import { parseISODate, calendarGrid, startOfWeek, addDays, addMonths, getWeekday, getWeekStart } from './date.js';

// Keep event placement date-only: a time label never changes an event's ISO day.
export function calendarDays(date, { view = 'month', locale = 'en-GB' } = {}) {
  if (!parseISODate(date)) return [];
  if (view !== 'week') return calendarGrid(date, { locale });
  const start = startOfWeek(date, { locale });
  const offset = (getWeekday(date) - getWeekStart(locale) + 7) % 7;
  return Array.from({ length: 7 }, (_, index) => {
    const value = start ? addDays(start, index) : addDays(date, index - offset);
    const parts = parseISODate(value);
    return { date: value, day: parts?.day ?? null, inMonth: value?.slice(0, 7) === date.slice(0, 7), disabled: !parts };
  });
}

export function placeCalendarEvents(date, { view = 'month', locale = 'en-GB', events = [] } = {}) {
  const days = calendarDays(date, { view, locale }).map(day => ({ ...day, events: [] }));
  const byDate = new Map(days.filter(day => day.date).map(day => [day.date, day]));
  for (const event of events) {
    if (event && parseISODate(event.date)) byDate.get(event.date)?.events.push(event);
  }
  for (const day of days) day.events.sort((left, right) => String(left.time || '').localeCompare(String(right.time || '')));
  return days;
}

export function shiftCalendarDate(date, direction, view = 'month') {
  return view === 'week' ? addDays(date, direction * 7) : addMonths(date, direction);
}

export function calendarKeyDate(date, key, { view = 'month', locale = 'en-GB', shiftKey = false } = {}) {
  if (!parseISODate(date)) return null;
  const days = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  if (Object.hasOwn(days, key)) return addDays(date, days[key]);
  const offset = (getWeekday(date) - getWeekStart(locale) + 7) % 7;
  if (key === 'Home') return addDays(date, -offset);
  if (key === 'End') return addDays(date, 6 - offset);
  if (key === 'PageUp' || key === 'PageDown') {
    const direction = key === 'PageUp' ? -1 : 1;
    return shiftKey ? addMonths(date, direction * 12) : shiftCalendarDate(date, direction, view);
  }
  return null;
}
