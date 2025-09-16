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
import {
  DataRecord,
  NumberFormats,
  QueryFormData,
  supersetTheme,
  TimeseriesDataRecord,
} from '@superset-ui/core';

export interface SupersetPluginChartTop5BarsStylesProps {
  height: number;
  width: number;
  headerFontSize: keyof typeof supersetTheme.typography.sizes;
  boldText: boolean;
}

interface SupersetPluginChartTop5BarsCustomizeProps {
  headerText: string;
}

interface ErgPlanFactFormData extends QueryFormData {
  planMetric?: any;
  factMetric?: any;
  deviationMode?: 'auto' | 'metric';
  deviationMetric?: any;

  unitLabel?: string;
  showBigValues?: boolean;
  numberFormat?: keyof typeof NumberFormats | string;
}

export interface ErgPlanFactTransformedProps {
  width: number;
  height: number;
  data: DataRecord[]; // все строки, пришедшие из queriesData
  metrics: { plan: number; fact: number; deviation: number }; // готовые значения для графика
  formData: ErgPlanFactFormData; // настройки из панели управления
  formatValue: (n: number) => string; // форматтер чисел
}

export type SupersetPluginChartTop5BarsQueryFormData = QueryFormData &
  SupersetPluginChartTop5BarsStylesProps &
  SupersetPluginChartTop5BarsCustomizeProps;

export type SupersetPluginChartTop5BarsProps =
  SupersetPluginChartTop5BarsStylesProps &
    SupersetPluginChartTop5BarsCustomizeProps & {
      data: TimeseriesDataRecord[];
      // add typing here for the props you pass in from transformProps.ts!
    };
