import type {
  QueryFormData,
  QueryFormMetric,
  QueryFormColumn,
  DataRecord,
} from '@superset-ui/core';

/**
 * Размер заголовка: можно брать ключи темы ('xxs'…'xxl') или число в px
 */
export type HeaderFontSize =
  | 'xs'
  | 's'
  | 'm'
  | 'l'
  | 'xl'
  | 'xxl'
  | number;

/**
 * Данные строки после transformProps (категория + значение)
 */
export type Top5Row = {
  reason: string;
  value: number;
  raw?: DataRecord;
};

export interface SupersetPluginChartTop5BarsStylesProps {
  height: number;
  width: number;
  headerFontSize: HeaderFontSize;
  boldText: boolean;
  styleType: string;
  theme: 'dark' | 'light';
}

/**
 * Кастомные контролы
 */
export interface SupersetPluginChartTop5BarsCustomizeProps {
  headerText?: string;
  numberFormat?: string;
}

export interface Top5BarsFormData extends QueryFormData {
  groupby?: QueryFormColumn[];
  metrics?: QueryFormMetric[];
  metric?: QueryFormMetric;
  row_limit?: number;

  // Кастомные поля
  headerText?: string;
  headerFontSize?: HeaderFontSize;
  boldText?: boolean;
  numberFormat?: string;
  styleType: string;
}

export type SupersetPluginChartTop5BarsProps =
  SupersetPluginChartTop5BarsStylesProps &
    SupersetPluginChartTop5BarsCustomizeProps & {
      data: Top5Row[];
      max?: number;
      formData: Top5BarsFormData;
    };
