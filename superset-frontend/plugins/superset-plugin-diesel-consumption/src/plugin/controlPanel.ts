import { t } from '@superset-ui/core';
import { ControlPanelConfig, sections } from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    sections.echartsTimeSeriesQueryWithXAxisSort,
    {
      label: 'Customize',
      expanded: true,
      controlSetRows: [
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
        [
          {
            name: 'chart_type',
            config: {
              type: 'SelectControl',
              label: t('Chart type'),
              default: 'default',
              choices: [
                ['default', t('Default view')],
                ['plan_fact_daily', t('Daily Plan/Fact (bars)')],
                ['plan_fact_line', t('Daily Plan/Fact (line)')],
              ],
              description: t(
                'Choose how the data should be displayed: default layout or the daily Plan/Fact style.',
              ),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'chart_title',
            config: {
              type: 'TextControl',
              label: t('Chart title'),
              default: 'Добыча руды',
              description: t('Title displayed above the chart.'),
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'planLabel',
            config: {
              type: 'TextControl',
              label: 'Наименование плана',
              default: 'План',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'factLabel',
            config: {
              type: 'TextControl',
              label: 'Наименование факта',
              default: 'Факт',
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'metric_title',
            config: {
              type: 'TextControl',
              label: t('Название метрики'),
              default: 'тыс. тонн',
              description: t('Текст, отображаемый над значениями графика'),
              renderTrigger: true,
            },
          },
        ],
        // ─── Формат числа ──────────────────────────
        [
          {
            name: 'valueFormat',
            config: {
              type: 'SelectControl',
              label: 'Формат числа',
              default: ',.2f',
              choices: [
                [',.0f', 'Без дробных'],
                [',.1f', '1 знак'],
                [',.2f', '2 знака'],
                [',.3f', '3 знака'],
                [',.5f', '5 знаков'],
              ],
              renderTrigger: true,
            },
          },
        ],
        // ─── Font Size Control ──────────────────────────
        [
          {
            name: 'current_month_font_size',
            config: {
              type: 'SliderControl',
              label: t('Размер шрифта текущего месяца'),
              description: t(
                'Изменяет размер шрифта подписи текущего месяца на графике',
              ),
              default: 13,
              min: 8,
              max: 48,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'title_font_size',
            config: {
              type: 'SliderControl',
              label: t('Размер шрифта заголовка'),
              description: t('Изменяет размер шрифта заголовка графика'),
              default: 16,
              min: 8,
              max: 48,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'metric_font_size',
            config: {
              type: 'SliderControl',
              label: t('Размер шрифта метрики'),
              description: t('Размер шрифта значения метрики'),
              default: 16,
              min: 8,
              max: 48,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'x_axis_font_size',
            config: {
              type: 'SliderControl',
              label: t('Размер шрифта оси'),
              description: t('Размер шрифта подписей оси'),
              default: 10,
              min: 8,
              max: 48,
              step: 1,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'barWidth',
            config: {
              type: 'SliderControl',
              label: 'Ширина столбцов',
              default: 12,
              min: 2,
              max: 60,
              step: 1,
              renderTrigger: true,
            },
          },
          {
            name: 'barGap',
            config: {
              type: 'SliderControl',
              label: 'Отступ между столбцами',
              default: 20,
              min: 0,
              max: 60,
              step: 5,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'metric_title_font_size',
            config: {
              type: 'SliderControl',
              label: t('Размер шрифта щаголовка метрики'),
              description: t(
                'Изменяет размер шрифта заголовка метрики (например, единицы измерения над графиком)',
              ),
              default: 12,
              min: 8,
              max: 48,
              step: 1,
              renderTrigger: true,
            },
          },

          {
            name: 'fill_time_gaps',
            config: {
              type: 'CheckboxControl',
              label: 'Заполянять пропуски во времени (0)',
              default: true,
              renderTrigger: true,
              description:
                'Добавляет пропущенные дни или месяяцы со значением 0, чтобы шкала времени была непрерывной',
            },
          },
          {
            name: 'enable_fact_plan_coloring',
            config: {
              type: 'CheckboxControl',
              label: t('Цветная логика факт/план'),
              description: t(
                'Если включено, значения окрашиваются в зависимости от условий факт > план',
              ),
              default: true,
              renderTrigger: true,
            },
          },
        ],
        // ─── Галочка для отображения чисел для нового типа графика ──────────────────────────
        [
          {
            name: 'show_fact_labels',
            config: {
              type: 'CheckboxControl',
              label: 'Показывать значение факта для линейного графика',
              default: false,
              renderTrigger: true,
            },
          },
        ],
        // ─── Поворот значений в графике ──────────────────────────
        [
          {
            name: 'fact_label_rotation',
            config: {
              type: 'SelectControl',
              label: 'Поворот значений',
              default: '0',
              renderTrigger: true,
              choices: [
                ['0', 'Без поворота'],
                ['45', '45'],
              ],
            },
          },
        ],
      ],
    },
  ],
};

export default config;
