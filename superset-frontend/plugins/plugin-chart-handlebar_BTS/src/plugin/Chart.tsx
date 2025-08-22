// plugin-chart-handlebars/src/plugin/Chart.tsx

import React, { useEffect, useRef, useState } from 'react';
import Handlebars from 'handlebars';
import { ChartProps } from '@superset-ui/core';
import './handleBarsHelpers';
import './Chart.css';

interface HandlebarsProps extends ChartProps {
  formData: {
    template: string;
    styles?: string; // optional user CSS from controls
    [key: string]: any;
  };
  data: any[] | { records: any[] };
}

type Period = 'day' | 'week' | 'mnth' | 'year';

// Normalize any incoming value to a valid Period
const normalizePeriod = (v: string | null): Period => {
  switch ((v ?? '').toString().trim().toLowerCase()) {
    case '0':
    case 'day':
      return 'day';
    case '1':
    case 'week':
      return 'week';
    case '2':
    case 'mnth':
    case 'mon':
    case 'month':
      return 'mnth';
    case '3':
    case 'year':
      return 'year';
    default:
      return 'day';
  }
};

// Helper to show/hide table cells by period
const setCellsDisplay = (els: NodeListOf<HTMLElement>, on: boolean) => {
  els.forEach(el => (el.style.display = on ? 'table-cell' : 'none'));
};

