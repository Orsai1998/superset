/**
 * Apache 2.0
 */
import { t } from '@superset-ui/core';
import { ControlPanelConfig, sections } from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    sections.echartsTimeSeriesQueryWithXAxisSort,
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
            name: 'metric_width',
            config: {
              type: 'SliderControl',
              label: t('Metric width'),
              description: t('Размер ширины'),
              default: 350,
              min: 8,
              max: 800,
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
        ],
      ],
    },
  ],
};

export default config;
