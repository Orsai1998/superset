// eslint-disable-next-line no-restricted-syntax
import React, { useEffect, useRef, useState } from 'react';
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

echarts.use([
  BarChart,
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
    ${({ $themeMode }) =>
      $themeMode === 'light' ? '#E2E2E2' : 'rgba(26, 51, 111, 1)'};
  border-radius: 12px;
  background: ${({ $themeMode }) =>
    $themeMode === 'light' ? '#F5F5F5' : 'rgba(9, 21, 44, 1)'};
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

  .dot {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }

  .dot.plan {
    background: #d5d5d5;
  }

  .dot.fact {
    background: conic-gradient(#e57373 0deg 180deg, #81c784 180deg 360deg);
  }

  .legend {
    font-size: 14px;
    font-weight: 400 !important;
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
  data: { day: string | number; plan: number; fact: number }[];
  planColor: string;
  factColor: string;
  showMonthTotals: boolean;
  totals: { plan: number; fact: number };
  averages: { plan: number; fact: number };
  fmt: (n: number) => string;
  title?: string;
  formData?: {
    titleFontSize: number;
    chartType: 'default' | 'plan_fact_daily';
    chartTitle: string;
    metricTitle: string;
    currentMonthFontSize: number;
    metricTitleFontSize: number;
    theme?: 'light' | 'dark';
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
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const miniRef = useRef<HTMLDivElement>(null);
  const [maxHeight, setMaxHeight] = useState(0);
  const theme = formData?.theme || 'dark';
  const titleFontSize = formData?.titleFontSize || 16;
  const chartType = formData?.chartType;
  const chartTitle = formData?.chartTitle;
  const metricTitle = formData?.metricTitle;
  const metricTitleFontSize = formData?.metricTitleFontSize || 20;
  const currentMonthFontSize = formData?.currentMonthFontSize || 13;
  const planColor =
    theme === 'light' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(74, 149, 70, 1)';
  const factColor =
    theme === 'light' ? 'rgba(254, 38, 38, 0.5)' : 'rgba(255, 123, 123, 1)';

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = echarts.init(chartRef.current);

    const prepared = data
      .filter(d => d.day != null && d.day !== '')
      .map(d => ({
        day: String(d.day).padStart(2, '0'),
        fact: d.fact || 0,
        plan: d.plan || 0,
      }));

    const preparedWithColors = prepared.map(item => {
      const color = item.fact > item.plan ? '#EC8080' : '#7ECF9B';
      const labelColor = item.fact > item.plan ? '#FF4646' : '#5A9A71';
      return {
        ...item,
        color,
        labelColor,
      };
    });

    let option;

    // ==========================================================
    // === DEFAULT APPEARANCE (your existing one)
    // ==========================================================
    if (chartType === 'default') {
      option = {
        backgroundColor: 'transparent',
        grid: { left: 30, right: 10, top: 50, bottom: 40, containLabel: true },

        xAxis: {
          type: 'category',
          data: prepared.map(d => d.day),
          // eslint-disable-next-line theme-colors/no-literal-colors
          axisLabel: { color: '#9CB0C5', fontSize: 11 },
          axisLine: { show: false },
          axisTick: { show: false },
          min: 1,
        },

        yAxis: {
          type: 'value',
          show: true,
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
            const fact = params.find(p => p.seriesName === 'Факт')?.value ?? 0;
            const plan = params.find(p => p.seriesName === 'План')?.value ?? 0;

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
            name: 'Факт',
            type: 'bar',
            data: prepared.map(d => d.fact),
            barWidth: 14,
            barGap: '5%',
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
          {
            name: 'План',
            type: 'bar',
            data: prepared.map(d => d.plan),
            barWidth: 14,
            barGap: '5%',
            barCategoryGap: '40%',
            itemStyle: {
              color: planColor,
              borderRadius: [12, 12, 12, 12],
            },
          },
        ],

        graphic: [
          {
            type: 'text',
            left: 15,
            top: 10,
            style: {
              text: '1685',
              // eslint-disable-next-line theme-colors/no-literal-colors
              fill: '#ffffff',
              font: '700 20px "Russo One", sans-serif',
            },
          },
          {
            type: 'text',
            left: 70,
            top: 14,
            style: {
              text: title || '',
              // eslint-disable-next-line theme-colors/no-literal-colors
              fill: '#ffffff',
              font: '600 13px "Inter", sans-serif',
            },
          },
        ],
      };
    }

    // ==========================================================
    // === NEW APPEARANCE (daily plan/fact like screenshot)
    // ==========================================================
    else if (chartType === 'plan_fact_daily') {
      const planColorDefault = theme === 'light' ? '#D9D9D9' : '#D9D9D9';
      // @ts-ignore
      option = {
        backgroundColor: 'transparent',

        grid: {
          left: '-3.5%',
          right: '30px',
          top: 50,
          bottom: 0,
          containLabel: true,
        },

        xAxis: {
          type: 'category',
          data: prepared.map(d => d.day),
          axisLabel: {
            // eslint-disable-next-line theme-colors/no-literal-colors
            color: '#323232',
            fontSize: 12,
          },
          axisLine: { show: false },
          axisTick: { show: false },
          min: 0,
          boundaryGap: true,
        },

        yAxis: { show: false },

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
            data: prepared.map(d => d.plan),
            barWidth: 10,
            itemStyle: {
              color: planColorDefault,
              borderRadius: [6, 6, 0, 0],
            },
            label: {
              show: true,
              position: 'top',
              fontSize: 10,
              fontWeight: 700,
              distance: 10,
              // eslint-disable-next-line theme-colors/no-literal-colors
              color: '#6C6B6B',
              rotate: 90,
              offset: [15, 3],
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
            barWidth: 10,
            label: {
              show: true,
              position: 'top',
              fontSize: 10,
              fontWeight: 700,
              distance: 3,
              rotate: 90,
              offset: [15, 0],
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
    // @ts-ignore
    chart.setOption(option);
    if (chartType === 'default') {
      chart.resize({ width: width - 260, height });
    } else {
      chart.resize({ width, height: height - 100 });
    }

    // eslint-disable-next-line consistent-return
    return () => chart.dispose();
  }, [data, width, height, chartType, planColor, factColor]);

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
          <ChartContainer ref={chartRef} />
        </LeftPanel>

        {/* Right chart built from divs */}
        {showMonthTotals && (
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
            <span className="legend">План</span>
          </div>
          <div className="item">
            <div className="dot fact" />
            <span className="legend">Факт</span>
          </div>
        </div>

        <div id="chart" className="chart" />
        <ChartContainer ref={chartRef} />
      </Panel>
    </Wrapper>
  );

  if (chartType === 'plan_fact_daily') {
    return renderPlanFactDailyAppearance();
  }

  return renderDefaultAppearance();
};

export default SupersetPluginDieselConsumption;
