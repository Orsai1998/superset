/**
 * Top-40 Diesel Consumption Plugin — Final balanced layout
 */
import { styled } from '@superset-ui/core';
// eslint-disable-next-line no-restricted-syntax
import React from 'react';
import type { SupersetPluginTop40ConsumptionProps } from './types';

// @ts-ignore
import DefaultAvatar from './images/default_avatar.jpg';

const Container = styled.div<{
  $themeMode: 'light' | 'dark';
  $headerFontSize: number;
}>`
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible !important; /* allow content to expand */
  border-radius: 16px;
  color: ${({ $themeMode }) =>
    $themeMode === 'light' ? 'rgba(50, 50, 50, 1)' : '#fff'};
  background-color: ${({ $themeMode }) =>
    $themeMode === 'light' ? '#fff' : 'rgba(9, 21, 44, 1)'};
  font-family: 'Inter', sans-serif;

  .top40-panels {
    display: flex;
    flex-wrap: nowrap;
    justify-content: space-between;
    width: 100%;
    max-width: 100%;
    gap: 30px;
    background-color: ${({ $themeMode }) =>
      $themeMode === 'light' ? '#fff' : 'rgba(9, 21, 44, 1)'};
  }

  /* ==== Panel layout fix ==== */

  .panel {
    background: ${({ $themeMode }) =>
      $themeMode === 'light' ? 'rgba(245, 245, 245, 1)' : 'rgba(9, 21, 44, 1)'};
    border-radius: 12px;
    padding: 20px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    overflow: hidden;
    flex: 1 1 48%;
    min-width: 420px;
    container-type: inline-size;
    border: 1px solid
      ${({ $themeMode }) =>
        $themeMode === 'light' ? '#ddd' : 'rgba(26, 51, 111, 1)'};
  }

  h3 {
    margin: 0;
    font-weight: 700 !important;
    text-align: left;
    font-size: ${({ $headerFontSize }) => `${$headerFontSize}px`} !important;
    color: ${({ $themeMode }) =>
      $themeMode === 'light' ? 'rgba(50, 50, 50, 1)' : '#fff'} !important;
  }

  /* === LEFT PANEL (TOP 3 + GRID) === */

  .top-cards {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    width: 100%;
    height: auto;
  }

  .top-cards .card {
    flex: 1;
  }

  .card {
    border-radius: 10px;
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
  }

  .card img {
    width: 60%;
    height: auto;
    border-radius: 8px;
    object-fit: cover;
  }

  .card.top1 img,
  .card.top2 img,
  .card.top3 img {
    width: 60%;
    height: auto;
    border-radius: 12px;
    object-fit: cover;
  }

  .card:hover {
    transform: translateY(-3px);
  }

  /* === Top-3 highlight === */

  .card.top1,
  .card.top2,
  .card.top3 {
    background: ${({ $themeMode }) =>
      $themeMode === 'light'
        ? 'rgba(34, 197, 94, 0.4)'
        : 'rgba(23, 46, 22, 1)'};
  }

  /* остальные */

  .card.good {
    background: ${({ $themeMode }) =>
      $themeMode === 'light'
        ? 'rgba(226, 226, 226, 1)'
        : 'rgba(53, 63, 82, 1)'};
    aspect-ratio: 1 / 1.2;
    width: 100%;
  }

  .card.good img,
  .card.bad img {
    width: 60%;
    height: 60%;
    border-radius: 8px;
    object-fit: cover;
  }

  .card.bad {
    background: ${({ $themeMode }) =>
      $themeMode === 'light'
        ? 'rgba(254, 38, 38, 0.4)'
        : 'rgba(77, 37, 37, 1)'};
    border: ${({ $themeMode }) =>
      $themeMode === 'light' ? '1px solid rgba(254, 38, 38, 1)' : 'none'};
    width: 100%;
    aspect-ratio: 1 / 1.2;
  }

  .value {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
  }

  .name {
    font-size: 14px;
    margin-top: 6px;
    margin-bottom: 10px;
  }

  .index {
    position: absolute;
    bottom: 6px;
    left: 2px;
    font-size: 12px;
    font-weight: 600;
    opacity: 0.7;
  }

  /* === GRID FIX === */

  .cards {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: clamp(8px, 1vw, 16px);
    width: 100%;
    justify-content: start;
  }

  @container (max-width: 1400px) {
    //.cards {
    //  grid-template-columns: repeat(4, 1fr);
    //}
  }
  @container (max-width: 1100px) {
    .cards {
      grid-template-columns: repeat(3, 1fr);
    }
  }
  @container (max-width: 800px) {
    .cards {
      grid-template-columns: repeat(4, 1fr);
    }
  }
  @container (max-width: 550px) {
    .cards {
      grid-template-columns: 1fr;
    }
  }
  /* --- RIGHT PANEL FIX --- */
  //.panel.bad .cards {

  @media (max-width: 1400px) {
    .panel.good {
      flex: 1 1 100%;
    }

    .panel.bad {
      flex: 1 1 100%;
    }
  }
`;

