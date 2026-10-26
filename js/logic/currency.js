import { parseNumber } from './number.js';

export function formatCurrency(value, { locale = 'en-US', currency = 'USD', ...options } = {}) {
  const number = parseNumber(value);
  return number === null ? '' : new Intl.NumberFormat(locale, { ...options, style: 'currency', currency }).format(number);
}

function clean(value) {
  return value.replace(/[\u061c\u200e\u200f]/g, '').replace(/[\u00a0\u202f]/g, ' ').trim();
}

export function parseCurrency(value, { locale = 'en-US', currency = 'USD', ...options } = {}) {
  if (typeof value === 'number') return parseNumber(value);
  if (typeof value !== 'string') return null;
  let text = clean(value);
  if (!text) return null;
  const formatter = new Intl.NumberFormat(locale, { ...options, style: 'currency', currency });
  const sample = formatter.formatToParts(-1234567890123.5);
  const decimal = sample.find(part => part.type === 'decimal')?.value
    ?? new Intl.NumberFormat(locale, { minimumFractionDigits: 1 }).formatToParts(1.1).find(part => part.type === 'decimal')?.value;
  const group = (sample.find(part => part.type === 'group')?.value || '').replace(/[\u00a0\u202f]/g, ' ');
  const minus = sample.find(part => part.type === 'minusSign')?.value || '-';
  const symbols = [...new Set([currency, ...sample.filter(part => part.type === 'currency').map(part => part.value)])].sort((a, b) => b.length - a.length);
  let negative = false;
  if (text.startsWith('(') && text.endsWith(')')) {
    negative = true;
    text = text.slice(1, -1).trim();
  }
  // Currency affixes may precede or follow the signed amount, depending on locale.
  function removeCurrency() {
    for (const symbol of symbols) {
      if (text.startsWith(symbol)) { text = text.slice(symbol.length).trim(); return true; }
      if (text.endsWith(symbol)) { text = text.slice(0, -symbol.length).trim(); return true; }
    }
    return false;
  }
  const hadCurrency = removeCurrency();
  if (text.startsWith(minus) || text.startsWith('-') || text.startsWith('+')) {
    if (negative) return null;
    negative = !text.startsWith('+');
    text = text.slice(text.startsWith(minus) ? minus.length : 1).trim();
  }
  if (!hadCurrency) removeCurrency();
  const digitFormatter = new Intl.NumberFormat(locale, { useGrouping: false });
  for (let digit = 0; digit <= 9; digit += 1) text = text.split(clean(digitFormatter.format(digit))).join(String(digit));
  const pieces = text.split(decimal);
  if (pieces.length > 2 || (pieces.length === 2 && !/^\d+$/.test(pieces[1]))) return null;
  let integer = pieces[0];
  if (group && integer.includes(group)) {
    const groups = integer.split(group);
    const sizes = sample.filter(part => part.type === 'integer').map(part => [...part.value].length);
    const primary = sizes.at(-1), secondary = sizes.at(-2) || primary;
    if (groups.length < 2 || !groups.every(part => /^\d+$/.test(part))
      || groups.at(-1).length !== primary || groups[0].length < 1 || groups[0].length > secondary
      || groups.slice(1, -1).some(part => part.length !== secondary)) return null;
    integer = groups.join('');
  }
  if (!/^\d+$/.test(integer) && !(integer === '' && pieces.length === 2)) return null;
  const number = Number(`${integer || '0'}${pieces.length === 2 ? `.${pieces[1]}` : ''}`);
  return Number.isFinite(number) ? (negative && number !== 0 ? -number : number) : null;
}
