import { ChartProps, TimeseriesDataRecord } from '@superset-ui/core';

export default function transformProps(chartProps: ChartProps) {
  const { width, height, formData, queriesData } = chartProps;
  const { boldText, headerFontSize, headerText } = formData;
  const rawData = queriesData[0].data as TimeseriesDataRecord[];

  console.log(rawData)
  const { categoryColumn, titleColumn, valueColumn } = formData;
  console.log(chartProps)
  const data = rawData.map(row => ({
    category: row[categoryColumn],
    title: row[titleColumn],
    value: String(row[valueColumn]).padStart(9, '0'),
  }));

  return {
    width,
    height,
    data,
    boldText,
    headerFontSize,
    headerText,
  };
}

