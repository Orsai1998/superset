import Handlebars from 'handlebars';

// @ts-ignore
export function registerCustomHelpers() {
  // put ABOVE template compile
  const norm = (v: any) =>
    String(v ?? '')
      .replace(/\r\n/g, '\n') // Windows -> \n
      .replace(/\r/g, '\n') // old Mac -> \n
      .replace(/\u00A0/g, ' ') // NBSP -> space
      .replace(/[\u200B-\u200D\uFEFF]/g, '') // zero-width
      .trim();

  Handlebars.registerHelper('groupBy', function (items, fieldName, options) {
    const grouped = {};
    items.forEach((item: { [x: string]: any }) => {
      const key = item[fieldName];
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    });
    // Return as array of objects for easier use in template
    return Object.keys(grouped).map(key => ({
      group: key,
      rows: grouped[key],
    }));
  });
  Handlebars.registerHelper('json', function (context) {
    return JSON.stringify(context, null, 2);
  });

  Handlebars.registerHelper('divisionClass', function (division) {
    switch (division) {
      case 'Алюминий':
        return 'al';
      case 'Железо':
        return 'fe';
      case 'Хром':
        return 'cr';
      case 'Уголь':
        return 'c';
      case 'Энергетика':
        return 'e';
      default:
        return 'xx';
    }
  });

  Handlebars.registerHelper('divisionSvg', function (division) {
    const normalized = String(division)
      .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
      .trim()
      .toLowerCase()
      .replace(/^["']+|["']+$/g, '');
    const map = {
      алюминий: 'Al',
      железо: 'Fe',
      хром: 'Cr',
      уголь: 'C',
      энергетика: 'E',
    };

    const abbr = map[normalized] || '??';
    return abbr;
  });

  Handlebars.registerHelper('redflag', function (value) {
    let num;
    if (typeof value === 'number') {
      num = value;
    } else if (typeof value === 'string') {
      // Replace comma with dot for decimal, remove spaces, then parse
      num = parseFloat(
        value
          .replace(',', '.')
          .replace(/\s/g, '')
          .replace(/[^\d.-]/g, ''),
      );
    } else {
      num = NaN;
    }
    if (!Number.isNaN(num) && num > 0) {
      return '<span><img src="/static/assets/images/rflag.svg" width="20" height="16"/></span>';
    }
    return '';
  });

  Handlebars.registerHelper('splitlines', function (text) {
    if (!text) return [];
    return text.split('\n');
  });

  Handlebars.registerHelper('colorArrows', function (line) {
    if (!line) return '';
    return line
      .replace(/▲/g, '<span class="arrow up">▲</span>')
      .replace(/▼/g, '<span class="arrow down">▼</span>');
  });

  Handlebars.registerHelper('today', function () {
    const now = new Date();
    return now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  });

  Handlebars.registerHelper('yesterday', function () {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    return now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  });

  Handlebars.registerHelper('curmonthshort', function () {
    const now = new Date();
    const month = now
      .toLocaleDateString('ru-RU', { month: 'short' })
      .replace('.', '');
    return month.charAt(0).toUpperCase() + month.slice(1, 3);
  });

  Handlebars.registerHelper('kpiToggleButtons', function () {
    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentYear = now.getFullYear();
    const displayYear = currentMonth <= 1 ? currentYear - 1 : currentYear;

    return `<div class="smypkpi-toggle-buttons">
      <button type="button" class="kpi-toggle-btn" data-type="day" id="btn-day">День</button>
      <button type="button" class="kpi-toggle-btn" data-type="week" id="btn-week">Неделя</button>
      <button type="button" class="kpi-toggle-btn" data-type="mnth" id="btn-mnth">Месяц</button>
      <button type="button" class="kpi-toggle-btn" data-type="year" id="btn-year">${displayYear}</button>
    </div>`;
  });

  Handlebars.registerHelper('categoryButtons', function () {
    return new Handlebars.SafeString(`
    <div class="smypki-refresh-buttons">
      <button type="button" class="smypki-refresh-btn" data-cat="bp">БП</button>
      <button type="button" class="smypki-refresh-btn" data-cat="op">ОП</button>
      <button type="button" class="smypki-refresh-btn" data-cat="ps">ПС</button>
    </div>
  `);
  });
  Handlebars.registerHelper('parseDay', function (day, divisionClass) {
    if (!day) return [];
    // Map cyrillic to latin for class
    const typeMap = {
      БП: 'bp',
      ОП: 'op',
      ПС: 'ps',
      Ф: 'f',
    };
    // Split by line, filter empty
    return day
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line: string) => {
        let type = '';
        let label = '';
        // Try to extract type
        const match = line.match(/(БП|ОП|ПС|Ф):/);
        if (match) {
          type = typeMap[match[1]] || '';
          label = match[1];
        } else if (line.trim().startsWith('Ф:')) {
          type = 'f';
          label = 'Ф';
        }
        // Compose class: division-type
        const divClass = typeof divisionClass === 'string' ? divisionClass : '';
        return {
          type,
          label,
          value: line,
          divisionClass: divClass ? `${divClass}-${type}` : type,
        };
      });
  });
  Handlebars.registerHelper('stringify', function (context: any) {
    return JSON.stringify(context);
  });

  function toVals(v: any[] | null) {
    const strip = (s: any) =>
      String(s)
        .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
        .trim();
    if (Array.isArray(v)) return v.map(strip).filter(Boolean);
    if (v == null) return [];
    return String(v).split(',').map(strip).filter(Boolean); // "Хром,Алюминий" -> ["Хром","Алюминий"]
  }

  // Возвращает src/href для EMBEDDED CHART (Explore) с фильтрами
  Handlebars.registerHelper('createUrl', function (options) {
    const sliceId = String(options.hash.slice_id); // ← ТОЛЬКО slice_id
    const column = String(options.hash.filter_col); // ← column_name в датасете (не лейбл)
    const valuesArr = toVals(options.hash.filter_col_val); // ← строка или массив
    const height = options.hash.height ? String(options.hash.height) : '100%';

    // const filter = {
    //   clause: 'WHERE',
    //   expressionType: 'SIMPLE',
    //   subject: column,          // tech column_name
    //   operator: 'IN',
    //   comparator: valuesArr,    // ["Хром","Алюминий"]
    // };

    // const formData = {
    //   force: true,                       // игнорировать сохранённые фильтры
    //   adhoc_filters: [filter],           // для совместимости
    //   extra_form_data: {
    //     override_form_data: {
    //       adhoc_filters: [filter],       // гарантированно переопределяет
    //       filters: [{ col: column, op: 'IN', val: valuesArr }],
    //     },
    //   },
    // };

    const base = `${window.location.origin}/superset/explore/`;
    const url =
      `${base}?slice_id=${encodeURIComponent(sliceId)}` +
      `&standalone=1&force=1&&height=${encodeURIComponent(height)}` +
      `&${column}=${valuesArr}`; // ${encodeURIComponent(JSON.stringify(valuesArr))}`
    // + `&form_data=${encodeURIComponent(JSON.stringify(formData))}`;

    return new Handlebars.SafeString(url);
  });

  // Helper: parse values from string/array to array of strings
  Handlebars.registerHelper('origin', () =>
    typeof window !== 'undefined' ? window.location.origin : '',
  );
  Handlebars.registerHelper('thisIsDash', function (value) {
    return value === '-';
  });

  Handlebars.registerHelper('eq', (a, b) => norm(a) === norm(b));
  Handlebars.registerHelper('notEq', (a, b) => norm(a) !== norm(b));

  Handlebars.registerHelper('parseDayQL', function (day, divisionClass) {
    if (!day) return [];

    const typeMap = {
      БП: 'bp',
      ОП: 'op',
      ПС: 'ps',
      П: 'ps',
      Ф: 'f',
    };

    const divClass = typeof divisionClass === 'string' ? divisionClass : '';
    const results = [];

    // Normalize line endings, handle stray carriage returns (\r)
    const lines = day
      .replace(/\r/g, '')
      .split(/\n/)
      .filter((line: string) => line.trim() !== '');

    // Regex patterns
    const arrowRegex = /^(▲|▼)-?\d+%$/;
    const valueRegex = /^(БП|ОП|ПС|П|Ф):(.+)$/;

    for (const line of lines) {
      const trimmed = line.trim();

      // Arrow line (e.g. ▼-1%)
      if (arrowRegex.test(trimmed)) {
        const symbol = trimmed.charAt(0); // '▲' or '▼'
        const direction = symbol === '▲' ? 'up' : 'down';
        const percent = trimmed.slice(1); // e.g. "-1%"

        results.push({
          type: 'ps',
          label: '',
          value: trimmed,
          arrowSymbol: symbol,
          arrowDirection: direction,
          arrowValue: percent,
          divisionClass: 'ps',
        });
        continue;
      }

      // Value line like "П:71 - 100" or "Ф:69,94"
      const match = trimmed.match(valueRegex);
      if (match) {
        const [_, label, rawValue] = match;
        const type = typeMap[label] || '';
        const value = `${label}:${rawValue.trim()}`;

        results.push({
          type,
          label,
          value,
          change: null,
          divisionClass: divClass ? `${divClass}-${type}` : type,
        });
        continue;
      }

      // Unknown or free text line (optional)
      results.push({
        type: 'ps',
        label: '',
        value: trimmed,
        change: null,
        divisionClass: 'ps',
      });
    }

    return results;
  });
  Handlebars.registerHelper('splitProds', function (value) {
    if (Array.isArray(value)) return value.slice(0, 3);
    if (value == null) return [];
    const s = String(value);
    // split by comma or whitespace, trim, dedupe, cap 3
    const arr = s
      .split(/[,\s]+/)
      .map(v => v.trim())
      .filter(Boolean);
    const seen = new Set<string>();
    const out: string[] = [];
    for (const v of arr) {
      if (!seen.has(v)) {
        out.push(v);
        seen.add(v);
      }
      if (out.length >= 8) break;
    }
    return out;
  });

  // Turn anything into an array of strings (comma/semicolon separated supported)
  function toValsAny(v: string | any[] | null) {
    if (v == null) {
      // @ts-ignore
      return [];
    }
    if (Array.isArray(v))
      return v
        .map(String)
        .map(s => s.trim())
        .filter(Boolean);
    const s = String(v).trim();
    if (!s) return [];
    return s
      .split(/[;,]/)
      .map(x => x.trim())
      .filter(Boolean);
  }

  // Resolve "foo", "a.b.c", or "{{a.b.c}}" against current context/root
  function resolvePathLike(raw: string | null, ctx: any, root: any) {
    if (raw == null) return '';
    let t = String(raw).trim();
    // if quoted, strip surrounding quotes
    t = t.replace(/^['"]|['"]$/g, '');
    // strip {{ }}
    t = t.replace(/^\{\{|\}\}$/g, '');
    if (!t) return '';

    let base = ctx;
    if (t.startsWith('root.')) {
      base = root;
      t = t.slice(5);
    }

    let cur = base;
    for (const k of t.split('.')) {
      if (!k || k === 'this') continue;
      if (cur != null && k in cur) cur = cur[k];
      else return raw; // fallback to original literal if not found
    }
    return cur;
  }

  Handlebars.registerHelper('createUrlDash', options => {
    const target = String(options.hash.target || '').trim(); // 'dash' | 'object'
    const standalone =
      options.hash.standalone != null
        ? String(options.hash.standalone).trim()
        : '1';
    const height = options.hash.height
      ? String(options.hash.height).trim()
      : '100%';

    // filters
    const col0 = String(options.hash.filter_col || '').trim();
    let val0 = options.hash.filter_val;

    const col1 = String(options.hash.filter_col1 || '').trim();
    let val1 = options.hash.filter_val1;

    const col2 = String(options.hash.filter_col2 || '').trim();
    let val2 = options.hash.filter_val2;

    // raw extra params (may contain variables)
    let many = (options.hash.manyparams ?? '').toString().trim();
    if (many.startsWith('?') || many.startsWith('&')) many = many.slice(1);

    const { origin } = window.location;
    // @ts-ignore
    const root = options.data?.root || this;
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const ctx = this;

    // If a filter value is a single token/path, resolve it; otherwise treat as list
    function normalizeVals(v: any[]) {
      if (Array.isArray(v)) return v.map(x => String(x));
      const s = String(v ?? '').trim();
      if (!s) return [];
      // single token case -> resolve
      if (!s.includes(',') && !s.includes(';')) {
        const resolved = resolvePathLike(s, ctx, root);
        return toValsAny(resolved);
      }
      // comma/semicolon list -> keep as literals
      return toValsAny(s);
    }

    const filters = [];
    val0 = normalizeVals(val0);
    if (col0 && val0.length) filters.push({ col: col0, vals: val0 });
    val1 = normalizeVals(val1);
    if (col1 && val1.length) filters.push({ col: col1, vals: val1 });
    val2 = normalizeVals(val2);
    if (col2 && val2.length) filters.push({ col: col2, vals: val2 });

    // Build query
    const qp = [
      `standalone=${encodeURIComponent(standalone)}`,
      `force=1`,
      `height=${encodeURIComponent(height)}`,
    ];

    for (const f of filters) {
      qp.push(
        `${encodeURIComponent(f.col)}=${f.vals
          .map(encodeURIComponent)
          .join(',')}`,
      );
    }

    // Resolve variables inside manyparams
    if (many) {
      const extra = Array.isArray(many)
        ? many // If 'many' is an array, process it directly
        : many.split('&').filter(Boolean); // If 'many' is a string, split it by '&'
      const queryString = extra
        .map((pair: string) => {
          const i = pair.indexOf('=');
          const key = i === -1 ? pair : pair.slice(0, i);
          const rawVal = i === -1 ? '' : pair.slice(i + 1);
          const resolved = resolvePathLike(rawVal, ctx, root);
          // @ts-ignore
          return `${encodeURIComponent(key)}=${encodeURIComponent(resolved)}`;
        })
        .join('&');

      if (queryString) qp.push(queryString);
    }

    // Need at least one filter or manyparams to build
    if (!filters.length && !many) return '';

    let url;
    if (target === 'dash') {
      const dashId = String(options.hash.dash_id || '').trim();
      if (!dashId) return '';
      url = `${origin}/superset/dashboard/${encodeURIComponent(
        dashId,
      )}/?${qp.join('&')}`;
    } else {
      const sliceId = String(options.hash.slice_id || '').trim();
      if (!sliceId) return '';
      url = `${origin}/superset/explore/?slice_id=${encodeURIComponent(
        sliceId,
      )}&${qp.join('&')}`;
    }

    return new Handlebars.SafeString(url);
  });
}
