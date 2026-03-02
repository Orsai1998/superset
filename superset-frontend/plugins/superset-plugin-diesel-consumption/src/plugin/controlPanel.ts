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
              label: t('Metric title'),
              default: 'тыс. тонн',
              description: t('Label displayed above the metrics.'),
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
              label: t('Current month font size'),
              description: t(
                'Adjust the font size of charts current month font size',
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
        [
          {
            name: 'metric_font_size',
            config: {
              type: 'SliderControl',
              label: t('Metric font size'),
              description: t('Metric font size.'),
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
              label: t('Axis font size'),
              description: t('Axis font size.'),
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
              label: t('Metric title font size'),
              description: t(
                'Adjust the font size of the metric title (e.g., units above chart).',
              ),
              default: 12,
              min: 8,
              max: 48,
              step: 1,
              renderTrigger: true,
            },
          },
          {
            name: 'enable_fact_plan_coloring',
            config: {
              type: 'CheckboxControl',
              label: t('Enable fact/plan color logic'),
              description: t(
                'If enabled, metrics will be colored based on fact > plan.',
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
      ],
    },
  ],
};

export default config;
