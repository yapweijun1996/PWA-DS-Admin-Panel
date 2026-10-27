// Interaction sweep (dev tool): opens menus, dialogs and drawers on each route and reports leftover English text.
//   const { sweepI18n } = await import('/scripts/i18n-sweep.mjs'); await sweepI18n({ paths: ['/components/modal'], post: '/save' })
// For every route it clicks each distinct button in <main> (depth 1) and each distinct button of an overlay that appeared (depth 2),
// collecting text after every click, then closes overlays with Escape. Navigation links are never clicked.
import { collect, needsTranslation, goto } from './i18n-scan.mjs';

const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const overlaySelector = '[role="dialog"],[role="menu"],[role="listbox"],[role="tooltip"],.modal-layer,.drawer-layer,.popover,.menu,.toast,.toast-region';

export async function sweepI18n({ paths, post, settle = 450, clickDelay = 140, maxPerPage = 40 } = {}) {
  const { zhKeepEnglish } = await import('../js/i18n/zh/index.js');
  const kept = new Set(zhKeepEnglish);
  const hasLatin = value => /[A-Za-z]{3,}/.test(value) && !/[㐀-鿿]/.test(value);
  const skip = 'script,style,pre,code,.brand,kbd,[translate="no"],[lang="en"],.token-name,.mono';
  const found = new Map();
  const add = (path, kind, value) => {
    const clean = value.replace(/\s+/g, ' ').trim();
    if (!clean || kept.has(clean) || !needsTranslation(clean)) return;
    const entry = found.get(clean) || { text: clean, kind, routes: new Set() };
    entry.routes.add(path);
    found.set(clean, entry);
  };
  const label = button => (button.getAttribute('aria-label') || button.textContent).replace(/\s+/g, ' ').trim();
  const usable = button => button.isConnected && !button.disabled && button.getAttribute('aria-disabled') !== 'true' && button.offsetParent !== null && !button.closest('nav,header.topbar,.context-panel,.bottom-nav') && !/delete|remove|discard changes/i.test(label(button));
  const close = async () => { for (let i = 0; i < 3; i += 1) { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); document.activeElement?.dispatchEvent?.(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await pause(40); } };
  let clicks = 0;
  for (const path of paths) {
    await goto(path, settle);
    const main = document.querySelector('main');
    const seen = new Set();
    const queue = [...main.querySelectorAll('button')];
    for (const button of queue.slice(0, maxPerPage * 3)) {
      if (!usable(button) || seen.has(label(button)) || seen.size >= maxPerPage) continue;
      seen.add(label(button));
      const hashBefore = location.hash;
      button.click(); clicks += 1;
      await pause(clickDelay);
      collect(document.body, path, skip, add);
      const overlay = [...document.querySelectorAll(overlaySelector)].filter(node => node.offsetParent !== null || node.getAttribute('role'));
      const inner = new Set();
      for (const control of overlay.flatMap(node => [...node.querySelectorAll('button,[role="menuitem"],[role="option"],[role="tab"]')]).slice(0, 12)) {
        if (!usable(control) || inner.has(label(control)) || /^(close|cancel)$/i.test(label(control))) continue;
        inner.add(label(control));
        control.click(); clicks += 1;
        await pause(clickDelay);
        collect(document.body, path, skip, add);
      }
      await close();
      if (location.hash !== hashBefore) await goto(hashBefore, settle);
    }
  }
  const out = [...found.values()].map(entry => ({ ...entry, routes: [...entry.routes] }));
  if (post) await fetch(post, { method: 'POST', body: JSON.stringify(out) });
  return { paths: paths.length, clicks, remaining: out.length, sample: out.slice(0, 10).map(entry => entry.text.slice(0, 70)) };
}
