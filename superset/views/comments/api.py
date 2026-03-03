# Licensed to the Apache Software Foundation (ASF) under one
# or more contributor license agreements.  See the NOTICE file
# distributed with this work for additional information
# regarding copyright ownership.  The ASF licenses this file
# to you under the Apache License, Version 2.0 (the
# "License"); you may not use this file except in compliance
# with the License.  You may obtain a copy of the License at
#
#   http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing,
# software distributed under the License is distributed on an
# "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
# KIND, either express or implied.  See the License for the
# specific language governing permissions and limitations
# under the License.
from __future__ import annotations

import re
from datetime import datetime
from typing import Any

from flask import g, request, Response
from flask_appbuilder import expose
from flask_appbuilder.api import safe
from flask_appbuilder.hooks import before_request
from flask_appbuilder.security.decorators import permission_name, protect
from marshmallow import fields, Schema, validate, ValidationError
from sqlalchemy import func, or_
from sqlalchemy.orm import joinedload

from superset import db, is_feature_enabled, security_manager
from superset.commands.dashboard.exceptions import (
    DashboardAccessDeniedError,
    DashboardNotFoundError,
)
from superset.daos.dashboard import DashboardDAO
from superset.exceptions import SupersetSecurityException
from superset.extensions import event_logger
from superset.models.comments import Comment, CommentMention, CommentScopeType
from superset.models.slice import Slice
from superset.utils import core as utils
from superset.views.base_api import BaseSupersetApi, requires_json, statsd_metrics

MENTION_RE = re.compile(r"(?<!\w)@([^\s,;:!?()[\]{}<>\"'`]{1,128})")
DELETED_COMMENT_BODY = "[deleted]"
DELETED_COMMENT_BODY_HTML = "<em>[deleted]</em>"
MAX_PAGE_SIZE = 200


class CommentCreateSchema(Schema):
    scope_type = fields.String(
        required=True,
        validate=validate.OneOf([scope.value for scope in CommentScopeType]),
    )
    dashboard_id = fields.Integer(allow_none=True)
    slice_id = fields.Integer(allow_none=True)
    body = fields.String(required=True, validate=validate.Length(min=1))
    x_pct = fields.Float(
        allow_none=True,
        load_default=None,
        validate=validate.Range(min=0.0, max=1.0),
    )
    y_pct = fields.Float(
        allow_none=True,
        load_default=None,
        validate=validate.Range(min=0.0, max=1.0),
    )


class CommentReplySchema(Schema):
    body = fields.String(required=True, validate=validate.Length(min=1))


class CommentEditSchema(Schema):
    body = fields.String(required=True, validate=validate.Length(min=1))


comment_create_schema = CommentCreateSchema()
comment_reply_schema = CommentReplySchema()
comment_edit_schema = CommentEditSchema()


