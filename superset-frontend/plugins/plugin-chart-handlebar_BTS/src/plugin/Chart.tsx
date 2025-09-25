import { useEffect, useRef, useState } from 'react';
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

// --- helpers -------------------------------
function primeCollapsedFiltersFor(dashIds: string[]) {
  try {
    // global defaults
    localStorage.setItem('DASHBOARD_FILTER_BAR_COLLAPSED', 'true');
    localStorage.setItem('DASHBOARD_FILTERS_OPEN', 'false');
    localStorage.setItem('NATIVE_FILTERS_PANEL_OPEN', 'false');
    localStorage.setItem('NATIVE_FILTERS_COLLAPSED', 'true');
    // per-dashboard keys
    dashIds.forEach(id => {
      const did = String(id).trim();
      if (!did) return;
      localStorage.setItem(`DASHBOARD_FILTER_BAR_COLLAPSED__${did}`, 'true');
      localStorage.setItem(`DASHBOARD_FILTERS_OPEN__${did}`, 'false');
      localStorage.setItem(`NATIVE_FILTERS_PANEL_OPEN__${did}`, 'false');
      localStorage.setItem(`NATIVE_FILTERS_COLLAPSED__${did}`, 'true');
    });
  } catch {
    /* empty */
  }
}

function addFilterFlags(url: string, show: '0' | '1' = '0') {
  const u = new URL(url, window.location.origin);
  // don’t double-add
  if (!u.searchParams.has('show_filters'))
    u.searchParams.set('expand_filters', show);
  if (!u.searchParams.has('show_native_filters'))
    u.searchParams.set('show_native_filters', show);
  return `${u.pathname}?${u.searchParams.toString()}`;
}

