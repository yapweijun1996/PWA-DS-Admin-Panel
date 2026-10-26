import test from 'node:test';
import assert from 'node:assert/strict';
import { parseISODate, formatISODate, daysInMonth, addDays, addMonths, getWeekday, getWeekStart, startOfWeek, isDateDisabled, calendarGrid } from '../js/logic/date.js';
import { parseNumber, decimalPlaces, roundToPrecision, clampNumber, normalizeNumber, stepNumber, isStepAligned, validateNumber } from '../js/logic/number.js';
import { formatCurrency, parseCurrency } from '../js/logic/currency.js';

test('ISO parsing rejects rollover, loose dates, timestamps and non-Gregorian leap days', () => {
  assert.deepEqual(parseISODate('2024-02-29'), { year: 2024, month: 2, day: 29 });
  assert.deepEqual(parseISODate('0001-01-01'), { year: 1, month: 1, day: 1 });
  for (const value of ['2023-02-29', '1900-02-29', '2024-04-31', '2024-00-10', '2024-13-01', '2024-01-00', '2024-2-03', '2024-01-01T00:00:00Z', ' 2024-01-01', '0000-01-01', '10000-01-01', '', null, new Date()]) {
    assert.equal(parseISODate(value), null, String(value));
  }
  assert.equal(daysInMonth(2000, 2), 29);
  assert.equal(daysInMonth(1900, 2), 28);
  assert.equal(daysInMonth(2024, 4), 30);
  assert.equal(daysInMonth(2024, 0), 0);
});

test('date formatting validates parts and preserves years before 100', () => {
  assert.equal(formatISODate({ year: 9, month: 2, day: 3 }), '0009-02-03');
  assert.equal(formatISODate({ year: 2024, month: 2, day: 30 }), null);
  assert.equal(formatISODate({ year: 2024, month: 1.5, day: 1 }), null);
  assert.equal(formatISODate(), null);
});

