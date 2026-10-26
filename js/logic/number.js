export function parseNumber(value) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value !== 'string' || !/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(value.trim())) return null;
  const number = Number(value.trim());
  return Number.isFinite(number) ? number : null;
}

export function decimalPlaces(value) {
  const number = parseNumber(value);
  if (number === null) return 0;
  const [coefficient, exponent = '0'] = String(number).toLowerCase().split('e');
  return Math.max(0, (coefficient.split('.')[1]?.length || 0) - Number(exponent));
}

function validPrecision(precision) {
  if (!Number.isInteger(precision) || precision < 0 || precision > 15) throw new RangeError('Precision must be an integer from 0 to 15.');
}

export function roundToPrecision(value, precision = 0) {
  validPrecision(precision);
  const number = parseNumber(value);
  if (number === null) return null;
  // Shift the decimal exponent instead of multiplying (1.005 * 100 is inexact).
  const [coefficient, exponent = '0'] = String(Math.abs(number)).split('e');
  const shifted = Number(`${coefficient}e${Number(exponent) + precision}`);
  if (!Number.isFinite(shifted)) return number;
  const rounded = Math.round(shifted);
  const [roundedCoefficient, roundedExponent = '0'] = String(rounded).split('e');
  const result = Number(`${roundedCoefficient}e${Number(roundedExponent) - precision}`) * Math.sign(number);
  return result === 0 ? 0 : result;
}

export function clampNumber(value, { min, max } = {}) {
  const number = parseNumber(value);
  if (number === null) return null;
  const lower = parseNumber(min), upper = parseNumber(max);
  if (lower !== null && upper !== null && lower > upper) throw new RangeError('Minimum must not exceed maximum.');
  return Math.min(upper ?? Infinity, Math.max(lower ?? -Infinity, number));
}

export function normalizeNumber(value, options = {}) {
  const number = parseNumber(value);
  if (number === null) return null;
  return clampNumber(options.precision === undefined ? number : roundToPrecision(number, options.precision), options);
}

export function stepNumber(value, direction = 1, options = {}) {
  const step = options.step === undefined ? 1 : parseNumber(options.step);
  if (step === null || step <= 0) throw new RangeError('Step must be a positive finite number.');
  if (!Number.isInteger(direction)) throw new RangeError('Step direction must be an integer.');
  const number = parseNumber(value) ?? parseNumber(options.min) ?? 0;
  const precision = options.precision ?? Math.min(15, Math.max(decimalPlaces(number), decimalPlaces(step)));
  return normalizeNumber(number + direction * step, { ...options, precision });
}

export function isStepAligned(value, { min = 0, step = 1 } = {}) {
  const number = parseNumber(value), increment = parseNumber(step), base = parseNumber(min) ?? 0;
  if (number === null || increment === null || increment <= 0) return false;
  const steps = (number - base) / increment;
  return Math.abs(steps - Math.round(steps)) <= Math.min(1e-7, Number.EPSILON * Math.max(1, Math.abs(steps)) * 8);
}

// Stable reason codes let callers supply localized field-error messages.
export function validateNumber(value, { min, max, step, precision } = {}) {
  const number = parseNumber(value);
  if (number === null) return 'number';
  if (parseNumber(min) !== null && number < Number(min)) return 'min';
  if (parseNumber(max) !== null && number > Number(max)) return 'max';
  if (precision !== undefined) {
    validPrecision(precision);
    if (decimalPlaces(number) > precision) return 'precision';
  }
  if (step !== undefined && !isStepAligned(number, { min, step })) return 'step';
  return null;
}
