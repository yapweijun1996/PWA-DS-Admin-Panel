import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { VERSION, BUILD } from '../js/build-info.js';

const root = new URL('../', import.meta.url);
const pwaSource = await readFile(new URL('js/pwa.js', root), 'utf8');
const appSource = await readFile(new URL('js/app.js', root), 'utf8');
const routerSource = await readFile(new URL('js/router.js', root), 'utf8');
const flush = () => new Promise(resolve => setImmediate(resolve));

class Events {
  listeners = new Map();
  addEventListener(type, listener) {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type).add(listener);
  }
  removeEventListener(type, listener) { this.listeners.get(type)?.delete(listener); }
  dispatchEvent(event) {
    event.target ??= this;
    event.currentTarget = this;
    this[`on${event.type}`]?.(event);
    for (const listener of [...(this.listeners.get(event.type) || [])]) listener(event);
    return true;
  }
  dispatch(type, properties = {}) { this.dispatchEvent({ type, preventDefault() {}, stopPropagation() {}, ...properties }); }
}

// A small DOM double exercises actual view/event behavior, not browser layout.
class ViewNode extends Events {
  constructor(tagName, document) {
    super();
    this.tagName = tagName;
    this.ownerDocument = document;
    this.children = [];
    this.attributes = {};
    this.dataset = {};
    this.className = '';
    this.hidden = false;
    this.disabled = false;
    this.style = { setProperty() {}, removeProperty() {} };
    this.classList = {
      add: name => { this.className = `${this.className} ${name}`.trim(); },
      remove: name => { this.className = this.className.split(' ').filter(value => value !== name).join(' '); },
    };
  }
  setAttribute(name, value) {
    this.attributes[name] = String(value);
    if (name === 'class') this.className = String(value);
    if (name === 'id' || name === 'href' || name === 'value') this[name] = String(value);
    if (name === 'hidden' || name === 'disabled') this[name] = true;
    if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, character) => character.toUpperCase())] = String(value);
  }
  getAttribute(name) { return name === 'class' ? this.className : this.attributes[name] ?? null; }
  append(...nodes) { for (const node of nodes) { if (node instanceof ViewNode) node.parentElement = this; this.children.push(node); } }
  replaceChildren(...nodes) {
    for (const child of this.children) if (child instanceof ViewNode) child.parentElement = null;
    this.children = [];
    this.append(...nodes);
  }
  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter(node => node !== this);
    this.parentElement = null;
  }
  after(node) {
    const parent = this.parentElement;
    parent.children.splice(parent.children.indexOf(this) + 1, 0, node);
    node.parentElement = parent;
  }
  contains(node) { return this === node || this.children.some(child => child instanceof ViewNode && child.contains(node)); }
  focus() { this.ownerDocument.activeElement = this; }
  click() { if (!this.disabled) this.dispatch('click'); }
  get firstElementChild() { return this.children.find(node => node instanceof ViewNode) || null; }
  get isConnected() { return this.ownerDocument.contains(this); }
  get textContent() { return this.children.map(node => node instanceof ViewNode ? node.textContent : node).join(''); }
  set textContent(value) { this.replaceChildren(String(value)); }
  set innerHTML(value) {
    this.replaceChildren();
    const stack = [this];
    for (const token of String(value).match(/<[^>]+>|[^<]+/g) || []) {
      if (token.startsWith('</')) { stack.pop(); continue; }
      if (!token.startsWith('<')) { stack.at(-1).append(token); continue; }
      const tag = /^<([\w-]+)/.exec(token)?.[1];
      if (!tag) continue;
      const node = new ViewNode(tag, this.ownerDocument);
      const attributes = token.slice(tag.length + 1, -1);
      for (const match of attributes.matchAll(/([^\s=/>]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) node.setAttribute(match[1], match[2] ?? match[3] ?? match[4] ?? '');
      stack.at(-1).append(node);
      if (!['input', 'meta', 'br', 'hr', 'img', 'link'].includes(tag) && !token.endsWith('/>')) stack.push(node);
    }
  }
  querySelectorAll(selector) {
    const simple = (node, part) => {
      if (part.startsWith('.')) return node.className.split(/\s+/).includes(part.slice(1));
      if (part.startsWith('#')) return node.id === part.slice(1);
      const attribute = /^\[([^=\]]+)(?:="([^"]*)")?\]$/.exec(part);
      if (attribute) return attribute[2] === undefined ? node.getAttribute(attribute[1]) !== null : node.getAttribute(attribute[1]) === attribute[2];
      return node.tagName === part;
    };
    const matches = (node, selection) => {
      const parts = selection.trim().split(/\s+/);
      if (!simple(node, parts.pop())) return false;
      let parent = node.parentElement;
      while (parts.length) {
        const part = parts.pop();
        while (parent && !simple(parent, part)) parent = parent.parentElement;
        if (!parent) return false;
        parent = parent.parentElement;
      }
      return true;
    };
    const result = [];
    for (const child of this.children) {
      if (!(child instanceof ViewNode)) continue;
      if (selector.split(',').some(part => matches(child, part))) result.push(child);
      result.push(...child.querySelectorAll(selector));
    }
    return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
}

function documentDouble() {
  const document = new ViewNode('document');
  document.ownerDocument = document;
  document.createElement = tag => new ViewNode(tag, document);
  document.getElementById = id => document.querySelector(`#${id}`);
  document.visibilityState = 'visible';
  document.documentElement = document.createElement('html');
  document.documentElement.lang = 'en';
  document.documentElement.dataset.theme = 'light';
  document.head = document.createElement('head');
  document.body = document.createElement('body');
  document.append(document.documentElement);
  document.documentElement.append(document.head, document.body);
  document.head.innerHTML = '<meta name="theme-color">';
  document.body.innerHTML = '<a class="skip-link"></a><div id="app"></div><div id="overlay-root"></div><div id="notification-root"></div>';
  return document;
}

function serviceWorker(state = 'installing') {
  return Object.assign(new Events(), {
    state, messages: [],
    postMessage(message, ports = []) {
      if (message.type === 'GET_BUILD') ports[0].postMessage({ build: BUILD });
      else this.messages.push(message.type);
    },
  });
}

function harness({ app = false, waiting = false, installing = false, controlled = true, deferRegistration = false } = {}) {
  const document = documentDouble();
  const events = new Events();
  const timers = new Map();
  const searchOpens = [];
  let now = 0;
  let timerId = 0;
  let registerCount = 0;
  let updateCount = 0;
  let reloadCount = 0;
  let updateAction;
  let releaseRegistration;
  const registration = Object.assign(new Events(), {
    scope: 'https://example.test/admin/',
    waiting: waiting ? serviceWorker('installed') : null,
    installing: installing ? serviceWorker() : null,
    async update() { updateCount++; await updateAction?.(); },
  });
  const ready = deferRegistration ? new Promise(resolve => { releaseRegistration = () => resolve(registration); }) : Promise.resolve(registration);
  const serviceWorkers = Object.assign(new Events(), {
    controller: controlled ? serviceWorker('activated') : null,
    async register() { registerCount++; return ready; },
  });
  const location = {
    hash: '#/route-from-a-newer-deploy',
    reload() { reloadCount++; },
    replace(hash) { this.hash = hash; },
  };
  const media = () => Object.assign(new Events(), { matches: false });
  const values = new Map();
  const sandbox = {
    console, URL, VERSION, BUILD, document, location,
    navigator: { serviceWorker: serviceWorkers, onLine: true },
    Date: class extends Date { static now() { return now; } },
    matchMedia: media,
    addEventListener: events.addEventListener.bind(events),
    removeEventListener: events.removeEventListener.bind(events),
    dispatchEvent: events.dispatchEvent.bind(events),
    CustomEvent: class { constructor(type, options = {}) { this.type = type; this.detail = options.detail; } },
    MessageChannel: class {
      constructor() {
        this.port1 = { close() {} };
        this.port2 = { postMessage: data => queueMicrotask(() => this.port1.onmessage?.({ data })) };
      }
    },
    setTimeout(callback, delay) { const id = ++timerId; timers.set(id, { callback, at: now + delay }); return id; },
    clearTimeout(id) { timers.delete(id); },
    requestAnimationFrame() {},
    fetch: async () => ({ ok: true, json: async () => ({}) }),
    localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    history: { replaceState() {} },
    registry: [], categories: [], exampleRoutes: [],
    icon: () => '<svg class="icon"></svg>',
    t: key => ({ notFound: 'Page not found', notFoundDescription: 'This page does not exist.', goHome: 'Go home' })[key] || key,
    setLanguage() {}, getLanguage: () => 'en', startLocalizer() {},
    createCommandPalette: () => ({ open: query => searchOpens.push(query) }),
  };
  sandbox.window = sandbox;
  // Execute the real modules with only their import boundaries supplied by the harness.
  const executable = (source, path) => source.replace(/^import .*;\n/gm, '').replace(/^export /gm, '').replaceAll('import.meta.url', JSON.stringify(new URL(path, root).href));
  runInNewContext(`${executable(pwaSource, 'js/pwa.js')}\nglobalThis.pwa = { initPWA, getPWAState, checkForUpdates, applyUpdate, renderPWA };`, sandbox);
  if (app) runInNewContext(`${executable(routerSource, 'js/router.js')}\n${executable(appSource, 'js/app.js')}`, sandbox);
  return {
    pwa: sandbox.pwa, window: sandbox, document, registration, serviceWorkers, searchOpens, releaseRegistration,
    get registerCount() { return registerCount; }, get updateCount() { return updateCount; }, get reloadCount() { return reloadCount; },
    onUpdate(action) { updateAction = action; },
    advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of [...timers]) if (timer.at <= now) { timers.delete(id); timer.callback(); }
    },
    visibility(state) { document.visibilityState = state; document.dispatch('visibilitychange'); },
    navigate(hash) { location.hash = hash; events.dispatch('hashchange'); },
    discover(worker = serviceWorker()) { registration.installing = worker; registration.dispatch('updatefound'); return worker; },
    installed(worker) { registration.installing = null; registration.waiting = worker; worker.state = 'installed'; worker.dispatch('statechange'); },
    redundant(worker) { registration.installing = null; registration.waiting = null; worker.state = 'redundant'; worker.dispatch('statechange'); },
  };
}

