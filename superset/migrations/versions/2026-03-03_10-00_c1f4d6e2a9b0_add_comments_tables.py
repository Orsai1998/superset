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
"""add comments tables

Revision ID: c1f4d6e2a9b0
Revises: 48cbb571fa3a
Create Date: 2026-03-03 10:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

from superset.migrations.shared.utils import has_table

# revision identifiers, used by Alembic.
revision = "c1f4d6e2a9b0"
down_revision = "48cbb571fa3a"


comment_scope_type = sa.Enum("dashboard", "chart", name="comment_scope_type")


def upgrade():
    if not has_table("comments"):
        op.create_table(
            "comments",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("scope_type", comment_scope_type, nullable=False),
            sa.Column("dashboard_id", sa.Integer(), nullable=True),
            sa.Column("slice_id", sa.Integer(), nullable=True),
            sa.Column("parent_id", sa.Integer(), nullable=True),
            sa.Column("body", sa.Text(), nullable=False),
            sa.Column("body_html", sa.Text(), nullable=False),
            sa.Column("created_by_fk", sa.Integer(), nullable=False),
            sa.Column("created_on", sa.DateTime(), nullable=False),
            sa.Column("updated_on", sa.DateTime(), nullable=False),
            sa.Column("deleted_on", sa.DateTime(), nullable=True),
            sa.ForeignKeyConstraint(["created_by_fk"], ["ab_user.id"]),
            sa.ForeignKeyConstraint(
                ["dashboard_id"], ["dashboards.id"], ondelete="CASCADE"
            ),
            sa.ForeignKeyConstraint(
                ["parent_id"],
                ["comments.id"],
                ondelete="SET NULL",
            ),
            sa.ForeignKeyConstraint(["slice_id"], ["slices.id"], ondelete="CASCADE"),
            sa.PrimaryKeyConstraint("id"),
        )
        op.create_index("ix_comments_scope_type", "comments", ["scope_type"])
        op.create_index("ix_comments_dashboard_id", "comments", ["dashboard_id"])
        op.create_index("ix_comments_slice_id", "comments", ["slice_id"])
        op.create_index("ix_comments_parent_id", "comments", ["parent_id"])
        op.create_index("ix_comments_created_on", "comments", ["created_on"])

    if not has_table("comment_mentions"):
        op.create_table(
            "comment_mentions",
            sa.Column("id", sa.Integer(), nullable=False),
            sa.Column("comment_id", sa.Integer(), nullable=False),
            sa.Column("user_id", sa.Integer(), nullable=False),
            sa.Column("created_on", sa.DateTime(), nullable=False),
            sa.ForeignKeyConstraint(
                ["comment_id"],
                ["comments.id"],
                ondelete="CASCADE",
            ),
            sa.ForeignKeyConstraint(
                ["user_id"],
                ["ab_user.id"],
                ondelete="CASCADE",
            ),
            sa.PrimaryKeyConstraint("id"),
            sa.UniqueConstraint(
                "comment_id",
                "user_id",
                name="uq_comment_mentions_comment_user",
            ),
        )
        op.create_index(
            "ix_comment_mentions_comment_id", "comment_mentions", ["comment_id"]
        )
        op.create_index("ix_comment_mentions_user_id", "comment_mentions", ["user_id"])


def downgrade():
    if has_table("comment_mentions"):
        op.drop_index("ix_comment_mentions_user_id", table_name="comment_mentions")
        op.drop_index("ix_comment_mentions_comment_id", table_name="comment_mentions")
        op.drop_table("comment_mentions")

    if has_table("comments"):
        op.drop_index("ix_comments_created_on", table_name="comments")
        op.drop_index("ix_comments_parent_id", table_name="comments")
        op.drop_index("ix_comments_slice_id", table_name="comments")
        op.drop_index("ix_comments_dashboard_id", table_name="comments")
        op.drop_index("ix_comments_scope_type", table_name="comments")
        op.drop_table("comments")

    comment_scope_type.drop(op.get_bind(), checkfirst=True)
