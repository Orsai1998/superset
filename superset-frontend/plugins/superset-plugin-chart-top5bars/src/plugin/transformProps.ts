import { ChartProps, DataRecord, getNumberFormatter } from '@superset-ui/core';
import type { Top5BarsFormData } from '../types';

type AdhocMetric = {
  label?: string;
  metric_name?: string;
  sqlExpression?: string;
};

export type Top5Row = { reason: string; value: number; raw?: DataRecord };

export interface Top5BarsTransformedProps {
  width: number;
  height: number;
  data: Top5Row[];
  max: number;
  headerText?: string;
  headerFontSize?: any;
  boldText?: boolean;
  numberFormat?: string;
  formatValue: (n: number) => string;
}

function getMetricKey(
  metric: string | AdhocMetric | undefined,
): string | undefined {
  if (!metric) return undefined;
  if (typeof metric === 'string') return metric;
  return metric.label || metric.metric_name || undefined;
}

function toNumber(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

export default function transformProps(
  chartProps: ChartProps,
): Top5BarsTransformedProps {
  const { width, height, formData, queriesData } = chartProps;
  const fd = (formData as unknown as Top5BarsFormData) || {};
  const rows = (queriesData?.[0]?.data ?? []) as DataRecord[];

  const groupbyCol = (Array.isArray(fd.groupby) && fd.groupby[0]) || 'reason';

  const metricKeyFromArray = Array.isArray(fd.metrics)
    ? getMetricKey(fd.metrics[0])
    : undefined;
  const metricKey =
    metricKeyFromArray || fd.metric_label || getMetricKey(fd.metric) || 'value';

  const numberFormat = fd.numberFormat || 'SMART_NUMBER';
  const formatter = getNumberFormatter(numberFormat);

  const mapped: Top5Row[] = rows.map(r => {
    // @ts-ignore
    const reasonRaw = (r[groupbyCol] ?? (r as any).reason) as unknown;
    const valueRaw = (r[metricKey as keyof DataRecord] ??
      (r as any).value) as unknown;
    return {
      reason: String(reasonRaw ?? ''),
      value: toNumber(valueRaw, 0),
      raw: r,
    };
  });

  const cleaned = mapped
    .filter(d => d.reason !== '' && Number.isFinite(d.value))
    .sort((a, b) => b.value - a.value);
  const topN = toNumber(fd.row_limit, 5) || 5;
  const top = cleaned.slice(0, topN);
  const max = Math.max(1, ...top.map(d => d.value));

  return {
    width,
    height,
    data: top,
    max,
    headerText: fd.headerText,
    headerFontSize: fd.headerFontSize,
    boldText: Boolean(fd.boldText),
    numberFormat,
    formatValue: (n: number) => formatter(n),
  };
}
