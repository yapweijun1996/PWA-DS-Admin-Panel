// Shell interaction sweep (dev tool): top-bar menus, command palette, search, not-found, mobile More sheet.
//   const { sweepShell } = await import('/scripts/i18n-shell-sweep.mjs'); await sweepShell({ post: '/save/shell' })
import { collect, needsTranslation, goto } from './i18n-scan.mjs';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export async function sweepShell({ post } = {}) {
  const { zhKeepEnglish } = await import('../js/i18n/zh/index.js');
  const kept = new Set(zhKeepEnglish);
  const skip = 'script,style,pre,code,.brand,kbd,[translate="no"],[lang="en"],.token-name,.mono';
  const found = new Map();
  const add = (path, kind, value) => {
    const clean = value.replace(/\s+/g, ' ').trim();
    if (!clean || kept.has(clean) || !needsTranslation(clean)) return;
    const entry = found.get(clean) || { text: clean, kind, routes: new Set() };
    entry.routes.add(path);
    found.set(clean, entry);
  };
  const press = async (key, options = {}) => { (document.activeElement || document.body).dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...options })); await pause(120); };
  const gather = label => collect(document.body, label, skip, add);
  const closeAll = async () => { for (let i = 0; i < 3; i += 1) await press('Escape'); };
  for (const id of ['#notification-menu', '#theme-menu', '#account-menu', '#language-toggle-skip']) {
    const button = document.querySelector(id);
    if (!button) continue;
    button.click(); await pause(200); gather(`menu ${id}`);
    for (const item of [...document.querySelectorAll('[role="menuitem"],[role="menuitemradio"]')].slice(0, 6)) { item.focus?.(); gather(`menu ${id}`); }
    await closeAll();
  }
  await goto('/overview', 400);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true })); await pause(300); gather('command palette');
  const input = document.querySelector('[role="dialog"] input, [role="combobox"]');
  if (input) for (const query of ['a', 'zzzz', 'date']) { input.value = query; input.dispatchEvent(new Event('input', { bubbles: true })); await pause(250); gather(`palette "${query}"`); }
  await closeAll();
  const search = document.querySelector('#global-search');
  if (search) { search.focus(); search.value = 'zzzz'; search.dispatchEvent(new Event('input', { bubbles: true })); await pause(300); gather('global search none'); search.value = 'order'; search.dispatchEvent(new Event('input', { bubbles: true })); await pause(300); gather('global search'); await closeAll(); }
  for (const hash of ['#/no-such-page', '#/components/no-such', '#/examples/erp/nothing']) { await goto(hash, 500); gather(`not found ${hash}`); }
  const out = [...found.values()].map(entry => ({ ...entry, routes: [...entry.routes] }));
  if (post) await fetch(post, { method: 'POST', body: JSON.stringify(out) });
  return { remaining: out.length, texts: out.map(entry => `${entry.text.slice(0, 70)} [${entry.routes[0]}]`) };
}
