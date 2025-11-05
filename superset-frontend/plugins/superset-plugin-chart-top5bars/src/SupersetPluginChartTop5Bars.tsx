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

// eslint-disable-next-line theme-colors/no-literal-colors
const Styles = styled.div<SupersetPluginChartTop5BarsStylesProps>`
  background: transparent;
  height: ${({ height }) => height}px;
  width: ${({ width }) => width}px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .top5-header {
    padding: 4px 6px 6px 6px;
    color: #ffffff;
    line-height: 1.2;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .top5-chart {
    min-height: 0;
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
  }

  /* === Card style (screenshot) === */

  .card-wrapper {
    background: rgba(20, 33, 64, 1);
    border: 1px solid rgba(26, 51, 111, 1);
    border-radius: 17px;
    padding: 16px 18px;
    display: flex;
    flex-direction: column;
    color: #ffffff;
    font-family: 'Onest', sans-serif;
    flex: 1 1 auto;
    height: 100%;
    width: 100%;
  }

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    margin-bottom: 10px;
  }

  .card-header h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }

  .card-header span {
    font-size: 13px;
    color: #9aa3b1;
  }

  .card-row {
    margin-top: 10px;
  }

  .card-label {
    font-size: 13px;
    color: #c4c4c4;
    margin-bottom: 4px;
  }

  .card-values {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 700;
    font-size: 15px;
    margin-bottom: 2px;
  }

  .progress-bar {
    height: 6px;
    border-radius: 3px;
    background: linear-gradient(90deg, #0093ff 0%, #00c9ff 100%);
    box-shadow: 0 2px 6px rgba(0, 147, 255, 0.6);
    transition: width 0.6s ease-out;
  }
`;

