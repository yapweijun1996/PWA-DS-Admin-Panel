import test from 'node:test';
import assert from 'node:assert/strict';
import { checkAccessibility, labelInName, headingOrder } from '../js/a11y-selfcheck.js';

test('label-in-name accepts the visible label within a longer accessible name', () => {
  assert.equal(labelInName('Save', 'Save profile'), true);
  assert.equal(labelInName('Search', 'Site search'), true);
  assert.equal(labelInName('Add customer', 'Add customer to workspace'), true);
});

test('label-in-name normalizes case and Unicode whitespace without dropping words', () => {
  assert.equal(labelInName('  Save\n changes\t', 'SAVE\u00a0CHANGES to profile'), true);
  assert.equal(labelInName('First\u2003name', 'Your first name'), true);
  assert.equal(labelInName('Café', 'Cafe\u0301 menu'), true);
  assert.equal(labelInName('保存', '保存更改'), true);
});

test('label-in-name rejects replacement, omitted and reordered visible labels', () => {
  assert.equal(labelInName('Delete customer', 'Remove record'), false);
  assert.equal(labelInName('Save changes', 'Save'), false);
  assert.equal(labelInName('Add customer', 'Customer add'), false);
  assert.equal(labelInName('Enable alerts', 'Disable alerts'), false);
  assert.equal(labelInName('Save changes', ''), false);
});

test('label-in-name does not invent a visible label for an icon-only control', () => {
  assert.equal(labelInName('', 'Close dialog'), true);
  assert.equal(labelInName(' \n ', ''), true);
  assert.equal(labelInName(null, 'Close dialog'), true);
  assert.equal(labelInName('Search', null), false);
});

test('label-in-name strips punctuation and symbols but retains counts', () => {
  assert.equal(labelInName('Components 71', 'Components 71'), true);
  assert.equal(labelInName('Components 71', 'Components'), false);
  assert.equal(labelInName('26 2 ·', '26, Monday, 26 October 2026, 2 events'), false);
  assert.equal(labelInName('26', '26, Monday, 26 October 2026, 2 events'), true);
  assert.equal(labelInName('Save… changes ✓', 'Save changes'), true);
});

// Minimal DOM fixture: exercise text traversal and IDREF/name precedence without
// adding a DOM dependency to the Node unit suite.
function controlFixture(tag, attributes, children) {
  const nodes = [];
  const document = { getElementById: id => nodes.find(node => node.getAttribute('id') === id) };
  function element(localName, attrs = {}, content = []) {
    const node = {
      nodeType: 1, localName, ownerDocument: document, parentElement: null,
      getAttribute: name => attrs[name] ?? null,
      hasAttribute: name => Object.hasOwn(attrs, name),
      getRootNode: () => document,
      querySelectorAll: () => node.childNodes.filter(child => child.nodeType === 1).flatMap(child => [child, ...child.querySelectorAll('*')]),
    };
    nodes.push(node);
    node.childNodes = content.map(child => typeof child === 'string' ? { nodeType: 3, textContent: child } : child);
    node.childNodes.forEach(child => { child.parentElement = node; });
    return node;
  }
  return { element, root: element(tag, attributes, children.map(child => typeof child === 'string' ? child : element('span', child.attributes, [child.text]))) };
}

test('counted nav names come from content; explicit labels cannot omit the count', () => {
  const content = [{ text: 'Components' }, { text: '71' }];
  for (const attributes of [{ href: '#/components' }, { href: '#/components', 'aria-label': 'Components 71' }]) {
    assert.deepEqual(checkAccessibility(controlFixture('a', attributes, content).root), []);
  }
  assert.deepEqual(checkAccessibility(controlFixture('a', { href: '#/components', 'aria-label': 'Components' }, content).root).map(row => row.rule), ['label-in-name']);
});

test('calendar counts remain visible to label-in-name even when aria-hidden', () => {
  const attributes = { 'aria-label': '26, Monday, 26 October 2026, 1 event' };
  for (const decoration of [{ text: '1 ·' }, { text: '1 ·', attributes: { 'aria-hidden': 'true' } }]) {
    const failing = controlFixture('button', attributes, ['26', decoration]);
    assert.deepEqual(checkAccessibility(failing.root).map(row => row.rule), ['label-in-name']);
  }
  const passing = controlFixture('button', attributes, ['26', { text: '', attributes: { 'aria-hidden': 'true', 'data-count': '1' } }]);
  assert.deepEqual(checkAccessibility(passing.root), []);
});

test('aria-labelledby takes precedence over aria-label and content', () => {
  const fixture = controlFixture('button', { 'aria-labelledby': 'name', 'aria-label': 'Save' }, ['Save']);
  fixture.root.childNodes.push(fixture.element('span', { id: 'name', hidden: '' }, ['Remove']));
  assert.deepEqual(checkAccessibility(fixture.root).map(row => row.rule), ['label-in-name']);
});

test('heading order accepts consecutive levels, repeats and returns to ancestors', () => {
  assert.deepEqual(headingOrder([1, 2, 3, 3, 2, 1, 2]), []);
  assert.deepEqual(headingOrder([2, 3, 2]), []);
  assert.deepEqual(headingOrder([]), []);
  assert.deepEqual(headingOrder([3]), []);
});

test('heading order reports every forward skip at its original index', () => {
  assert.deepEqual(headingOrder([1, 3, 4, 2, 5, 1, 4]), [
    { index: 1, previous: 1, level: 3 },
    { index: 4, previous: 2, level: 5 },
    { index: 6, previous: 1, level: 4 }
  ]);
});

test('heading order accepts string aria levels and levels beyond native h6', () => {
  assert.deepEqual(headingOrder(['1', '2', '4']), [{ index: 2, previous: 2, level: 4 }]);
  assert.deepEqual(headingOrder([5, 6, 8]), [{ index: 2, previous: 6, level: 8 }]);
});

test('heading order ignores invalid levels without resetting its previous heading', () => {
  assert.deepEqual(headingOrder([1, '', null, 0, -1, 2.5, 'unknown', undefined, 3]), [
    { index: 8, previous: 1, level: 3 }
  ]);
});

test('heading order leaves the supplied levels untouched', () => {
  const levels = Object.freeze([1, 3, 2, 4]);
  assert.deepEqual(headingOrder(levels), [
    { index: 1, previous: 1, level: 3 },
    { index: 3, previous: 2, level: 4 }
  ]);
});
