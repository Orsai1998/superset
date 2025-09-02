/**
 * Apache 2.0
 */
import { buildQueryContext, QueryFormData } from '@superset-ui/core';

type AdhocMetric = {
  label?: string;
  metric_name?: string;
  sqlExpression?: string;
  // возможны и другие поля adhoc-метрики — нам главное достать label
};

function getMetricLabel(metric: string | AdhocMetric | undefined): string | undefined {
  if (!metric) return undefined;
  if (typeof metric === 'string') return metric;
  return metric.label || metric.metric_name;
}

export default function buildQuery(formData: QueryFormData) {
  // читаем управляющие поля так, как задали в controlPanel.ts
  const groupby = (formData as any).groupby || (formData as any).cols || ['reason'];
  const metrics = (formData as any).metrics?.length
    ? (formData as any).metrics
    : [(formData as any).metric || 'sum__value']; // fallback, если вдруг метрика не задана
  const row_limit = (formData as any).row_limit ?? 5;

  // берём первую метрику для сортировки (Top-N)
  const primaryMetricLabel =
    getMetricLabel(metrics[0]) || 'sum__value';

  return buildQueryContext(formData, baseQueryObject => [
    {
      ...baseQueryObject,
      is_timeseries: false,
      groupby,
      metrics,
      // сортируем по метрике по убыванию (false => DESC)
      orderby: [[primaryMetricLabel, false]],
      row_limit,
    },
  ]);
}
