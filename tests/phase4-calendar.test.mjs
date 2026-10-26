import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDays, placeCalendarEvents, shiftCalendarDate, calendarKeyDate } from '../js/logic/calendar.js';
import { addDays, calendarGrid } from '../js/logic/date.js';

test('month view reuses the six-week date picker grid and locale boundaries', () => {
  for (const locale of ['en-GB', 'en-US', 'ar-EG']) {
    assert.deepEqual(calendarDays('2026-10-26', { locale }), calendarGrid('2026-10-26', { locale }));
  }
  assert.equal(calendarDays('2026-10-26')[0].date, '2026-09-28');
  assert.equal(calendarDays('2026-10-26').at(-1).date, '2026-11-08');
  assert.deepEqual(calendarDays('invalid'), []);
});

test('week view crosses month and year boundaries without time-zone arithmetic', () => {
  const days = calendarDays('2026-12-31', { view: 'week', locale: 'en-GB' });
  assert.equal(days.length, 7);
  assert.equal(days[0].date, '2026-12-28');
  assert.equal(days.at(-1).date, '2027-01-03');
  assert.equal(days.at(-1).inMonth, false);
  for (let index = 1; index < days.length; index += 1) assert.equal(days[index].date, addDays(days[index - 1].date, 1));
  assert.equal(calendarDays('2026-11-01', { view: 'week', locale: 'en-US' })[0].date, '2026-11-01');
  assert.equal(calendarDays('2026-11-01', { view: 'week', locale: 'en-GB' })[0].date, '2026-10-26');
  assert.equal(calendarDays('2026-11-01', { view: 'week', locale: 'ar-EG' })[0].date, '2026-10-31');
});

test('month event placement includes adjacent-month cells and excludes out-of-grid events', () => {
  const events = [
    { id: 'before', title: 'Before', date: '2026-09-27' },
    { id: 'start', title: 'Start', date: '2026-09-28' },
    { id: 'month', title: 'In month', date: '2026-10-26', time: '23:30' },
    { id: 'end', title: 'End', date: '2026-11-08' },
    { id: 'after', title: 'After', date: '2026-11-09' },
    { id: 'bad', title: 'Invalid', date: '2026-02-30' }
  ];
  const days = placeCalendarEvents('2026-10-26', { events });
  assert.deepEqual(days.flatMap(day => day.events.map(event => event.id)), ['start', 'month', 'end']);
  assert.equal(days.find(day => day.date === '2026-10-26').events[0], events[2]);
  assert.equal(days.find(day => day.date === '2026-10-27').events.length, 0);
  assert.equal(events.length, 6);
});

test('week event placement includes both endpoints across a year and excludes neighbors', () => {
  const events = ['2026-12-27', '2026-12-28', '2026-12-31', '2027-01-03', '2027-01-04'].map(date => ({ id: date, title: date, date }));
  const days = placeCalendarEvents('2026-12-31', { view: 'week', events });
  assert.deepEqual(days.flatMap(day => day.events.map(event => event.id)), ['2026-12-28', '2026-12-31', '2027-01-03']);
  assert.equal(days[0].events[0].date, '2026-12-28');
  assert.equal(days.at(-1).events[0].date, '2027-01-03');
});

test('events stay on their ISO day, all-day first, then stable chronological HH:mm time', () => {
  const events = [
    { id: 1, title: 'Late', date: '2026-10-26', time: '23:30' },
    { id: 2, title: 'All day', date: '2026-10-26' },
    { id: 3, title: 'Morning', date: '2026-10-26', time: '08:00' },
    { id: 4, title: 'Also morning', date: '2026-10-26', time: '08:00' }
  ];
  const snapshot = JSON.stringify(events);
  assert.deepEqual(placeCalendarEvents('2026-10-26', { events }).find(day => day.date === '2026-10-26').events.map(event => event.id), [2, 3, 4, 1]);
  assert.equal(JSON.stringify(events), snapshot);
  assert.deepEqual(placeCalendarEvents('invalid', { events }), []);
});

test('previous and next periods clamp month days and move whole weeks', () => {
  assert.equal(shiftCalendarDate('2024-01-31', 1), '2024-02-29');
  assert.equal(shiftCalendarDate('2026-01-31', 1), '2026-02-28');
  assert.equal(shiftCalendarDate('2026-12-31', 1, 'week'), '2027-01-07');
  assert.equal(shiftCalendarDate('2026-01-01', -1, 'week'), '2025-12-25');
  assert.equal(shiftCalendarDate('9999-12-31', 1), null);
});

test('day keyboard navigation uses locale week ends and the active view period', () => {
  assert.equal(calendarKeyDate('2026-10-26', 'ArrowLeft'), '2026-10-25');
  assert.equal(calendarKeyDate('2026-10-31', 'ArrowRight'), '2026-11-01');
  assert.equal(calendarKeyDate('2026-10-26', 'ArrowUp'), '2026-10-19');
  assert.equal(calendarKeyDate('2026-10-26', 'ArrowDown'), '2026-11-02');
  assert.equal(calendarKeyDate('2026-10-28', 'Home'), '2026-10-26');
  assert.equal(calendarKeyDate('2026-10-28', 'End'), '2026-11-01');
  assert.equal(calendarKeyDate('2026-10-28', 'Home', { locale: 'en-US' }), '2026-10-25');
  assert.equal(calendarKeyDate('2026-10-28', 'End', { locale: 'en-US' }), '2026-10-31');
  assert.equal(calendarKeyDate('2026-10-31', 'PageDown'), '2026-11-30');
  assert.equal(calendarKeyDate('2026-10-31', 'PageUp', { view: 'week' }), '2026-10-24');
  assert.equal(calendarKeyDate('2024-02-29', 'PageDown', { shiftKey: true }), '2025-02-28');
  assert.equal(calendarKeyDate('2026-10-26', 'Enter'), null);
  assert.equal(calendarKeyDate('invalid', 'ArrowRight'), null);
});

test('supported date boundaries retain the active week and never place events on null cells', () => {
  for (const date of ['0001-01-01', '9999-12-31']) {
    const days = placeCalendarEvents(date, { view: 'week', locale: 'en-US', events: [{ id: 'edge', title: 'Edge', date }] });
    assert.equal(days.length, 7);
    assert.equal(days.find(day => day.date === date).events.length, 1);
    assert.ok(days.filter(day => day.date === null).every(day => day.disabled && day.events.length === 0));
  }
  assert.equal(calendarKeyDate('0001-01-01', 'ArrowLeft'), null);
  assert.equal(calendarKeyDate('9999-12-31', 'ArrowRight'), null);
});
