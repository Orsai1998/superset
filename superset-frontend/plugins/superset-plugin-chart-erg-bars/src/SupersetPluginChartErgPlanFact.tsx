// eslint-disable-next-line no-restricted-syntax
import { useEffect, useRef } from 'react';
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
import type { ErgPlanFactTransformedProps } from './types';

echarts.use([
  BarChart,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
  LabelLayout,
]);

// eslint-disable-next-line theme-colors/no-literal-colors
const Styles = styled.div<{ height: number; width: number }>`
  background: transparent;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .erg-chart {
    flex: 1;
    min-height: 0;
  }
`;

export default function SupersetPluginChartErgPlanFact(
  props: ErgPlanFactTransformedProps,
) {
  const { width, height, metrics, formData } = props;
  const chartDivRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const render = () => {
    const el = chartDivRef.current!;
    if (!chartRef.current) {
      chartRef.current = echarts.init(el, undefined, { renderer: 'canvas' });
    }
    const chart = chartRef.current;

    const unit = formData.unitLabel || '';
    const { plan, fact, deviation } = metrics;
    const rawMax = Math.max(plan ?? 0, fact ?? 0, deviation ?? 0);
    const niceMax = Math.max(2500, Math.ceil((rawMax + 100) / 100) * 100); // минимум 2200
    const fontCommon = {
      // eslint-disable-next-line theme-colors/no-literal-colors
      color: '#fff',
      fontFamily:
        '"Russo One", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
      fontWeight: 700,
      fontSize: 16,
    };
    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      grid: { left: 88, right: 20, top: 90, bottom: 60 },
      xAxis: {
        type: 'category',
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { ...fontCommon, margin: 16 },
        data: [`План (${unit})`, `Отклонение (${unit})`, `Факт (${unit})`],
      },
      yAxis: {
        min: 0,
        max: niceMax,
        type: 'value',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: {
          ...fontCommon,
          margin: 10,
          align: 'right',
        },
      },
      series: [
        {
          type: 'bar',
          data: [plan, deviation, fact],
          barWidth: '98%',
          itemStyle: {
            color: (params: any) => {
              const idx = params.dataIndex;
              const isDev = idx === 1;
              return new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  color: isDev ? '#0093FF' : 'rgba(98,84,78,1)',
                },
                {
                  offset: 1,
                  color: isDev ? '#000000' : 'rgba(0,0,0,0.7)',
                },
              ]) as any;
            },
          },
          label: {
            show: formData.showBigValues !== false,
            position: 'top',
            fontSize: 42,
            // eslint-disable-next-line theme-colors/no-literal-colors
            color: '#fff',
            fontFamily:
              '"Russo One", system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif',
            fontWeight: 700,
          },
        },
      ],

      title: { textStyle: { ...fontCommon } },
      animationDuration: 600,
    };

    chart.setOption(option, { notMerge: true, lazyUpdate: true });
    chart.resize({ width, height });
  };

  useEffect(() => {
    if (!chartDivRef.current) {
      return undefined;
    }

    render();

    const onResize = () => chartRef.current?.resize();
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, [width, height, formData.unitLabel, formData.showBigValues, render]);

  if (
    !metrics ||
    (metrics.plan === 0 && metrics.fact === 0 && metrics.deviation === 0)
  ) {
    return (
      <Styles height={height} width={width}>
        <div
          style={{
            // eslint-disable-next-line theme-colors/no-literal-colors
            color: '#C4C4C4',
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
    <Styles height={height} width={width}>
      <div ref={chartDivRef} className="erg-chart" />
    </Styles>
  );
}
