import test from 'node:test';
import assert from 'node:assert/strict';
import { registry } from '../components/registry.js';
import { createPagination } from '../components/pagination.js';
import { createProgressBar } from '../components/progress-bar.js';
import { createBreadcrumbs } from '../components/breadcrumbs.js';
import { createAvatar } from '../components/avatar.js';
import { createBadge } from '../components/badge.js';
import { createFilterChip } from '../components/filter-chip.js';
import { createAlert } from '../components/alert.js';

// Deliberately small DOM double for component state/markup logic, not browser layout or accessibility certification.
class ComponentNode {
  constructor(tag) {
    this.tagName = tag;
    this.children = [];
    this.attributes = {};
    this.listeners = new Map();
    this.style = {};
    this.className = '';
    this.classList = { add: (...names) => { this.className = [...new Set([...this.className.split(' '), ...names])].filter(Boolean).join(' '); } };
  }
  setAttribute(key, value) { this.attributes[key] = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
  addEventListener(type, listener) { this.listeners.set(type, listener); }
  append(...nodes) { for (const node of nodes) { if (node instanceof ComponentNode) node.parentElement = this; this.children.push(node); } }
  replaceChildren(...nodes) { for (const child of this.children) if (child instanceof ComponentNode) child.parentElement = null; this.children = []; this.append(...nodes); }
  remove() { if (!this.parentElement) return; this.parentElement.children = this.parentElement.children.filter(child => child !== this); this.parentElement = null; }
  contains(node) { return this === node || this.children.some(child => child instanceof ComponentNode && child.contains(node)); }
  focus() { document.activeElement = this; }
  getClientRects() { return [{}]; }
  dispatch(type) { this.listeners.get(type)?.({ target: this, currentTarget: this, stopPropagation() {}, preventDefault() {} }); }
  click() { if (!this.disabled) this.dispatch('click'); }
  querySelectorAll(selector) {
    const result = [];
    const matches = node => {
      if (selector.startsWith('.')) return node.className.split(' ').includes(selector.slice(1));
      const attribute = selector.match(/^\[([^=]+)="([^"]*)"\]$/);
      return attribute ? node.getAttribute(attribute[1]) === attribute[2] : node.tagName === selector;
    };
    for (const child of this.children) {
      if (!(child instanceof ComponentNode)) continue;
      if (matches(child)) result.push(child);
      result.push(...child.querySelectorAll(selector));
    }
    return result;
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  get firstElementChild() { return this.children.find(child => child instanceof ComponentNode); }
  get textContent() { return this.children.map(child => child instanceof ComponentNode ? child.textContent : String(child)).join(''); }
  get nextElementSibling() { const siblings = this.parentElement?.children.filter(child => child instanceof ComponentNode) || []; return siblings[siblings.indexOf(this) + 1] || null; }
  get previousElementSibling() { const siblings = this.parentElement?.children.filter(child => child instanceof ComponentNode) || []; return siblings[siblings.indexOf(this) - 1] || null; }
  get isConnected() { return document.body.contains(this); }
}

function dom(context) {
  const previous = { document: globalThis.document, Node: globalThis.Node };
  globalThis.Node = ComponentNode;
  globalThis.document = { createElement: tag => new ComponentNode(tag), activeElement: null, documentElement: { lang: 'en' }, body: new ComponentNode('body') };
  context.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key];
      else globalThis[key] = value;
    }
  });
}

function control(root, label) { return root.querySelectorAll('button').find(node => node.getAttribute('aria-label') === label); }

test('every phase2a component has complete canonical guide metadata', () => {
  const required = ['breadcrumbs', 'card', 'kpi-card', 'badge', 'pill', 'filter-chip', 'avatar-stack', 'progress-bar', 'alert', 'drawer', 'detail-panel', 'description-list', 'pagination', 'avatar'];
  for (const name of required) assert.ok(registry.some(entry => entry.name === name), name);
  for (const { name, guide } of registry) {
    for (const key of ['purpose', 'props', 'variants', 'tokens', 'states', 'keyboard', 'accessibility', 'responsive', 'example', 'do', 'dont']) assert.ok(guide[key]?.length, `${name}.${key}`);
  }
});

