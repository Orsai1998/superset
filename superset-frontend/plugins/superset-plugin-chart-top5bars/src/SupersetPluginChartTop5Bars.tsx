// eslint-disable-next-line no-restricted-syntax
import React, { useEffect, useRef } from 'react';
import { styled } from '@superset-ui/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as echarts from 'echarts/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BarChart } from 'echarts/charts';
// eslint-disable-next-line import/no-extraneous-dependencies
import { GridComponent, TooltipComponent } from 'echarts/components';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CanvasRenderer } from 'echarts/renderers';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LabelLayout } from 'echarts/features';
import type {
  SupersetPluginChartTop5BarsProps,
  SupersetPluginChartTop5BarsStylesProps,
} from './types';

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
  LabelLayout,
]);

// @ts-ignore
// eslint-disable-next-line theme-colors/no-literal-colors
const Styles = styled.div<SupersetPluginChartTop5BarsStylesProps>`
  background: transparent;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  overflow: hidden;

  /* Заголовок + чарт — вертикальная колонка */
  display: flex;
  flex-direction: column;

  .top5-header {
    /* Можно подстроить отступы под ваш стиль */
    padding: 4px 6px 6px 6px;
    /* eslint-disable-next-line theme-colors/no-literal-colors */
    color: #ffffff;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .top5-chart {
    flex: 1;
    min-height: 0; /* важно, чтобы eCharts не вылезал */
  }
`;

type Row = { reason: string; value: number };

// сопоставление размера из controls к px
const headerSizePx: Record<string, number> = {
  xxs: 10,
  xs: 12,
  s: 14,
  m: 16,
  l: 18,
  xl: 20,
  xxl: 24,
};

export default function SupersetPluginChartTop5Bars(
  props: SupersetPluginChartTop5BarsProps,
) {
  const {
    data = [],
    height,
    width,
  } = props as unknown as {
    data: Row[];
    height: number;
    width: number;
  };

  // берём поля из controls (transformProps должен их пробросить как есть)
  const { headerText, boldText, headerFontSize } = (props as any) || {};
  const headerPx =
    typeof headerFontSize === 'number'
      ? headerFontSize
      : headerSizePx[String(headerFontSize || 'xl')] ?? 20;

  const chartDivRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);

  const prepare = (rows: Row[]) => {
    const sorted = [...rows]
      .filter(d => d && typeof d.value === 'number')
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);
    return {
      reasons: sorted.map(d => String(d.reason ?? '—')),
      values: sorted.map(d => Number(d.value ?? 0)),
      max: Math.max(1, ...sorted.map(d => Number(d.value ?? 0))),
    };
  };

  const render = () => {
    const el = chartDivRef.current!;
    if (!chartRef.current)
      chartRef.current = echarts.init(el, undefined, { renderer: 'canvas' });
    const chart = chartRef.current;

    const { reasons, values, max } = prepare(data as Row[]);

    // @ts-ignore
    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      grid: { left: 8, right: 64, top: 8, bottom: 8, containLabel: true },

      xAxis: {
        type: 'value',
        max,
        splitLine: { show: false },
        axisLabel: { show: false },
        axisTick: { show: false },
        axisLine: { show: false },
      },
      yAxis: {
        type: 'category',
        data: reasons,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },

      tooltip: {
        show: true,
        trigger: 'item',
        formatter: (p: any) => `${p.name}: <b>${p.value}</b>`,
      },

      series: [
        {
          type: 'bar',
          data: values,
          barWidth: 16,
          label: {
            show: true,
            position: 'right',
            // eslint-disable-next-line theme-colors/no-literal-colors
            color: '#FFFFFF',
            fontFamily: 'Russo One, "Helvetica Neue", Helvetica, sans-serif',
            fontWeight: 800,
            fontSize: 22,
            // @ts-ignore
            formatter: ({ value }) => `${value}`,
          },
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                // eslint-disable-next-line theme-colors/no-literal-colors
                { offset: 0, color: '#000000' }, // 0%
                // eslint-disable-next-line theme-colors/no-literal-colors
                { offset: 1, color: '#0093FF' }, // 100%
              ],
            },
            shadowBlur: 10,
            shadowColor: 'rgba(0,0,0,.35)',
          },
          emphasis: { focus: 'series' },
          z: 5,
        },
        {
          type: 'bar',
          data: values,
          barWidth: 16,
          barGap: '-100%',
          // eslint-disable-next-line theme-colors/no-literal-colors
          itemStyle: { color: 'rgba(0,0,0,0)' },
          tooltip: { show: false },
          emphasis: { disabled: true },
          label: {
            show: true,
            position: 'insideLeft',
            distance: 6,
            // eslint-disable-next-line theme-colors/no-literal-colors
            color: '#5F5F61',
            fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
            fontSize: 14,
            fontWeight: 400,
            formatter: (p: any) => p.name,
          },
          labelLayout: (p: any) => {
            const r = p.rect; // {x,y,width,height}
            return {
              x: r.x + 2,
              y: r.y - 6,
              align: 'left',
              verticalAlign: 'bottom',
            };
          },
          z: 10,
        },
      ],

      textStyle: { fontFamily: 'Russo One, sans-serif' },
      animation: true,
    };

    chart.setOption(option, { notMerge: true, lazyUpdate: true });
    chart.resize({ width, height });
  };

  // @ts-ignore
  // eslint-disable-next-line consistent-return
  useEffect(() => {
    if (chartDivRef.current) {
      render();
      const onResize = () => chartRef.current?.resize();
      window.addEventListener('resize', onResize);
      return () => {
        window.removeEventListener('resize', onResize);
        chartRef.current?.dispose();
        chartRef.current = null;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    JSON.stringify(data),
    height,
    width,
    headerText,
    boldText,
    headerFontSize,
  ]);

  if (!data || (Array.isArray(data) && data.length === 0)) {
    return (
      <Styles height={height} width={width} headerFontSize={0} boldText={false}>
        {headerText ? (
          <div
            className="top5-header"
            style={{
              fontSize: headerPx,
              fontWeight: boldText ? 700 : 400,
              fontFamily: 'Arial, "Helvetica Neue", Helvetica, sans-serif',
            }}
          >
            {headerText}
          </div>
        ) : null}
        <div
          style={{
            // eslint-disable-next-line theme-colors/no-literal-colors
            color: '#9CA3AF',
            fontFamily: 'Russo One, sans-serif',
            padding: 12,
          }}
        >
          Нет данных
        </div>
      </Styles>
    );
  }

  return (
    <Styles height={height} width={width} headerFontSize={0} boldText={false}>
      {headerText ? (
        <div
          className="top5-header"
          style={{
            fontSize: headerPx,
            fontWeight: boldText ? 700 : 400,
            fontFamily: 'Russo One, "Helvetica Neue", Helvetica, sans-serif',
          }}
        >
          {headerText}
        </div>
      ) : null}
      <div ref={chartDivRef} className="top5-chart" />
    </Styles>
  );
}
