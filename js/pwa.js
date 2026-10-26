import { VERSION, BUILD } from './build-info.js';

const state = {
  supported: 'serviceWorker' in navigator,
  online: navigator.onLine,
  installed: window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true,
  updateAvailable: false, checking: false, updating: false, error: '', message: '',
  version: VERSION, build: BUILD, installedBuild: '', installAvailable: false,
};
let registration;
let initialized = false;
let installPrompt;
let updateRequested = false;
let reloaded = false;
let updateTimer;
let banner;
let overlay;
let activeContainer;

const strings = {
  en: {
    title: 'PWA & Updates', version: 'Application version', build: 'Loaded build', installedBuild: 'Active service worker build',
    unavailable: 'Not active yet', online: 'Online', offline: 'Offline — your app shell, tokens and component docs remain available.',
    installed: 'Installed app', browser: 'Running in browser', ready: 'New version available', check: 'Check for updates', checking: 'Checking…',
    update: 'Update now', updating: 'Installing update…', retry: 'Retry update', clear: 'Clear offline cache', install: 'Install app',
    contract: 'Offline support includes the app shell, tokens and component documentation after the first complete online load. Token edits stay in this browser. No server writes exist.',
    installHelp: 'To install, use your browser’s Install app command. On iPhone or iPad, use Share → Add to Home Screen.',
    unsupported: 'Service workers are unavailable. Use HTTPS or localhost in a supported browser.',
    current: 'You are up to date.', failed: 'The update could not finish. Check your connection and retry.',
    checkFailed: 'Could not check for updates. Check your connection and try again.', registrationFailed: 'Offline setup failed. Reload while online to try again.',
    clearConfirm: 'Clear this application’s offline cache? The app will reload and download a fresh offline copy. Continue only while online.',
    clearFailed: 'Could not clear the offline cache. Please try again.', offlineClear: 'Go online before clearing the cache so offline support can be restored.',
    installing: 'Please keep this page open. It will reload once the new version is ready.', dismiss: 'Close', retrySetup: 'Retry offline setup',
  },
  zh: {
    title: 'PWA 与更新', version: '应用版本', build: '当前页面构建', installedBuild: '活动服务工作线程构建',
    unavailable: '尚未激活', online: '在线', offline: '离线 — 应用框架、设计令牌和组件文档仍可使用。',
    installed: '已安装应用', browser: '在浏览器中运行', ready: '有新版本可用', check: '检查更新', checking: '正在检查…',
    update: '立即更新', updating: '正在安装更新…', retry: '重试更新', clear: '清除离线缓存', install: '安装应用',
    contract: '首次完整在线加载后，应用框架、设计令牌和组件文档均支持离线使用。令牌修改保存在此浏览器中，不会写入服务器。',
    installHelp: '请使用浏览器的“安装应用”功能。iPhone 或 iPad 可选择“分享 → 添加到主屏幕”。',
    unsupported: '服务工作线程不可用。请在支持的浏览器中使用 HTTPS 或 localhost。',
    current: '当前已是最新版本。', failed: '更新未能完成。请检查网络后重试。',
    checkFailed: '无法检查更新。请检查网络后重试。', registrationFailed: '离线设置失败。请联网后重新加载。',
    clearConfirm: '清除此应用的离线缓存？应用将重新加载并下载新的离线副本。请仅在联网时继续。',
    clearFailed: '无法清除离线缓存，请重试。', offlineClear: '请先联网再清除缓存，以便恢复离线支持。',
    installing: '请保持页面打开，新版本就绪后将自动重新加载一次。', dismiss: '关闭', retrySetup: '重试离线设置',
  },
};
const text = key => strings[document.documentElement.lang.startsWith('zh') ? 'zh' : 'en'][key];

export function getPWAState() { return { ...state }; }

function button(label, action, disabled = false) {
  const element = document.createElement('button');
  element.type = 'button';
  element.className = 'pwa-button';
  element.textContent = label;
  element.disabled = disabled;
  element.addEventListener('click', action);
  return element;
}

function publish() {
  renderBanner();
  if (activeContainer?.isConnected) renderPWA(activeContainer);
  else activeContainer = undefined;
  window.dispatchEvent(new CustomEvent('pwa:state', { detail: getPWAState() }));
}

async function resolveEdits() {
  if (typeof window.resolveDirty === 'function') return (await window.resolveDirty()) === true;
  return !window.appDirty;
}

function addStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .pwa-banner{position:fixed;z-index:90;bottom:calc(80px + env(safe-area-inset-bottom));left:50%;transform:translateX(-50%);width:min(620px,calc(100% - 32px));padding:var(--space);border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
    .pwa-banner[hidden],.pwa-overlay[hidden]{display:none}.pwa-actions{display:flex;gap:12px;flex-wrap:wrap;margin-block:var(--space)}
    .pwa-button{min-height:44px;padding:10px 16px;border:1px solid var(--border);border-radius:var(--radius);background:var(--surface);color:var(--text);font:inherit;cursor:pointer}.pwa-button:hover{border-color:var(--accent)}.pwa-button:focus-visible{outline:2px solid var(--accent);outline-offset:3px}.pwa-button:disabled{opacity:.55;cursor:default}
    .pwa-facts{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:12px}.pwa-facts dt{color:var(--muted)}.pwa-facts dd{margin:0;overflow-wrap:anywhere}.pwa-note{color:var(--muted);line-height:1.6}.pwa-error{color:var(--danger)}
    .pwa-overlay{position:fixed;inset:0;z-index:1000;background:var(--bg);color:var(--text);display:grid;place-items:center;padding:var(--space)}.pwa-update-card{width:min(100%,480px);padding:calc(var(--space) * 2);background:var(--surface);border:1px solid var(--border);border-radius:var(--radius)}
    .pwa-spinner{display:inline-block;width:24px;height:24px;border:3px solid var(--border);border-top-color:var(--accent);border-radius:50%;animation:pwa-spin 1s linear infinite}@keyframes pwa-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.pwa-spinner{animation:none}}
  `;
  document.head.append(style);
}

function renderBanner() {
  if (!banner) return;
  banner.replaceChildren();
  banner.hidden = state.online && !state.updateAvailable && !state.error;
  if (banner.hidden) return;
  const status = document.createElement('span');
  status.textContent = !state.online ? text('offline') : state.updateAvailable ? text('ready') : state.error;
  banner.append(status);
  if (state.updateAvailable) banner.append(button(text('update'), applyUpdate, state.updating));
  else if (state.error && state.supported && !registration) banner.append(button(text('retrySetup'), registerWorker));
}

function showOverlay(failed = false) {
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'pwa-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', text('updating'));
    document.body.append(overlay);
  }
  overlay.hidden = false;
  overlay.replaceChildren();
  const card = document.createElement('div');
  card.className = 'pwa-update-card';
  const heading = document.createElement('h2');
  heading.textContent = text(failed ? 'failed' : 'updating');
  card.append(heading);
  if (!failed) {
    const spinner = document.createElement('span');
    spinner.className = 'pwa-spinner';
    spinner.setAttribute('aria-hidden', 'true');
    const message = document.createElement('p');
    message.setAttribute('role', 'status');
    message.textContent = text('installing');
    card.append(spinner, message);
    card.tabIndex = -1;
  } else {
    card.append(button(text('retry'), applyUpdate), button(text('dismiss'), () => { overlay.hidden = true; }));
  }
  overlay.append(card);
  overlay.onkeydown = event => {
    if (event.key === 'Tab') {
      const buttons = [...overlay.querySelectorAll('button')];
      if (!buttons.length) { event.preventDefault(); return; }
      if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1).focus(); }
      else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0].focus(); }
    }
    if (event.key === 'Escape' && failed) overlay.hidden = true;
  };
  (card.querySelector('button') || card).focus();
}

async function activeBuild() {
  const controller = navigator.serviceWorker.controller;
  if (!controller) return;
  const channel = new MessageChannel();
  const value = await new Promise(resolve => {
    const timeout = setTimeout(() => { channel.port1.close(); resolve(''); }, 2500);
    channel.port1.onmessage = event => {
      clearTimeout(timeout);
      channel.port1.close();
      resolve(typeof event.data?.build === 'string' ? event.data.build : '');
    };
    controller.postMessage({ type: 'GET_BUILD' }, [channel.port2]);
  });
  state.installedBuild = value;
  publish();
}

function observeRegistration(value) {
  registration = value;
  state.updateAvailable = Boolean(value.waiting && navigator.serviceWorker.controller);
  function watch(worker) {
    if (!worker) return;
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed') {
        state.updateAvailable = Boolean(value.waiting && navigator.serviceWorker.controller);
        publish();
      }
      if (worker.state === 'redundant' && state.updating) failUpdate();
    });
  }
  watch(value.installing);
  value.addEventListener('updatefound', () => watch(value.installing));
  publish();
  activeBuild();
}

async function registerWorker() {
  state.error = '';
  try {
    observeRegistration(await navigator.serviceWorker.register(new URL('../sw.js', import.meta.url), { updateViaCache: 'none' }));
  } catch {
    state.error = text('registrationFailed');
    publish();
  }
}

function failUpdate() {
  clearTimeout(updateTimer);
  state.updating = false;
  state.error = text('failed');
  showOverlay(true);
  publish();
}

async function applyUpdate() {
  if (state.updating || !(await resolveEdits())) return;
  if (!registration?.waiting) {
    await checkForUpdates();
    if (!registration?.waiting) return;
  }
  state.updating = true;
  state.error = '';
  updateRequested = true;
  showOverlay();
  publish();
  updateTimer = setTimeout(failUpdate, 20000);
  try { registration.waiting.postMessage({ type: 'SKIP_WAITING' }); }
  catch { failUpdate(); }
}

async function checkForUpdates() {
  if (state.checking) return;
  state.checking = true;
  state.error = '';
  state.message = '';
  publish();
  try {
    if (!registration) await registerWorker();
    if (!registration) throw new Error('No service worker registration');
    await registration.update();
    state.updateAvailable = Boolean(registration.waiting && navigator.serviceWorker.controller);
    if (!state.updateAvailable && !registration.installing) state.message = text('current');
  } catch { state.error = text('checkFailed'); }
  finally { state.checking = false; publish(); }
}

async function clearOfflineCache() {
  if (!(await resolveEdits())) return;
  if (!navigator.onLine) { state.error = text('offlineClear'); publish(); return; }
  if (!window.confirm(text('clearConfirm'))) return;
  try {
    const scope = registration?.scope || new URL('../', import.meta.url).href;
    const prefix = `ds-admin-${new URL(scope).pathname}-`;
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(prefix)).map(name => caches.delete(name)));
    if (registration) await registration.unregister();
    location.reload();
  } catch { state.error = text('clearFailed'); publish(); }
}

async function installApp() {
  if (!installPrompt) return;
  const prompt = installPrompt;
  installPrompt = undefined;
  state.installAvailable = false;
  publish();
  await prompt.prompt();
  await prompt.userChoice;
}

export function initPWA() {
  if (initialized) return getPWAState();
  initialized = true;
  addStyles();
  banner = document.createElement('aside');
  banner.className = 'pwa-banner';
  banner.setAttribute('aria-live', 'polite');
  banner.hidden = true;
  document.body.append(banner);
  window.addEventListener('online', () => { state.online = true; publish(); });
  window.addEventListener('offline', () => { state.online = false; publish(); });
  window.addEventListener('app:language', () => {
    state.message = '';
    state.error = '';
    publish();
    if (state.updating) showOverlay();
  });
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    installPrompt = event;
    state.installAvailable = true;
    publish();
  });
  window.addEventListener('appinstalled', () => {
    state.installed = true;
    state.installAvailable = false;
    installPrompt = undefined;
    publish();
  });
  if (state.supported) {
    navigator.serviceWorker.addEventListener('controllerchange', async () => {
      if (updateRequested && !reloaded) {
        if (!(await resolveEdits())) { clearTimeout(updateTimer); state.updating = false; if (overlay) overlay.hidden = true; publish(); return; }
        reloaded = true;
        clearTimeout(updateTimer);
        location.reload();
      } else activeBuild();
    });
    registerWorker();
  }
  publish();
  return getPWAState();
}

export function renderPWA(container) {
  activeContainer = container;
  container.replaceChildren();
  const heading = document.createElement('h1');
  heading.textContent = text('title');
  const facts = document.createElement('dl');
  facts.className = 'pwa-facts';
  for (const [label, value] of [['version', VERSION], ['build', BUILD], ['installedBuild', state.installedBuild || text('unavailable')]]) {
    const term = document.createElement('dt');
    const detail = document.createElement('dd');
    term.textContent = text(label);
    detail.textContent = value;
    facts.append(term, detail);
  }
  const status = document.createElement('p');
  status.setAttribute('role', 'status');
  status.textContent = `${text(state.online ? 'online' : 'offline')} · ${text(state.installed ? 'installed' : 'browser')}`;
  const contract = document.createElement('p');
  contract.className = 'pwa-note';
  contract.textContent = text('contract');
  const help = document.createElement('p');
  help.className = 'pwa-note';
  help.textContent = text(state.supported ? 'installHelp' : 'unsupported');
  container.append(heading, facts, status, contract, help);
  if (state.supported) {
    const actions = document.createElement('div');
    actions.className = 'pwa-actions';
    actions.append(button(text(state.checking ? 'checking' : 'check'), checkForUpdates, state.checking || state.updating));
    if (state.updateAvailable) actions.append(button(text(state.updating ? 'updating' : 'update'), applyUpdate, state.updating));
    if (state.installAvailable) actions.append(button(text('install'), installApp));
    actions.append(button(text('clear'), clearOfflineCache, state.updating));
    container.append(actions);
  }
  if (state.updateAvailable || state.message || state.error) {
    const note = document.createElement('p');
    note.setAttribute('role', state.error ? 'alert' : 'status');
    note.className = state.error ? 'pwa-error' : 'pwa-note';
    note.textContent = state.error || (state.updateAvailable ? text('ready') : state.message);
    container.append(note);
  }
}
