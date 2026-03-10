import { ChartProps, getNumberFormatter } from '@superset-ui/core';
import { DieselDatum } from '../types';

function normalizeByTimeGrain(
  data: DieselDatum[],
  timeGrainSqla?: string | null,
): DieselDatum[] {
  if (!timeGrainSqla) return data;

  const map = new Map<string, DieselDatum>();
  data.forEach(d => map.set(d.day, d));

  /* ======================
     DAY → always 01..31
  ====================== */
  if (timeGrainSqla === 'P1D') {
    return Array.from({ length: 31 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0');
      return (
        map.get(day) ?? {
          day,
          plan: 0,
          fact: 0,
        }
      );
    });
  }

  /* ======================
     MONTH → always 01..12
  ====================== */
  if (timeGrainSqla === 'P1M') {
    return Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0');
      return (
        map.get(month) ?? {
          day: month,
          plan: 0,
          fact: 0,
        }
      );
    });
  }

  return data;
}

// @ts-ignore
function resolveXAxisColumn(formData) {
  const pick = (col: { label: any }) => {
    if (!col) return null;

    // Case 1: string = physical column name
    if (typeof col === 'string') return col;

    // Case 2: SQL expression / adhoc column
    if (typeof col === 'object' && col.label) return col.label;

    return null;
  };

  const x1 = pick(formData.xAxis);
  if (x1) return x1;

  const x2 = pick(formData.x_axis);
  if (x2) return x2;

  // Fallback: use groupby[0]
  if (Array.isArray(formData.groupby) && formData.groupby.length > 0) {
    const g = pick(formData.groupby[0]);
    if (g) return g;
  }

  // Final fallback: Superset timestamp col
  return '__timestamp';
}
function resolveDay(value: any, timeGrainSqla?: string | null) {
  if (!value) return value;

  if (!timeGrainSqla) {
    return value;
  }

  const d = new Date(value);

  switch (timeGrainSqla) {
    /* ======================
       TIME
    ====================== */
    case 'PT1S':
      return d.toISOString().slice(11, 19); // HH:mm:ss

    case 'PT1M':
    case 'PT5M':
    case 'PT10M':
    case 'PT15M':
    case 'PT30M':
      return d.toISOString().slice(11, 16); // HH:mm

    case 'PT1H':
      return d.toISOString().slice(11, 13); // HH

    /* ======================
       DAY → 01, 02, 03 ...
    ====================== */
    case 'P1D':
      return String(d.getUTCDate()).padStart(2, '0');

    /* ======================
       WEEK
    ====================== */
    case 'P1W':
    case '1969-12-28T00:00:00Z/P1W':
    case '1969-12-29T00:00:00Z/P1W': {
      const monday = new Date(d);
      const day = monday.getUTCDay() || 7;
      monday.setUTCDate(monday.getUTCDate() - day + 1);
      return String(monday.getUTCDate()).padStart(2, '0');
    }

    /* ======================
       MONTH / QUARTER / YEAR
    ====================== */
    case 'P1M':
      return `${d.getUTCMonth() + 1}`.padStart(2, '0');

    case 'P3M': {
      const q = Math.floor(d.getUTCMonth() / 3) + 1;
      return `Q${q}`;
    }

    case 'P1Y':
      return `${d.getUTCFullYear()}`;

    default:
      return value;
  }
}

export default function transformProps(chartProps: ChartProps) {
  const { width, height, theme, queriesData, formData } = chartProps;
  const { timeGrainSqla } = formData;
  const records = queriesData?.[0]?.data ?? [];
  // === STANDARD Superset time column ===
  const timeCol = resolveXAxisColumn(formData);
  if (!timeCol) {
    console.warn('Superset did not provide x_axis column.');
  }

  // === METRICS ===
  const [planMetric, factMetric] = formData.metrics ?? [];

  const planMetricName = planMetric?.label ?? planMetric;
  const factMetricName = factMetric?.label ?? factMetric;

  // === FORMATTING ===
  const valueFormat =
    (formData as any).valueFormat ?? (formData as any).value_format ?? ',.2f';
  const fmt = getNumberFormatter(valueFormat);
  // === TRANSFORM WITHOUT SORTING (Superset already sorts!) ===
  const rawData: DieselDatum[] = records.map((rec: Record<any, any>) => ({
    day: resolveDay(rec[timeCol], timeGrainSqla),

    plan: Number(rec[planMetricName] ?? 0),
    fact: Number(rec[factMetricName] ?? 0),
  }));
  const fillTimeGaps =
    (formData as any).fill_time_gaps ?? (formData as any).fillTimeGaps ?? true;
  const data = fillTimeGaps
    ? normalizeByTimeGrain(rawData, timeGrainSqla)
    : rawData;
  // === TOTALS (based on filtered dataset) ===
  const totals = data.reduce(
    (acc, d) => {
      acc.plan += d.plan;
      acc.fact += d.fact;
      return acc;
    },
    { plan: 0, fact: 0 },
  );

  const count = data.length || 1;

  const averages = {
    plan: totals.plan / count,
    fact: totals.fact / count,
  };

  const planLabel =
    typeof formData?.planLabel === 'string' ? formData.planLabel : 'План';

  const factLabel =
    typeof formData?.factLabel === 'string' ? formData.factLabel : 'Факт';

  const barWidth = Number.isFinite(formData?.barWidth)
    ? formData?.barWidth
    : 12;
  const barGap = Number.isFinite(formData?.barGap) ? formData?.barGap : 20;
  const showFactLabels = Boolean((formData as any).showFactLabels);

  return {
    width,
    height,
    theme,
    data,
    planColor: formData.plan_color ?? '#E77E83',
    factColor: formData.fact_color ?? '#7DBE82',
    showMonthTotals: formData.show_month_totals ?? true,
    totals,
    averages,
    fmt,
    title: formData.slice_name ?? '',
    formData,
    planLabel,
    factLabel,
    barWidth,
    barGap,
    showFactLabels,
  };
}
