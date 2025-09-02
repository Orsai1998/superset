import { buildQueryContext, QueryFormData } from '@superset-ui/core';

type AdhocMetric = {
  label?: string;
  metric_name?: string;
  sqlExpression?: string;
};

function getMetricLabel(
  metric: string | AdhocMetric | undefined,
): string | undefined {
  if (!metric) return undefined;
  if (typeof metric === 'string') return metric;
  return metric.label || metric.metric_name;
}

export default function buildQuery(formData: QueryFormData) {
  const groupby = (formData as any).groupby ||
    (formData as any).cols || ['reason'];
  const metrics = (formData as any).metrics?.length
    ? (formData as any).metrics
    : [(formData as any).metric || 'sum__value'];
  const row_limit = (formData as any).row_limit ?? 5;

  const primaryMetricLabel = getMetricLabel(metrics[0]) || 'sum__value';

  return buildQueryContext(formData, baseQueryObject => [
    {
      ...baseQueryObject,
      is_timeseries: false,
      groupby,
      metrics,
      orderby: [[primaryMetricLabel, false]],
      row_limit,
    },
  ]);
}
