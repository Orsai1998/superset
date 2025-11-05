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
              type: 'SelectControl',
              label: t('Header font size'),
              default: 'xl',
              choices: [
                ['xxs', 'xx-small'],
                ['xs', 'x-small'],
                ['s', 'small'],
                ['m', 'medium'],
                ['l', 'large'],
                ['xl', 'x-large'],
                ['xxl', 'xx-large'],
              ],
              renderTrigger: true,
              description: t('Размер шрифта заголовка'),
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
        ],
      ],
    },
  ],
};

export default config;
