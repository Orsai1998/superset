/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { buildQueryContext, QueryFormData } from '@superset-ui/core';

/**
 * buildQuery defines how Superset constructs the backend query
 * based on control panel settings.
 *
 * For Top-40 Consumption, we need:
 *  - the grouping columns (drivers, date, etc.)
 *  - the selected metric (fuel consumption)
 *  - optional “plan” and “photo URL” columns
 *  - filters and row limits
 */
export default function buildQuery(formData: QueryFormData) {
  const { groupby = [], metric, plan_column, row_limit } = formData as any;

  // Collect all columns to be returned by the query
  const columns = [...groupby];
  if (plan_column) columns.push(plan_column);
  // if (photo_column) columns.push(photo_column);

  return buildQueryContext(formData, baseQueryObject => [
    {
      ...baseQueryObject,
      columns,
      metrics: [metric],
      groupby,
      row_limit: row_limit || 40,
      orderby: [[metric, false]], // descending order (Top-N)
    },
  ]);
}
