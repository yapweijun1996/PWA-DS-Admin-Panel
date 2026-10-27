// Pure message matcher: exact source text first, then `{name}` templates. Used by the DOM localizer.
// Templates compile once; captured values are localized recursively (up to three levels) so `{month} · Customers: {n}` and nested dates work.
const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Reserved placeholder names only match their own shape (dates, numbers), so such templates cannot swallow ordinary sentences;
// free placeholders never span a sentence boundary (". "); {code}/{code2} captures stay verbatim, any other free capture must translate.
const names = list => `(?:${list.join('|')})`;
const numberWords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const numeric = `(?:\\d[\\d,.]*(?:%|px|ms|s|em|rem|KB|MB)?|${[...numberWords, ...numberWords.map(word => word[0].toUpperCase() + word.slice(1))].join('|')})`;
const typed = {
  ...Object.fromEntries(['count', 'n', 'total', 'percent', 'number', 'seconds', 'size', 'index', 'position', 'step'].map(name => [name, numeric])),
  class: '\\d{1,2}[A-Z]',
  day: '\\d{1,2}', year: '\\d{4}', time: '\\d{1,2}:\\d{2}',
  month: names(['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']),
  weekday: names(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']),
};

// Chinese glued to an English word (a template filled with a data label) reads better with a space between them.
export function spaceLatin(text) {
  return text.replace(/([A-Za-z])(?=[\u3400-\u9fff])/g, '$1 ').replace(/([\u3400-\u9fff])(?=[A-Za-z])/g, '$1 ');
}

export function createMatcher(messages, { strict = true, keep = [] } = {}) {
  const kept = new Set(keep);
  let depth = 0;
  const templates = Object.keys(messages)
    .filter(key => /\{\w+\}/.test(key))
    .map(key => {
      const placeholders = [];
      const source = escapeRegExp(key).replace(/\\\{(\w+)\\\}/g, (match, name) => { placeholders.push(name); return `(${typed[name.replace(/\d+$/, '')] ?? '(?:(?!\\.\\s)[\\s\\S])+?'})`; });
      const literal = key.replace(/\{\w+\}/g, '');
      return { key, names: placeholders, pattern: new RegExp(`^${source}$`, 's'), weight: literal.length, loose: placeholders.every(name => !typed[name.replace(/\d+$/, '')]) && (literal.match(/[A-Za-z]/g) || []).length < 2 };
    })
    .filter(template => !template.loose)
    .sort((a, b) => b.weight - a.weight);
  const cache = new Map();
  function translate(text) {
    const match = /^(\s*)([\s\S]*?)(\s*)$/.exec(text);
    const key = match[2].replace(/\s+/g, ' ');
    if (!key) return text;
    let result = cache.get(key);
    if (result === undefined) {
      result = messages[key];
      if (result === undefined) {
        for (const template of templates) {
          const found = template.pattern.exec(key);
          if (!found) continue;
          depth += 1;
          const values = Object.fromEntries(template.names.map((name, index) => [name, depth > 3 ? found[index + 1] : translate(found[index + 1])]));
          depth -= 1;
          // A free placeholder must end up translated, or hold code/a proper noun; leftover English prose would produce mixed-language text.
          const prose = template.names.some((name, index) => !/^code\d*$/.test(name) && !typed[name.replace(/\d+$/, '')] && values[name] === found[index + 1] && !kept.has(found[index + 1]) && /(?<![\w-]|\w\.)[a-z]{3,}(?![\w-]|\.\w)/.test(found[index + 1]));
          if (strict && prose) continue;
          result = spaceLatin(messages[template.key].replace(/\{(\w+)\}/g, (placeholder, name) => (name in values ? values[name] : placeholder)));
          break;
        }
      }
      cache.set(key, result ?? null);
    }
    return result == null ? text : `${match[1]}${result}${match[3]}`;
  }
  return { translate };
}
