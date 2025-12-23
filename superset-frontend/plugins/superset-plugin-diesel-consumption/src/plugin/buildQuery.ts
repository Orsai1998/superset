import {
  buildQueryContext,
  buildQueryObject,
  QueryFormData,
  ensureIsArray,
  getMetricLabel,
  normalizeOrderBy,
  isXAxisSet,
  getXAxisColumn,
  QueryObject,
} from '@superset-ui/core';
import { extractExtraMetrics } from '@superset-ui/chart-controls';

export default function buildQuery(formData: QueryFormData) {
  const sortByMetric = ensureIsArray(formData.timeseries_limit_metric)[0];
  const { groupby } = formData;
  return buildQueryContext(formData, baseQueryObject => {
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
    let orderby: QueryObject['orderby'];
    const asc = formData.sort_ascending !== false;
    if (formData.sort_by === '__xaxis__' && xAxis) {
      orderby = [[xAxis, asc]];
    } else {
      const { orderby: normalizedOrderby } = normalizeOrderBy(baseQueryObject);
      orderby = normalizedOrderby;
    }
    // === APPLY FILTERS ===
    if (Array.isArray(formData.filters)) {
      query.filters = formData.filters;
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
        orderby,
      },
    ];
  });
}
