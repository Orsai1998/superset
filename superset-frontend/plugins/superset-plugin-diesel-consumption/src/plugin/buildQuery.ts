import {
  buildQueryContext,
  buildQueryObject,
  QueryFormData,
  ensureIsArray,
  getMetricLabel,
  normalizeOrderBy,
  isXAxisSet,
  getXAxisColumn,
} from '@superset-ui/core';
import { extractExtraMetrics } from '@superset-ui/chart-controls';

function buildSortMetric(op: string, column: string) {
  return {
    expressionType: 'SIMPLE',
    aggregate: op.toUpperCase(),
    column: { column_name: column },
    label: `${op}__${column}`,
  };
}

export default function buildQuery(formData: QueryFormData) {
  const sortByMetric = ensureIsArray(formData.timeseries_limit_metric)[0];
  const { groupby } = formData;
  return buildQueryContext(formData, baseQueryObject => {
    let orderby = [];
    const query = buildQueryObject(formData);
    // @ts-ignore
    let metrics = [...query.metrics];
    const extra_metrics = extractExtraMetrics(formData);
    const columns = [
      ...(isXAxisSet(formData) ? ensureIsArray(getXAxisColumn(formData)) : []),
      ...ensureIsArray(groupby),
    ];
    // === APPLY GROUP BY ===
    const xAxis = formData.xAxis || formData.x_axis || formData.groupby?.[0];
    if (xAxis) {
      query.groupby = [xAxis];
    }

    // === APPLY METRICS ===
    if (formData.metrics) {
      query.metrics = formData.metrics;
    }

    // === APPLY SORTING ===
    // formData.sort_by: 'plan' | 'fact' | metric label

    if (sortByMetric) {
      // ensure the metric is included in metrics
      const sortLabel = getMetricLabel(sortByMetric);
      const hasSortMetric = metrics.some(
        (m: any) => getMetricLabel(m) === sortLabel,
      );

      if (!hasSortMetric) {
        metrics = [...metrics, sortByMetric];
      }
    }

    // === APPLY FILTERS ===
    if (Array.isArray(formData.filters)) {
      query.filters = formData.filters;
    }

    if (formData.x_axis_sort_series) {
      const op = formData.x_axis_sort_series; // "min" | "max" | "sum"
      const metric = buildSortMetric(op, xAxis);

      // ensure metric is in SELECT
      metrics = [...metrics, metric];
      query.metrics = metrics;

      orderby = [[metric, formData.x_axis_sort_series_ascending ?? true]];
      // @ts-ignore
      query.orderby = orderby;
      return [query];
    }

    if (formData.x_axis_sort_asc !== undefined) {
      query.orderby = [[xAxis, formData.x_axis_sort_asc]];
    }

    // === APPLY LIMIT ===
    // @ts-ignore
    query.row_limit = formData.row_limit ?? 1000;
    return [
      {
        ...baseQueryObject,
        metrics: [...(baseQueryObject.metrics || []), ...extra_metrics],
        columns,
        series_columns: groupby,
        ...(isXAxisSet(formData) ? {} : { is_timeseries: true }),
        orderby: normalizeOrderBy(baseQueryObject).orderby,
      },
    ];
  });
}
