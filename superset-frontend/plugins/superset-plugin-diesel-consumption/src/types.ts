import {
  QueryFormData,
  supersetTheme,
  TimeseriesDataRecord,
} from '@superset-ui/core';

export interface SupersetPluginDieselConsumptionStylesProps {
  height: number;
  width: number;
  headerFontSize: keyof typeof supersetTheme.typography.sizes;
  boldText: boolean;
  theme: 'light' | 'dark';
  title_font_size: number;
  planLabel?: string;
  factLabel?: string;
  barWidth?: number;
  barGap?: number;
}

interface SupersetPluginDieselConsumptionCustomizeProps {
  headerText: string;
}

export type SupersetPluginDieselConsumptionQueryFormData = QueryFormData &
  SupersetPluginDieselConsumptionStylesProps &
  SupersetPluginDieselConsumptionCustomizeProps;

export type DieselDatum = {
  day: any;
  plan: number;
  fact: number;
};

export type SupersetPluginDieselConsumptionProps =
  SupersetPluginDieselConsumptionStylesProps &
    SupersetPluginDieselConsumptionCustomizeProps & {
      data: TimeseriesDataRecord[];
      planColor: string; // Цвет для плана
      factColor: string; // Цвет для факта
      showMonthTotals: boolean; // Показать итоговые значения по месяцу
      totals: { plan: number; fact: number }; // Итоги для плана и факта
      fmt: (n: number) => string; // Функция для форматирования чисел
      title?: string; // Заголовок графика
      formData: SupersetPluginDieselConsumptionQueryFormData;
    };
