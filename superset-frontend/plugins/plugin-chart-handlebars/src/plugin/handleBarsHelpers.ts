import Handlebars from 'handlebars';

export function registerCustomHelpers() {
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
      'алюминий': 'Al',
      'железо': 'Fe',
      'хром': 'Cr',
      'уголь': 'C',
      'энергетика': 'E',
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
    return `<div class="smypkpi-toggle-buttons">
      <button type="button" class="kpi-toggle-btn" data-type="day" id="btn-day">День</button>
      <button type="button" class="kpi-toggle-btn" data-type="week" id="btn-week">Неделя</button>
      <button type="button" class="kpi-toggle-btn" data-type="mnth" id="btn-mnth">Месяц</button>
      <button type="button" class="kpi-toggle-btn" data-type="year" id="btn-year">Год</button>
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
}