test('day movement crosses leap, month and year boundaries without local-time offsets', () => {
  assert.equal(addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(addDays('2024-02-29', 1), '2024-03-01');
  assert.equal(addDays('2023-03-01', -1), '2023-02-28');
  assert.equal(addDays('2023-12-31', 1), '2024-01-01');
  assert.equal(addDays('2024-01-01', -1), '2023-12-31');
  assert.equal(addDays('2024-03-09', 2), '2024-03-11');
  assert.equal(addDays('2024-11-02', 2), '2024-11-04');
  assert.equal(addDays('0099-12-31', 1), '0100-01-01');
  assert.equal(addDays('9999-12-31', 1), null);
  assert.equal(addDays('0001-01-01', -1), null);
  assert.equal(addDays('bad', 1), null);
  assert.equal(addDays('2024-01-01', 0.5), null);
});

test('month movement clamps end-of-month rather than overflowing', () => {
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
  assert.equal(addMonths('2023-01-31', 1), '2023-02-28');
  assert.equal(addMonths('2024-03-31', -1), '2024-02-29');
  assert.equal(addMonths('2024-02-29', 12), '2025-02-28');
  assert.equal(addMonths('2024-01-31', -13), '2022-12-31');
  assert.equal(addMonths('2024-12-15', 2), '2025-02-15');
  assert.equal(addMonths('0001-01-01', -1), null);
  assert.equal(addMonths('9999-12-31', 1), null);
});

test('locale week starts follow regional conventions and explicit weekday overrides', () => {
  assert.equal(getWeekStart('en-US'), 0);
  assert.equal(getWeekStart('en-GB'), 1);
  assert.equal(getWeekStart('de-DE'), 1);
  assert.equal(getWeekStart('zh-CN'), 1);
  assert.equal(getWeekStart('ar-EG'), 6);
  assert.equal(getWeekday('2024-09-01'), 0);
  assert.equal(getWeekday('invalid'), null);
  assert.equal(startOfWeek('2024-09-04', { locale: 'en-US' }), '2024-09-01');
  assert.equal(startOfWeek('2024-09-04', { locale: 'en-GB' }), '2024-09-02');
  assert.equal(startOfWeek('2024-09-04', { weekStartsOn: 6 }), '2024-08-31');
});

test('date bounds are inclusive and disabled arrays, sets and predicates share behavior', () => {
  const bounds = { min: '2024-02-10', max: '2024-02-20' };
  assert.equal(isDateDisabled('2024-02-09', bounds), true);
  assert.equal(isDateDisabled('2024-02-10', bounds), false);
  assert.equal(isDateDisabled('2024-02-20', bounds), false);
  assert.equal(isDateDisabled('2024-02-21', bounds), true);
  assert.equal(isDateDisabled('invalid', bounds), true);
  for (const disabledDates of [['2024-02-15'], new Set(['2024-02-15']), date => getWeekday(date) === 4]) {
    assert.equal(isDateDisabled('2024-02-15', { disabledDates }), true);
    assert.equal(isDateDisabled('2024-02-16', { disabledDates }), false);
  }
});

test('calendar grids contain six continuous locale-aligned weeks and actual disabled cells', () => {
  const grid = calendarGrid('2024-02-20', { locale: 'en-GB', min: '2024-02-02', max: '2024-02-28', disabledDates: ['2024-02-14'] });
  assert.equal(grid.length, 42);
  assert.equal(grid[0].date, '2024-01-29');
  assert.equal(grid.at(-1).date, '2024-03-10');
  assert.equal(grid.filter(cell => cell.inMonth).length, 29);
  assert.deepEqual(grid.find(cell => cell.date === '2024-02-14'), { date: '2024-02-14', day: 14, inMonth: true, disabled: true });
  assert.equal(grid.find(cell => cell.date === '2024-02-02').disabled, false);
  assert.equal(grid.find(cell => cell.date === '2024-02-29').disabled, true);
  for (let index = 1; index < grid.length; index += 1) assert.equal(grid[index].date, addDays(grid[index - 1].date, 1));
  assert.equal(calendarGrid('2024-09-01', { locale: 'en-US' })[0].date, '2024-09-01');
  assert.equal(calendarGrid('2024-09-01', { locale: 'en-GB' })[0].date, '2024-08-26');
  assert.equal(calendarGrid('2024-09-01', { locale: 'ar-EG' })[0].date, '2024-08-31');
  assert.deepEqual(calendarGrid('invalid'), []);
});

test('number parsing distinguishes zero and empty input and rejects numeric prefixes', () => {
  assert.equal(parseNumber(' 0 '), 0);
  assert.equal(parseNumber('-.25'), -0.25);
  assert.equal(parseNumber('1.25e2'), 125);
  for (const value of ['', ' ', null, undefined, false, '12px', '1,234', '0x10', 'Infinity', NaN, Infinity]) assert.equal(parseNumber(value), null);
});

test('decimal precision accounts for exponent notation and rounds decimal ties symmetrically', () => {
  assert.equal(decimalPlaces(1.23), 2);
  assert.equal(decimalPlaces(1e-7), 7);
  assert.equal(decimalPlaces(1.2e-7), 8);
  assert.equal(decimalPlaces(1e21), 0);
  assert.equal(roundToPrecision(1.005, 2), 1.01);
  assert.equal(roundToPrecision(2.675, 2), 2.68);
  assert.equal(roundToPrecision(-1.005, 2), -1.01);
  assert.equal(roundToPrecision(0.1 + 0.2, 2), 0.3);
  assert.equal(roundToPrecision(1.23456789e-7, 9), 0.000000123);
  assert.equal(roundToPrecision(-0.001, 2), 0);
  assert.equal(roundToPrecision('', 2), null);
  assert.throws(() => roundToPrecision(1, -1), RangeError);
  assert.throws(() => roundToPrecision(1, 16), RangeError);
});

test('normalization respects inclusive numeric bounds after precision rounding', () => {
  assert.equal(normalizeNumber('1.005', { precision: 2, min: 0, max: 10 }), 1.01);
  assert.equal(normalizeNumber(-2, { min: 0 }), 0);
  assert.equal(normalizeNumber(20, { max: 10 }), 10);
  assert.equal(normalizeNumber('', { min: 0 }), null);
  assert.equal(clampNumber(0, { min: 0, max: 0 }), 0);
  assert.throws(() => clampNumber(2, { min: 3, max: 1 }), RangeError);
});

test('stepping avoids decimal drift, respects explicit precision and stops at limits', () => {
  assert.equal(stepNumber(0.1, 1, { step: 0.2 }), 0.3);
  assert.equal(stepNumber(0.3, -1, { step: 0.1 }), 0.2);
  assert.equal(stepNumber(0, -1, { min: 0, step: 0.1 }), 0);
  assert.equal(stepNumber(0.9, 1, { max: 1, step: 0.2 }), 1);
  assert.equal(stepNumber('', 1, { min: 2, step: 0.5 }), 2.5);
  assert.equal(stepNumber(1.234, 1, { step: 0.01, precision: 2 }), 1.24);
  assert.equal(stepNumber(0.0000001, 1, { step: 0.0000002 }), 0.0000003);
  assert.throws(() => stepNumber(1, 1, { step: 0 }), RangeError);
  assert.throws(() => stepNumber(1, 1, { step: -1 }), RangeError);
});

test('number validation reports bound, precision and step errors without rounding user input', () => {
  assert.equal(isStepAligned(0.3, { step: 0.1 }), true);
  assert.equal(isStepAligned(0.35, { min: 0.05, step: 0.1 }), true);
  assert.equal(isStepAligned(0.3, { min: 0.05, step: 0.1 }), false);
  assert.equal(isStepAligned(0.31, { step: 0.1 }), false);
  assert.equal(validateNumber('', {}), 'number');
  assert.equal(validateNumber(-1, { min: 0 }), 'min');
  assert.equal(validateNumber(2, { max: 1 }), 'max');
  assert.equal(validateNumber(1.234, { precision: 2 }), 'precision');
  assert.equal(validateNumber(0.35, { step: 0.1 }), 'step');
  assert.equal(validateNumber(0.3, { min: 0, max: 0.3, precision: 2, step: 0.1 }), null);
});

test('currency formatting delegates locale separators, symbols and minor units to Intl', () => {
  assert.equal(formatCurrency(1234.5, { locale: 'en-US', currency: 'USD' }), '$1,234.50');
  assert.equal(formatCurrency(1234.5, { locale: 'de-DE', currency: 'EUR' }), '1.234,50\u00a0€');
  assert.equal(formatCurrency(1234.5, { locale: 'ja-JP', currency: 'JPY' }), '￥1,235');
  assert.equal(formatCurrency(1.234, { locale: 'en-US', currency: 'KWD' }), 'KWD\u00a01.234');
  assert.equal(formatCurrency(0), '$0.00');
  assert.equal(formatCurrency(''), '');
  assert.equal(formatCurrency(NaN), '');
  assert.equal(formatCurrency(-12, { currencySign: 'accounting' }), '($12.00)');
});

test('currency parsing accepts locale decimal/grouping separators and configured currency affixes', () => {
  assert.equal(parseCurrency('$1,234.50'), 1234.5);
  assert.equal(parseCurrency(' USD 1,234.50 '), 1234.5);
  assert.equal(parseCurrency('-$1,234.50'), -1234.5);
  assert.equal(parseCurrency('($1,234.50)'), -1234.5);
  assert.equal(parseCurrency('1.234,50\u00a0€', { locale: 'de-DE', currency: 'EUR' }), 1234.5);
  assert.equal(parseCurrency('1\u202f234,50\u00a0€', { locale: 'fr-FR', currency: 'EUR' }), 1234.5);
  assert.equal(parseCurrency('1 234,50 €', { locale: 'fr-FR', currency: 'EUR' }), 1234.5);
  assert.equal(parseCurrency('12,34,567.89', { locale: 'en-IN', currency: 'INR' }), 1234567.89);
  assert.equal(parseCurrency(',50', { locale: 'de-DE', currency: 'EUR' }), 0.5);
  assert.equal(parseCurrency('0'), 0);
});

test('formatted currency amounts round-trip for Latin, Indian and Arabic numbering systems', () => {
  for (const options of [
    { locale: 'en-US', currency: 'USD' }, { locale: 'de-DE', currency: 'EUR' },
    { locale: 'fr-FR', currency: 'EUR' }, { locale: 'en-IN', currency: 'INR' },
    { locale: 'ar-EG', currency: 'EGP' }, { locale: 'fa-IR', currency: 'USD' }
  ]) {
    for (const amount of [0, 1234.5, -1234.5]) assert.equal(parseCurrency(formatCurrency(amount, options), options), amount, JSON.stringify(options));
  }
});

test('currency parsing rejects malformed grouping, duplicate signs and trailing junk', () => {
  for (const text of ['', ' ', '$', '1,23.50', '1,234,56', '1.2.3', '12abc', '1e3', '--12', '(-$12)', '$$12', 'NaN', 'Infinity']) assert.equal(parseCurrency(text), null, text);
  assert.equal(parseCurrency('1,234.50', { locale: 'de-DE', currency: 'EUR' }), null);
  assert.equal(parseCurrency('1,23,456', { locale: 'en-US', currency: 'USD' }), null);
  assert.equal(parseCurrency(null), null);
  assert.equal(parseCurrency(Infinity), null);
});