class CommentRestApi(BaseSupersetApi):
    resource_name = "comments"
    allow_browser_login = True
    class_permission_name = "Comment"
    method_permission_name = {
        "list": "read",
        "create": "comment",
        "reply": "comment",
        "edit": "comment",
        "delete": "comment",
        "resolve": "comment",
        "reopen": "comment",
        "mentions": "read",
        "users": "read",
    }
    openapi_spec_tag = "Comments"

    @before_request
    def ensure_comments_enabled(self) -> Response | None:
        if not is_feature_enabled("COMMENTING_ENABLED"):
            return self.response_404()
        return None

    @staticmethod
    def _is_authenticated() -> bool:
        user = getattr(g, "user", None)
        return bool(user and not user.is_anonymous)

    @staticmethod
    def _normalize_mention_token(token: str) -> str:
        """
        Normalize mention token by trimming wrappers/punctuation.

        Supports both @username and @email-style mentions.
        """
        normalized = (token or "").strip().rstrip(".,;:!?)]}")
        if normalized.startswith("@"):
            normalized = normalized[1:]
        if normalized.lower().startswith("mailto:"):
            normalized = normalized[7:]
        return normalized

    def _parse_scope(
        self,
        scope_type_raw: str | None,
        dashboard_id: int | None,
        slice_id: int | None,
    ) -> tuple[CommentScopeType, int | None, int | None]:
        if not scope_type_raw:
            raise ValueError("scope_type is required")

        try:
            scope_type = CommentScopeType(scope_type_raw)
        except ValueError as ex:
            raise ValueError("scope_type must be one of: dashboard, chart") from ex

        if scope_type == CommentScopeType.dashboard and not dashboard_id:
            raise ValueError("dashboard_id is required for dashboard scope")
        if scope_type == CommentScopeType.chart and not slice_id:
            raise ValueError("slice_id is required for chart scope")

        return scope_type, dashboard_id, slice_id

    def _ensure_scope_access(
        self,
        scope_type: CommentScopeType,
        dashboard_id: int | None,
        slice_id: int | None,
    ) -> None:
        if scope_type == CommentScopeType.dashboard:
            try:
                DashboardDAO.get_by_id_or_slug(str(dashboard_id))
            except DashboardNotFoundError as ex:
                raise LookupError("Dashboard not found") from ex
            except DashboardAccessDeniedError as ex:
                raise PermissionError("Forbidden") from ex
            return

        chart = db.session.query(Slice).filter(Slice.id == slice_id).one_or_none()
        if chart is None:
            raise LookupError("Chart not found")

        try:
            security_manager.raise_for_access(chart=chart)
        except SupersetSecurityException as ex:
            raise PermissionError("Forbidden") from ex

    def _is_comment_owner_or_admin(self, comment: Comment) -> bool:
        if not self._is_authenticated():
            return False
        return bool(
            security_manager.is_admin()
            or comment.created_by_fk == getattr(g.user, "id", None)
        )

    @staticmethod
    def _normalize_page(raw_page: int | None) -> int:
        return max(raw_page or 0, 0)

    @staticmethod
    def _normalize_page_size(raw_page_size: int | None) -> int:
        if not raw_page_size:
            return 50
        return min(max(raw_page_size, 1), MAX_PAGE_SIZE)

    def _serialize_user(self, user: Any | None) -> dict[str, Any] | None:
        if not user:
            return None

        full_name = " ".join(filter(None, [user.first_name, user.last_name])).strip()
        avatar_url = None
        extra_attributes = getattr(user, "extra_attributes", None)
        if extra_attributes:
            avatar_url = getattr(extra_attributes[0], "avatar_url", None)

        return {
            "id": user.id,
            "username": user.username,
            "name": full_name or user.username,
            "avatar_url": avatar_url,
        }

    def _serialize_comment(self, comment: Comment) -> dict[str, Any]:
        is_deleted = bool(comment.deleted_on)
        can_manage = bool(not is_deleted and self._is_comment_owner_or_admin(comment))

        return {
            "id": comment.id,
            "scope_type": comment.scope_type.value,
            "dashboard_id": comment.dashboard_id,
            "slice_id": comment.slice_id,
            "parent_id": comment.parent_id,
            "body": DELETED_COMMENT_BODY if is_deleted else comment.body,
            "body_html": DELETED_COMMENT_BODY_HTML if is_deleted else comment.body_html,
            "created_on": (
                comment.created_on.isoformat() if comment.created_on else None
            ),
            "updated_on": (
                comment.updated_on.isoformat() if comment.updated_on else None
            ),
            "deleted_on": (
                comment.deleted_on.isoformat() if comment.deleted_on else None
            ),
            "resolved": bool(comment.resolved),
            "resolved_on": (
                comment.resolved_on.isoformat() if comment.resolved_on else None
            ),
            "resolved_by": self._serialize_user(
                getattr(comment, "resolved_by_user", None)
            ),
            "x_pct": comment.x_pct,
            "y_pct": comment.y_pct,
            "author": self._serialize_user(comment.created_by),
            "mentioned_users": [
                self._serialize_user(mention.user) for mention in comment.mentions
            ],
            "can_edit": can_manage,
            "can_delete": can_manage,
            "can_resolve": bool(
                not is_deleted
                and comment.parent_id is None
                and self._is_authenticated()
            ),
        }

    def _extract_mentions(self, body: str) -> list[Any]:
        raw_tokens = {
            self._normalize_mention_token(match.group(1))
            for match in MENTION_RE.finditer(body or "")
        }
        raw_tokens = {token for token in raw_tokens if token}
        if not raw_tokens:
            return []

        lookup_values = {token.lower() for token in raw_tokens}
        # Support @user@example.com by also matching the local part ("user").
        lookup_values.update(
            token.split("@", 1)[0].lower()
            for token in raw_tokens
            if "@" in token and token.split("@", 1)[0]
        )

        user_model = security_manager.user_model
        filters = [func.lower(user_model.username).in_(lookup_values)]
        if hasattr(user_model, "email"):
            filters.append(func.lower(user_model.email).in_(lookup_values))

        return db.session.query(user_model).filter(or_(*filters)).all()

    def _sync_mentions(self, comment: Comment, body: str) -> None:
        mentioned_users = self._extract_mentions(body)
        comment.mentions = [CommentMention(user_id=user.id) for user in mentioned_users]

    def _can_access_comment_scope(self, comment: Comment) -> bool:
        try:
            self._ensure_scope_access(
                comment.scope_type, comment.dashboard_id, comment.slice_id
            )
            return True
        except (LookupError, PermissionError):
            return False

    @expose("/", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    @permission_name("read")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.list",
        log_to_statsd=False,
    )
    def list(self) -> Response:
        """List comments for dashboard/chart scope."""
        scope_type_raw = request.args.get("scope_type")
        dashboard_id = request.args.get("dashboard_id", type=int)
        slice_id = request.args.get("slice_id", type=int)
        page = self._normalize_page(request.args.get("page", type=int))
        page_size = self._normalize_page_size(request.args.get("page_size", type=int))

        try:
            scope_type, dashboard_id, slice_id = self._parse_scope(
                scope_type_raw,
                dashboard_id,
                slice_id,
            )
            self._ensure_scope_access(scope_type, dashboard_id, slice_id)
        except ValueError as ex:
            return self.response_400(message=str(ex))
        except LookupError as ex:
            return self.response_404(message=str(ex))
        except PermissionError:
            return self.response_403()

        query = (
            db.session.query(Comment)
            .options(
                joinedload(Comment.created_by),
                joinedload(Comment.mentions).joinedload(CommentMention.user),
            )
            .filter(Comment.scope_type == scope_type)
        )

        if scope_type == CommentScopeType.dashboard:
            query = query.filter(Comment.dashboard_id == dashboard_id)
        else:
            query = query.filter(Comment.slice_id == slice_id)

        count = query.count()
        total_unresolved_count = (
            query.filter(
                Comment.parent_id.is_(None),
                Comment.resolved.is_(False),
                Comment.deleted_on.is_(None),
            )
            .count()
        )
        comments = (
            query.order_by(Comment.created_on.asc(), Comment.id.asc())
            .offset(page * page_size)
            .limit(page_size)
            .all()
        )

        return self.response(
            200,
            count=count,
            page=page,
            page_size=page_size,
            total_unresolved_count=total_unresolved_count,
            result=[self._serialize_comment(comment) for comment in comments],
        )

    @expose("/", methods=("POST",))
    @protect()
    @safe
    @statsd_metrics
    @permission_name("comment")
    @requires_json
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.create",
        log_to_statsd=False,
    )
    def create(self) -> Response:
        """Create a top-level comment."""
        if not self._is_authenticated():
            return self.response_401()

        try:
            item = comment_create_schema.load(request.json)
            scope_type, dashboard_id, slice_id = self._parse_scope(
                item.get("scope_type"),
                item.get("dashboard_id"),
                item.get("slice_id"),
            )
            self._ensure_scope_access(scope_type, dashboard_id, slice_id)
        except ValidationError as ex:
            return self.response_400(message=ex.messages)
        except ValueError as ex:
            return self.response_400(message=str(ex))
        except LookupError as ex:
            return self.response_404(message=str(ex))
        except PermissionError:
            return self.response_403()

        body = (item.get("body") or "").strip()
        if not body:
            return self.response_400(message="Comment body cannot be empty")

        comment = Comment(
            scope_type=scope_type,
            dashboard_id=dashboard_id,
            slice_id=slice_id,
            body=body,
            body_html=utils.markdown(body),
            created_by_fk=g.user.id,
            x_pct=item.get("x_pct"),
            y_pct=item.get("y_pct"),
        )
        self._sync_mentions(comment, body)

        db.session.add(comment)
        db.session.commit()

        return self.response(201, result=self._serialize_comment(comment))

    @expose("/<int:comment_id>/reply", methods=("POST",))
    @protect()
    @safe
    @statsd_metrics
    @permission_name("comment")
    @requires_json
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.reply",
        log_to_statsd=False,
    )
    def reply(self, comment_id: int) -> Response:
        """Create a reply for an existing comment."""
        if not self._is_authenticated():
            return self.response_401()

        parent_comment = (
            db.session.query(Comment)
            .options(
                joinedload(Comment.created_by),
                joinedload(Comment.mentions).joinedload(CommentMention.user),
            )
            .filter(Comment.id == comment_id)
            .one_or_none()
        )
        if parent_comment is None:
            return self.response_404(message="Comment not found")

        try:
            self._ensure_scope_access(
                parent_comment.scope_type,
                parent_comment.dashboard_id,
                parent_comment.slice_id,
            )
            item = comment_reply_schema.load(request.json)
        except ValidationError as ex:
            return self.response_400(message=ex.messages)
        except LookupError as ex:
            return self.response_404(message=str(ex))
        except PermissionError:
            return self.response_403()

        body = (item.get("body") or "").strip()
        if not body:
            return self.response_400(message="Comment body cannot be empty")

        comment = Comment(
            scope_type=parent_comment.scope_type,
            dashboard_id=parent_comment.dashboard_id,
            slice_id=parent_comment.slice_id,
            parent_id=parent_comment.id,
            body=body,
            body_html=utils.markdown(body),
            created_by_fk=g.user.id,
        )
        self._sync_mentions(comment, body)

        db.session.add(comment)
        db.session.commit()

        return self.response(201, result=self._serialize_comment(comment))

    @expose("/<int:comment_id>", methods=("PATCH",))
    @protect()
    @safe
    @statsd_metrics
    @permission_name("comment")
    @requires_json
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.edit",
        log_to_statsd=False,
    )
    def edit(self, comment_id: int) -> Response:
        """Edit a comment body."""
        if not self._is_authenticated():
            return self.response_401()

        comment = (
            db.session.query(Comment)
            .options(
                joinedload(Comment.created_by),
                joinedload(Comment.mentions).joinedload(CommentMention.user),
            )
            .filter(Comment.id == comment_id)
            .one_or_none()
        )
        if comment is None:
            return self.response_404(message="Comment not found")

        try:
            self._ensure_scope_access(
                comment.scope_type, comment.dashboard_id, comment.slice_id
            )
            item = comment_edit_schema.load(request.json)
        except ValidationError as ex:
            return self.response_400(message=ex.messages)
        except LookupError as ex:
            return self.response_404(message=str(ex))
        except PermissionError:
            return self.response_403()

        if comment.deleted_on:
            return self.response_400(message="Deleted comments cannot be edited")

        if not self._is_comment_owner_or_admin(comment):
            return self.response_403()

        body = (item.get("body") or "").strip()
        if not body:
            return self.response_400(message="Comment body cannot be empty")

        comment.body = body
        comment.body_html = utils.markdown(body)
        comment.updated_on = datetime.utcnow()
        self._sync_mentions(comment, body)

        db.session.commit()

        return self.response(200, result=self._serialize_comment(comment))

    @expose("/<int:comment_id>", methods=("DELETE",))
    @protect()
    @safe
    @statsd_metrics
    @permission_name("comment")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.delete",
        log_to_statsd=False,
    )
    def delete(self, comment_id: int) -> Response:
        """Soft delete a comment."""
        if not self._is_authenticated():
            return self.response_401()

        comment = (
            db.session.query(Comment).filter(Comment.id == comment_id).one_or_none()
        )
        if comment is None:
            return self.response_404(message="Comment not found")

        try:
            self._ensure_scope_access(
                comment.scope_type, comment.dashboard_id, comment.slice_id
            )
        except LookupError as ex:
            return self.response_404(message=str(ex))
        except PermissionError:
            return self.response_403()

        if not self._is_comment_owner_or_admin(comment):
            return self.response_403()

        if not comment.deleted_on:
            now = datetime.utcnow()
            comment.deleted_on = now
            comment.updated_on = now
            db.session.commit()

        return self.response(200, message="OK")

    @expose("/<int:comment_id>/resolve", methods=("PATCH",))
    @protect()
    @safe
    @statsd_metrics
    @permission_name("comment")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.resolve",
        log_to_statsd=False,
    )
    def resolve(self, comment_id: int) -> Response:
        """Mark a comment thread as resolved."""
        if not self._is_authenticated():
            return self.response_401()

        comment = (
            db.session.query(Comment)
            .options(
                joinedload(Comment.created_by),
                joinedload(Comment.mentions).joinedload(CommentMention.user),
            )
            .filter(Comment.id == comment_id)
            .one_or_none()
        )
        if comment is None:
            return self.response_404(message="Comment not found")

        try:
            self._ensure_scope_access(
                comment.scope_type, comment.dashboard_id, comment.slice_id
            )
        except LookupError as ex:
            return self.response_404(message=str(ex))
        except PermissionError:
            return self.response_403()

        if comment.deleted_on:
            return self.response_400(message="Deleted comments cannot be resolved")
        if comment.parent_id is not None:
            return self.response_400(
                message="Only top-level comments can be resolved"
            )

        if not comment.resolved:
            comment.resolved = True
            comment.resolved_by = g.user.id
            comment.resolved_on = datetime.utcnow()
            db.session.commit()

        return self.response(200, result=self._serialize_comment(comment))

    @expose("/<int:comment_id>/reopen", methods=("PATCH",))
    @protect()
    @safe
    @statsd_metrics
    @permission_name("comment")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.reopen",
        log_to_statsd=False,
    )
    def reopen(self, comment_id: int) -> Response:
        """Reopen a previously resolved comment thread."""
        if not self._is_authenticated():
            return self.response_401()

        comment = (
            db.session.query(Comment)
            .options(
                joinedload(Comment.created_by),
                joinedload(Comment.mentions).joinedload(CommentMention.user),
            )
            .filter(Comment.id == comment_id)
            .one_or_none()
        )
        if comment is None:
            return self.response_404(message="Comment not found")

        try:
            self._ensure_scope_access(
                comment.scope_type, comment.dashboard_id, comment.slice_id
            )
        except LookupError as ex:
            return self.response_404(message=str(ex))
        except PermissionError:
            return self.response_403()
        if comment.parent_id is not None:
            return self.response_400(
                message="Only top-level comments can be reopened"
            )

        if comment.resolved:
            comment.resolved = False
            comment.resolved_by = None
            comment.resolved_on = None
            db.session.commit()

        return self.response(200, result=self._serialize_comment(comment))

    @expose("/mentions/", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    @permission_name("read")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.mentions",
        log_to_statsd=False,
    )
    def mentions(self) -> Response:
        """List mentions for the authenticated user."""
        if not self._is_authenticated():
            return self.response_401()

        scope_type_raw = request.args.get("scope_type")
        dashboard_id = request.args.get("dashboard_id", type=int)
        slice_id = request.args.get("slice_id", type=int)
        page = self._normalize_page(request.args.get("page", type=int))
        page_size = self._normalize_page_size(request.args.get("page_size", type=int))

        scope_filters: list[Any] = []
        if scope_type_raw:
            try:
                scope_type, dashboard_id, slice_id = self._parse_scope(
                    scope_type_raw,
                    dashboard_id,
                    slice_id,
                )
                self._ensure_scope_access(scope_type, dashboard_id, slice_id)
            except ValueError as ex:
                return self.response_400(message=str(ex))
            except LookupError as ex:
                return self.response_404(message=str(ex))
            except PermissionError:
                return self.response_403()

            scope_filters.append(Comment.scope_type == scope_type)
            if scope_type == CommentScopeType.dashboard:
                scope_filters.append(Comment.dashboard_id == dashboard_id)
            else:
                scope_filters.append(Comment.slice_id == slice_id)

        mentions = (
            db.session.query(CommentMention)
            .options(
                joinedload(CommentMention.user),
                joinedload(CommentMention.comment).joinedload(Comment.created_by),
                joinedload(CommentMention.comment)
                .joinedload(Comment.mentions)
                .joinedload(CommentMention.user),
            )
            .join(Comment, CommentMention.comment_id == Comment.id)
            .filter(
                CommentMention.user_id == g.user.id,
                Comment.deleted_on.is_(None),
                *scope_filters,
            )
            .order_by(CommentMention.created_on.desc(), CommentMention.id.desc())
            .all()
        )

        visible_mentions = [
            mention
            for mention in mentions
            if self._can_access_comment_scope(mention.comment)
        ]
        count = len(visible_mentions)
        start = page * page_size
        end = start + page_size
        page_mentions = visible_mentions[start:end]

        return self.response(
            200,
            count=count,
            page=page,
            page_size=page_size,
            result=[
                {
                    "id": mention.id,
                    "created_on": (
                        mention.created_on.isoformat() if mention.created_on else None
                    ),
                    "comment": self._serialize_comment(mention.comment),
                }
                for mention in page_mentions
            ],
        )

    @expose("/users/", methods=("GET",))
    @protect()
    @safe
    @statsd_metrics
    @permission_name("read")
    @event_logger.log_this_with_context(
        action=lambda self, *args, **kwargs: f"{self.__class__.__name__}.users",
        log_to_statsd=False,
    )
    def users(self) -> Response:
        """Search users for mention autocomplete."""
        if not self._is_authenticated():
            return self.response_401()

        raw_query = (request.args.get("q") or "").strip().lower()
        page_size = min(
            self._normalize_page_size(request.args.get("page_size", type=int)),
            20,
        )

        user_model = security_manager.user_model
        query = db.session.query(user_model)

        if hasattr(user_model, "active"):
            query = query.filter(user_model.active.is_(True))

        if raw_query:
            filters = [func.lower(user_model.username).like(f"{raw_query}%")]
            if hasattr(user_model, "email"):
                filters.append(func.lower(user_model.email).like(f"{raw_query}%"))
            if hasattr(user_model, "first_name"):
                filters.append(func.lower(user_model.first_name).like(f"{raw_query}%"))
            if hasattr(user_model, "last_name"):
                filters.append(func.lower(user_model.last_name).like(f"{raw_query}%"))
            query = query.filter(or_(*filters))

        users = query.order_by(user_model.username.asc()).limit(page_size).all()
        serialized_users = [
            serialized
            for serialized in (self._serialize_user(user) for user in users)
            if serialized is not None
        ]

        return self.response(200, count=len(serialized_users), result=serialized_users)
