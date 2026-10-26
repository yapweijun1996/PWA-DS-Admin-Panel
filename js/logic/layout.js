const finite = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;

function bounds(count, { minWidths = [], maxWidths = [], totalWidth } = {}) {
  const minimum = Array.from({ length: count }, (_, index) => Math.max(0, finite(minWidths[index], 160)));
  const maximum = minimum.map((value, index) => Math.max(value, finite(maxWidths[index], Infinity)));
  const total = typeof totalWidth === 'number' && Number.isFinite(totalWidth) ? Math.max(0, totalWidth) : null;
  const minimumSum = minimum.reduce((sum, value) => sum + value, 0);
  // When the container is physically too narrow, preserve proportions rather than overflow.
  if (total !== null && minimumSum > total) minimum.forEach((value, index) => { minimum[index] = value * total / minimumSum; });
  return { minimum, maximum, total };
}

export function clampPaneWidths(widths, options = {}) {
  if (!Array.isArray(widths)) throw new TypeError('Pane widths must be an array.');
  const { minimum, maximum, total } = bounds(widths.length, options);
  const result = widths.map((width, index) => Math.max(minimum[index], Math.min(maximum[index], finite(width, minimum[index]))));
  if (total === null || !result.length) return result;
  let difference = total - result.reduce((sum, value) => sum + value, 0);
  // Redistribute among panes with room; a pane hitting its bound leaves the next pass.
  for (let pass = 0; pass <= result.length && Math.abs(difference) > 0.000001; pass++) {
    const eligible = result.map((value, index) => index).filter(index => difference > 0 ? result[index] < maximum[index] : result[index] > minimum[index]);
    if (!eligible.length) break;
    const share = difference / eligible.length;
    for (const index of eligible) result[index] = Math.max(minimum[index], Math.min(maximum[index], result[index] + share));
    difference = total - result.reduce((sum, value) => sum + value, 0);
  }
  return result;
}

export function resizePaneWidths(widths, index, delta, options = {}) {
  const result = clampPaneWidths(widths, options);
  if (!Number.isInteger(index) || index < 0 || index >= result.length - 1 || !Number.isFinite(delta)) return result;
  const { minimum, maximum } = bounds(result.length, options);
  const movement = Math.max(Math.max(minimum[index] - result[index], result[index + 1] - maximum[index + 1]),
    Math.min(Math.min(maximum[index] - result[index], result[index + 1] - minimum[index + 1]), delta));
  result[index] += movement;
  result[index + 1] -= movement;
  return result;
}

export function loadPaneWidths(storage, key, defaults, options = {}) {
  let widths = defaults;
  try {
    const saved = JSON.parse(storage.getItem(key));
    if (Array.isArray(saved) && saved.length === defaults.length && saved.every(value => typeof value === 'number' && Number.isFinite(value))) widths = saved;
  } catch { /* Storage is an optional browser preference. */ }
  return clampPaneWidths(widths, options);
}

export function savePaneWidths(storage, key, widths, options = {}) {
  const normalized = clampPaneWidths(widths, options);
  try { storage.setItem(key, JSON.stringify(normalized)); return true; } catch { return false; }
}
