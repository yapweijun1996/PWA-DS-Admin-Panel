import { parseNumber, decimalPlaces, roundToPrecision } from './number.js';
import { parseCurrency } from './currency.js';
import { parseISODate } from './date.js';

function empty(value) { return value === null || value === undefined || (typeof value === 'string' && !value.trim()); }
function numeric(column) { return column.type === 'number' || column.type === 'currency'; }

export function coerceGridValue(column, value) {
  if (empty(value)) return (column.type || 'text') === 'text' ? '' : null;
  if (numeric(column)) return (column.type === 'currency' ? parseCurrency(value, { currency: column.currency, locale: column.locale }) : parseNumber(value)) ?? value;
  return value;
}

export function normalizeGridRows(rows, columns) {
  return rows.map(row => {
    const copy = { ...row };
    for (const column of columns) copy[column.key] = coerceGridValue(column, row[column.key]);
    return copy;
  });
}

export function validateGridCell(column, value, row = {}, rowIndex = 0) {
  if (empty(value)) return column.required ? `${column.label} is required.` : '';
  const candidate = coerceGridValue(column, value);
  if (numeric(column)) {
    if (typeof candidate !== 'number' || !Number.isFinite(candidate)) return `Enter a valid ${column.type === 'currency' ? 'currency amount' : 'number'}.`;
    if (column.min !== undefined && candidate < column.min) return `Minimum is ${column.min}.`;
    if (column.max !== undefined && candidate > column.max) return `Maximum is ${column.max}.`;
  } else if (column.type === 'select') {
    if (!(column.options || []).some(option => Object.is(option.value, candidate))) return 'Choose an available option.';
  } else if (column.type === 'date') {
    if (!parseISODate(candidate)) return 'Choose a valid date.';
    if (column.min && candidate < column.min) return `Earliest date is ${column.min}.`;
    if (column.max && candidate > column.max) return `Latest date is ${column.max}.`;
  }
  if (column.validate) {
    const result = column.validate(candidate, { ...row, [column.key]: candidate }, rowIndex);
    if (typeof result === 'string') return result;
    if (result === false) return `Enter a valid ${column.label}.`;
  }
  return '';
}

export function validateGridRows(rows, columns) {
  return rows.map((row, rowIndex) => Object.fromEntries(columns.map(column => [column.key, validateGridCell(column, row[column.key], row, rowIndex)])));
}

// Retain invalid input instead of clamping it, discarding it, or substituting zero.
export function editGridCell(rows, columns, rowIndex, key, value) {
  const column = columns.find(item => item.key === key);
  if (!column) throw new RangeError(`Unknown grid column: ${key}`);
  if (!Number.isInteger(rowIndex) || rowIndex < 0 || rowIndex >= rows.length) throw new RangeError('Grid row is out of range.');
  return rows.map((row, index) => index === rowIndex ? { ...row, [key]: coerceGridValue(column, value) } : { ...row });
}

export function gridDirtyCells(rows, savedRows, columns) {
  return rows.map((row, rowIndex) => Object.fromEntries(columns.map(column => [column.key, !savedRows[rowIndex] || !Object.is(coerceGridValue(column, row[column.key]), coerceGridValue(column, savedRows[rowIndex][column.key]))])));
}

export function aggregateGridColumns(rows, columns) {
  const result = {};
  for (const column of columns) {
    if (!numeric(column) || !['sum', 'average'].includes(column.aggregate)) continue;
    let total = 0;
    let count = 0;
    let precision = 0;
    let average = 0;
    rows.forEach((row, rowIndex) => {
      const value = coerceGridValue(column, row[column.key]);
      if (empty(value) || validateGridCell(column, value, row, rowIndex)) return;
      total += value;
      count += 1;
      // Weighted terms avoid overflow when averaging large, finite values.
      average = average * ((count - 1) / count) + value / count;
      precision = Math.max(precision, decimalPlaces(value));
    });
    const value = column.aggregate === 'average' ? (count ? average : null) : (Number.isFinite(total) ? roundToPrecision(total, Math.min(15, precision)) : null);
    result[column.key] = { value: Number.isFinite(value) ? value : null, count, excluded: rows.length - count, aggregate: column.aggregate };
  }
  return result;
}

export function moveGridFocus({ row, column }, key, rowCount, columnCount) {
  const next = { row, column };
  if (key === 'ArrowLeft') next.column -= 1;
  else if (key === 'ArrowRight') next.column += 1;
  else if (key === 'ArrowUp') next.row -= 1;
  else if (key === 'ArrowDown') next.row += 1;
  else if (key === 'Home') next.column = 0;
  else if (key === 'End') next.column = columnCount - 1;
  next.row = Math.max(0, Math.min(Math.max(0, rowCount - 1), next.row));
  next.column = Math.max(0, Math.min(Math.max(0, columnCount - 1), next.column));
  return next;
}
