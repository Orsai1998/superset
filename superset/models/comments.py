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

import enum
from datetime import datetime

from flask_appbuilder import Model
from sqlalchemy import Boolean, Column, DateTime, Enum, Float, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import relationship

from superset import security_manager
from superset.utils.core import MediumText


class CommentScopeType(enum.Enum):
    dashboard = "dashboard"
    chart = "chart"


class Comment(Model):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True)
    scope_type = Column(Enum(CommentScopeType), nullable=False)
    dashboard_id = Column(
        Integer,
        ForeignKey("dashboards.id", ondelete="CASCADE"),
        nullable=True,
    )
    slice_id = Column(
        Integer,
        ForeignKey("slices.id", ondelete="CASCADE"),
        nullable=True,
    )
    parent_id = Column(
        Integer,
        ForeignKey("comments.id", ondelete="SET NULL"),
        nullable=True,
    )
    body = Column(MediumText(), nullable=False)
    body_html = Column(MediumText(), nullable=False)
    created_by_fk = Column(Integer, ForeignKey("ab_user.id"), nullable=False)
    created_on = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_on = Column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow,
        nullable=False,
    )
    deleted_on = Column(DateTime, nullable=True)
    resolved = Column(Boolean, default=False, nullable=False)
    resolved_by = Column(
        Integer,
        ForeignKey("ab_user.id", ondelete="SET NULL"),
        nullable=True,
    )
    resolved_on = Column(DateTime, nullable=True)
    x_pct = Column(Float, nullable=True)
    y_pct = Column(Float, nullable=True)

    created_by = relationship(security_manager.user_model, foreign_keys=[created_by_fk])
    resolved_by_user = relationship(security_manager.user_model, foreign_keys=[resolved_by])
    dashboard = relationship("Dashboard", foreign_keys=[dashboard_id])
    slice = relationship("Slice", foreign_keys=[slice_id])
    parent = relationship("Comment", remote_side=[id], backref="replies")
    mentions = relationship(
        "CommentMention",
        back_populates="comment",
        cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"Comment<{self.id}>"


class CommentMention(Model):
    __tablename__ = "comment_mentions"

    id = Column(Integer, primary_key=True)
    comment_id = Column(
        Integer,
        ForeignKey("comments.id", ondelete="CASCADE"),
        nullable=False,
    )
    user_id = Column(
        Integer,
        ForeignKey("ab_user.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_on = Column(DateTime, default=datetime.utcnow, nullable=False)

    comment = relationship("Comment", back_populates="mentions")
    user = relationship(security_manager.user_model, foreign_keys=[user_id])

    __table_args__ = (
        UniqueConstraint(
            "comment_id",
            "user_id",
            name="uq_comment_mentions_comment_user",
        ),
    )

    def __repr__(self) -> str:
        return f"CommentMention<{self.id}>"