function extractDashIdFromHref(href: string): string | null {
  // matches /superset/dashboard/<id-or-slug>[/ or ?]
  const m = href.match(/\/superset\/dashboard\/([^/?#]+)[/?#]?/i);
  return m ? decodeURIComponent(m[1]) : null;
}

// -------------------------------------------------------------------------

// Build URL that auto-applies a Native Filter (no button press)
function buildDashWithAppliedFilterUrl(
  dashboardId: number | string,
  nativeFilterIdRaw: string, // short id from JSON (no "NATIVE_FILTER-" prefix)
  value: string | number | (string | number)[],
  opts?: { showFilters?: '1' | '0' }, // optional: left panel state
) {
  const shortId = nativeFilterIdRaw.replace(/^NATIVE_FILTER-/, '');
  const esc = (s: any) => String(s).replace(/'/g, "\\'");
  const list = Array.isArray(value) ? value : [value];
  const risonList = `!(${list.map(v => `'${esc(v)}'`).join(',')})`;

  // data_mask: applied + current states match -> Apply button not active
  const dataMask =
    `(${`NATIVE_FILTER-${shortId}`}:(` +
    `filterState:(value:${risonList}),` +
    `ownState:(),` +
    `extraFormData:(),` +
    `applied:(state:(value:${risonList}),extraFormData:())` +
    `))`;

  const params = new URLSearchParams();
  params.set('data_mask', dataMask);
  // (Optional) also set native_filters so the UI control shows the same value
  const nativeFilters = `(${`NATIVE_FILTER-${shortId}`}:(filterState:(value:${risonList}),id:NATIVE_FILTER-${shortId},ownState:()))`;
  params.set('native_filters', nativeFilters);

  if (opts?.showFilters) params.set('expand_filters', opts.showFilters);

  return `/superset/dashboard/${dashboardId}/?${params.toString()}`;
}

// function buildDashboardUrl(opts: {
//   baseUrl: string; // e.g. https://superset.mycorp.local
//   dashboardIdOrSlug: string; // numeric id or slug
//   query?: Record<string, string>; // optional query params
// }) {
//   const { baseUrl, dashboardIdOrSlug, query = {} } = opts;
//
//   // Common useful params:
//   // standalone=3   -> hide chrome
//   // show_filters=0 -> hide native filter bar (optional)
//   const q = new URLSearchParams({
//     standalone: '3',
//     ...query,
//   });
//
//   // Prefer slug route if you have one; id also works
//   // /superset/dashboard/<slug>/
//   // /superset/dashboard/<id>/
//   const u = new URL(
//     `/superset/dashboard/${encodeURIComponent(
//       dashboardIdOrSlug,
//     )}/?${q.toString()}`,
//     baseUrl,
//   );
//   return u.toString();
// }

// Helper to show/hide table cells by period
const setCellsDisplay = (els: NodeListOf<HTMLElement>, on: boolean) => {
  // eslint-disable-next-line no-return-assign,no-param-reassign
  els.forEach(el => (el.style.display = on ? 'table-cell' : 'none'));
};

export default function HandlebarsChart(props: HandlebarsProps) {
  const { template } = props.formData;
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
      root.innerHTML = '';
      return;
    }

    // Render handlebars HTML
    root.innerHTML = html;

    // Optional: inline user CSS (remove if CSP blocks it)
    const userStyles = (props.formData as any).styles as string | undefined;
    if (userStyles?.trim()) {
      const exists = root.querySelector('style[data-origin="userStyles"]');
      if (exists) exists.remove();
      const styleTag = document.createElement('style');
      styleTag.setAttribute('data-origin', 'userStyles');
      styleTag.appendChild(document.createTextNode(userStyles));
      root.prepend(styleTag);
    }

    // === NEW: dashurl with collapsed  filter===

    // 1) find anchors like your screenshot
    const anchors = Array.from(
      root.querySelectorAll<HTMLAnchorElement>(
        'a.open-modal[href*="/superset/dashboard/"]',
      ),
    );

    // 2) collect dash ids from hrefs
    const dashIds = anchors
      .map(a => extractDashIdFromHref(a.getAttribute('href') || ''))
      .filter((v): v is string => Boolean(v));

    // 3) prime localStorage so a plain click opens with the filter bar CLOSED
    primeCollapsedFiltersFor(dashIds);

    // 4) also add URL flags (belt & suspenders)
    anchors.forEach(a => {
      const href = a.getAttribute('href') || '';
      if (!href) return;
      // default closed; if you ever need open for a single link, add data-show-filters="1"
      const show =
        (a.getAttribute('data-show-filters') || '0') === '1' ? '1' : '0';
      a.setAttribute('href', addFilterFlags(href, show));
    });

    // === NEW: dashurl===
    const dashLinks = root.querySelectorAll<HTMLAnchorElement>(
      'a[data-open-dashboard]',
    );
    dashLinks.forEach(a => {
      const did = a.getAttribute('data-open-dashboard')!;
      const nfId = (a.getAttribute('data-nf-id') || '').replace(
        /^NATIVE_FILTER-/,
        '',
      );
      const raw = (a.getAttribute('data-val') || '').trim();
      const vals = raw.includes(',')
        ? raw.split(',').map(s => s.trim())
        : [raw];
      const show = (a.getAttribute('data-show-filters') || '') as
        | '1'
        | '0'
        | '';
      // eslint-disable-next-line no-param-reassign
      a.href = buildDashWithAppliedFilterUrl(did, nfId, vals, {
        showFilters: show || undefined,
      });
      // eslint-disable-next-line no-param-reassign
      if (!a.hasAttribute('target')) a.target = '_blank';
    });

    // === NEW: realize <div.auto-iframe data-src="..."> to real <iframe> ===
    const realizeAutoIframes = () => {
      const slots = Array.from(
        root.querySelectorAll<HTMLElement>('.auto-iframe[data-src]'),
      );
      let i = 0;

      // @ts-ignore
      const loadNext = () => {
        if (i >= slots.length) return;
        // eslint-disable-next-line no-plusplus
        const slot = slots[i++];
        // eslint-disable-next-line consistent-return
        if (slot.dataset.realized === '1') return loadNext();

        const src = slot.dataset.src!;
        const height = slot.dataset.height || '33vh';
        const padding = slot.dataset.padding || '0';

        const iframe = document.createElement('iframe');
        iframe.src = src;
        iframe.title = slot.dataset.title || `Embedded-${i}`;
        Object.assign(iframe.style, {
          width: '100%',
          height,
          border: 'none',
          display: 'block',
          background: 'transparent',
        });

        // timeout + retry once
        const t = window.setTimeout(() => {
          iframe.src = src; // retry same URL once
        }, 30000);

        iframe.addEventListener('load', () => {
          clearTimeout(t);
          loadNext();
        });
        iframe.addEventListener('error', () => {
          clearTimeout(t);
          loadNext();
        });

        slot.innerHTML = '';
        slot.style.padding = padding;
        slot.appendChild(iframe);
        slot.dataset.realized = '1';
      };

      // Start with a small stagger to let the page settle
      setTimeout(loadNext, 50);
    };
    // === NEW: realize DASH <div.auto-iframe data-src="..."> to real <iframe> ===
    // ---------------------------------------------------------------------
    // const realizeAutoDashIframes = () => {
    //   const slots = root.querySelectorAll<HTMLElement>(
    //     '.auto-dash[data-base][data-dash]',
    //   );
    //   slots.forEach(slot => {
    //     if (slot.dataset.realized === '1') return;
    //
    //     const base = slot.dataset.base!;
    //     const dash = slot.dataset.dash!; // id or slug
    //     const height = slot.dataset.height || '60vh';
    //
    //     // Optional JSON for query params (e.g., {"expand_filters":"0","r":"last 7 days"})
    //     let query: Record<string, string> = {};
    //     const paramsJson = slot.dataset.params;
    //     if (paramsJson) {
    //       try {
    //         query = JSON.parse(paramsJson);
    //       } catch {
    //         // ignore bad JSON
    //       }
    //     }
    //
    //     // Optional dynamic product filters via data-* (you can name them how you want)
    //     // Example: data-filter_prod="WidgetA" -> ?filter_prod=WidgetA
    //     // This keeps things generic (your dashboard can read URL params via Jinja/native filters mapping).
    //     for (const { name, value } of Array.from(slot.attributes)) {
    //       if (name.startsWith('data-filter_')) {
    //         const key = name.replace(/^data-filter_/, '');
    //         query[key] = value;
    //       }
    //     }
    //
    //     const src = buildDashboardUrl({
    //       baseUrl: base,
    //       dashboardIdOrSlug: dash,
    //       query,
    //     });
    //
    //     const iframe = document.createElement('iframe');
    //     iframe.src = src;
    //     iframe.title = slot.dataset.title || 'Dashboard';
    //     Object.assign(iframe.style, {
    //       width: '100%',
    //       height,
    //       border: 'none',
    //       display: 'block',
    //     } as CSSStyleDeclaration);
    //
    //     slot.innerHTML = '';
    //     slot.appendChild(iframe);
    //     slot.dataset.realized = '1';
    //   });
    // };

    // ---- State kept across clicks (not React state) ------------------------
    // We keep the current period in both DOM (data-period) and a ref variable,
    // so it remains correct on every click.
    let periodRef: Period = 'day'; // | null = null; // null => "no specific period" (show all columns)

    // Read from DOM if it existed (e.g., re-mount within same container)
    const attr = root.getAttribute('data-period');
    if (attr) periodRef = normalizePeriod(attr);

    const setPeriod = (p: Period) => {
      periodRef = p;
      if (p) root.setAttribute('data-period', p);
      // else root.removeAttribute('data-period');
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
      const { cat } = btn.dataset;
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
            // eslint-disable-next-line no-param-reassign
            row.style.display = DISPLAY_ROW;
          } else {
            // eslint-disable-next-line no-param-reassign
            row.style.display = 'none';
          }
        });
        // show rows matching selected categories
        catsToShow.forEach(cat => {
          document
            .querySelectorAll<HTMLElement>(`.${p}-value-row.xx.${cat}`)
            // eslint-disable-next-line no-return-assign,no-param-reassign
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
        // @ts-ignore
        const typeAttr = periodBtn.getAttribute('data-type'); // may be '0','1','2','3' or names
        const next = normalizePeriod(typeAttr);
        const allBtns = root.querySelectorAll<HTMLElement>('.kpi-toggle-btn');

        // Determine if clicked was already active BEFORE we clear classes
        // @ts-ignore
        const wasActive = periodBtn.classList.contains('active');

        // Clear highlight on all period buttons
        allBtns.forEach(b => b.classList.remove('active'));

        if (wasActive) {
          // Toggle off -> no specific period
          setPeriod('day');
        } else {
          // Activate clicked button
          // @ts-ignore
          periodBtn.classList.add('active');
          setPeriod(next);
        }

        applyPeriodColumns(); // update visible columns
        applyCategoryFilter(); // re-apply rows for new period
        return;
      }

      const openLink = target.closest(
        'a.open-modal',
      ) as HTMLAnchorElement | null;
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
      }
    };

    // Initial apply on mount
    applyPeriodColumns();
    applyCategoryFilter();

    realizeAutoIframes();

    root.addEventListener('click', onClick);
    // eslint-disable-next-line consistent-return
    return () => root.removeEventListener('click', onClick);
  }, [html, props.formData.styles, template]);

  return (
    <>
      <div ref={containerRef} className="handlebars-root" />

      {/* Модалка */}
      {modalUrl && (
        // eslint-disable-next-line jsx-a11y/no-static-element-interactions
        <div
          style={{
            position: 'fixed',
            inset: 0,
            // eslint-disable-next-line theme-colors/no-literal-colors
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setModalUrl(null)}
        >
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div
            style={{
              // eslint-disable-next-line theme-colors/no-literal-colors
              background: '#fff',
              width: '75%',
              height: '75%',
              position: 'relative',
            }}
            onClick={e => e.stopPropagation()}
          >
            <iframe
              src={modalUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                padding: '10px',
              }}
              title="Preview"
            />
            {/* eslint-disable-next-line react/button-has-type */}
            <button
              onClick={() => setModalUrl(null)}
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                border: 'none',
                // eslint-disable-next-line theme-colors/no-literal-colors
                background: '#333',
                lineHeight: '25px',
                cursor: 'pointer',
                fontSize: '25px',
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
