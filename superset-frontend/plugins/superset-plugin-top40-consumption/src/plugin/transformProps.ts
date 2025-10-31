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

import { ChartProps, TimeseriesDataRecord } from '@superset-ui/core';
import { Top40Person, DailyBar } from '../types';

export default function transformProps(chartProps: ChartProps): {
  width: number;
  height: number;
  boldText: any;
  headerFontSize: any;
  headerText: any;
  theme: any;
  formData: any;
  data: {
    chartData: DailyBar[];
    topLeft: Top40Person[];
    topRight: Top40Person[];
  };
  rawData: TimeseriesDataRecord[];
} {
  const { width, height, formData, queriesData } = chartProps;
  const { boldText, headerFontSize, headerText, theme } = formData;
  const rawData = (queriesData?.[0]?.data || []) as TimeseriesDataRecord[];

  /**
   * Example expected dataset shape:
   * [
   *   { day: '01', value: 659, plan: 685, name: 'Иванов И.О.', photo: 'https://...', rank: 1 },
   *   ...
   * ]
   */

  // --- Daily bar data ---
  const chartData: DailyBar[] = rawData.map((row: any) => ({
    day: String(row.day ?? ''),
    value: Number(row.value ?? 0),
    plan: Number(row.plan ?? 0),
  }));

  // --- Drivers sorted by efficiency ---
  const persons: Top40Person[] = rawData
    .filter((r: any) => r.name && r.photo)
    .sort((a: any, b: any) => (a.value ?? 0) - (b.value ?? 0))
    .map((r: any, i: number) => ({
      id: r.id ?? i + 1,
      rank: i + 1,
      name: r.name ?? 'Фамилия И.О.',
      photo: r.photo ?? '',
      value: Number(r.value ?? 0),
    }));

  // Split top 40 into left (best 1–20) and right (worse 21–40)
  const topLeft = persons.slice(0, 20);
  const topRight = persons.slice(20, 40);

  return {
    width,
    height,
    boldText,
    headerFontSize,
    headerText,
    theme,
    formData,
    data: {
      chartData,
      topLeft,
      topRight,
    },
    rawData,
  };
}
