import { ChartProps, getNumberFormatter } from '@superset-ui/core';
import { DieselDatum } from '../types';

export default function transformProps(chartProps: ChartProps) {
  const { width, height, theme, queriesData, formData } = chartProps;

  const records = queriesData?.[0]?.data ?? [];
  console.log(queriesData);
  // === STANDARD Superset time column ===
  const timeCol =
    formData.xAxis || formData.x_axis || formData.groupby?.[0] || '__timestamp';
  if (!timeCol) {
    console.warn('Superset did not provide x_axis column.');
  }

  // === METRICS ===
  const [planMetric, factMetric] = formData.metrics ?? [];

  const planMetricName = planMetric?.label ?? planMetric;
  const factMetricName = factMetric?.label ?? factMetric;

  // === FORMATTING ===
  const fmt = getNumberFormatter(formData.value_format ?? ',.0f');

  // === TRANSFORM WITHOUT SORTING (Superset already sorts!) ===
  const data: DieselDatum[] = records.map((rec: Record<string, any>) => ({
    day: rec[timeCol],

    plan: Number(rec[planMetricName] ?? 0),
    fact: Number(rec[factMetricName] ?? 0),
  }));

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
  };
}