test('pagination clamps empty, filtered, invalid and out-of-range page states', context => {
  dom(context);
  const pager = createPagination({ total: 248, page: 999, pageSize: 10 });
  assert.equal(pager.state.page, 25);
  assert.equal(control(pager.element, 'Next page').disabled, true);
  assert.match(pager.element.textContent, /Showing 241 to 248 of 248/);
  pager.setState({ total: 0, page: 3 });
  assert.equal(pager.state.page, 1);
  assert.equal(control(pager.element, 'Previous page').disabled, true);
  assert.equal(control(pager.element, 'Next page').disabled, true);
  assert.match(pager.element.textContent, /Showing 0 to 0 of 0/);
  pager.setState({ total: Infinity, pageSize: 0 });
  assert.equal(pager.state.total, 0);
  assert.equal(pager.state.pageSize, 1);
});

test('pagination calls the owner and retains current-page focus across synchronous owner updates', context => {
  dom(context);
  const changes = [];
  const pager = createPagination({ total: 45, onPageChange(page) { changes.push(page); pager.setState({ page }); } });
  document.body.append(pager.element);
  control(pager.element, 'Next page').click();
  assert.deepEqual(changes, [2]);
  assert.equal(pager.state.page, 2);
  assert.equal(document.activeElement.getAttribute('aria-label'), 'Page 2');
  assert.equal(control(pager.element, 'Page 2').getAttribute('aria-current'), 'page');
  pager.setState({ disabled: true });
  control(pager.element, 'Next page').click();
  assert.deepEqual(changes, [2]);
});

test('progress values clamp and preserve their accessible range', context => {
  dom(context);
  const over = createProgressBar({ value: 200, max: 80, label: 'Mock usage', showValue: true });
  const progress = over.querySelector('.ds-progress-track');
  assert.equal(progress.getAttribute('aria-valuenow'), '80');
  assert.equal(progress.getAttribute('aria-valuemax'), '80');
  assert.equal(progress.firstElementChild.style.width, '100%');
  assert.equal(createProgressBar({ value: -10 }).querySelector('.ds-progress-track').getAttribute('aria-valuenow'), '0');
  assert.equal(createProgressBar({ value: NaN, max: 0 }).querySelector('.ds-progress-track').getAttribute('aria-valuemax'), '100');
});

test('breadcrumbs name only the final current page and keep ancestor links', context => {
  dom(context);
  const crumbs = createBreadcrumbs({ items: [{ label: 'Components', href: '#/components' }, { label: 'Card', href: '#/components/card' }] });
  assert.equal(crumbs.querySelectorAll('a').length, 1);
  assert.equal(crumbs.querySelector('a').getAttribute('href'), '#/components');
  assert.equal(crumbs.querySelector('span').getAttribute('aria-current'), 'page');
});

test('avatar falls back to named initials when an image fails or the name is absent', context => {
  dom(context);
  const avatar = createAvatar({ name: 'Olivia Rhye', src: 'missing-local-avatar.png' });
  assert.equal(avatar.getAttribute('aria-label'), 'Olivia Rhye');
  avatar.querySelector('img').dispatch('error');
  assert.equal(avatar.querySelector('img'), null);
  assert.equal(avatar.textContent, 'OR');
  assert.equal(createAvatar({ name: '' }).getAttribute('aria-label'), 'Unknown person');
});

test('badges preserve named semantic states while chips and alerts dismiss exactly once', context => {
  dom(context);
  for (const tone of ['neutral', 'accent', 'success', 'warning', 'danger', 'info']) {
    const badge = createBadge({ label: 'Mock status', tone, pill: true, dot: true });
    assert.ok(badge.className.includes(`ds-tag-${tone}`));
    assert.equal(badge.querySelector('.ds-tag-dot').getAttribute('aria-hidden'), 'true');
  }
  let removed = 0;
  const chip = createFilterChip({ label: 'Country: US', onRemove: () => { removed += 1; } });
  const alert = createAlert({ title: 'Mock warning', tone: 'warning', onDismiss: () => { removed += 1; } });
  document.body.append(chip, alert);
  chip.querySelector('button').click();
  assert.equal(chip.isConnected, false);
  alert.querySelector('button').click();
  assert.equal(alert.isConnected, false);
  assert.equal(removed, 2);
});
