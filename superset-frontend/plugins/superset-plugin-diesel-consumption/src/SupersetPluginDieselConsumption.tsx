// eslint-disable-next-line no-restricted-syntax
import React, { useEffect, useRef, useState } from 'react';
import { styled } from '@superset-ui/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import * as echarts from 'echarts/core';
// eslint-disable-next-line import/no-extraneous-dependencies
import { BarChart, LineChart } from 'echarts/charts';
// eslint-disable-next-line import/no-extraneous-dependencies
import { GridComponent, TooltipComponent } from 'echarts/components';
// eslint-disable-next-line import/no-extraneous-dependencies
import { CanvasRenderer } from 'echarts/renderers';
// eslint-disable-next-line import/no-extraneous-dependencies
import { LabelLayout } from 'echarts/features';

echarts.use([
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  CanvasRenderer,
  LabelLayout,
]);
const Span = styled.div<{
  $themeMode: 'light' | 'dark';
  $fontSize: number;
}>`
  font-size: ${({ $fontSize }) => `${$fontSize}px`} !important;
  font-weight: 700 !important;
  color: ${({ $themeMode }) =>
    $themeMode === 'light' ? 'rgba(50, 50, 50, 1)' : '#fff'};
`;

const ChartTitle = styled.div<{
  $themeMode: 'light' | 'dark';
  $fontSize: number;
}>`
  font-size: ${({ $fontSize }) => `${$fontSize}px`} !important;
  font-weight: 700 !important;
  color: ${({ $themeMode }) => ($themeMode === 'light' ? '#323232' : '#fff')};
  font-family: 'Onest', sans-serif;
`;

const MetricTitle = styled.div<{
  $themeMode: 'light' | 'dark';
  $fontSize: number;
}>`
  font-size: ${({ $fontSize }) => `${$fontSize}px`} !important;
  font-weight: 400 !important;
  color: ${({ $themeMode }) => ($themeMode === 'light' ? '#323232' : '#fff')};
  font-family: 'Onest', sans-serif;
`;
// === Styles ===
const Container = styled.div<{
  $themeMode: 'light' | 'dark';
  $fontSize: number;
  $width: number;
  $height: number;
}>`
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  flex-direction: row;
  gap: 15px;
  padding: 6px;
  font-family: 'Onest', sans-serif;
  overflow: visible;
`;

const Wrapper = styled.div<{
  $themeMode: 'light' | 'dark';
  $width: number;
  $height: number;
}>`
  display: flex;
  align-items: stretch;
  flex-direction: column;
  font-family: 'Onest', sans-serif;
  height: ${({ $height }) => `${$height}px`};
  width: ${({ $width }) => `${$width}px`};

  .titles {
    display: flex;
    justify-content: space-between;
  }
`;

const LeftPanel = styled.div<{ $themeMode: 'light' | 'dark' }>`
  flex: 1;
  display: flex;
  flex-direction: column;
  border: 1px solid
  ${({ $themeMode }) =>
    $themeMode === 'light' ? '#ddd' : 'rgba(26, 51, 111, 1)'};
  border-radius: 12px;
  background: ${({ $themeMode }) =>
    $themeMode === 'light' ? 'rgba(245, 245, 245, 1)' : 'rgba(9, 21, 44, 1)'};
  padding: 8px 12px;
  min-width: 0;
`;

// eslint-disable-next-line theme-colors/no-literal-colors
const Panel = styled.div<{ $themeMode: 'light' | 'dark' }>`
  border: 1px solid
  ${({ $themeMode }) => ($themeMode === 'light' ? '#E2E2E2' : '#1A336F')};
  border-radius: 12px;
  background: ${({ $themeMode }) =>
    $themeMode === 'light' ? '#F5F5F5' : '#142140'};
  padding: 8px 12px;
  position: relative;
  font-family: 'Onest', sans-serif;

  .custom-legend {
    position: absolute;
    top: 8px;
    left: 12px;
    display: flex;
    gap: 20px;
    align-items: center;
    z-index: 10;
  }

  .custom-legend .item {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 18px;
    color: #333;
  }

  .spacer {
    margin-bottom: 40px;
  }

  .dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }

  .dot.plan {
    background: ${({ $themeMode }) =>
      $themeMode === 'light' ? '#d5d5d5' : '#09152B'};
  }

  .dot.fact {
    background: conic-gradient(#e57373 0deg 180deg, #81c784 180deg 360deg);
  }

  .legend {
    font-size: 14px;
    font-weight: 400 !important;
    color: ${({ $themeMode }) => ($themeMode === 'light' ? '#323232' : '#fff')};
  }
`;

