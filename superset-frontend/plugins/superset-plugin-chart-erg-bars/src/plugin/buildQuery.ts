import { buildQueryContext, QueryFormData } from '@superset-ui/core';

const mkAdhocColumn = (label: string) => ({
  expressionType: 'SQL' as const,
  label,
  sqlExpression: label,
});

export default function buildQuery(formData: QueryFormData) {
  const fd: any = formData;

  const deviationMode: 'auto' | 'column' = fd.deviationMode ?? 'auto';

  const planCol: string | undefined = fd.planColumn || undefined;
  const factCol: string | undefined = fd.factColumn || undefined;

  const cols: string[] = [];
  if (planCol) cols.push(planCol);
  if (factCol) cols.push(factCol);
  if (deviationMode === 'column' && fd.deviationColumn) {
    cols.push(fd.deviationColumn);
  }

  const columns = Array.from(new Set(cols.map(String))).map(mkAdhocColumn);

  return buildQueryContext(formData, base => [
    {
      ...base,
      is_timeseries: false,
      columns,
      metrics: [],
      groupby: [],
      row_limit: 1,
      orderby: [],
    },
  ]);
}
