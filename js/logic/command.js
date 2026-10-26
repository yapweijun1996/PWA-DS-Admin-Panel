const normalize = value => String(value ?? '').trim().toLocaleLowerCase();
const recentIds = values => Array.isArray(values) ? [...new Set(values.filter(value => typeof value === 'string' && value.trim()))].slice(0, 8) : [];

function matchRank(item, query) {
  const label = normalize(item.label);
  const keywords = normalize(Array.isArray(item.keywords) ? item.keywords.join(' ') : item.keywords);
  if (!query) return 0;
  if (label === query) return 0;
  if (label.startsWith(query)) return 1;
  if (label.includes(query)) return 2;
  if (keywords.includes(query)) return 3;
  if (query.split(/\s+/u).every(part => `${label} ${keywords}`.includes(part))) return 4;
  return Infinity;
}

export function rankCommands(items, query = '', { recents = [] } = {}) {
  const search = normalize(query);
  const recent = recentIds(recents);
  return items.map((item, index) => ({ item, index, rank: matchRank(item, search), recent: recent.indexOf(String(item.id)) }))
    .filter(entry => !entry.item.disabled && Number.isFinite(entry.rank))
    .sort((a, b) => a.rank - b.rank || (a.recent < 0 ? recent.length : a.recent) - (b.recent < 0 ? recent.length : b.recent) || a.index - b.index)
    .map(entry => entry.item);
}

export function rememberCommand(recents, id, limit = 8) {
  const count = Number.isFinite(limit) ? Math.max(0, Math.min(8, Math.floor(limit))) : 8;
  if (typeof id !== 'string' || !id.trim()) return recentIds(recents).slice(0, count);
  return [id, ...recentIds(recents).filter(value => value !== id)].slice(0, count);
}

export function loadRecentCommands(storage, key = 'forma.command-recents') {
  try { return recentIds(JSON.parse(storage.getItem(key))); } catch { return []; }
}

export function saveRecentCommands(storage, recents, key = 'forma.command-recents') {
  try { storage.setItem(key, JSON.stringify(recentIds(recents))); return true; } catch { return false; }
}