function control(container, label) { return container.querySelectorAll('button').find(button => button.textContent === label); }
function prompt(h) { return h.document.querySelector('[data-not-found-update]'); }

test('startup and visible-tab checks share a ten-minute throttle; explicit settings checks bypass it', async () => {
  const h = harness();
  h.pwa.initPWA();
  h.pwa.initPWA();
  await flush();
  assert.equal(h.registerCount, 1);
  assert.equal(h.updateCount, 1);
  h.advance(599999);
  h.visibility('hidden');
  h.visibility('visible');
  await flush();
  assert.equal(h.updateCount, 1);
  h.advance(1);
  h.visibility('visible');
  await flush();
  assert.equal(h.updateCount, 2);
  const settings = h.document.createElement('section');
  h.document.body.append(settings);
  h.pwa.renderPWA(settings);
  control(settings, 'Check for updates').click();
  await flush();
  assert.equal(h.updateCount, 3);
  assert.match(settings.textContent, /You are up to date/);
  assert.ok(control(settings, 'Clear offline cache'));
  h.visibility('visible');
  await flush();
  assert.equal(h.updateCount, 3);
});

test('a recovery check before initialization shares registration and its in-flight update with startup', async () => {
  const h = harness({ deferRegistration: true });
  const first = h.pwa.checkForUpdates();
  h.pwa.initPWA();
  const second = h.pwa.checkForUpdates();
  await flush();
  assert.equal(h.registerCount, 1);
  assert.equal(h.updateCount, 0);
  h.releaseRegistration();
  await Promise.all([first, second]);
  assert.equal(h.registerCount, 1);
  assert.equal(h.updateCount, 1);
  assert.equal(h.pwa.getPWAState().checking, false);
});

