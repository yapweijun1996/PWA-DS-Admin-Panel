// Browser-side i18n coverage scan (dev tool, not shipped). From the running app in Chinese mode:
//   const { scanI18n } = await import('/scripts/i18n-scan.mjs'); await scanI18n({ post: '/save' })
// Visits every route and returns visible text that still has no CJK characters. Code samples (pre/code), token names,
// the brand, anything marked translate="no" and strings listed in keepEnglish are exempt. `extra` runs after each route load.
// Code-like text (token lists, identifiers, hex/colour functions, emails, domains, URLs, font stacks) is never translated.
export function isCodeLike(text) {
  const value = text.trim();
  if (/^(?:color-mix|rgb|hsl|var)\(|^#[0-9a-f]{3,8}$|sans-serif|^https?:\/\/|^\S+@\S+$|^[\w-]+(?:\.[\w-]+)*\.(?:example|com|org)$/i.test(value) && !/\s/.test(value.replace(/,\s/g, ','))) return true;
  // Identifiers (token and palette steps such as series-1 or orange.500) are code; a plain one-word label such as Ready or Business is not.
  if (/^[a-z][a-z0-9]*(?:[-.][a-z0-9]+)+$/.test(value) || /^[a-z]+\d+$/.test(value)) return true;
  if (/^[A-Z]{2,6}$/.test(value) || /^[A-Z]+(?:-[A-Z0-9]+)+$/.test(value)) return true; // acronyms and record IDs (ERP, SGD, MOCK-1042, STU-001)
  if (/sans-serif|^color-mix\(|^[a-z]\w*\(.*\)\.?$|^\{.*\}$/.test(value)) return true;
  return value.includes('--') && value.replace(/--[\w-]+(?:\/[\w-]+)*/g, '').replace(/[\s,;.]/g, '') === '';
}

// A rendered string still needs translation when it has no Chinese at all, or when Chinese is mixed with a run of English prose
// (two consecutive lowercase words once code, proper nouns and identifiers are ignored).
export function needsTranslation(text) {
  if (isCodeLike(text)) return false;
  if (!/[\u3400-\u9fff]/.test(text)) return /[A-Za-z]{3,}/.test(text);
  if (/[\u3400-\u9fff][a-z]{2,}|[a-z]{2,}[\u3400-\u9fff]/.test(text)) return true; // Chinese glued to an English word: a template filled with untranslated text
  if (/^[a-z]\w*\(/.test(text.trim())) return false; // API signature line: code with translated prose around it
  const prose = text
    .replace(/\{[^}]*\}|\[[^\]]*\]|\([^)]*\)|"[^"]*"|'[^']*'|`[^`]*`|<[^>]+>|https?:\/\/\S+|\S+@\S+/g, ' ')
    .replace(/\b[\w-]*[A-Z_.:=\/-][\w.:=\/-]*\b/g, ' ')
    .replace(/\broving tabindex\b|\btab ?index\b|\bwidth\/height\b|\btime datetime\b/gi, ' ');
  return /(?<![\w.-])[a-z]{3,}[\s,.;]+[a-z]{3,}(?![\w.-])/.test(prose);
}

// Navigation for automated sweeps: clicking through demos leaves forms dirty, and the unsaved-changes guard would otherwise
// refuse every later route change and silently re-scan the same page. Guard handlers are dropped and the dirty flag cleared.
let guardsDisabled = false;
export function disableNavigationGuards() {
  if (guardsDisabled) return;
  guardsDisabled = true;
  window.addEventListener('app:resolve-dirty', event => { event.detail.handlers.push = () => 0; });
}
export async function goto(path, settle = 450) {
  disableNavigationGuards();
  window.appDirty = false;
  document.querySelectorAll('[role="dialog"]').forEach(dialog => dialog.closest('.modal-layer,.dialog-layer')?.remove());
  location.hash = path.startsWith('#') ? path : `#${path}`;
  await new Promise(resolve => setTimeout(resolve, settle));
  if (location.hash !== (path.startsWith('#') ? path : `#${path}`)) throw new Error(`navigation to ${path} was blocked`);
}

export async function scanI18n({ post, settle = 450, routesOnly } = {}) {
  const { routes } = await import('../js/router.js');
  const { registry } = await import('../components/registry.js');
  const { zhKeepEnglish } = await import('../js/i18n/zh/index.js');
  const kept = new Set(zhKeepEnglish);
  const paths = routesOnly || [...new Set([...routes.map(route => route.path).filter(path => !path.includes(':')), ...registry.map(item => `/components/${item.name}`), '/examples/erp/order/SO-1042', '/examples/crm/customer/CRM-001', '/examples/school/student/STU-001'])];
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
  for (const path of paths) {
    await goto(path, settle);
    collect(document.body, path, skip, add);
  }
  const out = [...found.values()].map(entry => ({ ...entry, routes: [...entry.routes] }));
  if (post) await fetch(post, { method: 'POST', body: JSON.stringify(out) });
  return { routes: paths.length, remaining: out.length, sample: out.slice(0, 8).map(entry => entry.text.slice(0, 60)) };
}

// Collects leftover English from one subtree; exported so interaction sweeps (menus, dialogs) can reuse it.
export function collect(root, path, skip, add) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) { const parent = walker.currentNode.parentElement; if (parent && !parent.closest(skip)) add(path, 'text', walker.currentNode.nodeValue); }
  // Selected values shown in comboboxes; queries typed into the palette and search are the sweeps' own input.
  root.querySelectorAll('main input[role="combobox"],main input[readonly]').forEach(input => { if (input.value && !input.closest(skip) && !input.closest('[role="dialog"]')) add(path, 'value', input.value); });
  root.querySelectorAll('[aria-label],[placeholder],[title]').forEach(element => {
    if (element.closest('pre,code,.brand')) return;
    for (const attribute of ['aria-label', 'placeholder', 'title']) if (element.hasAttribute(attribute)) add(path, attribute, element.getAttribute(attribute));
  });
}
