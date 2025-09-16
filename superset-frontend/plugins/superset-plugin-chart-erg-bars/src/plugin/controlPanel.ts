import { t } from '@superset-ui/core';
import { ControlPanelConfig } from '@superset-ui/chart-controls';

// @ts-ignore
const config: ControlPanelConfig = {
  controlPanelSections: [
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'planColumn',
            config: {
              type: 'SelectControl',
              label: t('Колонка — План'),
              description: t('Поле таблицы для значения «План».'),
              freeForm: true,
              default: 'plan',
              mapStateToProps: (state: {
                datasource?: { columns?: any[] };
              }) => ({
                choices:
                  state.datasource?.columns?.map((c: any) => [
                    c.column_name,
                    c.verbose_name || c.column_name,
                  ]) ?? [],
              }),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'factColumn',
            config: {
              type: 'SelectControl',
              label: t('Колонка — Факт'),
              description: t('Поле таблицы для значения «Факт».'),
              freeForm: true,
              default: 'fact',
              mapStateToProps: (state: {
                datasource?: { columns?: any[] };
              }) => ({
                choices:
                  state.datasource?.columns?.map((c: any) => [
                    c.column_name,
                    c.verbose_name || c.column_name,
                  ]) ?? [],
              }),
              renderTrigger: true,
            },
          },
        ],

        // ----- ОТКЛОНЕНИЕ (auto | column) -----
        [
          {
            name: 'deviationMode',
            config: {
              type: 'SelectControl',
              label: t('Отклонение'),
              default: 'auto',
              choices: [
                ['auto', t('Авто: План − Факт')],
                ['column', t('Колонка')],
              ],
              description: t(
                'Как получить отклонение: посчитать на фронте или взять из отдельной колонки.',
              ),
              clearable: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'deviationColumn',
            config: {
              type: 'SelectControl',
              label: t('Колонка — Отклонение'),
              description: t('Используется, если выбран режим «Колонка».'),
              freeForm: true,
              default: null,
              visibility: ({ controls }) =>
                controls?.deviationMode?.value === 'column',
              mapStateToProps: (state: {
                datasource?: { columns?: any[] };
              }) => ({
                choices:
                  state.datasource?.columns?.map((c: any) => [
                    c.column_name,
                    c.verbose_name || c.column_name,
                  ]) ?? [],
              }),
              renderTrigger: true,
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
            name: 'unitLabel',
            config: {
              type: 'TextControl',
              label: t('Единица измерения'),
              default: t('тонн хром'),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'showBigValues',
            config: {
              type: 'CheckboxControl',
              label: t('Крупные числа над столбцами'),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'numberFormat',
            config: {
              type: 'TextControl',
              label: t('Формат чисел'),
              default: 'SMART_NUMBER',
              renderTrigger: true,
            },
          },
        ],
      ],
    },
  ],
};

export default config;
