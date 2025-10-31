import { buildQueryContext, QueryFormData } from '@superset-ui/core';

/**
 * The buildQuery function is used to create an instance of QueryContext that's
 * sent to the chart data endpoint. It specifies the columns to be grouped by
 * and other query configurations, such as filters and metrics.
 */
export default function buildQuery(formData: QueryFormData) {
  const { cols: groupby, metrics, filters } = formData; // Destructure other useful fields if needed

  // Build the query context
  return buildQueryContext(formData, baseQueryObject => [
    {
      ...baseQueryObject,
      groupby, // Apply groupby to the baseQueryObject
      metrics, // Add metrics if needed
      filters, // Add filters if needed
    },
  ]);
}