test('unknown routes check for updates and retain working search, home and focus when no update exists', async () => {
  const h = harness({ app: true });
  await flush();
  assert.equal(h.document.querySelector('.not-found h1').textContent, 'Page not found');
  assert.equal(h.updateCount, 1);
  assert.equal(prompt(h).textContent, '');
  assert.equal(h.document.querySelector('.not-found a').getAttribute('href'), '#/overview');
  const search = h.document.querySelector('[data-not-found-search]');
  search.focus();
  search.click();
  assert.equal(h.searchOpens.length, 1);
  await h.pwa.checkForUpdates();
  assert.equal(h.document.querySelector('[data-not-found-search]'), search);
  assert.equal(h.document.activeElement, search);
  assert.equal(h.updateCount, 2);
  h.navigate('#/another-new-route');
  await flush();
  assert.equal(h.updateCount, 3, 'each unknown-route navigation forces a fresh check');
  h.navigate('#/components/component-from-a-newer-deploy');
  await flush();
  assert.equal(h.document.querySelector('.not-found h1').textContent, 'Page not found');
  assert.equal(h.updateCount, 4, 'unknown component detail routes use the same recovery check');
  assert.equal(h.registerCount, 1);
});

test('a waiting update on an unknown route offers the existing explicit update flow', async () => {
  const h = harness({ app: true, waiting: true });
  await flush();
  assert.equal(prompt(h).textContent, 'A newer version is available - Update now');
  const worker = h.registration.waiting;
  assert.equal(worker.messages.length, 0, 'a recovery check never activates an update automatically');
  control(prompt(h), 'Update now').click();
  await flush();
  assert.equal(worker.messages.join(','), 'SKIP_WAITING');
  assert.equal(h.document.querySelector('.pwa-overlay').hidden, false);
  h.serviceWorkers.dispatch('controllerchange');
  await flush();
  assert.equal(h.reloadCount, 1);
});

