import { Currency, type DatasourceType } from '@superset-ui/core';
import { Owner } from '@superset-ui/chart-controls';

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
export type ColumnObject = {
  id: number;
  column_name: string;
  type: string;
  verbose_name?: string;
  description?: string;
  expression?: string;
  filterable: boolean;
  groupby: boolean;
  is_active: boolean;
  is_dttm: boolean;
  python_date_format?: string;
  uuid?: string;
  extra?: string;
  certified_by?: string;
  certification_details?: string;
  warning_markdown?: string;
  advanced_data_type?: string;
};

type MetricObject = {
  id: number;
  uuid: string;
  expression?: string;
  description?: string;
  metric_name: string;
  verbose_name?: string;
  metric_type: string;
  d3format?: string;
  currency?: Currency;
  warning_text?: string;
  certified_by?: string;
  certification_details?: string;
  warning_markdown?: string;
};

export type DatasetObject = {
  id: number;
  table_name?: string;
  sql?: string;
  filter_select_enabled?: boolean;
  fetch_values_predicate?: string;
  schema?: string;
  catalog?: string;
  description: string | null;
  main_dttm_col: string;
  offset?: number;
  default_endpoint?: string;
  cache_timeout?: number;
  is_sqllab_view?: boolean;
  template_params?: string;
  owners: Owner[];
  columns: ColumnObject[];
  metrics: MetricObject[];
  extra?: string;
  is_managed_externally: boolean;
  normalize_columns: boolean;
  always_filter_main_dttm: boolean;
  type: DatasourceType;
  column_formats: Record<string, string>;
  datasource_name: string | null;
  verbose_map: Record<string, string>;
};
