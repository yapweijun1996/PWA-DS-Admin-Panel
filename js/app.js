import { registry } from '../components/registry.js';
import { initPWA, renderPWA, getPWAState } from './pwa.js';
import { VERSION, BUILD } from './build-info.js';
import { createRouter } from './router.js';
import { t, setLanguage, getLanguage } from './i18n.js';
import { icon } from './icons.js';
import { renderShowcase } from './kits-showcase.js';
import { renderLearn } from './learn.js';
import { createChart } from '../components/chart.js';

const storage = {
  read(key, fallback) { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; } },
  write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { notify(getLanguage() === 'zh' ? '无法保存到浏览器存储。' : 'Browser storage is unavailable. Changes cannot be persisted.'); return false; } },
};
const defaults = { language: 'en', theme: 'light', palette: 'blue', kit: 'enterprise', density: 'comfortable', landingPage: '/overview', pageSize: 10, panel: null, reducedMotion: false };
const storedPreferences = storage.read('forma.preferences', {});
const prefs = { ...defaults, ...(storedPreferences && typeof storedPreferences === 'object' ? storedPreferences : {}) };
if (!['light', 'dark', 'system'].includes(prefs.theme)) prefs.theme = 'light';
if (!['comfortable', 'compact'].includes(prefs.density)) prefs.density = 'comfortable';
if (!['expanded', 'collapsed'].includes(prefs.panel)) prefs.panel = null;
const palettes = ['blue', 'indigo', 'violet', 'emerald', 'teal', 'rose', 'orange', 'slate'];
const kitNames = ['enterprise', 'liquid', 'ops'];
if (!palettes.includes(prefs.palette)) prefs.palette = 'blue';
if (!kitNames.includes(prefs.kit)) prefs.kit = 'enterprise';
if (!['/overview', '/tokens', '/components'].includes(prefs.landingPage)) prefs.landingPage = '/overview';
if (![5, 10, 20, 50].includes(prefs.pageSize)) prefs.pageSize = 10;
setLanguage(prefs.language);
const mediaTheme = matchMedia('(prefers-color-scheme: dark)');
const tablet = matchMedia('(min-width: 768px) and (max-width: 1024px)');
let tokens = {};
let overrides = storage.read('forma.token-overrides', {});
let changeLog = storage.read('forma.token-history', []);
if (!overrides || typeof overrides !== 'object' || Array.isArray(overrides)) overrides = {};
if (!Array.isArray(changeLog)) changeLog = [];
changeLog = changeLog.filter(entry => entry && typeof entry.token === 'string' && typeof entry.time === 'string').slice(0, 50);
let route;
let router;
let activeGroup = 'all';
let editMode = 'light';
let searchQuery = '';
let draft = null;
let activeDialog = null;
let resolvingDirty = null;
let nextDialogId = 0;
window.appDirty = false;
const root = document.querySelector('#app');
const overlayRoot = document.querySelector('#overlay-root');
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const label = value => String(value).replace(/[-_]/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
const groupIcons = { Color: 'tokens', Typography: 'type', Spacing: 'spacing', Radius: 'radius', Shadow: 'shadow' };
const modules = ['overview', 'tokens', 'components', 'settings'];
const settingsSections = ['general', 'appearance', 'about', 'pwa'];
const tokenEntries = () => Object.entries(tokens).flatMap(([group, values]) => Object.entries(values).map(([name, values]) => ({ group, name, values })));
const tokenValue = (name, mode) => overrides[name]?.[mode] ?? tokenEntries().find(item => item.name === name)?.values[mode];
const panelOpen = () => prefs.panel === null ? prefs.kit !== 'ops' && !tablet.matches : prefs.panel === 'expanded';

function notify(message) {
  const host = document.querySelector('#notification-root');
  if (!host) return;
  host.textContent = message;
  host.classList.add('is-visible');
  clearTimeout(notify.timer);
  notify.timer = setTimeout(() => host.classList.remove('is-visible'), 3600);
}
function applyPreferences() {
  const html = document.documentElement;
  html.dataset.theme = prefs.theme === 'system' ? (mediaTheme.matches ? 'dark' : 'light') : prefs.theme;
  html.dataset.themePreference = prefs.theme;
  html.dataset.palette = prefs.palette;
  html.dataset.kit = prefs.kit;
  html.dataset.density = prefs.density;
  html.dataset.reducedMotion = prefs.reducedMotion ? 'true' : 'false';
  html.dataset.panel = panelOpen() ? 'expanded' : 'collapsed';
  applyOverrides();
}
function savePreference(key, value) {
  if (key === 'kit' && value !== prefs.kit) {
    // Explicit axis choices remain independent; kit defaults apply only to untouched axes.
    const preset = value === 'ops' ? { theme: 'dark', palette: 'teal', density: 'compact' } : { theme: 'light', palette: 'blue', density: 'comfortable' };
    for (const axis of ['theme', 'palette', 'density']) if (!prefs[`${axis}Explicit`]) prefs[axis] = preset[axis];
  }
  if (['theme', 'palette', 'density'].includes(key)) prefs[`${key}Explicit`] = true;
  prefs[key] = value;
  storage.write('forma.preferences', prefs);
  applyPreferences();
  const themeIcon = document.querySelector('#theme-menu .icon');
  if (themeIcon) themeIcon.outerHTML = icon(prefs.theme === 'dark' ? 'moon' : prefs.theme === 'system' ? 'monitor' : 'sun');
  window.dispatchEvent(new CustomEvent('app:preferences', { detail: { ...prefs } }));
}
function applyOverrides() {
  const mode = document.documentElement.dataset.theme || 'light';
  for (const { name } of tokenEntries()) {
    const value = draft?.name === name && draft.mode === mode && draft.valid ? draft.value : overrides[name]?.[mode];
    if (value !== undefined) document.documentElement.style.setProperty(`--${name}`, value);
    else document.documentElement.style.removeProperty(`--${name}`);
  }
  requestAnimationFrame(() => {
    const color = getComputedStyle(document.documentElement).getPropertyValue('--surface').trim();
    if (color) document.querySelector('meta[name="theme-color"]').content = color;
  });
}
function normalizeToken(group, name, raw, mode = editMode) {
  let value = String(raw).trim();
  if (group === 'Color') {
    const short = /^#([a-f\d]{3})$/i.exec(value);
    if (short) value = `#${[...short[1]].map(character => character.repeat(2)).join('')}`;
    return /^#[a-f\d]{6}$/i.test(value) ? { valid: true, value: value.toLowerCase() } : { valid: false, error: t('invalidColor') };
  }
  if (!value || /[;{}<>]|\/\*|url\s*\(|expression\s*\(|!important/i.test(value) || /#[a-f\d]{3,8}\b|(?:rgb|hsl)a?\s*\(/i.test(value)) return { valid: false, error: t('invalidValue') };
  const property = group === 'Shadow' ? 'box-shadow' : group === 'Radius' ? 'border-radius' : group === 'Spacing' ? 'padding' : group === 'Layout' ? 'width' : group === 'Motion' ? (name.includes('easing') ? 'transition-timing-function' : 'transition-duration') : group === 'Surface' ? (name.endsWith('alpha') ? 'opacity' : name.endsWith('blur') || name.endsWith('saturation') ? 'filter' : 'background') : name.includes('family') || name.includes('mono') || name.includes('numeric') ? 'font-family' : name === 'line-height' ? 'line-height' : 'font-size';
  const expandReferences = (candidate, seen) => candidate.replace(/var\(\s*--([\w-]+)\s*\)/g, (_, reference) => {
    if (seen.has(reference)) throw new Error('Circular token reference');
    const source = tokenEntries().find(item => item.name === reference);
    if (!source) throw new Error('Unknown token reference');
    return expandReferences(String(overrides[reference]?.[mode] ?? source.values[mode]), new Set([...seen, reference]));
  });
  let resolved;
  try { resolved = expandReferences(value, new Set([name])); } catch { return { valid: false, error: t('invalidValue') }; }
  const candidate = name === 'surface-blur' ? `blur(${resolved})` : name === 'surface-saturation' ? `saturate(${resolved})` : resolved;
  if (/var\s*\(/i.test(resolved) || /^(initial|inherit|unset|revert(?:-layer)?)$/i.test(value) || !CSS.supports(property, candidate)) return { valid: false, error: t('invalidValue') };
  if (['font-size', 'padding', 'border-radius'].includes(property) && (/^-/.test(resolved) || (property === 'font-size' && parseFloat(resolved) === 0))) return { valid: false, error: t('invalidValue') };
  return { valid: true, value };
}
function sanitizeOverrides() {
  const result = {};
  for (const { group, name } of tokenEntries()) for (const mode of ['light', 'dark']) {
    const existing = overrides[name]?.[mode];
    if (existing === undefined) continue;
    const normalized = normalizeToken(group, name, existing, mode);
    if (normalized.valid) (result[name] ??= {})[mode] = normalized.value;
  }
  overrides = result;
}
function logEdit(name, mode, previous, next) {
  if (previous === next) return;
  changeLog.unshift({ token: name, mode, old: previous, new: next, time: new Date().toISOString() });
  changeLog = changeLog.slice(0, 50);
  storage.write('forma.token-history', changeLog);
}
function saveDraft() {
  if (!draft?.valid) return false;
  const previous = tokenValue(draft.name, draft.mode);
  const { name, mode, value } = draft;
  const nextOverrides = structuredClone(overrides);
  (nextOverrides[name] ??= {})[mode] = value;
  if (!storage.write('forma.token-overrides', nextOverrides)) return false;
  overrides = nextOverrides;
  logEdit(name, mode, previous, value);
  draft = null;
  window.appDirty = false;
  applyOverrides();
  notify(t('saved'));
  return true;
}
function discardDraft() { draft = null; window.appDirty = false; applyOverrides(); }

function dialog(title, content, actions, { onClose = () => {}, className = '' } = {}) {
  const previousFocus = document.activeElement;
  const layer = document.createElement('div');
  const titleId = `app-dialog-title-${++nextDialogId}`;
  layer.className = 'dialog-backdrop';
  layer.innerHTML = `<section class="app-dialog ${className}" role="dialog" aria-modal="true" aria-labelledby="${titleId}"><div class="dialog-heading"><h2 id="${titleId}">${escape(title)}</h2><button class="icon-button" data-close aria-label="${escape(t('close'))}">${icon('close')}</button></div><div class="dialog-body">${content}</div><div class="dialog-actions"></div></section>`;
  overlayRoot.append(layer);
  const close = () => { layer.remove(); if (activeDialog?.layer === layer) activeDialog = null; previousFocus?.isConnected && previousFocus.focus(); };
  const requestClose = () => onClose(close);
  layer.querySelector('[data-close]').addEventListener('click', requestClose);
  layer.addEventListener('click', event => { if (event.target === layer) requestClose(); });
  layer.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); requestClose(); }
    if (event.key === 'Tab') {
      const items = [...layer.querySelectorAll('button:not(:disabled),a[href],input:not(:disabled),textarea:not(:disabled),[tabindex="0"]')].filter(element => !element.hidden);
      const first = items[0]; const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  for (const action of actions) {
    const button = document.createElement('button');
    button.className = `button ${action.primary ? 'button-primary' : ''} ${action.danger ? 'button-danger' : ''}`;
    button.textContent = action.label;
    button.disabled = !!action.disabled;
    if (action.id) button.id = action.id;
    button.addEventListener('click', () => action.run(close));
    layer.querySelector('.dialog-actions').append(button);
  }
  activeDialog = { layer, close };
  queueMicrotask(() => (layer.querySelector('input,textarea') || layer.querySelector('button')).focus());
  return { layer, close };
}
window.resolveDirty = async () => {
  const handlers = [];
  window.dispatchEvent(new CustomEvent('app:resolve-dirty', { detail: { handlers } }));
  for (const handler of handlers) if (!(await handler())) return false;
  if (!window.appDirty) return true;
  if (resolvingDirty) return resolvingDirty;
  resolvingDirty = new Promise(resolve => {
    const finish = (allowed, close) => { close(); resolvingDirty = null; if (allowed) { document.querySelector('.token-editor-layer')?.remove(); activeDialog = null; } resolve(allowed); };
    dialog(t('dirtyTitle'), `<p>${escape(t('dirtyDescription'))}</p>`, [
      { label: t('cancel'), run: close => finish(false, close) },
      { label: t('discard'), run: close => { discardDraft(); finish(true, close); } },
      { label: t('save'), primary: true, disabled: !draft?.valid, run: close => { if (saveDraft()) finish(true, close); } },
    ], { onClose: close => finish(false, close) });
  });
  return resolvingDirty;
};
window.addEventListener('beforeunload', event => { if (window.appDirty) { event.preventDefault(); event.returnValue = ''; } });

function navLink(module, mobile = false) {
  const href = module === 'settings' ? '#/settings/general' : `#/${module}`;
  return `<a class="${mobile ? 'bottom-tab' : 'rail-link'} ${route?.module === module ? 'active' : ''}" href="${href}" ${route?.module === module ? 'aria-current="page"' : ''} aria-label="${escape(t(module))}">${icon(module)}<span class="${mobile ? '' : 'rail-tooltip'}">${escape(t(module))}</span></a>`;
}
function renderShell() {
  root.innerHTML = `<header class="topbar"><a class="brand" href="#/overview"><span class="brand-mark">${icon('logo')}</span><span>Forma</span></a><div class="breadcrumbs"></div><div class="global-search"><label class="search-field">${icon('search')}<input id="global-search" type="search" placeholder="Search pages, components, tokens" aria-label="Global search" aria-controls="global-results" autocomplete="off"><kbd>⌘ K</kbd></label><div id="global-results" hidden></div></div><div class="topbar-actions"><button class="icon-button" id="notification-menu" aria-label="Notifications" aria-haspopup="menu" aria-expanded="false">${icon('bell')}<span id="notification-count"></span></button><button class="language-button" id="language-toggle" aria-label="${escape(t('language'))}">${icon('globe')}<span>${getLanguage() === 'en' ? 'EN' : '中文'}</span></button><button class="icon-button" id="theme-menu" aria-label="${escape(t('theme'))}" aria-haspopup="menu" aria-expanded="false">${icon(prefs.theme === 'dark' ? 'moon' : 'sun')}</button><button class="avatar" id="account-menu" aria-label="${escape(t('account'))}" aria-haspopup="menu" aria-expanded="false">DS</button></div></header>
    <div class="workspace"><aside class="context-panel" aria-label="${escape(t('contextNavigation'))}"></aside><div class="main-column"><main id="main-content" tabindex="-1"></main><footer class="workspace-footer"><span>Forma · ${t('workspace')}</span><span>v${escape(VERSION)}</span></footer></div></div><nav class="bottom-nav" aria-label="${escape(t('navigation'))}">${modules.slice(0, 3).map(module => navLink(module, true)).join('')}<button class="bottom-tab" id="mobile-more" aria-haspopup="dialog">${icon('more')}<span>${t('more')}</span></button></nav>`;
  document.querySelector('.skip-link').textContent = t('skip');
  document.querySelector('#language-toggle').onclick = async () => {
    if (!(await window.resolveDirty())) return;
    savePreference('language', getLanguage() === 'en' ? 'zh' : 'en');
    setLanguage(prefs.language);
    window.dispatchEvent(new Event('app:language'));
    render();
  };
  document.querySelector('#theme-menu').onclick = event => menu(event.currentTarget, ['light', 'dark', 'system'].map(theme => ({ label: t(theme), icon: theme === 'light' ? 'sun' : theme === 'dark' ? 'moon' : 'monitor', checked: prefs.theme === theme, run: () => { savePreference('theme', theme); render(); } })));
  document.querySelector('#account-menu').onclick = event => menu(event.currentTarget, [
    { label: t('localWorkspace'), description: t('localOnly') },
    { label: t('language'), icon: 'globe', run: () => document.querySelector('#language-toggle').click() },
    { label: t('theme'), icon: 'sun', run: () => document.querySelector('#theme-menu').click() },
    { label: t('settings'), icon: 'settings', run: () => { location.hash = '#/settings/general'; } },
    { label: t('about'), icon: 'info', run: () => { location.hash = '#/settings/about'; } },
  ]);
  const search = document.querySelector('#global-search');
  search.oninput = () => {
    const query = search.value.trim().toLowerCase();
    const entries = [{ label: 'Guide', href: '#/learn' }, ...['overview', 'tokens', 'components', 'kits'].map(name => ({ label: label(name), href: `#/${name}` })), ...settingsSections.map(name => ({ label: `Settings / ${label(name)}`, href: `#/settings/${name}` })), ...registry.map(entry => ({ label: entry.label, href: `#/components/${entry.name}` })), ...tokenEntries().map(entry => ({ label: `Token / ${entry.name}`, href: '#/tokens', token: entry.name }))].filter(entry => entry.label.toLowerCase().includes(query)).slice(0, 12);
    const results = document.querySelector('#global-results');
    results.hidden = !query;
    results.innerHTML = entries.length ? entries.map(entry => `<a href="${entry.href}" ${entry.token ? `data-search-token="${escape(entry.token)}"` : ''}>${escape(entry.label)}</a>`).join('') : '<p>No results</p>';
    results.querySelectorAll('a').forEach(link => link.onclick = () => { if (link.dataset.searchToken) { searchQuery = link.dataset.searchToken; activeGroup = 'all'; if (route.module === 'tokens') render(); } results.hidden = true; });
  };
  search.onkeydown = event => { if (event.key === 'Escape') document.querySelector('#global-results').hidden = true; if (event.key === 'ArrowDown' || event.key === 'Enter') { event.preventDefault(); document.querySelector('#global-results a')?.focus(); } };
  updateNotifications();
  document.querySelector('#notification-menu').onclick = event => menu(event.currentTarget, notificationItems());
  document.querySelector('#mobile-more').onclick = () => dialog(t('more'), `<nav class="sheet-links">${settingsSections.map(section => `<a class="context-link" href="#/settings/${section}">${icon(section === 'pwa' ? 'download' : section === 'about' ? 'info' : 'settings')}${t(section)}${icon('chevronRight')}</a>`).join('')}</nav>`, [], { className: 'mobile-sheet', onClose: close => close() }).layer.querySelectorAll('a').forEach(link => link.addEventListener('click', () => activeDialog?.close()));
  document.querySelector('#mobile-more').addEventListener('click', () => {
    const link = document.createElement('a'); link.className = 'context-link'; link.href = '#/kits'; link.textContent = 'Design kits'; link.onclick = () => activeDialog?.close();
    document.querySelector('.sheet-links')?.prepend(link);
    const guideLink = document.createElement('a'); guideLink.className = 'context-link'; guideLink.href = '#/learn'; guideLink.textContent = 'Guide'; guideLink.onclick = () => activeDialog?.close(); document.querySelector('.sheet-links')?.prepend(guideLink);
  });
}
function menu(anchor, items) {
  document.querySelector('.app-menu')?.remove();
  const element = document.createElement('div');
  element.className = 'app-menu'; element.setAttribute('role', 'menu');
  anchor.setAttribute('aria-expanded', 'true');
  for (const item of items) {
    const row = document.createElement(item.run ? 'button' : 'div');
    row.className = item.run ? 'menu-item' : 'menu-caption';
    if (item.run) row.setAttribute('role', 'menuitem');
    row.innerHTML = `${item.icon ? icon(item.icon) : ''}<span>${escape(item.label)}${item.description ? `<small>${escape(item.description)}</small>` : ''}</span>${item.checked ? icon('check') : ''}`;
    if (item.run) row.onclick = () => { close(); item.run(); };
    element.append(row);
  }
  document.body.append(element);
  const rect = anchor.getBoundingClientRect();
  element.style.left = `${Math.max(8, Math.min(rect.left, innerWidth - element.offsetWidth - 8))}px`;
  element.style.top = `${rect.bottom + element.offsetHeight + 8 > innerHeight ? Math.max(8, rect.top - element.offsetHeight - 8) : rect.bottom + 8}px`;
  const close = () => { element.remove(); anchor.setAttribute('aria-expanded', 'false'); document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', keys); };
  const outside = event => { if (!element.contains(event.target) && !anchor.contains(event.target)) close(); };
  const keys = event => {
    const buttons = [...element.querySelectorAll('button')]; const index = buttons.indexOf(document.activeElement);
    if (event.key === 'Escape') { close(); anchor.focus(); }
    if (['ArrowDown', 'ArrowUp'].includes(event.key)) { event.preventDefault(); buttons[(index + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length]?.focus(); }
    if (event.key === 'Tab') close();
  };
  document.addEventListener('pointerdown', outside); document.addEventListener('keydown', keys);
  element.querySelector('button')?.focus();
}
function renderContext() {
  const current = route.module === 'notFound' ? 'overview' : route.module;
  let links = '';
  if (current === 'overview') links = `<a class="context-link active" href="#/overview">${icon('overview')}${t('workspaceOverview')}</a><div class="context-label">${t('quickStart')}</div><a class="context-link" href="#/tokens">${icon('tokens')}${t('exploreTokens')}</a><a class="context-link" href="#/components">${icon('components')}${t('exploreComponents')}</a>`;
  if (current === 'tokens') links = `<button class="context-link ${activeGroup === 'all' ? 'active' : ''}" data-group="all">${icon('tokens')}${t('allTokens')}<span class="nav-count">${tokenEntries().length}</span></button><div class="context-label">${t('foundations')}</div>${Object.keys(tokens).map(group => `<button class="context-link ${activeGroup === group ? 'active' : ''}" data-group="${escape(group)}">${icon(groupIcons[group])}${t(group)}<span class="nav-count">${Object.keys(tokens[group]).length}</span></button>`).join('')}<div class="context-separator"></div><button class="context-link" data-history>${icon('clock')}${t('history')}</button>`;
  if (current === 'components') links = `<a class="context-link ${!route.params.name ? 'active' : ''}" href="#/components">${icon('components')}${t('all')}<span class="nav-count">${registry.length}</span></a><div class="context-label">${t('library')}</div>${registry.map(entry => `<a class="context-link ${route.params.name === entry.name ? 'active' : ''}" href="#/components/${encodeURIComponent(entry.name)}">${icon('components')}<span>${escape(componentLabel(entry))}</span></a>`).join('')}`;
  if (current === 'settings') links = settingsSections.map(section => `<a class="context-link ${route.section === section ? 'active' : ''}" href="#/settings/${section}">${icon(section === 'pwa' ? 'download' : section === 'about' ? 'info' : section === 'appearance' ? 'sun' : 'settings')}${t(section)}</a>`).join('');
  const section = (title, names) => `<div class="context-label">${title}</div>${names.map(name => `<a class="context-link ${current === name ? 'active' : ''}" href="${name === 'settings' ? '#/settings/general' : `#/${name}`}" aria-label="${escape(name === 'kits' ? 'Design kits' : t(name))}">${icon(name === 'kits' ? 'components' : name)}<span class="nav-label">${name === 'kits' ? 'Design kits' : t(name)}</span>${name === 'components' ? `<span class="nav-count">${registry.length}</span>` : ''}</a>${current === name ? `<div class="nested-nav">${links}</div>` : ''}`).join('')}`;
  document.querySelector('.context-panel').innerHTML = `<button class="icon-button" id="sidebar-toggle" aria-label="${escape(t(panelOpen() ? 'collapse' : 'expand'))}" aria-expanded="${panelOpen()}">${icon('panel')}</button><div class="context-content">${section('Main', ['overview', 'tokens', 'components', 'kits'])}${section('System', ['settings'])}</div><button class="context-bottom" id="sidebar-account"><span class="avatar">DS</span><span class="nav-label"><strong>${t('localWorkspace')}</strong><small>${t('localData')}</small></span></button>`;
  const guideLink = document.createElement('a'); guideLink.className = `context-link${current === 'learn' ? ' active' : ''}`; guideLink.href = '#/learn'; guideLink.setAttribute('aria-label', 'Guide'); guideLink.innerHTML = `${icon('components')}<span class="nav-label">Guide</span>`; document.querySelector('.context-content .context-label')?.after(guideLink);
  document.querySelector('#sidebar-toggle').onclick = () => { savePreference('panel', panelOpen() ? 'collapsed' : 'expanded'); render(); };
  document.querySelector('#sidebar-account').onclick = () => document.querySelector('#account-menu').click();
  document.querySelectorAll('[data-group]').forEach(button => button.onclick = () => { activeGroup = button.dataset.group; render(); });
  document.querySelector('[data-history]')?.addEventListener('click', showHistory);
  const parentTitle = route.module === 'settings' || route.module === 'components' && route.params.name ? t(route.module) : null;
  document.querySelector('.breadcrumbs').innerHTML = `<span>${escape(t('workspace'))}</span>${icon('chevronRight')}${parentTitle ? `<span>${escape(parentTitle)}</span>${icon('chevronRight')}` : ''}<strong aria-current="page">${escape(routeTitle())}</strong>`;
}
function routeTitle() {
  if (route.module === 'kits') return 'Design kits';
  if (route.module === 'learn') return 'Guide';
  if (route.module === 'components' && route.params.name) {
    const entry = registry.find(item => item.name === route.params.name);
    return entry ? componentLabel(entry) : t('notFound');
  }
  return t(route.section || route.module);
}
function pageHeader(title, description, actions = '') { return `<div class="page-heading"><div><div class="eyebrow">${t('workspace')}</div><h1>${escape(title)}</h1><p>${escape(description)}</p></div>${actions ? `<div class="page-actions">${actions}</div>` : ''}</div>`; }
function componentLabel(entry) {
  const chinese = { button: '按钮', input: '输入框', select: '选择器', checkbox: '复选框', switch: '开关', tag: '标签', pill: '胶囊标签', tabs: '选项卡', table: '表格', modal: '对话框', toast: '消息提示', tooltip: '工具提示', popover: '弹出菜单' };
  return getLanguage() === 'zh' ? chinese[entry.name] || entry.label : entry.label;
}
function dateLabel(value) { const date = new Date(value); return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat(getLanguage() === 'zh' ? 'zh-CN' : 'en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date); }
function renderOverview(main) {
  const state = getPWAState();
  main.innerHTML = `${pageHeader(t('overview'), t('overviewDescription'))}<section class="welcome-card"><div class="welcome-copy"><span class="eyebrow">${t('designFoundation')}</span><h2>${t('welcome')}</h2><p>${t('quickStartDescription')}</p><a class="button button-primary" href="#/tokens">${t('exploreTokens')}${icon('arrowRight')}</a></div><div class="foundation-art" aria-hidden="true"><div class="art-grid"><span></span><span></span><span></span><span></span></div><div class="art-label">Aa <span>↗</span></div><div class="art-line"></div></div></section><section class="metric-grid" aria-label="${escape(t('workspaceOverview'))}">${[{ name: 'tokenCount', value: tokenEntries().length, description: 'tokenMetric', icon: 'tokens' }, { name: 'componentCount', value: registry.length, description: 'componentMetric', icon: 'components' }, { name: 'editCount', value: changeLog.length, description: 'editMetric', icon: 'clock' }, { name: 'version', value: VERSION, description: 'versionMetric', icon: 'code' }].map(metric => `<article class="card metric"><div class="metric-top"><span>${t(metric.name)}</span><span class="metric-icon">${icon(metric.icon)}</span></div><strong>${escape(metric.value)}</strong><small>${t(metric.description)}</small></article>`).join('')}</section><div class="overview-grid"><section class="card recent-card"><div class="card-heading"><h2>${t('recentEdits')}</h2><a href="#/tokens">${t('viewAll')}${icon('arrowRight')}</a></div>${changeLog.length ? `<div class="recent-list">${changeLog.slice(0, 5).map(item => `<div class="recent-item"><span class="recent-icon">${icon('edit')}</span><div><strong>${escape(item.token)}</strong><small>${escape(item.new)} <span aria-hidden="true">·</span> ${t(item.mode)}</small></div><time datetime="${escape(item.time)}">${dateLabel(item.time)}</time></div>`).join('')}</div>` : `<div class="empty-state"><span class="empty-icon">${icon('clock')}</span><h3>${t('noEdits')}</h3><p>${t('noEditsDescription')}</p><a href="#/tokens" class="text-link">${t('exploreTokens')}${icon('arrowRight')}</a></div>`}</section><section class="card status-card"><div class="card-heading"><h2>${t('runtimeStatus')}</h2>${icon('wifi')}</div><div class="status-item"><span>${t('online')}</span><span class="badge"><i class="status-dot ${navigator.onLine ? '' : 'is-offline'}"></i>${t(navigator.onLine ? 'online' : 'offline')}</span></div><div class="status-item"><span>PWA</span><strong>${t(state.installed ? 'installed' : 'browserMode')}</strong></div><div class="status-item"><span>${t('version')}</span><strong>${escape(VERSION)}</strong></div><p class="status-note">${t(state.updateAvailable ? 'updateReady' : navigator.serviceWorker?.controller ? 'serviceReady' : 'servicePending')}</p><a class="button button-block" href="#/settings/pwa">${t('manageUpdates')}${icon('arrowRight')}</a></section></div><section class="quick-links"><a href="#/tokens"><span class="quick-icon">${icon('tokens')}</span><div><h3>${t('foundations')}</h3><p>${t('tokensDescription')}</p></div>${icon('arrowRight')}</a><a href="#/components"><span class="quick-icon">${icon('components')}</span><div><h3>${t('library')}</h3><p>${t('componentsDescription')}</p></div>${icon('arrowRight')}</a></section>`;
  main.insertAdjacentHTML('beforeend', '<section class="card info-card"><div><h2>Appearance</h2><p>Compare three design kits with the same reference screens.</p><a class="button" href="#/kits">Explore design kits</a></div></section>');
  const chartCard = document.createElement('section'); chartCard.className = 'card learn-card'; chartCard.append(createChart({ type: 'line', title: 'Mock customer growth — demonstration data', labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], series: [{ name: 'Mock customers', values: [18, 24, 23, 36, 42] }, { name: 'Mock trials', values: [8, 12, 10, 18, 20] }] })); main.append(chartCard);
}
function tokenPreview(group, name, value) {
  if (group === 'Color') return `<span class="token-swatch" style="background:${escape(value)}"></span>`;
  if (group === 'Typography') return `<span class="type-preview" style="${name.includes('family') || name.includes('mono') || name.includes('numeric') ? 'font-family' : name === 'line-height' ? 'line-height' : 'font-size'}:${escape(value)}">Aa</span>`;
  if (group === 'Spacing') return `<span class="space-preview" style="width:${escape(value)}"></span>`;
  if (group === 'Radius') return `<span class="radius-preview" style="border-radius:${escape(value)}"></span>`;
  if (!['Shadow', 'Color', 'Typography', 'Spacing', 'Radius'].includes(group)) return `<code>${escape(value)}</code>`;
  return `<span class="shadow-preview" style="box-shadow:${escape(value)}"></span>`;
}
function renderTokens(main) {
  main.innerHTML = `${pageHeader(t('tokens'), t('tokensDescription'), `<button class="button" id="copy-css">${icon('copy')}${t('copyCSS')}</button><button class="button button-primary" id="export-tokens">${icon('download')}${t('exportJSON')}</button>`)}<section class="card token-card"><div class="token-toolbar"><div class="search-field">${icon('search')}<input id="token-search" type="search" aria-label="${escape(t('searchTokens'))}" placeholder="${escape(t('searchTokens'))}" value="${escape(searchQuery)}"></div><div class="mode-toggle" role="group" aria-label="${escape(t('mode'))}"><button class="${editMode === 'light' ? 'active' : ''}" data-mode="light" aria-pressed="${editMode === 'light'}">${icon('sun')}${t('light')}</button><button class="${editMode === 'dark' ? 'active' : ''}" data-mode="dark" aria-pressed="${editMode === 'dark'}">${icon('moon')}${t('dark')}</button></div></div><div class="mobile-groups">${['all', ...Object.keys(tokens)].map(group => `<button class="chip ${activeGroup === group ? 'active' : ''}" data-filter-group="${escape(group)}">${t(group === 'all' ? 'allTokens' : group)}</button>`).join('')}</div><div id="token-groups"></div><div class="token-footer"><span>${t('tokenDescription')}</span><div><button class="text-button" id="history-button">${icon('clock')}${t('history')}</button><button class="text-button" id="reset-all" ${!Object.keys(overrides).length ? 'disabled' : ''}>${icon('reset')}${t('resetAll')}</button></div></div></section><p class="page-note">${icon('info')}${t('tokenHelp')}</p>`;
  drawTokenRows();
  document.querySelector('#token-search').oninput = event => { searchQuery = event.target.value; drawTokenRows(); };
  document.querySelectorAll('[data-mode]').forEach(button => button.onclick = () => { editMode = button.dataset.mode; render(); });
  document.querySelectorAll('[data-filter-group]').forEach(button => button.onclick = () => { activeGroup = button.dataset.filterGroup; render(); });
  document.querySelector('#export-tokens').onclick = exportTokens;
  document.querySelector('#copy-css').onclick = copyCSS;
  document.querySelector('#history-button').onclick = showHistory;
  document.querySelector('#reset-all').onclick = () => dialog(t('resetConfirm'), `<p>${t('resetDescription')}</p>`, [{ label: t('cancel'), run: close => close() }, { label: t('resetAll'), danger: true, run: close => {
    const previous = overrides;
    if (!storage.write('forma.token-overrides', {})) return;
    overrides = {};
    for (const { name, values } of tokenEntries()) for (const mode of ['light', 'dark']) if (previous[name]?.[mode] !== undefined) logEdit(name, mode, previous[name][mode], values[mode]);
    applyOverrides(); close(); render(); notify(t('saved'));
  } }], { onClose: close => close() });
}
function drawTokenRows() {
  const groups = Object.entries(tokens).filter(([group]) => activeGroup === 'all' || group === activeGroup).map(([group, values]) => {
    const entries = Object.entries(values).filter(([name]) => `${name} ${group} ${t(group)} ${tokenValue(name, editMode)}`.toLowerCase().includes(searchQuery.trim().toLowerCase()));
    if (!entries.length) return '';
    return `<section class="token-group"><div class="token-group-title"><span>${icon(groupIcons[group])}${t(group)}</span><span>${entries.length}</span></div><div class="token-table-labels"><span>${t('token')}</span><span>${t('value')}</span><span>${t('preview')}</span><span></span></div>${entries.map(([name]) => `<div class="token-row-wrap"><button class="token-row" data-token="${escape(name)}" data-token-group="${escape(group)}"><span class="token-name"><span>--${escape(name)}</span>${overrides[name]?.[editMode] !== undefined ? `<small class="edited-label">${t('edited')}</small>` : ''}</span><code>${escape(tokenValue(name, editMode))}</code><span class="token-preview">${tokenPreview(group, name, tokenValue(name, editMode))}</span>${icon('edit')}</button>${overrides[name]?.[editMode] !== undefined ? `<button class="token-reset icon-button" data-reset="${escape(name)}" aria-label="${escape(`${t('reset')} ${name}`)}">${icon('reset')}</button>` : ''}</div>`).join('')}</section>`;
  }).join('');
  document.querySelector('#token-groups').innerHTML = groups || `<div class="empty-state"><h3>${t('noResults')}</h3></div>`;
  document.querySelectorAll('[data-token]').forEach(button => button.onclick = () => editToken(button.dataset.tokenGroup, button.dataset.token));
  document.querySelectorAll('[data-reset]').forEach(button => button.onclick = () => resetToken(button.dataset.reset));
}
function resetToken(name) {
  const previous = tokenValue(name, editMode);
  const nextOverrides = structuredClone(overrides);
  delete nextOverrides[name][editMode];
  if (!Object.keys(nextOverrides[name]).length) delete nextOverrides[name];
  if (!storage.write('forma.token-overrides', nextOverrides)) return;
  overrides = nextOverrides;
  logEdit(name, editMode, previous, tokenValue(name, editMode));
  applyOverrides(); render(); notify(t('saved'));
}
function editToken(group, name) {
  const initial = tokenValue(name, editMode);
  draft = { name, mode: editMode, group, value: initial, valid: true };
  const editor = dialog(`${t('editToken')} · ${name}`, `<div class="editor-meta"><code>--${escape(name)}</code><span class="badge">${t(editMode)}</span></div><label class="field-label" for="token-value">${t('value')}</label><div class="editor-input-row">${group === 'Color' && /^#[a-f\d]{6}$/i.test(initial) ? `<input type="color" class="color-picker" id="token-color" value="${escape(initial)}" aria-label="${escape(t('Color'))}">` : ''}<input class="field" id="token-value" value="${escape(initial)}" spellcheck="false" autocomplete="off" aria-describedby="token-error token-preview-help"></div><p class="field-error" id="token-error" role="alert"></p><p class="field-help" id="token-preview-help">${t('livePreview')}</p>`, [
    { label: t('cancel'), run: close => { discardDraft(); close(); } },
    { label: t('save'), primary: true, id: 'save-token', run: close => { if (saveDraft()) { close(); render(); } } },
  ], { onClose: async close => { if (!window.appDirty || await window.resolveDirty()) { discardDraft(); close(); render(); } } });
  editor.layer.classList.add('token-editor-layer');
  const input = editor.layer.querySelector('#token-value');
  const picker = editor.layer.querySelector('#token-color');
  const update = value => {
    const normalized = normalizeToken(group, name, value);
    draft = { name, mode: editMode, group, value: normalized.valid ? normalized.value : value, valid: normalized.valid };
    window.appDirty = value !== initial;
    updateNotifications();
    input.setAttribute('aria-invalid', String(!normalized.valid));
    editor.layer.querySelector('#token-error').textContent = normalized.error || '';
    editor.layer.querySelector('#save-token').disabled = !normalized.valid;
    if (picker && normalized.valid) picker.value = normalized.value;
    if (normalized.valid) applyOverrides();
  };
  input.oninput = () => update(input.value);
  if (picker) picker.oninput = () => { input.value = picker.value; update(picker.value); };
}
function mergedTokens() {
  const result = structuredClone(tokens);
  for (const values of Object.values(result)) for (const [name, modes] of Object.entries(values)) for (const mode of ['light', 'dark']) modes[mode] = tokenValue(name, mode);
  return result;
}
function exportTokens() {
  const url = URL.createObjectURL(new Blob([`${JSON.stringify(mergedTokens(), null, 2)}\n`], { type: 'application/json' }));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'tokens.json'; document.body.append(anchor); anchor.click(); anchor.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); notify(t('downloadStarted'));
}
async function copyCSS() {
  const result = ['light', 'dark'].map(mode => `${mode === 'light' ? ':root' : '[data-theme=dark]'} {\n${tokenEntries().map(({ name }) => `  --${name}: ${tokenValue(name, mode)};`).join('\n')}\n}`).join('\n');
  try { await navigator.clipboard.writeText(`${result}\n`); notify(t('copied')); } catch {
    const fallback = dialog(t('copyCSS'), `<p>${t('copyFailed')}</p><textarea class="field css-export" readonly aria-label="CSS">${escape(result)}</textarea>`, [{ label: t('close'), run: close => close() }], { onClose: close => close() });
    fallback.layer.querySelector('textarea').select();
  }
}
function showHistory() {
  dialog(t('history'), changeLog.length ? `<div class="history-list">${changeLog.map(item => `<article class="history-item"><div><strong>--${escape(item.token)}</strong><span class="badge">${t(item.mode)}</span><time datetime="${escape(item.time)}">${dateLabel(item.time)}</time></div><p><span>${t('oldValue')}: <code>${escape(item.old)}</code></span>${icon('arrowRight')}<span>${t('newValue')}: <code>${escape(item.new)}</code></span></p></article>`).join('')}</div>` : `<div class="empty-state"><h3>${t('noHistory')}</h3></div>`, [{ label: t('close'), run: close => close() }], { className: 'history-dialog', onClose: close => close() });
}
function renderComponents(main) {
  const entry = registry.find(item => item.name === route.params.name);
  if (route.params.name && !entry) return renderNotFound(main);
  if (entry) {
    main.innerHTML = `<a class="back-link" href="#/components">${icon('arrowLeft')}${t('backComponents')}</a>${pageHeader(componentLabel(entry), t('componentsDescription'))}<div id="component-playground"></div>`;
    entry.render(main.querySelector('#component-playground'));
    return;
  }
  main.innerHTML = `${pageHeader(t('components'), t('componentsDescription'))}<section class="library-intro"><span class="quick-icon">${icon('components')}</span><div><h2>${t('componentIntro')}</h2><p>${t('componentIntroBody')}</p></div></section><div class="component-grid">${registry.map(entry => `<a class="card component-tile" href="#/components/${encodeURIComponent(entry.name)}"><div class="component-tile-preview" aria-hidden="true">${componentIllustration(entry.name)}</div><div class="component-tile-body"><h2>${escape(componentLabel(entry))}</h2><span>${t('openPlayground')}${icon('arrowRight')}</span></div></a>`).join('')}</div>`;
}
function componentIllustration(name) {
  if (name === 'button') return `<span class="illustration-button">${getLanguage() === 'zh' ? '开始使用' : 'Get started'} ${icon('arrowRight')}</span>`;
  if (name === 'input' || name === 'select') return `<span class="illustration-field">${name === 'input' ? icon('search') : ''}${getLanguage() === 'zh' ? '输入您的内容' : 'Your content here'}${name === 'select' ? icon('chevronDown') : ''}</span>`;
  if (name === 'switch') return '<span class="illustration-switch"><i></i></span>';
  if (name === 'checkbox') return `<span class="illustration-check">${icon('check')}</span><span>${getLanguage() === 'zh' ? '保持统一' : 'Keep it consistent'}</span>`;
  if (name === 'tag' || name === 'pill') return `<span class="badge"><i class="status-dot"></i>${getLanguage() === 'zh' ? '已发布' : 'Published'}</span>`;
  if (name === 'tabs') return `<span class="illustration-tabs"><b>${t('overview')}</b><span>${t('settings')}</span></span>`;
  return `<span class="illustration-generic">${icon(name === 'table' ? 'overview' : name === 'modal' ? 'panel' : name === 'toast' ? 'check' : name === 'tooltip' ? 'info' : 'more')}</span>`;
}
function settingRow(title, description, control) { return `<div class="setting-row"><div><h3>${t(title)}</h3><p>${t(description)}</p></div><div class="setting-control">${control}</div></div>`; }
function choice(key, choices) { return `<div class="segmented-control" role="group" aria-label="${escape(t(key))}">${choices.map(([value, title]) => `<button data-pref="${key}" data-value="${escape(value)}" class="${String(prefs[key]) === String(value) ? 'active' : ''}" aria-pressed="${String(prefs[key]) === String(value)}">${escape(t(title))}</button>`).join('')}</div>`; }
function renderSettings(main) {
  const section = route.section || 'general';
  main.innerHTML = `${pageHeader(t(section), t('settingsDescription'))}<nav class="settings-tabs" aria-label="${escape(t('settings'))}">${settingsSections.map(item => `<a href="#/settings/${item}" class="${section === item ? 'active' : ''}" ${section === item ? 'aria-current="page"' : ''}>${t(item)}</a>`).join('')}</nav><div id="settings-content"></div>`;
  const content = main.querySelector('#settings-content');
  if (section === 'pwa') { renderPWA(content); return; }
  if (section === 'about') content.innerHTML = `<section class="card about-card"><span class="brand-mark about-mark">${icon('logo')}</span><h2>Forma</h2><p>${t('aboutDescription')}</p><div class="version-grid"><div><span>${t('version')}</span><strong id="app-version">${escape(VERSION)}</strong></div><div><span>${t('build')}</span><code id="app-build">${escape(BUILD)}</code></div></div><p class="technology-label">${icon('code')}${t('technology')}</p></section><section class="card info-card">${icon('shield')}<div><h2>${t('localData')}</h2><p>${t('localDataDescription')}</p></div></section>`;
  if (section === 'general') content.innerHTML = `<section class="card settings-card"><div class="card-heading"><h2>${t('preferences')}</h2>${icon('settings')}</div>${settingRow('landingPage', 'landingDescription', `<button class="button preference-menu" data-pref-menu="landingPage" aria-haspopup="menu" aria-expanded="false">${t(prefs.landingPage.slice(1))}${icon('chevronDown')}</button>`)}${settingRow('density', 'densityDescription', choice('density', [['comfortable', 'comfortable'], ['compact', 'compact']]))}${settingRow('pageSize', 'pageSizeDescription', `<button class="button preference-menu" data-pref-menu="pageSize" aria-haspopup="menu" aria-expanded="false">${prefs.pageSize}${icon('chevronDown')}</button>`)}</section>`;
  if (section === 'appearance') content.innerHTML = `<section class="card settings-card"><div class="card-heading"><h2>${t('appearanceTitle')}</h2>${icon('sun')}</div>${settingRow('theme', 'themeDescription', choice('theme', [['light', 'light'], ['dark', 'dark'], ['system', 'system']]))}${settingRow('density', 'densityDescription', choice('density', [['comfortable', 'comfortable'], ['compact', 'compact']]))}${settingRow('panel', 'panelDescription', choice('panel', [['expanded', 'expanded'], ['collapsed', 'collapsed']]))}${settingRow('reducedMotion', 'reducedMotionDescription', `<button class="preference-switch ${prefs.reducedMotion ? 'is-on' : ''}" role="switch" aria-checked="${prefs.reducedMotion}" aria-label="${escape(t('reducedMotion'))}" id="motion-toggle"><span></span></button>`)}</section>`;
  if (section === 'appearance') content.insertAdjacentHTML('beforeend', `<section class="card settings-card"><div class="card-heading"><h2>Palette</h2><span>Accent only · light and dark</span></div><div class="palette-picker">${palettes.map(name => `<button class="button" data-pref="palette" data-value="${name}" aria-pressed="${prefs.palette === name}"><span class="palette-dot palette-${name}" aria-hidden="true"></span>${label(name)}</button>`).join('')}</div></section><section class="card settings-card"><div class="card-heading"><h2>Design kit</h2><a href="#/kits">Compare reference screens</a></div><div class="kit-picker">${kitNames.map(name => `<button class="button" data-pref="kit" data-value="${name}" aria-pressed="${prefs.kit === name}"><span class="kit-preview" aria-hidden="true"></span><strong>${label(name)}</strong><small>${name === 'enterprise' ? 'Solid surfaces · balanced workspace' : name === 'liquid' ? 'Glass chrome · readable solid content' : 'Compact operations · tabular numbers'}</small></button>`).join('')}</div></section>`);
  content.querySelectorAll('[data-pref]').forEach(button => button.onclick = () => { savePreference(button.dataset.pref, button.dataset.value); render(); notify(t('preferencesSaved')); });
  content.querySelectorAll('[data-pref-menu]').forEach(button => button.onclick = () => {
    const key = button.dataset.prefMenu;
    const values = key === 'landingPage' ? ['/overview', '/tokens', '/components'] : [5, 10, 20, 50];
    menu(button, values.map(value => ({ label: key === 'landingPage' ? t(value.slice(1)) : String(value), checked: prefs[key] === value, run: () => { savePreference(key, value); render(); notify(t('preferencesSaved')); } })));
  });
  content.querySelector('#motion-toggle')?.addEventListener('click', () => { savePreference('reducedMotion', !prefs.reducedMotion); render(); });
}
function renderNotFound(main) { main.innerHTML = `<div class="empty-state not-found">${icon('search')}<h1>${t('notFound')}</h1><p>${t('notFoundDescription')}</p><a class="button button-primary" href="#/overview">${t('goHome')}</a></div>`; }
function render() {
  document.querySelector('.app-menu')?.remove();
  renderShell(); renderContext();
  const main = document.querySelector('#main-content');
  if (route.module === 'overview') renderOverview(main);
  else if (route.module === 'tokens') renderTokens(main);
  else if (route.module === 'components') renderComponents(main);
  else if (route.module === 'settings') renderSettings(main);
  else if (route.module === 'kits') renderShowcase(main, { prefs, savePreference, resolveDirty: window.resolveDirty, notify });
  else if (route.module === 'learn') renderLearn(main, tokens);
  else renderNotFound(main);
  document.title = `${routeTitle()} — Forma`;
}
mediaTheme.addEventListener('change', () => { if (prefs.theme === 'system') applyPreferences(); });
tablet.addEventListener('change', applyPreferences);
window.addEventListener('pwa:state', () => { if (route?.module === 'overview') renderOverview(document.querySelector('#main-content')); });

document.addEventListener('keydown', event => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') { event.preventDefault(); document.querySelector('#global-search')?.focus(); } });
function notificationItems() {
  const items = [];
  if (getPWAState().updateAvailable) items.push({ label: 'Application update available', run: () => { location.hash = '#/settings/pwa'; } });
  if (window.appDirty) items.push({ label: 'Unsaved changes', run: () => window.resolveDirty() });
  for (const entry of changeLog.slice(0, 5)) items.push({ label: `Token changed: ${entry.token}`, description: dateLabel(entry.time), run: showHistory });
  return items.length ? items : [{ label: 'No notifications' }];
}
function updateNotifications() {
  const count = notificationItems().filter(item => item.run).length;
  const badge = document.querySelector('#notification-count');
  if (badge) { badge.textContent = count || ''; badge.hidden = !count; }
}
window.addEventListener('pwa:state', updateNotifications);
window.addEventListener('app:dirty', updateNotifications);
async function start() {
  applyPreferences();
  try {
    const response = await fetch('./tokens/tokens.json');
    if (!response.ok) throw new Error(`Token request failed (${response.status})`);
    tokens = await response.json();
    sanitizeOverrides(); applyOverrides();
    router = createRouter(next => { route = next; render(); }, { landing: prefs.landingPage, beforeNavigate: window.resolveDirty });
    initPWA();
  } catch (error) {
    root.innerHTML = `<main class="boot-state"><h1>${getLanguage() === 'zh' ? '工作区无法启动' : 'Unable to start workspace'}</h1><p>${escape(error.message)}</p><button class="button" id="retry-start">${getLanguage() === 'zh' ? '重试' : 'Try again'}</button></main>`;
    document.querySelector('#retry-start').onclick = start;
  }
}
start();