test('installing recovery updates stay actionable, wait for installation and reload only once', async () => {
  const h = harness({ app: true });
  const worker = serviceWorker();
  h.onUpdate(() => h.discover(worker));
  await flush();
  assert.equal(prompt(h).textContent, 'A newer version is available - Update now');
  const search = h.document.querySelector('[data-not-found-search]');
  search.focus();
  worker.dispatch('statechange');
  assert.equal(h.document.querySelector('[data-not-found-search]'), search);
  assert.equal(h.document.activeElement, search);
  control(prompt(h), 'Update now').click();
  await flush();
  assert.equal(h.pwa.getPWAState().updating, true);
  assert.equal(h.document.querySelector('.pwa-overlay').hidden, false);
  assert.equal(worker.messages.length, 0);
  h.installed(worker);
  worker.dispatch('statechange');
  assert.equal(worker.messages.join(','), 'SKIP_WAITING');
  let allowReload;
  let decisions = 0;
  h.window.resolveDirty = () => { decisions++; return new Promise(resolve => { allowReload = resolve; }); };
  h.serviceWorkers.dispatch('controllerchange');
  h.serviceWorkers.dispatch('controllerchange');
  assert.equal(decisions, 1);
  allowReload(true);
  await flush();
  h.serviceWorkers.dispatch('controllerchange');
  await flush();
  assert.equal(h.reloadCount, 1);
});

test('redundant installs fail closed, remove the recovery offer and support an explicit retry', async () => {
  const h = harness({ app: true, installing: true });
  await flush();
  const worker = h.registration.installing;
  control(prompt(h), 'Update now').click();
  await flush();
  h.redundant(worker);
  assert.equal(worker.messages.length, 0);
  assert.equal(h.pwa.getPWAState().updating, false);
  assert.match(h.document.querySelector('.pwa-overlay').textContent, /could not finish/);
  assert.equal(prompt(h).textContent, '');
  h.serviceWorkers.dispatch('controllerchange');
  await flush();
  assert.equal(h.reloadCount, 0);
  const replacement = serviceWorker();
  h.onUpdate(() => h.discover(replacement));
  control(h.document.querySelector('.pwa-overlay'), 'Retry update').click();
  await flush();
  assert.equal(h.pwa.getPWAState().updating, true);
  h.installed(replacement);
  assert.equal(replacement.messages.join(','), 'SKIP_WAITING');
});

test('dirty decisions protect both explicit activation and reload, including repeated clicks', async () => {
  const h = harness({ waiting: true });
  h.pwa.initPWA();
  await flush();
  const worker = h.registration.waiting;
  h.window.resolveDirty = async () => false;
  await h.pwa.applyUpdate();
  assert.equal(worker.messages.length, 0);
  assert.equal(h.document.querySelector('.pwa-overlay'), null);
  let allowUpdate;
  let decisions = 0;
  h.window.resolveDirty = () => { decisions++; return new Promise(resolve => { allowUpdate = resolve; }); };
  const first = h.pwa.applyUpdate();
  const second = h.pwa.applyUpdate();
  assert.equal(decisions, 1);
  allowUpdate(true);
  await Promise.all([first, second]);
  assert.equal(worker.messages.join(','), 'SKIP_WAITING');
  h.window.resolveDirty = async () => false;
  h.serviceWorkers.dispatch('controllerchange');
  await flush();
  assert.equal(h.reloadCount, 0);
  assert.equal(h.pwa.getPWAState().updating, false);
  assert.equal(h.document.querySelector('.pwa-overlay').hidden, true);
});

test('an installation timeout never sends a late activation message', async () => {
  const h = harness({ installing: true });
  h.pwa.initPWA();
  await flush();
  const worker = h.registration.installing;
  await h.pwa.applyUpdate();
  h.advance(20000);
  assert.match(h.pwa.getPWAState().error, /could not finish/);
  h.installed(worker);
  assert.equal(worker.messages.length, 0);
  h.serviceWorkers.dispatch('controllerchange');
  await flush();
  assert.equal(h.reloadCount, 0);
});

test('first-time installation does not masquerade as a newer version or activate automatically', async () => {
  const h = harness({ app: true, installing: true, controlled: false });
  await flush();
  const worker = h.registration.installing;
  assert.equal(prompt(h).textContent, '');
  h.installed(worker);
  assert.equal(h.pwa.getPWAState().updateAvailable, false);
  await h.pwa.applyUpdate();
  assert.equal(worker.messages.length, 0);
  assert.equal(h.reloadCount, 0);
});

test('a failed update check settles and remains manually retryable within the automatic throttle', async () => {
  const h = harness();
  h.onUpdate(() => { throw new TypeError('Offline'); });
  h.pwa.initPWA();
  await flush();
  assert.equal(h.pwa.getPWAState().checking, false);
  assert.match(h.pwa.getPWAState().error, /Could not check for updates/);
  h.visibility('visible');
  await flush();
  assert.equal(h.updateCount, 1);
  h.onUpdate(() => {});
  await h.pwa.checkForUpdates();
  assert.equal(h.updateCount, 2);
  assert.equal(h.pwa.getPWAState().error, '');
  assert.equal(h.pwa.getPWAState().message, 'You are up to date.');
});
