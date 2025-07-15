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
}

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
  // All SVGs: blue neon rect, white text, same color for all
  let abbr = '';
  switch (division) {
    case 'Алюминий':
      abbr = 'Al';
      break;
    case 'Железо':
      abbr = 'Fe';
      break;
    case 'Хром':
      abbr = 'Cr';
      break;
    case 'Уголь':
      abbr = 'C';
      break;
    case 'Энергетика':
      abbr = 'E';
      break;
    default:
      abbr = '';
  }
  return `<svg class="division-svg" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" fill="#ef960f" />
    <text x="12" y="16" font-size="9" text-anchor="middle" fill="#fff" font-family="SF Pro Display, Arial, sans-serif" font-weight="bold">${abbr}</text>
  </svg>`;
});

Handlebars.registerHelper('redflag', function (value) {
  // Convert value to number (handle comma as decimal separator)
  const num = parseFloat(
    String(value)
      .replace('.', ',')
      .replace(/[^\d.-]/g, ''),
  );

  if (!Number.isNaN(num) && num > 0) {
    // SVG for a straight red flag
    return `<span class="red-flag" style="display:flex;justify-content:center;align-items:center;height:1.5em;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="1em" height="1em" style="display:block;">
          <rect x="6" y="4" width="2" height="40" fill="#B0B0BC" />
          <circle cx="7" cy="6" r="2" fill="#B0B0BC" />
          <path d="M8 6 L20 6 L20 16 L8 16 Z" fill="#e53935" />
        </svg>
      </span>`;
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
  return now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
});

Handlebars.registerHelper('yesterday', function () {
  const now = new Date();
  now.setDate(now.getDate() - 1);
  return now.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
});

Handlebars.registerHelper('curmonthshort', function () {
  const now = new Date();
  const month = now
    .toLocaleDateString('ru-RU', { month: 'short' })
    .replace('.', '');
  return month.charAt(0).toUpperCase() + month.slice(1, 3);
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
