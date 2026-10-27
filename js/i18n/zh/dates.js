// Chinese messages keyed by English source text (area: dates). Month, weekday and date-shape templates; captured parts are localized recursively.
export const keepEnglish = [];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const shortWeekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const numerals = ['一', '二', '三', '四', '五', '六', '日'];
// Day-cell labels of the calendar pickers: "{day}, {weekday}, {date}" plus optional state suffixes.
const suffixes = { '': '', ', today': '，今天', ', range start': '，范围起点', ', range end': '，范围终点', ', today, range start': '，今天，范围起点', ', today, range end': '，今天，范围终点', ', range start, range end': '，范围起点，范围终点' };
const cells = Object.fromEntries(Object.entries(suffixes).flatMap(([english, chinese]) => [
  [`{day}, {weekday}, {day2} {month} {year}${english}`, `{year}年{month}{day2}日{weekday}${chinese}`],
  [`{day}, {weekday}, {month} {day2}, {year}${english}`, `{year}年{month}{day2}日{weekday}${chinese}`],
]));
export default {
  ...cells,
  ...Object.fromEntries(months.map((name, index) => [name, `${index + 1}月`])),
  ...Object.fromEntries(shortMonths.map((name, index) => [name, `${index + 1}月`])),
  ...Object.fromEntries(weekdays.map((name, index) => [name, `星期${numerals[index]}`])),
  ...Object.fromEntries(shortWeekdays.map((name, index) => [name, `周${numerals[index]}`])),
  '{day} {month} {year}': '{year}年{month}{day}日',
  '{weekday}, {day} {month} {year}': '{year}年{month}{day}日{weekday}',
  '{month} {day}, {year}': '{year}年{month}{day}日',
  '{month} {year}': '{year}年{month}',
  '{day} {month}': '{month}{day}日',
  '{month} {day}': '{month}{day}日',
  '{weekday}, {month} {day}, {year}': '{year}年{month}{day}日{weekday}',
  '{weekday} {day} {month} {year}': '{year}年{month}{day}日{weekday}',
  '{day} {month}, {time}': '{month}{day}日 {time}',
  '{day}, {date}, {count} events': '{day}日，{date}，{count} 个事件',
  '{day}, {date}, 1 event': '{day}日，{date}，1 个事件',
  '{day}, {date}, today, {count} events': '{day}日，{date}，今天，{count} 个事件',
  '{day}, {date}, today, 1 event': '{day}日，{date}，今天，1 个事件',
  '{day}, {date}, today': '{day}日，{date}，今天',
  '{field} contains "{value}"': '{field}包含“{value}”',
  'Customer contains ""': '客户包含“”',
  '{day} {month} {year} – {day2} {month2} {year2}': '{year}年{month}{day}日至{year2}年{month2}{day2}日',
  '{month} {day}, {year} – {month2} {day2}, {year2}': '{year}年{month}{day}日至{year2}年{month2}{day2}日',
};