type Row = {
  raw: {
    metric: undefined;
  };
  reason: string;
  value: number;
  tons?: number;
};

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
  const { data, height, width, formData } = props;
  const { styleType, headerText, boldText, headerFontSize, subtitleText } =
    formData;

  const headerPx =
    typeof headerFontSize === 'number'
      ? headerFontSize
      : headerSizePx[String(headerFontSize || 'xl')] ?? 20;
  const chartDivRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.EChartsType | null>(null);
  const prepare = (rows: Row[]) => {
    const sorted = [...rows]
      .filter(d => d && typeof d.value === 'number')
      .sort((a, b) => a.value - b.value)
      .slice(0, 5);

    return {
      reasons: sorted.map(d => String(d.reason ?? '—')),
      values: sorted.map(d => Number(d.value ?? 0)),
      max: Math.max(1, ...sorted.map(d => Number(d.value ?? 0))),
      rows: sorted,
    };
  };

  /** ================
   * CLASSIC ECHARTS STYLE
   * ================ */
  const renderClassic = () => {
    const el = chartDivRef.current!;
    if (!chartRef.current)
      chartRef.current = echarts.init(el, undefined, { renderer: 'canvas' });
    const chart = chartRef.current;

    const { reasons, values, max } = prepare(data as unknown as Row[]);

    // @ts-ignore
    const option: echarts.EChartsCoreOption = {
      backgroundColor: 'transparent',
      grid: { left: 10, right: 100, top: 30, bottom: 20, containLabel: true },

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
            fontFamily: 'Onest, "Helvetica Neue", Helvetica, sans-serif',
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
                { offset: 0, color: '#000000' },
                // eslint-disable-next-line theme-colors/no-literal-colors
                { offset: 1, color: '#0093FF' },
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
            color: '#C4C4C4',
            fontFamily: 'Onest, Arial, "Helvetica Neue", Helvetica, sans-serif',
            fontSize: 16,
            fontWeight: 600,
            formatter: (p: any) => p.name,
          },
          labelLayout: (p: any) => {
            const r = p.rect;
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
      textStyle: { fontFamily: 'Onest, sans-serif' },
      animation: true,
    };

    chart.setOption(option, { notMerge: true, lazyUpdate: true });
    chart.resize({ width, height });
  };

  /** ================
   * CARD STYLE (Screenshot)
   * ================ */
  const renderCardStyle = () => {
    const el = chartDivRef.current!;
    if (!chartRef.current)
      chartRef.current = echarts.init(el, undefined, { renderer: 'canvas' });
    const chart = chartRef.current;

    const { rows, max } = prepare(data as unknown as Row[]);

    const option: echarts.EChartsCoreOption = {
      // eslint-disable-next-line theme-colors/no-literal-colors
      backgroundColor: 'rgba(20, 33, 64, 1)',
      grid: { left: 10, right: 100, top: 30, bottom: 30, containLabel: true },
      xAxis: {
        type: 'value',
        max,
        splitLine: { show: false },
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      yAxis: {
        type: 'category',
        inverse: true,
        data: rows.map(() => ''), // отключаем подписи оси
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
      },
      series: [
        {
          type: 'bar',
          data: rows.map(() => max),
          barWidth: 8,
          itemStyle: { color: 'transparent' },
          barGap: '100%',
          barCategoryGap: '-100%',
          label: {
            show: true,
            position: [0, -20], // над баром
            formatter: (p: any) => rows[p.dataIndex].reason,
            // eslint-disable-next-line theme-colors/no-literal-colors
            color: '#C4C4C4',
            fontSize: 16,
            align: 'left',
            lineHeight: 16,
            width: 300,
            overflow: 'break', // перенос длинных названий
            fontFamily: 'Onest, sans-serif',
          },
          z: 5,
        },

        {
          type: 'bar',
          data: rows.map(r => r.value),
          barWidth: 8,
          barCategoryGap: '-100%',
          barGap: '70%',
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              // eslint-disable-next-line theme-colors/no-literal-colors
              { offset: 0, color: '#142140' },
              // eslint-disable-next-line theme-colors/no-literal-colors
              { offset: 1, color: '#0093FF' },
            ]),
            borderRadius: [5, 5, 5, 5],
          },
          label: {
            show: true,
            position: 'right',
            distance: 8,
            formatter: (p: any) => {
              const row = rows[p.dataIndex];
              const raw = row.raw || {};
              const hasUnitColumn =
                raw.metric !== undefined &&
                raw.metric !== null &&
                raw.metric !== '';

              if (hasUnitColumn) {
                const unitValue = String(raw.metric);
                return `{white|${unitValue}}`;
              }
              const value =
                typeof p.value === 'number'
                  ? p.value.toFixed(1)
                  : String(p.value ?? '');

              return `{white|${value}}`;
            },
            rich: {
              dot: {
                // eslint-disable-next-line theme-colors/no-literal-colors
                color: '#0093FF',
                fontSize: 14,
                padding: [0, 4, 0, 0],
              },
              white: {
                // eslint-disable-next-line theme-colors/no-literal-colors
                color: '#FFFFFF',
                fontSize: 20,
                fontWeight: 700,
                fontFamily: 'Onest, sans-serif',
              },
              gray: {
                // eslint-disable-next-line theme-colors/no-literal-colors
                color: '#9AA3B1',
                fontSize: 16,
              },
            },
          },
          z: 10,
          animationDuration: 800,
          animationEasing: 'cubicOut',
        },
      ],
    };

    chart.setOption(option, { notMerge: true, lazyUpdate: true });
    chart.resize();
  };

  useEffect(() => {
    if (styleType === 'classic') {
      renderClassic();
    } else {
      renderCardStyle();
    }
  }, [width, height, headerText, boldText, headerFontSize, styleType, data]);

  // ...
  return (
    <Styles
      height={height}
      width={width}
      headerFontSize={0}
      boldText={false}
      styleType=""
    >
      {styleType === 'classic' ? (
        <>
          {headerText && (
            <div
              className="top5-header"
              style={{
                fontSize: headerPx,
                fontWeight: boldText ? 700 : 400,
                fontFamily: 'Onest, "Helvetica Neue", Helvetica, sans-serif',
              }}
            >
              {headerText}
            </div>
          )}
          <div ref={chartDivRef} className="top5-chart" />
        </>
      ) : (
        <div className="card-wrapper">
          <div className="card-header">
            <h3>{headerText || 'Топ 5 простоев КИВ'}</h3>
            <span>{subtitleText || ''}</span>
          </div>
          <div ref={chartDivRef} className="top5-chart" />
        </div>
      )}
    </Styles>
  );
}
