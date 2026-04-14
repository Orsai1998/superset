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
import { t } from '@superset-ui/core';
import {
  ControlPanelConfig,
  sharedControls,
} from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'category_column',
            config: {
              type: 'SelectControl',
              multi: false,
              renderTrigger: true,
              default: null,
              mapStateToProps: (state, controlState) => {
                const { datasource } = state;
                return {
                  choices: (datasource?.columns || []).map(
                    (col: { column_name: any }) => [col.column_name],
                  ),
                };
              },
              label: t('Categories'),
              description: t('Categories to group by'),
            },
          },
          {
            name: 'value_column',
            config: {
              type: 'SelectControl',
              label: t('Value Column'),
              description: t('Select the column to use for values'),
              clearable: false,
              renderTrigger: true,
              default: null,
              multi: false,
              mapStateToProps: (state, controlState) => {
                const { datasource } = state;
                return {
                  choices: (datasource?.columns || []).map(
                    (col: { column_name: any }) => [col.column_name],
                  ),
                };
              },
            },
          },
          {
            name: 'title_column',
            config: {
              ...sharedControls.columns,
              multi: false,
              label: t('Title'),
              description: t('Title'),
            },
          },
        ],
        ['adhoc_filters'],
        [
          {
            name: 'row_limit',
            config: sharedControls.row_limit,
          },
        ],
      ],
    },
  ],
};

export default config;
