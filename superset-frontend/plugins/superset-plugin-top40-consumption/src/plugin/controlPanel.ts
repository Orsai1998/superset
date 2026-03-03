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

import { t, validateNonEmpty } from '@superset-ui/core';
import {
  ControlPanelConfig,
  sharedControls,
} from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  /**
   * Control panel for Top-40 Consumption plugin.
   * The “Query” section defines how to fetch data,
   * while “Chart Options” handles appearance.
   */
  controlPanelSections: [
    // ─── Query Section ─────────────────────────────────────────────
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'groupby',
            config: {
              ...sharedControls.groupby,
              label: t('Group by columns'),
              description: t(
                'Columns that define each driver/row, e.g. name, photo URL, date.',
              ),
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'metric',
            config: {
              ...sharedControls.metric,
              label: t('Metric for consumption'),
              description: t(
                'Metric used for fuel consumption (e.g., g/tnkm).',
              ),
              validators: [validateNonEmpty],
            },
          },
        ],
        [
          {
            name: 'plan_column',
            config: {
              type: 'SelectControl',
              label: t('Plan column'),
              description: t(
                'Select the column representing planned fuel consumption.',
              ),
              mapStateToProps: ({ datasource }) => ({
                choices:
                  datasource?.columns?.map((c: any) => [
                    c.column_name,
                    c.verbose_name || c.column_name,
                  ]) || [],
              }),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'photo_column',
            config: {
              ...sharedControls.groupby,
              type: 'SelectControl',
              label: t('Photo URL column'),
              description: t(
                'Column containing URLs or base64 photos for drivers.',
              ),
              multi: false, // Allow only one selection for grouping by day
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'row_limit',
            config: {
              ...sharedControls.row_limit,
              default: 39,
              label: t('Row limit (Top N)'),
            },
          },
        ],
        ['adhoc_filters'],
      ],
    },

    {
      label: t('Customize'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'headerText',
            config: {
              type: 'TextControl',
              label: t('Заголовок'),
              description: t('Текс над карточками'),
              default: t('Топ 40 по удельному расходу дизельного топлива'),
              renderTrigger: true,
            },
          },
        ],
      ],
    },

    // ─── Chart Options Section ─────────────────────────────────────
    {
      label: t('Chart Options'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'title_font_size',
            config: {
              type: 'SliderControl',
              label: t('Title font size'),
              description: t(
                'Adjust the font size of chart titles and labels.',
              ),
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
              label: t('Theme'),
              default: 'dark',
              choices: [
                ['dark', t('Dark Theme')],
                ['light', t('Light Theme')],
              ],
              description: t('Select the color theme for this visualization.'),
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],

  // ─── Optional Control Overrides ──────────────────────────────────
  controlOverrides: {
    row_limit: {
      label: t('Number of records'),
      description: t('Number of drivers or records to display (Top-N).'),
    },
  },
};

export default config;
