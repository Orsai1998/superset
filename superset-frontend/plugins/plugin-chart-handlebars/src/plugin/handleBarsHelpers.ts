import Handlebars from 'handlebars';

export function registerCustomHelpers() {
  Handlebars.registerHelper(
    'groupByMain',
    function (items, fieldName, options) {
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
    },
  );
}
