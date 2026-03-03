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
"""add comment resolve and pin fields

Revision ID: d2a7e8f3b1c5
Revises: c1f4d6e2a9b0
Create Date: 2026-03-03 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

from superset.migrations.shared.utils import (
    add_column_if_not_exists,
    table_has_column,
    table_has_index,
)

# revision identifiers, used by Alembic.
revision = "d2a7e8f3b1c5"
down_revision = "c1f4d6e2a9b0"


def upgrade() -> None:
    add_column_if_not_exists(
        "comments",
        sa.Column("resolved", sa.Boolean(), nullable=False, server_default="false"),
    )
    add_column_if_not_exists(
        "comments",
        sa.Column("resolved_by", sa.Integer(), nullable=True),
    )
    add_column_if_not_exists(
        "comments",
        sa.Column("resolved_on", sa.DateTime(), nullable=True),
    )
    add_column_if_not_exists(
        "comments",
        sa.Column("x_pct", sa.Float(), nullable=True),
    )
    add_column_if_not_exists(
        "comments",
        sa.Column("y_pct", sa.Float(), nullable=True),
    )

    if not table_has_index("comments", "ix_comments_resolved"):
        op.create_index("ix_comments_resolved", "comments", ["resolved"])


def downgrade() -> None:
    if table_has_index("comments", "ix_comments_resolved"):
        op.drop_index("ix_comments_resolved", table_name="comments")

    with op.batch_alter_table("comments") as batch_op:
        for col in ("y_pct", "x_pct", "resolved_on", "resolved_by", "resolved"):
            if table_has_column("comments", col):
                batch_op.drop_column(col)
