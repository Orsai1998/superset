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
  QueryFormData,
  TimeseriesDataRecord,
} from '@superset-ui/core';

type HeaderFontSize = number | 'xs' | 's' | 'm' | 'l' | 'xl' | 'xxl';

/**
 * Layout & visual configuration
 */
export interface SupersetPluginTop40ConsumptionStylesProps {
  height: number;
  width: number;
  headerText?: string;
  headerFontSize: HeaderFontSize;
  boldText: boolean;
  theme: 'light' | 'dark';
}

/**
 * Custom control-panel props
 */
interface SupersetPluginTop40ConsumptionCustomizeProps {
  headerText?: string;
}

/**
 * Data structure for each bar element
 */
export interface DailyBar {
  day: string;
  value: number;
  plan: number;
}

/**
 * Data structure for each driver/person card
 */
export interface Top40Person {
  id?: number;
  rank?: number;
  name: string;
  photo?: string;
  value: number;
}

/**
 * Full chart data object (what transformProps should return)
 */
export interface Top40ChartData {
  chartData: DailyBar[];
  topLeft: Top40Person[];
  topRight: Top40Person[];
}

/**
 * Query form data type (sent from Superset’s backend)
 */
export type SupersetPluginTop40ConsumptionQueryFormData = QueryFormData &
  SupersetPluginTop40ConsumptionStylesProps &
  SupersetPluginTop40ConsumptionCustomizeProps;

/**
 * Final React props for the chart component
 */
export type SupersetPluginTop40ConsumptionProps =
  SupersetPluginTop40ConsumptionStylesProps &
    SupersetPluginTop40ConsumptionCustomizeProps & {
      /**
       * The transformed data used by the React component.
       */
      data: Top40ChartData;
      /**
       * Original query rows if needed for debugging or future use.
       */
      rawData?: TimeseriesDataRecord[];
      formData: SupersetPluginTop40ConsumptionQueryFormData;
    };
