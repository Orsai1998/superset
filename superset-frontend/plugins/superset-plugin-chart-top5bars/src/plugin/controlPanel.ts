/**
 * Apache 2.0
 */
import { t, validateNonEmpty } from '@superset-ui/core';
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
            name: 'groupby',
            config: {
              ...sharedControls.groupby,
              label: t('Group by (Category)'),
              description: t('Категориальная ось (например, reason)'),
              validators: [validateNonEmpty],
            },
          },
        ],

        [
          {
            name: 'metrics',
            config: {
              ...sharedControls.metrics,
              label: t('Metric'),
              description: t('Числовая метрика (например, SUM(value))'),
              validators: [validateNonEmpty],
            },
          },
        ],
        ['adhoc_filters'],
        [
          {
            name: 'sort_order',
            config: {
              type: 'SelectControl',
              label: t('Sort Order'),
              description: t('Choose how to sort bars before taking Top N'),
              default: 'desc',
              renderTrigger: true,
              choices: [
                ['asc', t('Ascending')],
                ['desc', t('Descending')],
                ['none', t('Do not sort')],
              ],
            },
          },
          {
            name: 'row_limit',
            config: {
              ...sharedControls.row_limit,
              default: 5,
              description: t('Сколько категорий показывать (Top-N)'),
            },
          },
        ],
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
              label: t('Header text'),
              default: 'Топ-5 простоев',
              renderTrigger: true,
              description: t('Текст заголовка над графиком'),
            },
          },
        ],

        [
          {
            name: 'subtitleText',
            config: {
              type: 'TextControl',
              label: t('Subtitle text'),
              default: '',
              renderTrigger: true,
              description: t(
                'Необязательная подпись под заголовком (например, "часы / тонны" или "значение / количество")',
              ),
            },
          },
        ],
        [
          {
            name: 'boldText',
            config: {
              type: 'CheckboxControl',
              label: t('Bold header'),
              default: true,
              renderTrigger: true,
              description: t('Сделать заголовок жирным'),
            },
          },
          {
            name: 'headerFontSize',
            config: {
              type: 'SliderControl',
              label: t('Header font size'),
              default: 12,
              min: 8,
              max: 48,
              step: 1,
              renderTrigger: true,
              description: t('Размер шрифта заголовка'),
            },
          },
        ],
        [
          {
            name: 'metric_title_font_size',
            config: {
              type: 'SliderControl',
              label: t('Metric title font size'),
              description: t('Размер шрифта метрики'),
              default: 12,
              min: 8,
              max: 48,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'styleType',
            config: {
              type: 'SelectControl',
              label: t('Display style'),
              default: 'classic',
              choices: [
                ['classic', t('Classic (Bar chart)')],
                ['modern', t('Modern (card style)')],
              ],
              renderTrigger: true,
              description: t(
                'Выберите стиль отображения: классический график или карточка как на макете',
              ),
            },
          },
          {
            name: 'color_scheme',
            config: {
              type: 'SelectControl',
              label: t('Bar Color Scheme'),
              default: 'blue',
              renderTrigger: true,
              choices: [
                ['blue', 'Blue → Cyan'],
                ['orange', 'Orange → Yellow'],
                ['bronze', 'Bronze → Navy'],
              ],
              description: t('Switch bar gradient color theme'),
            },
          },
        ],

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
};

export default config;
