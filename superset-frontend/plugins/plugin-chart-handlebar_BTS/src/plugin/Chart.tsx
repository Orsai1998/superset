import { useEffect, useRef, useState } from 'react';
import Handlebars from 'handlebars';
import { ChartProps } from '@superset-ui/core';
import './handleBarsHelpers';
import './Chart.css';

interface HandlebarsProps extends ChartProps {
  formData: {
    template: string;
    styles?: string; // optional user CSS from controls
    // EDITED2026: optional allowlist for postMessage bridge (CSV of origins)
    hostAllowlist?: string;
    host_allowlist?: string;
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
      return 'week'; // EDITED2026: default week (matches desired fallback)
  }
};

// --- helpers -------------------------------

function addFilterFlags(url: string, show: '0' | '1' = '0') {
  const u = new URL(url, window.location.origin);
  // EDITED2026: fix param check (was show_filters, but we set expand_filters)
  if (!u.searchParams.has('show_filters'))
    u.searchParams.set('expand_filters', show);
  if (!u.searchParams.has('show_native_filters'))
    u.searchParams.set('show_native_filters', show);
  return `${u.pathname}?${u.searchParams.toString()}`;
}

// --- helpers -------------------------------
function extractDashIdFromHref(href: string): string | null {
  // matches /superset/dashboard/<id-or-slug>[/ or ?]
  const m = href.match(/\/superset\/dashboard\/([^/?#]+)[/?#]?/i);
  return m ? decodeURIComponent(m[1]) : null;
}

// --- helpers -------------------------------

// DROP-IN: replace your current function with this one (same name/signature)
function tryHideEmpty(iframe: any, slot: any) {
  const maxMs = +slot.dataset.hidePollMaxMs || 15000; // total window to watch
  const stepMs = +slot.dataset.hidePollStepMs || 250; // poll interval
  const graceMs = +slot.dataset.hidePollGraceMs || 1200; // don't hide before this
  const needHits = +slot.dataset.hidePollHits || 2; // consecutive empty detections
  const debug = slot.dataset.hideDebug === '1';

  const started = performance.now();
  let emptyHits = 0;

  // Helper: (un)hide wrapper
  function setHidden(on: boolean) {
    if (on) {
      // eslint-disable-next-line no-param-reassign
      if (slot.style.display !== 'none') slot.style.display = 'none';
      slot.setAttribute('data-hidden-empty', '1');
    } else if (slot.getAttribute('data-hidden-empty') === '1') {
      slot.style.removeProperty('display');
      slot.removeAttribute('data-hidden-empty');
    }
  }

  // Look for empty state **inside chart containers only**
  function isEmptyScoped(doc: { querySelectorAll: (arg0: string) => any }) {
    // typical containers around charts on Superset dashboards
    const containers = doc.querySelectorAll(
      '.dashboard-component-chart, .slice_container, [data-test="chart"], .chart-container',
    );
    if (!containers.length) return false;

    // ant empty & explicit empty markers inside containers
    for (const c of containers) {
      if (
        c.querySelector(
          '.ant-empty, .ant-empty-normal, [data-test="empty-state"], .chart-empty, .slice-empty',
        )
      ) {
        if (debug) console.log('[hideEmpty] ant/marker found in container');
        return true;
      }
      // textual message inside the container
      const t = (c.innerText || '').trim();
      if (
        /No results were returned for this query|No data|Нет данных|Данные не найдены/i.test(
          t,
        )
      ) {
        if (debug)
          console.log('[hideEmpty] text match in container:', t.slice(0, 80));
        return true;
      }
    }

    return false;
  }

  function tick() {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) {
        if (performance.now() - started < maxMs) setTimeout(tick, stepMs);
        return;
      }

      const emptyNow = isEmptyScoped(doc);
      emptyHits = emptyNow ? emptyHits + 1 : 0;

      const elapsed = performance.now() - started;

      if (debug) {
        // light debug line
        console.log(
          '[hideEmpty] elapsed=',
          Math.round(elapsed),
          ' emptyNow=',
          emptyNow,
          ' hits=',
          emptyHits,
        );
      }

      // Only hide after grace time AND enough consecutive confirmations
      if (elapsed >= graceMs && emptyHits >= needHits) {
        setHidden(true);
        return;
      }

      // keep polling until timeout
      if (elapsed < maxMs) {
        setTimeout(tick, stepMs);
      }
    } catch (e) {
      // cross-origin → cannot inspect; leave visible
      if (debug) console.warn('[hideEmpty] cross-origin or error:', e);
    }
  }

  // start short, time-boxed polling
  setTimeout(tick, stepMs);
}

// -------------------------------------------------------------------------

// Build URL that auto-applies a Native Filter (no button press)
/**
 * Build URL that auto-applies a Native Filter (no button press)
 * and forwards optional standalone + show_filters query params.
 */
export function buildDashWithAppliedFilterUrl(
  dashboardId: number | string,
  nativeFilterIdRaw: string, // short или full
  values: string | number | (string | number)[],
  opts?: {
    showFilters?: '0' | '1'; // скрыть/показать левую панель
    standalone?: string | number; // прокидываем как есть (например 3)
  },
): string {
  // --- id: short/full ---
  const shortId = String(nativeFilterIdRaw).replace(/^NATIVE_FILTER-/, '');
  const fullId = `NATIVE_FILTER-${shortId}`;

  // --- values -> массив строк ---
  const list = Array.isArray(values)
    ? values
    : typeof values === 'string' && values.includes(',')
      ? values
          .split(',')
          .map(s => s.trim())
          .filter(Boolean)
      : [values];

  const esc = (v: unknown) => String(v).replace(/'/g, "\\'");
  const risonList = `!(${list.map(v => `'${esc(v)}'`).join(',')})`;

  // --- data_mask: current == applied ---
  const dataMask =
    `(${fullId}:(filterState:(value:${risonList}),ownState:(),extraFormData:(),` +
    `applied:(state:(value:${risonList}),extraFormData:())))`;

  // --- native_filters: синхронизация UI ---
  const nativeFilters = `(${fullId}:(filterState:(value:${risonList}),id:${fullId},ownState:()))`;

  // --- query params ---
  const params = new URLSearchParams();
  params.set('data_mask', dataMask);
  params.set('native_filters', nativeFilters);

  if (opts?.showFilters === '0' || opts?.showFilters === '1') {
    params.set('expand_filters', opts.showFilters);
  }

  if (opts?.standalone !== undefined && opts?.standalone !== null) {
    const standalone = String(opts.standalone).trim();
    if (standalone) params.set('standalone', standalone); // будет ровно ?standalone=3
  }

  return `/superset/dashboard/${dashboardId}/?${params.toString()}`;
}

// Helper to show/hide table cells by period
const setCellsDisplay = (els: NodeListOf<HTMLElement>, on: boolean) => {
  // eslint-disable-next-line no-return-assign,no-param-reassign
  els.forEach(el => (el.style.display = on ? 'table-cell' : 'none'));
};

// EDITED2026: postMessage protocol types (bridge for external host control)
type CtrlAction = 'SET_PERIOD' | 'GET_STATE' | 'CLICK_LINK' | 'CLICK_TAB'; // EDITED2026
type CtrlReq = {
  type: 'SSE_CTRL';
  v: 1;
  id: string;
  action: CtrlAction;
  payload?: { period?: Period; linkId?: string; label?: string };
}; // EDITED2026
type CtrlAck = {
  type: 'SSE_CTRL_ACK';
  v: 1;
  id: string;
  status: 'OK' | 'ERR';
  result?: any;
  error?: { code: string; message: string };
};
// EDITED2026: CSS.escape fallback for older browsers
const cssEscape = (value: string): string => {
  const w = window as any;
  if (w?.CSS?.escape) return w.CSS.escape(value);
  return value.replace(/[^a-zA-Z0-9_-]/g, match => `\\${match}`);
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

    // === dashurl with collapsed filter ===

    // 1) find anchors like your screenshot
    const anchors = Array.from(
      root.querySelectorAll<HTMLAnchorElement>(
        'a.open-modal[href*="/superset/dashboard/"]',
      ),
    );

    // EDITED2026: remove unused map/filter chain; just normalize hrefs + keep as-is
    anchors.forEach(a => {
      const href = a.getAttribute('href') || '';
      if (!href) return;

      // just to validate / keep compatibility (optional)
      extractDashIdFromHref(href);

      // default closed; if you ever need open for a single link, add data-show-filters="1"
      const show =
        (a.getAttribute('data-show-filters') || '0') === '1' ? '1' : '0';
      a.setAttribute('href', addFilterFlags(href, show));
    });

    // --- dashUrl ---
    const dashLinks = root.querySelectorAll<HTMLAnchorElement>(
      'a[data-open-dashboard]',
    );
    dashLinks.forEach(a => {
      const didAttr = (a.getAttribute('data-open-dashboard') || '').trim();
      if (!didAttr) return;

      // native filter id (short или full) → short
      const nfIdRaw = (a.getAttribute('data-nf-id') || '').trim();
      const nfId = nfIdRaw.replace(/^NATIVE_FILTER-/, '');

      // значения (поддержка CSV)
      const rawVal = (a.getAttribute('data-val') || '').trim();
      const vals = rawVal
        ? rawVal.includes(',')
          ? rawVal
              .split(',')
              .map(s => s.trim())
              .filter(Boolean)
          : [rawVal]
        : [];

      // show_filters: нужно явно передать '0' или '1', иначе Superset возьмёт дефолт
      const showAttr = (a.getAttribute('data-show-filters') || '').trim(); // '0' | '1' | ''
      const showFilters =
        showAttr === '0' || showAttr === '1'
          ? (showAttr as '0' | '1')
          : undefined;

      // standalone: прокидываем строкой без Boolean/Number (чтобы '3' не стало 1)
      const stAttr = (a.getAttribute('data-standalone') || '').trim();
      const standalone = stAttr !== '' ? stAttr : undefined;

      if (nfId && vals.length) {
        // eslint-disable-next-line no-param-reassign
        a.href = buildDashWithAppliedFilterUrl(didAttr, nfId, vals, {
          showFilters,
          standalone,
        });
      } else {
        const qs = new URLSearchParams();
        if (vals.length) qs.set('prod', vals.join(',')); // если используете url_param('prod')
        if (showFilters) qs.set('expand_filters', showFilters);
        if (standalone) qs.set('standalone', standalone);
        // eslint-disable-next-line no-param-reassign
        a.href = `/superset/dashboard/${encodeURIComponent(didAttr)}/${
          qs.toString() ? `?${qs.toString()}` : ''
        }`;
      }

      // eslint-disable-next-line no-param-reassign
      if (!a.hasAttribute('target')) a.target = '_blank';
    });

    // === realize <div.auto-iframe data-src="..."> to real <iframe> ===
    const realizeAutoIframes = () => {
      const slots = Array.from(
        root.querySelectorAll<HTMLElement>('.auto-iframe[data-src]'),
      );
      let i = 0;

      // EDITED2026: remove ts-ignore; type the recursive loader
      const loadNext = (): void => {
        if (i >= slots.length) return;

        // eslint-disable-next-line no-plusplus
        const slot = slots[i++];
        // eslint-disable-next-line consistent-return
        if (slot.dataset.realized === '1') return loadNext();

        const src = slot.dataset.src!;
        const height =
          new URL(src, window.location.origin).searchParams.get('height') ||
          slot.dataset.height ||
          '33vh';
        const padding = slot.dataset.padding || '0';

        const iframe = document.createElement('iframe');
        iframe.src = src;

        // first quick check after append
        requestAnimationFrame(() => tryHideEmpty(iframe, slot));

        iframe.title = slot.dataset.title || `Embedded-${i}`;
        Object.assign(iframe.style, {
          width: '100%',
          height,
          border: 'none',
          display: 'block',
          background: 'transparent',
          overflow: 'hidden',
        });

        // timeout + retry once
        const t = window.setTimeout(() => {
          iframe.src = src; // retry same URL once
        }, 30000);

        const done = () => {
          clearTimeout(t);
          tryHideEmpty(iframe, slot);
          loadNext();
        };

        iframe.addEventListener('load', done);
        iframe.addEventListener('error', done);

        slot.innerHTML = '';
        slot.style.padding = padding;
        slot.appendChild(iframe);
        slot.dataset.realized = '1';
      };

      // Start with a small stagger to let the page settle
      setTimeout(loadNext, 50);
    };

    // ---------------------------------------------------------------------
    // ---- State kept across clicks (not React state) ------------------------
    // EDITED2026: default week, never null (week is enforced if user "unselects all")
    let periodRef: Period = 'week';

    // Read from DOM if it existed (e.g., re-mount within same container)
    const attr = root.getAttribute('data-period');
    if (attr) periodRef = normalizePeriod(attr);

    const setPeriodLocal = (p: Period) => {
      periodRef = p;
      root.setAttribute('data-period', p);
    };

    const getPeriod = (): Period => periodRef;

    // Multiple category selection (checkbox-like) - keep existing logic
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
      const p = getPeriod();

      // EDITED2026: scope for visibility selectors; some elements may be outside plugin root

      const dayCells = document.querySelectorAll<HTMLElement>('.day_visible');
      const weekCells = document.querySelectorAll<HTMLElement>('.week_visible');
      const mnthCells = document.querySelectorAll<HTMLElement>('.mnth_visible');
      const yearCells = document.querySelectorAll<HTMLElement>('.year_visible');

      setCellsDisplay(dayCells, p === 'day');
      setCellsDisplay(weekCells, p === 'week');
      setCellsDisplay(mnthCells, p === 'mnth');
      setCellsDisplay(yearCells, p === 'year');
    };

    // Ensure period buttons reflect current state
    const syncPeriodButtons = () => {
      const p = getPeriod() || 'week';
      const allPeriodBtns =
        root.querySelectorAll<HTMLElement>('.kpi-toggle-btn');
      allPeriodBtns.forEach(btn => {
        const typeAttr = btn.getAttribute('data-type');
        btn.classList.toggle('active', normalizePeriod(typeAttr) === p);
      });
    };

    // Show/hide rows by selected categories & current period
    const DISPLAY_ROW = 'table-row'; // change to 'block' if rows are <div>
    const applyCategoryFilter = () => {
      const current = getPeriod();

      const catsToShow =
        selectedCats.size === 0 ? ['bp', 'op', 'ps'] : Array.from(selectedCats);

      // EDITED2026: scope to root
      const allRows = document.querySelectorAll<HTMLElement>(
        `.${current}-value-row`,
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
          .querySelectorAll<HTMLElement>(`.${current}-value-row.xx.${cat}`)
          // eslint-disable-next-line no-return-assign,no-param-reassign
          .forEach(row => (row.style.display = DISPLAY_ROW));
      });
    };

    // Single delegated click handler
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      // ----- Period buttons (.kpi-toggle-btn) -----
      const periodBtn = target.closest('.kpi-toggle-btn') as HTMLElement | null;
      if (periodBtn) {
        const typeAttr = periodBtn.getAttribute('data-type'); // may be '0','1','2','3' or names
        const next = normalizePeriod(typeAttr);
        const allBtns = root.querySelectorAll<HTMLElement>('.kpi-toggle-btn');

        const wasActive = periodBtn.classList.contains('active'); // EDITED2026: remove ts-ignore

        // Clear highlight on all period buttons
        allBtns.forEach(b => b.classList.remove('active'));

        if (wasActive) {
          // EDITED2026: do NOT allow null/none -> force week
          const weekBtn = root.querySelector<HTMLElement>(
            '.kpi-toggle-btn[data-type="1"], .kpi-toggle-btn[data-type="week"]',
          );
          if (weekBtn) weekBtn.classList.add('active'); // keep week active visually
          setPeriodLocal('week');
        } else {
          periodBtn.classList.add('active'); // EDITED2026: remove ts-ignore
          setPeriodLocal(next);
        }

        applyPeriodColumns();
        applyCategoryFilter();
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
      const catBtn = target.closest(
        '.smypki-refresh-btn',
      ) as HTMLButtonElement | null; // EDITED2026: fix TS generic misuse
      if (catBtn) {
        const { cat } = catBtn.dataset;
        if (!cat) return;

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

    // ---------------------------------------------------------------------
    // EDITED2026: postMessage bridge (external host can call SET_PERIOD / GET_STATE)
    const parseAllowlist = (): Set<string> => {
      const csv = (
        props.formData.hostAllowlist ||
        props.formData.host_allowlist ||
        ''
      ).toString();
      const items = csv
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      return new Set(items);
    };

    const allowlist = parseAllowlist();

    // If allowlist not provided, allow only referrer origin (safe default)
    const refOrigin = (() => {
      try {
        return document.referrer ? new URL(document.referrer).origin : '';
      } catch {
        return '';
      }
    })();
    const HOST_ALLOWLIST = new Set<string>([
      'https://box.prod.k8s.erg.kz/map',
      'https://box.stage.k8s.erg.kz/map',
      window.location.origin,
      // 'http://localhost:3000', // EDITED2026: optional local dev
    ]);
    const isAllowedOrigin = (origin: string): boolean => {
      if (allowlist.size > 0) return allowlist.has(origin);
      return HOST_ALLOWLIST.has(origin) || origin === refOrigin;
    };

    const postAck = (win: Window | null, origin: string, ack: CtrlAck) => {
      try {
        win?.postMessage(ack, origin);
      } catch {
        // ignore
      }
    };

    const onMessage = async (ev: MessageEvent<any>) => {
      if (!isAllowedOrigin(ev.origin)) return;

      const msg = ev.data as CtrlReq;
      if (
        !msg ||
        msg.type !== 'SSE_CTRL' ||
        msg.v !== 1 ||
        !msg.id ||
        !msg.action
      )
        return;

      const replyOk = (result?: any) =>
        postAck(ev.source as Window | null, ev.origin, {
          type: 'SSE_CTRL_ACK',
          v: 1,
          id: msg.id,
          status: 'OK',
          result,
        });

      const replyErr = (code: string, message: string) =>
        postAck(ev.source as Window | null, ev.origin, {
          type: 'SSE_CTRL_ACK',
          v: 1,
          id: msg.id,
          status: 'ERR',
          error: { code, message },
        });

      try {
        if (msg.action === 'GET_STATE') {
          replyOk({ ready: true, activePeriod: getPeriod() });
          return;
        }

        if (msg.action === 'SET_PERIOD') {
          const period = msg.payload?.period;
          if (!period) {
            replyErr('BAD_PAYLOAD', 'period is required');
            return;
          }

          // Prefer clicking the actual button so existing UI logic runs
          const btn = root.querySelector<HTMLElement>(
            `.kpi-toggle-btn[data-type="${period}"]`,
          );
          if (!btn) {
            replyErr('NOT_FOUND', `period button not found: ${period}`);
            return;
          }

          btn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
          const cur = getPeriod() || 'week';
          replyOk({ ready: true, activePeriod: cur });
          return;
        }
        if (msg.action === 'CLICK_TAB') {
          // EDITED2026
          const raw = (msg.payload?.label ?? '').toString();
          const label = raw.replace(/\s+/g, ' ').trim();
          if (!label) {
            replyErr('BAD_PAYLOAD', 'label is required');
            return;
          }

          const norm = (s: string) =>
            s.replace(/\s+/g, ' ').trim().toLowerCase();

          // NOTE: root = контейнер вашего чарта. Если вкладки вне root — используйте document вместо root.
          const tabs = Array.from(
            document.querySelectorAll<HTMLElement>('[role="tab"]'),
          );
          const target = tabs.find(
            t => norm(t.textContent || '') === norm(label),
          );

          if (!target) {
            replyErr('NOT_FOUND', `tab not found by label: ${label}`);
            return;
          }

          target.click();
          replyOk({ clicked: true, label, tabId: target.id || '' });
          return;
        }
        if (msg.action === 'CLICK_LINK') {
          // EDITED2026
          const linkId = (msg.payload?.linkId || '').toString().trim();
          if (!linkId) {
            replyErr('BAD_PAYLOAD', 'linkId is required');
            return;
          }

          // Find by DOM id: <a id="...">
          const sel = `a#${cssEscape(linkId)}`;
          const a = root.querySelector<HTMLAnchorElement>(sel);
          if (!a) {
            replyErr('NOT_FOUND', `link not found by id: ${linkId}`);
            return;
          }

          // Use native click() so default actions (navigation) work if not prevented
          a.click();
          replyOk({
            clicked: true,
            linkId,
            href: a.getAttribute('href') || '',
          });
          return;
        }

        replyErr('BAD_ACTION', `Unknown action: ${String(msg.action)}`);
      } catch (e: any) {
        replyErr('FAIL', String(e?.message || e));
      }
    };

    // Initial apply on mount
    syncPeriodButtons();
    applyPeriodColumns();
    applyCategoryFilter();
    realizeAutoIframes();

    root.addEventListener('click', onClick);
    window.addEventListener('message', onMessage); // EDITED2026

    // eslint-disable-next-line consistent-return
    return () => {
      root.removeEventListener('click', onClick);
      window.removeEventListener('message', onMessage); // EDITED2026
    };
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
