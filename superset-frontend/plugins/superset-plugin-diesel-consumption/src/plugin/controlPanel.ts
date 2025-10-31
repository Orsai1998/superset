import { t, validateNonEmpty } from '@superset-ui/core';
import {
  sections,
  sharedControls,
  ControlPanelConfig,
} from '@superset-ui/chart-controls';

const config: ControlPanelConfig = {
  controlPanelSections: [
    sections.legacyTimeseriesTime,
    {
      label: t('Query'),
      expanded: true,
      controlSetRows: [
        [
          {
            name: 'groupby',
            config: {
              type: 'SelectControl',
              label: t('Day column'),
              description: t(
                'Categorical column for the day label (e.g., 01..31).',
              ),
              default: ['day'], // Default to 'day' column or an empty array if preferred
              validators: [validateNonEmpty],
              multi: false, // Allow only one selection for grouping by day
              freeForm: false,
              renderTrigger: true,
            },
          },
        ],
        [
          {
            name: 'metrics',
            config: {
              ...sharedControls.metrics,
              label: t('Metrics (Plan, Fact)'),
              description: t(
                'Provide two metrics: first for Plan, second for Fact. Usually SUM(plan), SUM(fact).',
              ),
              validators: [validateNonEmpty],
              multi: true, // Allow selecting multiple metrics
            },
          },
        ],
        [
          {
            name: 'adhoc_filters',
            config: {
              ...sharedControls.adhoc_filters,
              label: t('Filters'),
              default: [],
            },
          },
        ],
        [
          {
            name: 'row_limit',
            config: {
              type: 'NumberControl', // Use NumberControl for row limit
              label: t('Row limit'),
              default: 1000,
              description: t('Limit the number of rows returned by the query'),
              renderTrigger: true,
            },
          },
        ],
      ],
    },
    {
      label: t('Appearance'),
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
      ],
    },
  ],
};

export default config;
