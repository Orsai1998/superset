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

import { SupersetPluginMetallCutProps, MetallCutItem } from '../types';

export default function transformProps(
  chartProps: any,
): SupersetPluginMetallCutProps {
  const { formData, queriesData } = chartProps;

  const rows = queriesData?.[0]?.data ?? [];

  console.log(rows);

  const data: MetallCutItem[] = (rows as any[]).map((r, i) => ({
    id: String(r.title ?? i),
    title: String(r.title ?? '-'),
    deviationPerDay: Number(r.deviationPerDay ?? 0),
    monthDone: Number(r.monthDone ?? 0),
    monthPlan: Number(r.monthPlan ?? 1),
  }));

  return {
    data,
    formData,
    theme: formData.theme ?? 'dark',
    titleFontSize: formData.titleFontSize ?? 16,
    deviationFontSize: formData.deviationFontSize ?? 30,
    barNumberFontSize: formData.barNumberFontSize ?? 16,
    barHeight: formData.barHeight ?? 40,
  };
}