const Header = styled.div<{ $themeMode: 'light' | 'dark' }>`
  color: ${({ $themeMode }) =>
    $themeMode === 'light' ? 'rgba(50, 50, 50, 1)' : '#fff'};
  line-height: 1.3;
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.2px;
  margin-bottom: 4px;
`;

const ChartContainer = styled.div`
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
`;

const RightPanel = styled.div<{ $themeMode: 'light' | 'dark' }>`
  width: 220px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px solid
  ${({ $themeMode }) =>
    $themeMode === 'light'
      ? 'rgba(226, 226, 226, 1)'
      : 'rgba(26, 51, 111, 1)'};
  border-radius: 12px;
  background: ${({ $themeMode }) =>
    $themeMode === 'light' ? 'rgba(245, 245, 245, 1)' : 'rgba(9, 21, 44, 1)'};
  padding: 10px;
`;

// === Mini chart styles ===
const MiniChartContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  width: 100%;
  height: 90%;
`;

const Title = styled.div<{ $themeMode: 'light' | 'dark'; $fontSize: number }>`
  font-size: ${({ $fontSize }) => `${$fontSize}px`};
  font-weight: 600;
  color: ${({ $themeMode }) =>
    $themeMode === 'light' ? 'rgba(50, 50, 50, 1)' : '#fff'};
  margin-bottom: 10px;
`;

const BarsWrapper = styled.div`
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 40px;
  flex: 1;
`;

const BarGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
`;

const Bar = styled.div<{ h: number; bg: string }>`
  width: 70px;
  height: ${({ h }) => h}px;
  background-color: ${({ bg }) => bg};
  border-radius: 18px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  box-shadow: 0 0 10px ${({ bg }) => bg}55;
  transition: height 0.4s ease;
`;

// eslint-disable-next-line theme-colors/no-literal-colors
const Value = styled.div<{ $themeMode: 'light' | 'dark' }>`
  position: relative;
  bottom: 6px;
  font-weight: 700;
  font-size: 15px;
  color: #fff;
`;

// eslint-disable-next-line theme-colors/no-literal-colors
const Label = styled.div<{ $themeMode: 'light' | 'dark' }>`
  margin-top: 8px;
  font-size: 13px;
  color: #9cb0c5;
`;

// === Props ===
type Props = {
  width: number;
  height: number;
  data: { day: any; plan: number; fact: number }[];
  x: string;
  planLine: number[];
  factLine: number[];
  planColor: string;
  factColor: string;
  showMonthTotals: boolean;
  totals: { plan: number; fact: number };
  averages: { plan: number; fact: number };
  fmt: (n: number) => string;
  title?: string;
  planLabel?: string;
  factLabel?: string;
  barWidth: number;
  barGap: number;
  showFactLabels?: boolean;
  formData?: {
    titleFontSize: number;
    chartType: 'default' | 'plan_fact_daily' | 'plan_fact_line';
    chartTitle: string;
    metricTitle: string;
    currentMonthFontSize: number;
    metricTitleFontSize: number;
    metricFontSize: number;
    xAxisFontSize: number;
    theme?: 'light' | 'dark';
    enableFactPlanColoring: boolean;
  };
};

