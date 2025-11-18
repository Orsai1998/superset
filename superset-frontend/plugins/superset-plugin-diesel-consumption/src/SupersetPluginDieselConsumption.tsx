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
// === Styles ===
const Container = styled.div<{
  $themeMode: 'light' | 'dark';
  $fontSize: number;
}>`
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  flex-direction: row;
  gap: 15px;
  padding: 6px;
  font-family: 'Inter', 'Russo One', sans-serif;
  height: 100%;
  overflow: visible;
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
    currentMonthFontSize: number;
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
  const currentMonthFontSize = formData?.currentMonthFontSize || 13;
  const planColor =
    theme === 'light' ? 'rgba(34, 197, 94, 0.5)' : 'rgba(74, 149, 70, 1)';
  const factColor =
    theme === 'light' ? 'rgba(254, 38, 38, 0.5)' : 'rgba(255, 123, 123, 1)';
  // === Left ECharts Chart ===
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = echarts.init(chartRef.current);
    const prepared = data.map(d => ({
      day: String(d.day).padStart(2, '0'),
      fact: d.fact || 0,
      plan: d.plan || 0,
    }));

    chart.setOption({
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
        formatter: (params: any) => {
          const day = params[0].axisValue;
          const fact =
            params.find((p: { seriesName: string }) => p.seriesName === 'Факт')
              ?.value ?? 0;
          const plan =
            params.find((p: { seriesName: string }) => p.seriesName === 'План')
              ?.value ?? 0;

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
        // === FACT ===
        {
          name: 'Факт',
          type: 'bar',
          data: prepared.map(d => d.fact),
          barWidth: 14, // половина размера, чтобы влезли оба
          barGap: '5%',
          barCategoryGap: '40%',
          itemStyle: {
            color: (params: any) => {
              const d = prepared[params.dataIndex];
              return d.fact > d.plan ? factColor : planColor;
            },
            borderRadius: [12, 12, 12, 12],
          },
          label: {
            show: false,
            position: 'insideBottom',
            offset: [0, -4],
            fontWeight: 700,
            fontSize: 11,
            formatter: (params: any) => fmt(params.value),
          },
        },

        // === PLAN ===
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
          label: {
            show: false,
            position: 'top',
            offset: [0, -4],
            fontWeight: 700,
            fontSize: 11,
            formatter: (params: any) => fmt(params.value),
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
    });

    chart.resize({ width: width - 260, height });
    // eslint-disable-next-line consistent-return
    return () => chart.dispose();
  }, [data, width, height]);

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

  return (
    <div>
      <Span $themeMode={theme} $fontSize={titleFontSize}>
        Показатели АТЦ по удельному расходу ДТ (Весь парк ЕН-4000) (г/тнкм)
      </Span>

      <Container $themeMode={theme} $fontSize={titleFontSize}>
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
};

export default SupersetPluginDieselConsumption;
