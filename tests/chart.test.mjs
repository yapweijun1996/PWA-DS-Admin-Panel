import test from 'node:test';
import assert from 'node:assert/strict';
import { niceTicks, chartSummary, createChart, chartTypes } from '../components/chart.js';


test('nice ticks cover signed, negative-only and zero-only domains without a zero step', () => {
  for (const [minimum, maximum] of [[-37, 61], [-12, -2], [0, 0], [0.001, 0.007], [-0.08, 0.09]]) {
    const ticks = niceTicks(minimum, maximum);
    assert.ok(ticks.length >= 2);
    assert.ok(ticks.every(Number.isFinite));
    assert.ok(ticks[0] <= Math.min(0, minimum));
    assert.ok(ticks.at(-1) >= Math.max(0, maximum));
    assert.ok(ticks.includes(0));
    for (let index = 1; index < ticks.length; index += 1) assert.ok(ticks[index] > ticks[index - 1]);
    const step = ticks[1] - ticks[0];
    for (let index = 2; index < ticks.length; index += 1) assert.ok(Math.abs(ticks[index] - ticks[index - 1] - step) < Math.abs(step) * 1e-9);
  }
});

test('chart summaries name type, series, extrema and each trend using the formatter', () => {
  const summary = chartSummary({ type: 'line', title: 'Mock activity', labels: ['Jan', 'Feb', 'Mar'], series: [{ name: 'Growth', values: [4, -2, 8] }, { name: 'Decline', values: [7, null, 3] }, { name: 'Flat', values: [0, 0, 0] }], formatValue: value => `${value} units` });
  assert.match(summary, /Mock activity\. line chart\. 3 categories/);
  assert.match(summary, /Growth: minimum -2 units, maximum 8 units, increasing from 4 units to 8 units/);
  assert.match(summary, /Decline: minimum 3 units, maximum 7 units, decreasing from 7 units to 3 units/);
  assert.match(summary, /Flat: minimum 0 units, maximum 0 units, unchanged from 0 units to 0 units/);
});

test('chart summaries distinguish loading, absent and missing values', () => {
  assert.match(chartSummary({ loading: true }), /Loading data/);
  assert.match(chartSummary({}), /No data/);
  const summary = chartSummary({ labels: ['A', 'B', 'C'], series: [{ name: 'Missing', values: [null, NaN, Infinity] }] });
  assert.match(summary, /Missing: no data/);
  assert.doesNotMatch(summary, /NaN|Infinity/);
});

// Minimal DOM double: exercise shared rendering and updates, not browser layout.
class ChartNode {
  constructor(tag) { this.tagName = tag; this.children = []; this.attributes = {}; this.dataset = {}; this.className = ''; }
  setAttribute(key, value) { this.attributes[key] = String(value); if (key === 'class') this.className = String(value); }
  getAttribute(key) { return this.attributes[key] ?? null; }
  addEventListener() {}
  append(...nodes) { this.children.push(...nodes); }
  prepend(...nodes) { this.children.unshift(...nodes); }
  replaceChildren(...nodes) { this.children = [...nodes]; }
  contains(node) { return this === node || this.children.some(child => child instanceof ChartNode && child.contains(node)); }
  set textContent(value) { this.children = [String(value)]; }
  get textContent() { return this.children.map(child => child instanceof ChartNode ? child.textContent : String(child)).join(''); }
  querySelectorAll(selector) {
    return this.children.flatMap(child => {
      if (!(child instanceof ChartNode)) return [];
      const matches = selector.startsWith('.') ? child.className.split(' ').includes(selector.slice(1)) : child.tagName === selector;
      return [...(matches ? [child] : []), ...child.querySelectorAll(selector)];
    });
  }
}

test('every chart type renders its correct legend swatch and donut formatted values', context => {
  const previous = Object.fromEntries(['document', 'Node', 'MutationObserver'].map(key => [key, globalThis[key]]));
  globalThis.Node = ChartNode;
  globalThis.document = { createElement: tag => new ChartNode(tag), createElementNS: (_, tag) => new ChartNode(tag), documentElement: { lang: 'en' }, body: new ChartNode('body'), activeElement: null };
  globalThis.MutationObserver = class { observe() {} disconnect() {} };
  context.after(() => {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete globalThis[key]; else globalThis[key] = value;
    }
  });
  const chart = createChart({ labels: ['First', 'Second'], series: [{ name: 'Alpha', values: [12, 34] }, { name: 'Beta', values: [5, 6] }], formatValue: value => `$${value.toFixed(2)}` });
  context.after(() => chart.destroy());
  for (const type of chartTypes) {
    chart.update({ type });
    const controls = chart.querySelectorAll('.ds-chart-legend-button');
    assert.equal(controls.length, 2, type);
    controls.forEach((control, index) => {
      const swatches = control.querySelectorAll('.ds-chart-swatch');
      assert.equal(swatches.length, 1, type);
      const swatch = swatches[0];
      assert.equal(control.getAttribute('style'), `--chart-series: var(--series-${index + 1})`, type);
      if (type === 'line' || type === 'sparkline') {
        assert.ok(swatch.className.split(' ').includes('ds-chart-swatch-line'), type);
        assert.equal(swatch.querySelectorAll('line').length, 1, type);
        assert.equal(swatch.children.length, 2, `${type} retains marker`);
        assert.equal(swatch.querySelectorAll('line')[0].getAttribute('stroke-dasharray'), index ? '8 4' : '', type);
      } else {
        assert.ok(swatch.className.split(' ').includes('ds-chart-swatch-filled'), type);
        assert.equal(swatch.querySelectorAll('line').length, 0, type);
        const [square] = swatch.querySelectorAll('rect');
        assert.equal(square.getAttribute('width'), square.getAttribute('height'), type);
        assert.ok(Number(square.getAttribute('rx')) > 0, type);
      }
      if (type === 'donut') assert.equal(control.textContent, index ? '2. Second: $34.00' : '1. First: $12.00');
    });
  }
});
