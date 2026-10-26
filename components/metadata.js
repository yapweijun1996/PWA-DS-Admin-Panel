export const categories = ['Actions', 'Forms', 'Data display', 'Navigation', 'Feedback', 'Charts', 'Layouts', 'Enterprise'];
export function validateMetadata(entries) {
  const errors = [];
  for (const entry of entries) {
    const guide = entry.guide || {};
    for (const key of ['purpose', 'example']) if (typeof guide[key] !== 'string' || !guide[key].trim()) errors.push(`${entry.name}: missing guide ${key}`);
    for (const key of ['props', 'variants', 'states', 'keyboard', 'accessibility', 'do', 'dont']) if (!Array.isArray(guide[key]) || !guide[key].length || guide[key].some(value => typeof value !== 'string' || !value.trim())) errors.push(`${entry.name}: missing guide ${key}`);
    if (!categories.includes(entry.category)) errors.push(`${entry.name}: missing category`);
    if (typeof entry.demo !== 'function' || typeof entry.render !== 'function') errors.push(`${entry.name}: missing live demo`);
  }
  return errors;
}
