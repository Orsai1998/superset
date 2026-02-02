// eslint-disable-next-line no-restricted-syntax
import React, { useEffect } from 'react';

const STYLE_ID = 'superset-metall-cut-style';

const CSS = `
/* ===== WRAP ===== */
.mc-wrap {
  display: grid;
  grid-template-columns: 1fr;
  font-family: 'Onest', sans-serif;
}

.mc-card {
  padding: 10px;
}

/* ===== Dark Theme ===== */
.mc-wrap.dark {
  color: #e5e7eb;
  background: #142140;
}

.mc-wrap.dark .mc-card {
  color: #e5e7eb;
  border-color: rgba(255, 255, 255, 0.08);
}

.mc-wrap.dark .mc-label {
  color: #FFF;
}

.mc-wrap.dark .mc-bar-track {
  background: #0C1931;
}

.mc-wrap.dark .mc-bar-max {
  color: #6C6B6B;
}

.mc-wrap.dark .mc-plan-box, .mc-wrap.dark .mc-deviation-box {
    border-color: #103473;
}

/* ===== Light Theme ===== */
.mc-wrap.light {
  color: #1f2937;
  background: #f6f7f9;
}

.mc-wrap.light .mc-card {
  background: #fff;
}

.mc-wrap.light .mc-bar-track {
  background: #e5e7eb;
}

.mc-wrap.light .mc-bar-fill.pos {
  background: #4caf50;
}

.mc-wrap.light .mc-bar-fill.neg {
  background: #ef5350;
}

.mc-title {
  font-weight: 700;
  line-height: 1.25;
  margin-bottom: 14px;
}

.mc-grid {
  gap: 16px;
  display: grid;
  grid-template-columns: 170px 1fr;
}

.mc-deviation-box {
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #E2E2E2;
  background: rgba(0, 0, 0, 0.04);
}

.mc-label {
  color: #323232;
  font-size: 14px;
  margin-bottom: 25px;
}

.mc-deviation {
  font-size: 30px;
  font-weight: 700;
}

.mc-deviation.pos {
  color: #4A9546;
}

.mc-deviation.neg {
  color: #FF4646;
}

/* ===== RIGHT ===== */
.mc-plan-box {
  display: flex;
  padding: 12px 16px;
  border-radius: 12px;
  flex-direction: column;
  border: 1px solid #E2E2E2;
  background: rgba(0, 0, 0, 0.04);
}

/* ===== BAR ===== */
.mc-bar-track {
  flex: 1;
  height: 38px;
  overflow: visible;
  position: relative;
  border-top-right-radius: 19px;
  background: rgba(0, 0, 0, 0.08);
  border-bottom-right-radius: 19px;
}

.mc-bar-row {
  display: flex;
  align-item: center;
}

.mc-bar-fill {
  height: 100%;
  border-top-right-radius: 9px;
  border-bottom-right-radius: 9px;
}

.mc-bar-fill.pos {
  background: #7ECF9B;
}

.mc-bar-fill.neg {
  background: #EC8080;
}

.mc-bar-left.pos {
  color: #5A9A71;
}

.mc-bar-left.neg {
  color: #EC8080;
}

.mc-bar-marks {
  display: flex;
  color: #6b7280;
  font-size: 16px;
  justify-content: space-between;
}

.mc-wrap.dark .mc-bar-marks {
  color: #9ca3af;
}

.mc-bar-value {
  left: 8px;
  top: -22px;
  font-size: 12px;
  font-weight: 600;
  position: absolute;
}

.mc-bar-marker.pos {
  color: #5A9A71;
}

.mc-bar-marker.neg {
  color: #FF4646;
}

.mc-bar-max {
  color: #6C6B6B;
  max-width: 44px;
  font-size: 15px;
  font-weight: 600;
  text-align: right;
  padding-left: 8px;
}

.mc-bar-left {
  top: -22px;
  font-size: 16px;
  font-weight: 600;
  position: absolute;
  white-space: nowrap;
}

.mc-bar-marker {
  top: -22px;
  font-size: 16px;
  font-weight: 600;
  position: absolute;
  white-space: nowrap;
  left: clamp(14px, var(--pct), calc(100% - 14px));
}

`;

function useInjectStyles() {
  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.innerHTML = CSS;
      document.head.appendChild(style);
    }
  }, []);
}

export type MetallCutCard = {
  id: string;
  title: string;
  deviationPerDay: number;
  monthDone: number;
  monthPlan: number;
};

export type SupersetPluginMetallCutProps = {
  data: MetallCutCard[];
  theme: 'dark' | 'light';
  titleFontSize: number;
  deviationFontSize: number;
  barNumberFontSize: number;
  barHeight: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function fmt(n: number) {
  return new Intl.NumberFormat('ru-RU').format(n);
}

export default function SupersetPluginMetallCut(
  props: SupersetPluginMetallCutProps,
) {
  useInjectStyles();

  const {
    data,
    theme,
    titleFontSize,
    deviationFontSize,
    barNumberFontSize,
    barHeight,
  } = props;

  return (
    <div className={`mc-wrap ${theme === 'dark' ? 'dark' : 'light'}`}>
      {data.map(m => {
        const positive = m.deviationPerDay >= 0;
        const pct =
          m.monthDone > 0
            ? clamp((m.monthDone / m.monthPlan) * 100, 0, 100)
            : 0;
        return (
          <div className="mc-card" key={m.id}>
            <div
              className="mc-title"
              style={{ fontSize: `${titleFontSize}px` }}
            >
              {m.title}
            </div>

            <div className="mc-grid">
              {/* LEFT */}
              <div className="mc-deviation-box">
                <div className="mc-label">Отклонение за сутки</div>
                <div
                  className={`mc-deviation ${positive ? 'neg' : 'pos'}`}
                  style={{ fontSize: `${deviationFontSize}px` }}
                >
                  {fmt(Math.abs(m.deviationPerDay))}
                </div>
              </div>
              {/* RIGHT */}
              <div className="mc-plan-box">
                <div className="mc-label">Выполнение месячного плана</div>

                <div className="mc-bar-row">
                  <div
                    className="mc-bar-track"
                    style={{ height: `${barHeight}px` }}
                  >
                    <div
                      className={`mc-bar-fill ${positive ? 'neg' : 'pos'}`}
                      style={{ width: `${pct}%` }}
                    />
                    <span
                      className={`mc-bar-left ${positive ? 'neg' : 'pos'}`}
                      style={{ fontSize: `${barNumberFontSize}px` }}
                    >
                      {fmt(m.monthDone)}
                    </span>

                    <span
                      className={`mc-bar-marker ${positive ? 'neg' : 'pos'}`}
                      style={{
                        ['--pct' as any]: `${pct}%`,
                        fontSize: `${barNumberFontSize}px`,
                      }}
                    >
                      {fmt(m.monthDone)}
                    </span>
                  </div>
                  <span
                    className="mc-bar-max"
                    style={{ fontSize: `${barNumberFontSize}px` }}
                  >
                    {fmt(m.monthPlan)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
