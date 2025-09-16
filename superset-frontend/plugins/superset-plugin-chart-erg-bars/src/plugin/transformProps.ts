import {
  ChartProps,
  DataRecord,
  getMetricLabel,
  getNumberFormatter,
  NumberFormats,
  QueryFormData,
} from '@superset-ui/core';

type AdhocMetric = {
  label?: string;
  metric_name?: string;
  sqlExpression?: string;
  expressionType?: string;
  column?: any;
};
type MetricLike = string | AdhocMetric | undefined;

interface ErgPlanFactFormData extends QueryFormData {
  planMetric?: MetricLike;
  factMetric?: MetricLike;
  deviationMetric?: MetricLike;

  planColumn?: string;
  factColumn?: string;
  deviationColumn?: string;

  deviationMode?: 'auto' | 'metric' | 'column';

  unitLabel?: string;
  showBigValues?: boolean;
  numberFormat?: keyof typeof NumberFormats | string;

  metrics?: MetricLike[];
}

export interface ErgPlanFactTransformedProps {
  width: number;
  height: number;
  data: DataRecord[];
  metrics: { plan: number; fact: number; deviation: number };
  formData: ErgPlanFactFormData;
  formatValue: (n: number) => string;
}

const toNum = (v: unknown, fallback = 0): number => {
  if (v == null) return fallback;
  if (typeof v === 'string') {
    // мягкая очистка строкового числа: уберём пробелы, заменим запятую на точку
    const s = v.replace(/\s/g, '').replace(',', '.');
    const n = Number(s);
    return Number.isFinite(n) ? n : fallback;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};

function metricKey(m?: MetricLike): string | undefined {
  if (!m) return undefined;
  if (typeof m === 'string') return m;
  return m.label || (m as any).metric_name || getMetricLabel(m as any);
}

function resolveKeyAgainstColnames(
  key: string | undefined,
  colnames?: string[],
): string | undefined {
  if (!key) return undefined;
  if (colnames?.includes(key)) return key;

  const candidates = [
    key,
    key.replace(/"/g, ''),
    `"${key}"`,
    key.toLowerCase(),
    key.toUpperCase(),
  ];
  const found = colnames?.find(
    c => candidates.includes(c) || candidates.includes(c.replace(/"/g, '')),
  );
  return found ?? key;
}

export default function transformProps(
  chartProps: ChartProps,
): ErgPlanFactTransformedProps {
  const { width, height, queriesData, formData } = chartProps;
  const fd = (formData as unknown as ErgPlanFactFormData) || {};
  const rows = (queriesData?.[0]?.data ?? []) as DataRecord[];
  const colnames = (queriesData?.[0]?.colnames ?? []) as string[];
  const row = rows[0] || ({} as DataRecord);

  const useColumns = Boolean(fd.planColumn && fd.factColumn);

  let plan = 0;
  let fact = 0;
  let deviation = 0;

  if (useColumns) {
    plan = toNum(fd.planColumn ? row[fd.planColumn] : undefined, 0);
    fact = toNum(fd.factColumn ? row[fd.factColumn] : undefined, 0);

    if (fd.deviationMode === 'column' && fd.deviationColumn) {
      deviation = toNum(row[fd.deviationColumn], 0);
    } else {
      deviation = plan - fact; // авто-отклонение
    }
  } else {
    const [fallback1, fallback2] = Array.isArray(fd.metrics) ? fd.metrics : [];
    const planKeyRaw = metricKey(fd.planMetric) ?? metricKey(fallback1);
    const factKeyRaw =
      metricKey(fd.factMetric) ?? metricKey(fallback2 ?? fallback1);
    const devKeyRaw =
      fd.deviationMode === 'metric' ? metricKey(fd.deviationMetric) : undefined;

    const planKey = resolveKeyAgainstColnames(planKeyRaw, colnames);
    const factKey = resolveKeyAgainstColnames(factKeyRaw, colnames);
    const devKey = resolveKeyAgainstColnames(devKeyRaw, colnames);

    plan = toNum(planKey ? row[planKey as keyof DataRecord] : undefined, 0);
    fact = toNum(factKey ? row[factKey as keyof DataRecord] : undefined, 0);

    deviation =
      fd.deviationMode === 'metric'
        ? toNum(devKey ? row[devKey as keyof DataRecord] : undefined, 0)
        : plan - fact; // авто-отклонение
  }

  const formatter = getNumberFormatter(
    (fd.numberFormat as string) || 'SMART_NUMBER',
  );

  return {
    width,
    height,
    data: rows,
    metrics: { plan, fact, deviation },
    formData: fd,
    formatValue: (n: number) => formatter(n),
  };
}