export default function HandlebarsChart(props: HandlebarsProps) {
  const template = props.formData.template;
  const raw = props.data;
  const records: any[] = Array.isArray(raw)
    ? raw
    : Array.isArray((raw as any).records)
      ? (raw as any).records
      : [];

  const containerRef = useRef<HTMLDivElement>(null);
  const [modalUrl, setModalUrl] = useState<string | null>(null); // <-- состояние модалки
  const html = Handlebars.compile(template ?? '')({ data: records });

  useEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    if (!template) {
      console.warn('HandlebarsChart: template is empty');
      root.innerHTML = '';
      return;
    }


    // Render handlebars HTML
    root.innerHTML = html;

    // Optional: inline user CSS (remove if CSP blocks it)
    const userStyles = (props.formData as any).styles as string | undefined;
    if (userStyles && userStyles.trim()) {
      const exists = root.querySelector('style[data-origin="userStyles"]');
      if (exists) exists.remove();
      const styleTag = document.createElement('style');
      styleTag.setAttribute('data-origin', 'userStyles');
      styleTag.appendChild(document.createTextNode(userStyles));
      root.prepend(styleTag);
    }

    // ---- State kept across clicks (not React state) ------------------------
    // We keep the current period in both DOM (data-period) and a ref variable,
    // so it remains correct on every click.
    let periodRef: Period = 'day'; //| null = null; // null => "no specific period" (show all columns)

    // Read from DOM if it existed (e.g., re-mount within same container)
    const attr = root.getAttribute('data-period');
    if (attr) periodRef = normalizePeriod(attr);

    const setPeriod = (p: Period) => {
      periodRef = p;
      if (p) root.setAttribute('data-period', p);
      //else root.removeAttribute('data-period');
    };

    const getPeriod = (): Period => periodRef;

    // Multiple category selection (checkbox-like)
    const selectedCats = new Set<string>(); // 'bp' | 'op' | 'ps'
    // === INIT: Default selected categories ===
    ['bp', 'op', 'ps'].forEach(cat => selectedCats.add(cat));

    // Activate any existing category buttons
    const allCatBtns = root.querySelectorAll<HTMLButtonElement>(
      '.smypki-refresh-btn',
    );
    allCatBtns.forEach(btn => {
      const cat = btn.dataset.cat;
      if (cat && selectedCats.has(cat)) {
        btn.classList.add('active');
      }
    });
    // Toggle period columns visibility (table cells)
    const applyPeriodColumns = () => {
      const p = getPeriod(); // can be null
      const dayCells = document.querySelectorAll<HTMLElement>('.day_visible');
      const weekCells = document.querySelectorAll<HTMLElement>('.week_visible');
      const mnthCells = document.querySelectorAll<HTMLElement>('.mnth_visible');
      const yearCells = document.querySelectorAll<HTMLElement>('.year_visible');

      if (p === null) {
        // No specific period selected -> show all columns
        setCellsDisplay(dayCells, true);
        setCellsDisplay(weekCells, true);
        setCellsDisplay(mnthCells, true);
        setCellsDisplay(yearCells, true);
      } else {
        setCellsDisplay(dayCells, p === 'day');
        setCellsDisplay(weekCells, p === 'week');
        setCellsDisplay(mnthCells, p === 'mnth');
        setCellsDisplay(yearCells, p === 'year');
      }
    };

    const allPeriodBtns = root.querySelectorAll<HTMLElement>('.kpi-toggle-btn');
    allPeriodBtns.forEach(btn => {
      const typeAttr = btn.getAttribute('data-type');
      if (normalizePeriod(typeAttr) === 'day') {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
    // Show/hide rows by selected categories & current period
    // If no period selected -> apply to ALL periods.
    const DISPLAY_ROW = 'table-row'; // change to 'block' if rows are <div>
    const applyCategoryFilter = () => {
      const current = getPeriod(); // Period | null
      const periods: Period[] = current
        ? [current]
        : ['day', 'week', 'mnth', 'year'];
      const catsToShow =
        selectedCats.size === 0 ? ['bp', 'op', 'ps'] : Array.from(selectedCats);

      // For each period, hide all rows first (except .f), then show selected categories
      periods.forEach(p => {
        const allRows = document.querySelectorAll<HTMLElement>(
          `.${p}-value-row`,
        );
        // hide all except .f
        allRows.forEach(row => {
          if (row.classList.contains('f')) {
            row.style.display = DISPLAY_ROW;
          } else {
            row.style.display = 'none';
          }
        });
        // show rows matching selected categories
        catsToShow.forEach(cat => {
          document
            .querySelectorAll<HTMLElement>(`.${p}-value-row.xx.${cat}`)
            .forEach(row => (row.style.display = DISPLAY_ROW));
        });
      });
    };

    // Single delegated click handler
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // ----- Period buttons (.kpi-toggle-btn) -----
      const periodBtn = target.closest('.kpi-toggle-btn') as
        | HTMLElement
        | 'day';
      if (periodBtn) {
        const typeAttr = periodBtn.getAttribute('data-type'); // may be '0','1','2','3' or names
        const next = normalizePeriod(typeAttr);
        const allBtns = root.querySelectorAll<HTMLElement>('.kpi-toggle-btn');

        // Determine if clicked was already active BEFORE we clear classes
        const wasActive = periodBtn.classList.contains('active');

        // Clear highlight on all period buttons
        allBtns.forEach(b => b.classList.remove('active'));

        if (wasActive) {
          // Toggle off -> no specific period
          setPeriod('day');
        } else {
          // Activate clicked button
          periodBtn.classList.add('active');
          setPeriod(next);
        }

        applyPeriodColumns(); // update visible columns
        applyCategoryFilter(); // re-apply rows for new period
        return;
      }

      const openLink = target.closest('a.open-modal') as HTMLAnchorElement | null;
      if (openLink) {
        e.preventDefault();
        e.stopPropagation();
        setModalUrl(openLink.href);
        return;
      }

      // ----- Category checkbox buttons (.smypki-refresh-btn) -----
      const catBtn = target.closest<HTMLButtonElement>('.smypki-refresh-btn');
      if (catBtn) {
        const cat = catBtn.dataset.cat!; // 'bp' | 'op' | 'ps'
        if (catBtn.classList.contains('active')) {
          catBtn.classList.remove('active');
          selectedCats.delete(cat);
        } else {
          selectedCats.add(cat);
          catBtn.classList.add('active');
        }
        applyCategoryFilter();
        return;
      }
    };

    // Initial apply on mount
    applyPeriodColumns();
    applyCategoryFilter();

    root.addEventListener('click', onClick);
    return () => root.removeEventListener('click', onClick);
  }, [html, props.formData.styles, template]);

  return (
    <>
      <div ref={containerRef} className="handlebars-root" />

      {/* Модалка */}
      {modalUrl && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setModalUrl(null)}
        >
          <div
            style={{
              background: '#fff',
              width: '75%',
              height: '75%',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <iframe
              src={modalUrl}
              style={{ width: '100%', height: '100%', border: 'none' ,padding:'50px'}}
              title="Preview"
            />
            <button
              onClick={() => setModalUrl(null)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                border: 'none',
                background: 'transparent',
                lineHeight:'25px',
                cursor: 'pointer',
                fontSize:'25px',
              }}
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  );
}