// === Component ===
const SupersetPluginDieselConsumption: React.FC<Props> = ({
                                                            width,
                                                            height,
                                                            data,
                                                            showMonthTotals,
                                                            totals,
                                                            averages,
                                                            fmt,
                                                            title,
                                                            formData,
                                                            planLabel = 'План',
                                                            factLabel = 'Факт',
                                                            barWidth,
                                                            barGap = 5,
                                                            showFactLabels,
                                                          }) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);
  const theme = formData?.theme || 'dark';
  const titleFontSize = formData?.titleFontSize || 16;
  const chartType =
    (formData as any)?.chart_type ?? (formData as any)?.chartType ?? 'default';
  const chartTitle = formData?.chartTitle;
  const metricTitle = formData?.metricTitle;
  const metricTitleFontSize = formData?.metricTitleFontSize || 20;
  const metricFontSize = formData?.metricFontSize || 8;
  const axisFontSize = formData?.xAxisFontSize || 8;
  const currentMonthFontSize = formData?.currentMonthFontSize || 13;
  const enable_fact_plan_coloring = formData?.enableFactPlanColoring;
  const planColor =
    theme === 'light' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(74, 149, 70, 1)';
  const factColor =
    theme === 'light' ? 'rgba(254, 38, 38, 0.5)' : 'rgba(255, 123, 123, 1)';

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const prepared = data.map(d => ({
      day: d.day,
      fact: d.fact || 0,
      plan: d.plan || 0,
    }));

    const preparedWithColors = prepared.map(item => {
      let color = item.fact < item.plan ? '#EC8080' : '#7ECF9B';
      let labelColor = item.fact < item.plan ? '#FF4646' : '#5A9A71';

      if (enable_fact_plan_coloring) {
        color = item.fact > item.plan ? '#EC8080' : '#7ECF9B';
        labelColor = item.fact > item.plan ? '#FF4646' : '#5A9A71';
      }
      return {
        ...item,
        color,
        labelColor,
      };
    });

    let option: echarts.EChartsCoreOption = {};

    const xData = prepared.map(d => d.day);

    const factLine = prepared.map(d => d.fact);
    const planLine = prepared.map(d => d.plan);

    // ==========================================================
    // === PLAN FACT LINE AND DEFAULT APPEARANCE
    // ==========================================================
    if (chartType === 'plan_fact_line') {
      option = {
        backgroundColor: 'transparent',

        grid: {
          left: 10,
          right: '45px',
          top: 20,
          bottom: 25,
          containLabel: true,
        },

        xAxis: {
          type: 'category',
          data: xData,
          boundaryGap: false,
        },

        yAxis: {
          type: 'value',
        },

        series: [
          // ПОЛОСА ПЛАНА (толстая “лента”)
          {
            name: planLabel,
            type: 'line',
            data: planLine,
            symbol: 'none',
            smooth: false,
            step: false,
            lineStyle: {
              width: 2,
              opacity: 1,
              color: theme === 'light' ? '#323232' : 'rgba(255,255,255)',
            },
            emphasis: { disabled: true },
          },

          // КРИВАЯ ФАКТА + кружочки + заливка
          {
            name: factLabel,
            type: 'line',
            data: factLine,
            smooth: true,
            symbol: 'circle',
            symbolSize: 10,
            lineStyle: {
              width: 3,
              // eslint-disable-next-line theme-colors/no-literal-colors
              color: '#ff8c00',
            },
            label: {
              show: showFactLabels,
              position: 'top',
              distance: 6,
              formatter: (p: any) => {
                const v = Number(p.value);
                if (!Number.isFinite(v)) return '';
                return fmt(v);
              },
            },
            itemStyle: {
              color: (params: any) => {
                // покраска кружочков в красный или зеленый в зависимости от галочки
                const i = params.dataIndex;
                const fact = factLine[i];
                const plan = planLine[i];

                const higher = fact > plan;

                if (enable_fact_plan_coloring) {
                  return higher
                    ? 'rgba(74, 149, 70, 1)'
                    : 'rgba(255, 123, 123, 1)';
                }

                return higher
                  ? 'rgba(255, 123, 123, 1)'
                  : 'rgba(74, 149, 70, 1)';
              },
            },
            areaStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                {
                  offset: 0,
                  // eslint-disable-next-line theme-colors/no-literal-colors
                  color: 'rgba(255, 140, 0, 0.6)', // вверх оранжевый
                },
                {
                  offset: 1,
                  // eslint-disable-next-line theme-colors/no-literal-colors
                  color: 'rgba(255, 140, 0, 0)', // низ прозрачный
                },
              ]),
            },
            emphasis: { disabled: true },
          },
        ],
      };
    } else if (chartType === 'default') {
      option = {
        backgroundColor: 'transparent',
        grid: {
          left: 30,
          right: 10,
          top: 50,
          bottom: 40,
          containLabel: true,
        },

        xAxis: {
          type: 'category',
          data: xData,
          // eslint-disable-next-line theme-colors/no-literal-colors
          axisLabel: { color: '#9CB0C5', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
          min: 0,
        },

        yAxis: {
          type: 'value',
          show: true,
        },

        label: {
          show: showFactLabels,
          position: 'top',
          distance: 6,
          rotate: 90,
          formatter: (p: any) => (p.value == null ? '' : String(p.value)),
        },

        tooltip: {
          trigger: 'axis',
          // eslint-disable-next-line theme-colors/no-literal-colors
          backgroundColor: 'rgba(0,0,0,0.8)',
          borderWidth: 0,
          // eslint-disable-next-line theme-colors/no-literal-colors
          textStyle: { color: '#fff', fontSize: 12 },
          formatter: (params: any[]) => {
            const day = params[0].axisValue;
            const takeNumber = (v: any) => (Array.isArray(v) ? v[1] : v);
            const factRaw =
              params.find((p: any) => p.seriesName === 'Факт')?.value ?? 0;
            const planRaw =
              params.find(p => p.seriesName === 'План')?.value ?? 0;
            const fact = fmt(Number(takeNumber(factRaw)));
            const plan = fmt(Number(takeNumber(planRaw)));

            return `
            <div style="padding:4px 0 2px; font-size:13px;">
              <b>День ${day}</b><br/>
              Факт: <b>${fact}</b><br/>
              План: <b>${plan}</b>
            </div>
          `;
          },
        },

        series: [
          {
            name: factLabel,
            type: 'bar',
            data: prepared.map(d => d.fact),
            barWidth,
            barGap: `${barGap}%`,
            barCategoryGap: '40%',
            itemStyle: {
              color: (params: { dataIndex: string | number }) => {
                // @ts-ignore
                const d = prepared[params.dataIndex];
                return d.fact > d.plan ? factColor : planColor;
              },
              borderRadius: [12, 12, 12, 12],
            },
          },
          /* {
            name: planLabel,
            type: 'bar',
            data: prepared.map(d => d.plan),
            barWidth,
            barGap: `${barGap}%`,
            barCategoryGap: '40%',
            itemStyle: {
              color: planColor,
              borderRadius: [12, 12, 12, 12],
            },
          }, */
          {
            name: `${planLabel}_line`,
            type: 'line',
            data: prepared.map(d => d.plan),
            symbol: 'none',
            smooth: false,
            z: 10,
            lineStyle: {
              width: 2,
              // eslint-disable-next-line theme-colors/no-literal-colors
              color: '#323232',
            },
            emphasis: { disabled: true },
          },
        ],
      };
    }
      // ==========================================================
      // === NEW APPEARANCE (daily plan/fact like screenshot)
    // ==========================================================
    else {
      const planColorDefault = theme === 'light' ? '#D9D9D9' : '#09152B';
      const labelColor = theme === 'light' ? '#6C6B6B' : '#6C6B6B';
      const xAxisLabelColor = theme === 'light' ? '#323232' : '#FFFFFF';
      // @ts-ignore
      option = {
        backgroundColor: 'transparent',

        grid: {
          left: '0%',
          right: '45px',
          top: 50,
          bottom: 20,
          containLabel: true,
        },

        xAxis: {
          type: 'category',
          data: prepared.map(d => d.day),
          axisLabel: {
            // eslint-disable-next-line theme-colors/no-literal-colors
            color: xAxisLabelColor,
            fontSize: axisFontSize,
          },
          axisLine: { show: false },
          axisTick: { show: false },
          min: 0,
          boundaryGap: true,
        },

        yAxis: { show: false },

        dataZoom: [
          {
            type: 'inside',
            xAxisIndex: 0,
          },
          { type: 'slider', xAxisIndex: 0, height: 14, bottom: 0 },
        ],

        tooltip: {
          trigger: 'axis',
          // eslint-disable-next-line theme-colors/no-literal-colors
          backgroundColor: 'rgba(0,0,0,0.8)',
          // eslint-disable-next-line theme-colors/no-literal-colors
          textStyle: { color: '#fff' },
        },

        series: [
          // PLAN (background style)
          {
            name: 'План',
            type: 'bar',
            data: prepared.map(d => ({
              value: d.plan,
            })),
            barWidth,
            barGap: `${barGap}%`,
            itemStyle: {
              color: planColorDefault,
              borderRadius: [6, 6, 0, 0],
            },
            label: {
              show: true,
              position: 'top',
              fontSize: metricFontSize,
              fontWeight: 700,
              distance: 10,
              // eslint-disable-next-line theme-colors/no-literal-colors
              color: labelColor,
              rotate: 90,
              offset: [17, 10],
              formatter: (p: { value: number }) => fmt(p.value),
            },
            emphasis: { disabled: true },
          },

          // FACT (foreground bar)
          {
            name: 'Факт',
            type: 'bar',
            data: preparedWithColors.map(d => ({
              value: d.fact,
              itemStyle: { color: d.color },
              label: { color: d.labelColor },
            })),
            barWidth,
            barGap: `${barGap}%`,
            label: {
              show: true,
              position: 'top',
              fontSize: metricFontSize,
              fontWeight: 700,
              distance: 10,
              rotate: 90,
              offset: [17, 10],
              formatter: (p: { value: number }) => fmt(p.value),
            },
            itemStyle: {
              borderRadius: [6, 6, 0, 0],
            },
            emphasis: { disabled: true },
          },
        ],
      };
    }

    // === APPLY OPTION AND RESIZE
    chart.clear();

    const chartHeight = 260;

    // @ts-ignore
    chart.setOption(option, true);
    if (chartType === 'default') {
      chart.resize({ width: width - 260, height });
    } else if (chartType === 'plan_fact_line') {
      chart.resize({ width, height: chartHeight });
    } else {
      chart.resize({ width, height: height - 100 });
    }

    // eslint-disable-next-line consistent-return
    return () => chart.dispose();
  }, [
    data,
    width,
    height,
    chartType,
    planColor,
    factColor,
    enable_fact_plan_coloring,
  ]);

  // === Dynamic height for right bars ===
  useEffect(() => {
    if (miniRef.current) {
      const rect = miniRef.current.getBoundingClientRect();
      setMaxHeight(rect.height * 0.55);
    }
  }, [height]);

  const maxVal = Math.max(totals.plan, totals.fact);
  const planH = maxVal ? (totals.plan / maxVal) * maxHeight : 0;
  const factH = maxVal ? (totals.fact / maxVal) * maxHeight : 0;
  const isPlanFactLine = chartType === 'plan_fact_line';

  const formatValue = (v: number) => fmt(v);
  const renderDefaultAppearance = () => (
    <div>
      <Span $themeMode={theme} $fontSize={titleFontSize}>
        Показатели АТЦ по удельному расходу ДТ (Весь парк ЕН-4000) (г/тнкм)
      </Span>

      <Container
        $themeMode={theme}
        $fontSize={titleFontSize}
        $width={width}
        $height={height}
      >
        {/* Left chart */}
        <LeftPanel $themeMode={theme}>
          {title && <Header $themeMode={theme}>{title}</Header>}
          <ChartContainer
            ref={chartRef}
            style={{ width: `${width}px`, height: `${height}px` }}
          />
        </LeftPanel>

        {/* Right chart built from divs */}
        {showMonthTotals && !isPlanFactLine && (
          <RightPanel ref={miniRef} $themeMode={theme}>
            <MiniChartContainer>
              <Title $themeMode={theme} $fontSize={currentMonthFontSize}>
                Текущий месяц
              </Title>
              <BarsWrapper>
                <BarGroup>
                  <Bar
                    h={planH}
                    bg={
                      theme === 'light' ? 'rgba(109, 109, 109, 1)' : '#233040'
                    }
                  >
                    <Value $themeMode={theme}>
                      {formatValue(averages.plan)}
                    </Value>
                  </Bar>
                  <Label $themeMode={theme}>План</Label>
                </BarGroup>

                <BarGroup>
                  <Bar
                    h={factH}
                    bg={
                      averages.fact > averages.plan
                        ? theme === 'light'
                          ? 'rgba(34, 197, 94, 0.5)'
                          : 'rgba(74, 149, 70, 1)'
                        : theme === 'light'
                          ? 'rgba(254, 38, 38, 0.5)'
                          : '#FF7875'
                    }
                  >
                    <Value $themeMode={theme}>
                      {formatValue(averages.fact)}
                    </Value>
                  </Bar>
                  <Label $themeMode={theme}>Факт</Label>
                </BarGroup>
              </BarsWrapper>
            </MiniChartContainer>
          </RightPanel>
        )}
      </Container>
    </div>
  );
  const renderPlanFactDailyAppearance = () => (
    <Wrapper $themeMode={theme} $height={height} $width={width}>
      <div className="titles">
        <div className="chart_title">
          <ChartTitle $fontSize={titleFontSize} $themeMode={theme}>
            {chartTitle}
          </ChartTitle>
        </div>
        <div className="metric_title">
          <MetricTitle $fontSize={metricTitleFontSize} $themeMode={theme}>
            {metricTitle}
          </MetricTitle>
        </div>
      </div>
      <Panel $themeMode={theme}>
        <div className="custom-legend">
          <div className="item">
            <div className="dot plan" />
            <span className="legend">{planLabel}</span>
          </div>
          <div className="item">
            <div className="dot fact" />
            <span className="legend">{factLabel}</span>
          </div>
        </div>
        <div className="spacer" />
        <div id="chart" className="chart" />
        <ChartContainer ref={chartRef} />
      </Panel>
    </Wrapper>
  );

  if (chartType === 'plan_fact_daily' || chartType === 'plan_fact_line') {
    return renderPlanFactDailyAppearance();
  }

  return renderDefaultAppearance();
};

export default SupersetPluginDieselConsumption;
