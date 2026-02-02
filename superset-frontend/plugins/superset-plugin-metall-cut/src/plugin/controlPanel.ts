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

import { ControlPanelConfig } from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    // sections.datasource,
    {
      label: 'Query',
      expanded: true,
      controlSetRows: [['groupby'], ['metrics'], ['adhoc_filters']],
    },

    {
      label: 'Plan',
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'plan_column',
            config: {
              type: 'SelectControl',
              label: 'Plan column',
              description: 'Plan value',
              mapStateToProps: (state: any) => ({
                choices:
                  (state.datasource?.columns || []).map((c: any) => [
                    c.column_name,
                    c.column_name,
                  ]) ?? [],
              }),
            },
          },
        ],
      ],
    },

    {
      label: 'Customize',
      expanded: true,
      controlSetRows: [
        // ─── Title Font Size ───────────────────────────────────────
        [
          {
            name: 'titleFontSize',
            config: {
              type: 'SliderControl',
              label: 'Размер заголовка',
              description: 'Adjust the font size of chart titles and labels.',
              default: 16,
              min: 8,
              max: 48,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
        // ─── Theme Selector ───────────────────────────────────────
        [
          {
            name: 'theme',
            config: {
              type: 'SelectControl',
              label: 'Тема',
              default: 'dark',
              choices: [
                ['dark', 'Темная тема'],
                ['light', 'Светлая тема'],
              ],
              description: 'Выберите цвет темы',
              renderTrigger: true,
            },
          },
        ],
        // ─── Deviation font size ───────────────────────────────────────
        [
          {
            name: 'deviationFontSize',
            config: {
              type: 'SliderControl',
              label: 'Размер шрифт для отклонения за сутки',
              default: 30,
              min: 26,
              max: 90,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
        // ─── Bar number font size ───────────────────────────────────────
        [
          {
            name: 'barNumberFontSize',
            config: {
              type: 'SliderControl',
              label: 'Размер шрифт для чисел в графике',
              default: 16,
              min: 14,
              max: 28,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
        // ─── Bar heigh size ───────────────────────────────────────
        [
          {
            name: 'barHeight',
            config: {
              type: 'SliderControl',
              label: 'Высота полоски',
              default: 40,
              min: 26,
              max: 68,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
