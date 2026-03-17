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
"""add comment filter_state column

Revision ID: e3b9f4a7c2d6
Revises: d2a7e8f3b1c5
Create Date: 2026-03-17 12:00:00.000000

"""

import sqlalchemy as sa
from alembic import op

from superset.migrations.shared.utils import (
    add_column_if_not_exists,
    table_has_column,
)

# revision identifiers, used by Alembic.
revision = "e3b9f4a7c2d6"
down_revision = "d2a7e8f3b1c5"


def upgrade() -> None:
    add_column_if_not_exists(
        "comments",
        sa.Column("filter_state", sa.Text(), nullable=True),
    )


def downgrade() -> None:
    with op.batch_alter_table("comments") as batch_op:
        if table_has_column("comments", "filter_state"):
            batch_op.drop_column("filter_state")
