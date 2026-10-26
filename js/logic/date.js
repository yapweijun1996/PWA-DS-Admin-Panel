// Date-only values use ISO strings and UTC arithmetic, never the host time zone.
export function parseISODate(value) {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText), month = Number(monthText), day = Number(dayText);
  if (year < 1 || month < 1 || month > 12 || day < 1 || day > daysInMonth(year, month)) return null;
  return { year, month, day };
}

export function daysInMonth(year, month) {
  if (!Number.isInteger(year) || year < 1 || year > 9999 || !Number.isInteger(month) || month < 1 || month > 12) return 0;
  if (month === 2) return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

export function formatISODate({ year, month, day } = {}) {
  if (![year, month, day].every(Number.isInteger)) return null;
  const value = `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return parseISODate(value) ? value : null;
}

function utcDate(parts) {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  return date;
}

function fromUTCDate(date) {
  return formatISODate({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() });
}

export function addDays(value, amount) {
  const parts = parseISODate(value);
  if (!parts || !Number.isInteger(amount)) return null;
  const date = utcDate(parts);
  date.setUTCDate(date.getUTCDate() + amount);
  return fromUTCDate(date);
}

export function addMonths(value, amount) {
  const parts = parseISODate(value);
  if (!parts || !Number.isInteger(amount)) return null;
  const total = parts.year * 12 + parts.month - 1 + amount;
  const year = Math.floor(total / 12), month = ((total % 12) + 12) % 12 + 1;
  return formatISODate({ year, month, day: Math.min(parts.day, daysInMonth(year, month)) });
}

export function getWeekday(value) {
  const parts = parseISODate(value);
  return parts ? utcDate(parts).getUTCDay() : null;
}

// Return the JavaScript weekday index: Sunday = 0, Monday = 1.
export function getWeekStart(locale = 'en-US') {
  const language = new Intl.Locale(locale);
  const info = typeof language.getWeekInfo === 'function' ? language.getWeekInfo() : language.weekInfo;
  if (info) return info.firstDay % 7;
  // Older engines without weekInfo still support the primary regional conventions.
  const region = language.region || language.maximize().region;
  if (region === 'MV') return 5;
  if (['AF', 'BH', 'DJ', 'DZ', 'EG', 'IQ', 'IR', 'JO', 'KW', 'LY', 'OM', 'QA', 'SD', 'SY'].includes(region)) return 6;
  return ['AG', 'AS', 'BD', 'BR', 'BS', 'BT', 'BW', 'BZ', 'CA', 'CO', 'DM', 'DO', 'ET', 'GT', 'GU', 'HK', 'HN', 'ID', 'IL', 'IN', 'JM', 'JP', 'KE', 'KH', 'KR', 'LA', 'MH', 'MM', 'MO', 'MT', 'MX', 'MZ', 'NI', 'NP', 'PA', 'PE', 'PH', 'PK', 'PR', 'PT', 'PY', 'SA', 'SG', 'SV', 'TH', 'TT', 'TW', 'UM', 'US', 'VE', 'VI', 'WS', 'YE', 'ZA', 'ZW'].includes(region) ? 0 : 1;
}

function weekStart(options) {
  return Number.isInteger(options.weekStartsOn) && options.weekStartsOn >= 0 && options.weekStartsOn <= 6
    ? options.weekStartsOn : getWeekStart(options.locale);
}

export function startOfWeek(value, options = {}) {
  const weekday = getWeekday(value);
  return weekday === null ? null : addDays(value, -((weekday - weekStart(options) + 7) % 7));
}

export function isDateDisabled(value, { min, max, disabledDates = [] } = {}) {
  if (!parseISODate(value)) return true;
  if (parseISODate(min) && value < min) return true;
  if (parseISODate(max) && value > max) return true;
  if (typeof disabledDates === 'function') return Boolean(disabledDates(value));
  return disabledDates instanceof Set ? disabledDates.has(value) : disabledDates.includes(value);
}

// Six complete weeks keep calendar height stable while navigating months.
export function calendarGrid(value, options = {}) {
  const parts = parseISODate(value);
  if (!parts) return [];
  const first = formatISODate({ ...parts, day: 1 });
  const offset = (getWeekday(first) - weekStart(options) + 7) % 7;
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(first, index - offset);
    const cell = parseISODate(date);
    return { date, day: cell?.day ?? null, inMonth: cell?.month === parts.month && cell?.year === parts.year, disabled: isDateDisabled(date, options) };
  });
}
