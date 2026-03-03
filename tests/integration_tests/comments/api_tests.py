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

import pytest

from superset import db, security_manager
from superset.models.comments import Comment, CommentMention
from superset.models.dashboard import Dashboard
from superset.models.slice import Slice
from superset.utils import json
from tests.integration_tests.base_tests import SupersetTestCase
from tests.integration_tests.conftest import with_feature_flags
from tests.integration_tests.constants import (
    ADMIN_USERNAME,
    ALPHA_USERNAME,
    GAMMA_USERNAME,
)
from tests.integration_tests.fixtures.birth_names_dashboard import (
    load_birth_names_dashboard_with_slices,  # noqa: F401
    load_birth_names_data,  # noqa: F401
)


class TestCommentApi(SupersetTestCase):
    @pytest.fixture(autouse=True)
    def cleanup_comments(self):
        db.session.query(CommentMention).delete()
        db.session.query(Comment).delete()
        db.session.commit()
        yield
        db.session.query(CommentMention).delete()
        db.session.query(Comment).delete()
        db.session.commit()

    @staticmethod
    def get_dashboard_and_slice() -> tuple[Dashboard, Slice]:
        dashboard = (
            db.session.query(Dashboard)
            .join(Dashboard.slices)
            .order_by(Dashboard.id.desc())
            .first()
        )
        assert dashboard
        assert dashboard.slices
        return dashboard, dashboard.slices[0]

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(COMMENTING_ENABLED=True)
    def test_comment_crud_and_thread(self):
        self.login(ADMIN_USERNAME)
        dashboard, chart = self.get_dashboard_and_slice()

        create_payload = {
            "scope_type": "dashboard",
            "dashboard_id": dashboard.id,
            "body": "Root comment with @gamma",
        }
        create_response = self.client.post("/api/v1/comments/", json=create_payload)
        self.assertEqual(create_response.status_code, 201)
        create_data = json.loads(create_response.data.decode("utf-8"))
        comment_id = create_data["result"]["id"]

        list_response = self.client.get(
            f"/api/v1/comments/?scope_type=dashboard&dashboard_id={dashboard.id}"
        )
        self.assertEqual(list_response.status_code, 200)
        list_data = json.loads(list_response.data.decode("utf-8"))
        self.assertEqual(list_data["count"], 1)
        self.assertEqual(list_data["result"][0]["id"], comment_id)
        self.assertEqual(list_data["result"][0]["scope_type"], "dashboard")

        reply_response = self.client.post(
            f"/api/v1/comments/{comment_id}/reply",
            json={"body": f"Reply for chart {chart.id}"},
        )
        self.assertEqual(reply_response.status_code, 201)
        reply_data = json.loads(reply_response.data.decode("utf-8"))
        self.assertEqual(reply_data["result"]["parent_id"], comment_id)

        edit_response = self.client.patch(
            f"/api/v1/comments/{comment_id}",
            json={"body": "Edited comment body"},
        )
        self.assertEqual(edit_response.status_code, 200)
        edit_data = json.loads(edit_response.data.decode("utf-8"))
        self.assertEqual(edit_data["result"]["body"], "Edited comment body")

        delete_response = self.client.delete(f"/api/v1/comments/{comment_id}")
        self.assertEqual(delete_response.status_code, 200)

        deleted_list_response = self.client.get(
            f"/api/v1/comments/?scope_type=dashboard&dashboard_id={dashboard.id}"
        )
        self.assertEqual(deleted_list_response.status_code, 200)
        deleted_list_data = json.loads(deleted_list_response.data.decode("utf-8"))
        deleted_comment = next(
            item for item in deleted_list_data["result"] if item["id"] == comment_id
        )
        self.assertEqual(deleted_comment["body"], "[deleted]")
        self.assertIsNotNone(deleted_comment["deleted_on"])

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(COMMENTING_ENABLED=True)
    def test_non_owner_cannot_edit_or_delete_comment(self):
        self.login(ADMIN_USERNAME)
        dashboard, _ = self.get_dashboard_and_slice()

        create_response = self.client.post(
            "/api/v1/comments/",
            json={
                "scope_type": "dashboard",
                "dashboard_id": dashboard.id,
                "body": "Admin comment",
            },
        )
        self.assertEqual(create_response.status_code, 201)
        comment_id = json.loads(create_response.data.decode("utf-8"))["result"]["id"]

        self.logout()
        self.login(ALPHA_USERNAME)

        patch_response = self.client.patch(
            f"/api/v1/comments/{comment_id}",
            json={"body": "Should fail"},
        )
        self.assertEqual(patch_response.status_code, 403)

        delete_response = self.client.delete(f"/api/v1/comments/{comment_id}")
        self.assertEqual(delete_response.status_code, 403)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(COMMENTING_ENABLED=True)
    def test_mentions_endpoint(self):
        self.login(ADMIN_USERNAME)
        dashboard, chart = self.get_dashboard_and_slice()
        admin_user = security_manager.find_user(username=ADMIN_USERNAME)
        assert admin_user
        assert admin_user.email

        dashboard_comment_response = self.client.post(
            "/api/v1/comments/",
            json={
                "scope_type": "dashboard",
                "dashboard_id": dashboard.id,
                "body": f"Ping @gamma and @{admin_user.email} for review",
            },
        )
        self.assertEqual(dashboard_comment_response.status_code, 201)
        dashboard_comment_id = json.loads(
            dashboard_comment_response.data.decode("utf-8")
        )["result"]["id"]

        chart_comment_response = self.client.post(
            "/api/v1/comments/",
            json={
                "scope_type": "chart",
                "dashboard_id": dashboard.id,
                "slice_id": chart.id,
                "body": "Chart level ping @gamma",
            },
        )
        self.assertEqual(chart_comment_response.status_code, 201)
        chart_comment_id = json.loads(chart_comment_response.data.decode("utf-8"))[
            "result"
        ]["id"]

        self.logout()
        self.login(GAMMA_USERNAME)

        mentions_response = self.client.get("/api/v1/comments/mentions/")
        self.assertEqual(mentions_response.status_code, 200)
        mentions_data = json.loads(mentions_response.data.decode("utf-8"))
        self.assertGreaterEqual(mentions_data["count"], 1)
        assert any(
            mention["comment"]["id"] == dashboard_comment_id
            for mention in mentions_data["result"]
        )
        assert any(
            mention["comment"]["id"] == chart_comment_id
            for mention in mentions_data["result"]
        )

        scoped_mentions_response = self.client.get(
            f"/api/v1/comments/mentions/?scope_type=chart&slice_id={chart.id}"
        )
        self.assertEqual(scoped_mentions_response.status_code, 200)
        scoped_mentions_data = json.loads(scoped_mentions_response.data.decode("utf-8"))
        self.assertEqual(scoped_mentions_data["count"], 1)
        self.assertEqual(
            scoped_mentions_data["result"][0]["comment"]["id"], chart_comment_id
        )

        self.logout()
        self.login(ADMIN_USERNAME)

        own_mentions_response = self.client.get("/api/v1/comments/mentions/")
        self.assertEqual(own_mentions_response.status_code, 200)
        own_mentions_data = json.loads(own_mentions_response.data.decode("utf-8"))
        assert any(
            mention["comment"]["id"] == dashboard_comment_id
            for mention in own_mentions_data["result"]
        )

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(COMMENTING_ENABLED=True)
    def test_unresolved_count_tracks_threads_and_replies_cannot_resolve(self):
        self.login(ADMIN_USERNAME)
        dashboard, chart = self.get_dashboard_and_slice()

        root_response = self.client.post(
            "/api/v1/comments/",
            json={
                "scope_type": "chart",
                "dashboard_id": dashboard.id,
                "slice_id": chart.id,
                "body": "Root thread",
            },
        )
        self.assertEqual(root_response.status_code, 201)
        root_id = json.loads(root_response.data.decode("utf-8"))["result"]["id"]

        reply_response = self.client.post(
            f"/api/v1/comments/{root_id}/reply",
            json={"body": "Nested reply"},
        )
        self.assertEqual(reply_response.status_code, 201)
        reply_payload = json.loads(reply_response.data.decode("utf-8"))["result"]
        reply_id = reply_payload["id"]
        self.assertFalse(reply_payload["can_resolve"])

        list_response = self.client.get(
            f"/api/v1/comments/?scope_type=chart&slice_id={chart.id}"
        )
        self.assertEqual(list_response.status_code, 200)
        list_payload = json.loads(list_response.data.decode("utf-8"))
        self.assertEqual(list_payload["total_unresolved_count"], 1)

        resolve_reply = self.client.patch(f"/api/v1/comments/{reply_id}/resolve")
        self.assertEqual(resolve_reply.status_code, 400)

        reopen_reply = self.client.patch(f"/api/v1/comments/{reply_id}/reopen")
        self.assertEqual(reopen_reply.status_code, 400)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(COMMENTING_ENABLED=True)
    def test_auth_required(self):
        dashboard, _ = self.get_dashboard_and_slice()

        response = self.client.get(
            f"/api/v1/comments/?scope_type=dashboard&dashboard_id={dashboard.id}"
        )
        self.assertEqual(response.status_code, 401)

    @pytest.mark.usefixtures("load_birth_names_dashboard_with_slices")
    @with_feature_flags(COMMENTING_ENABLED=True)
    def test_users_endpoint_supports_username_lookup(self):
        self.login(ADMIN_USERNAME)

        response = self.client.get("/api/v1/comments/users/?q=adm&page_size=5")
        self.assertEqual(response.status_code, 200)
        payload = json.loads(response.data.decode("utf-8"))
        self.assertGreaterEqual(payload["count"], 1)
        assert any(user["username"] == ADMIN_USERNAME for user in payload["result"])