export default function SupersetPluginTop40Consumption({
  data = {
    chartData: [],
    topLeft: [],
    topRight: [],
  },
  formData,
}: SupersetPluginTop40ConsumptionProps) {
  const topLeft = data.topLeft ?? [];
  const topRight = data.topRight ?? [];
  const leftTop3 = topLeft.slice(0, 3);
  const leftRest = topLeft.slice(3, 15); // 12 more cards → 2 rows of 6
  console.log('DATA: test');
  console.log(leftTop3);
  const rightTop40 = [...topLeft.slice(15), ...topRight]; // rest go to right panel
  const theme = formData?.theme || 'dark';
  const titleFontSize = formData?.titleFontSize || 16;
  const generateAvatar = (name: string, url?: string) => {
    const raw = (url ?? '').toString();
    const value = raw.trim().toLowerCase();

    const invalid =
      !url ||
      value === '' ||
      value === 'null' ||
      value === 'undefined' ||
      value === '-';

    return invalid ? DefaultAvatar : raw;

    // const initials = (name || 'NA').substring(0, 2).toUpperCase();

    // return `data:image/svg+xml;utf8,
    // <svg xmlns='http://www.w3.org/2000/svg' width='80' height='80'>
    //  <rect width='80' height='80' rx='8' ry='8' fill='%230b1220'/>
    //  <text x='50%' y='50%' dy='.3em' fill='white'
    //         font-family='Arial' font-size='22' text-anchor='middle'>
    //     ${initials}
    //   </text>
    // </svg>`;
  };

  return (
    <Container $themeMode={theme} $headerFontSize={titleFontSize}>
      <div className="top40-panels">
        {/* LEFT PANEL */}
        <div className="panel good">
          <h3>Топ 40 по удельному расходу дизельного топлива (г/тнкм)</h3>

          <div className="top-cards">
            {leftTop3.map((p: any, i: number) => (
              <div key={`top3-${i}`} className={`card top${i + 1}`}>
                <div className="value">{p.value}</div>
                <img
                  src={generateAvatar(p.name, p.url)}
                  alt={p.name || 'avatar'}
                  loading="lazy"
                  onError={e => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = DefaultAvatar;
                  }}
                />
                <div className="name">{p.name}</div>
                <div className="index">{i + 1}</div>
              </div>
            ))}
          </div>

          <div className="cards">
            {leftRest.map((p: any, i: number) => (
              <div className="card good" key={`left-${i + 3}`}>
                <div className="value">{p.value}</div>
                <img
                  src={generateAvatar(p.name, p.url)}
                  alt={p.name || 'avatar'}
                  loading="lazy"
                  onError={e => {
                    const img = e.currentTarget;
                    img.onerror = null;
                    img.src = DefaultAvatar;
                  }}
                />
                <div className="name">{p.name}</div>
                <div className="index">{i + 4}</div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="panel bad">
          <h3>Топ 40 по удельному расходу дизельного топлива (г/тнкм)</h3>
          <div className="cards">
            {rightTop40.map((p: any, i: number) => {
              const index = i + leftRest.length + 4;
              const cardClass = index > 21 ? 'card bad' : 'card good';

              return (
                <div className={cardClass} key={`right-${i}`}>
                  <div className="value">{p.value}</div>
                  <img
                    src={generateAvatar(p.name, p.url)}
                    alt={p.name || 'avatar'}
                    loading="lazy"
                    onError={e => {
                      const img = e.currentTarget;
                      img.onerror = null;
                      img.src = DefaultAvatar;
                    }}
                  />
                  <div className="name">{p.name}</div>
                  <div className="index">{index}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Container>
  );
}
