import { ChartProps, getNumberFormatter } from '@superset-ui/core';
import { DieselDatum } from '../types';

export default function transformProps(chartProps: ChartProps) {
  const { width, height, theme, queriesData, formData } = chartProps;

  // Handle undefined queriesData gracefully
  const records = queriesData?.[0]?.data ?? [];

  // Grouping and metrics extraction
  const groupby = formData.groupby ?? []; // Default to empty array if not provided
  const [dayCol] = groupby;

  // Safely handle metrics
  const [planMetric, factMetric] = formData.metrics ?? [];
  const planMetricName = planMetric?.label ?? planMetric; // Use label or fallback to the metric name itself
  const factMetricName = factMetric?.label ?? factMetric;

  // Colors and other settings
  const planColor = formData.plan_color ?? '#E77E83'; // Use default color if not provided
  const factColor = formData.fact_color ?? '#7DBE82';
  const showMonthTotals = formData.show_month_totals ?? true; // Use nullish coalescing to fallback to true
  const valueFormat = formData.value_format ?? ',.0f'; // Default to number format

  // Get the number formatter
  const fmt = getNumberFormatter(valueFormat);

  // Transform records into the required format
  const data: DieselDatum[] = records.map((r: { [x: string]: any }) => ({
    day: r[dayCol], // Use the day column
    plan: Number(r[planMetricName]) || 0, // Ensure plan value is a number or fallback to 0
    fact: Number(r[factMetricName]) || 0, // Ensure fact value is a number or fallback to 0
  }));

  // Sort by day, treating day as a number if it's numeric, otherwise as a string
  const sorted = [...data].sort((a, b) => {
    const an = Number(a.day);
    const bn = Number(b.day);

    // If both are numbers, sort numerically
    // eslint-disable-next-line no-restricted-globals
    if (!isNaN(an) && !isNaN(bn)) return an - bn;

    // If they are not numbers, sort lexicographically (as strings)
    return String(a.day).localeCompare(String(b.day));
  });

  // Calculate totals for the plan and fact metrics
  const totals = sorted.reduce(
    (acc, d) => {
      acc.plan += d.plan;
      acc.fact += d.fact;
      return acc;
    },
    { plan: 0, fact: 0 }, // Default values for the accumulator
  );

  // Return the processed data and settings
  return {
    width,
    height,
    theme,
    data: sorted,
    planColor,
    factColor,
    showMonthTotals,
    totals,
    fmt,
    title: formData?.slice_name ?? '',
    formData,
  };
}
