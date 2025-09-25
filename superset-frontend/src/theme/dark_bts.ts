import { SupersetTheme } from '@superset-ui/core';

export const dark_bts: Partial<SupersetTheme> = {
  id: 'DARK_BTS',
  label: 'Dark BTS Theme',
  colors: {
    primary: '#ff9e29',
    secondary: '#5a6469',
    background: '#1e1e1e',
    text: '#ffffff',
    grid: { stroke: '#32373c' },
  },
  echartsTheme: {
    backgroundColor: '#1e1e1e',
    color: ['#ff9e29', '#5a6469', '#ef7f1a', '#32373c'],
    axisLine: { lineStyle: { color: '#0008' } },
    axisLabel: { color: '#ffffff' },
  },
};