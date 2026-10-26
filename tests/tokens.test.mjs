import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generate, loadTokenSources } from '../scripts/build-tokens.mjs';
import { contrastMatrix } from '../scripts/contrast.mjs';

const tokens = JSON.parse(await readFile(new URL('../tokens/tokens.json', import.meta.url), 'utf8'));

test('token generation is deterministic and leaves its input unchanged', () => {
  const before = JSON.stringify(tokens);
  const first = generate(tokens);
  assert.equal(generate(tokens), first);
  assert.equal(generate(JSON.parse(before)), first);
  assert.equal(JSON.stringify(tokens), before);
  assert.ok(first.endsWith('\n'));
});

test('every token has complete light and dark values with matching generated variables', () => {
  const names = [];
  for (const [group, entries] of Object.entries(tokens)) {
    assert.ok(Object.keys(entries).length > 0, `${group} is empty`);
    for (const [name, value] of Object.entries(entries)) {
      names.push(name);
      assert.deepEqual(Object.keys(value).sort(), ['dark', 'light']);
      for (const mode of ['light', 'dark']) assert.ok(typeof value[mode] === 'string' && value[mode].length > 0, `${name}.${mode}`);
    }
  }
  assert.equal(new Set(names).size, names.length, 'CSS custom property names must be unique across groups');
  const css = generate(tokens);
  const blocks = css.match(/\{([^}]+)\}/g);
  assert.equal(blocks.length, 2);
  const variables = block => [...block.matchAll(/--([\w-]+):/g)].map(match => match[1]);
  assert.deepEqual(variables(blocks[0]), names);
  assert.deepEqual(variables(blocks[1]), names);
  assert.match(css, /^:root\s*\{/);
  assert.match(css, /\[data-theme=(?:"dark"|dark)\]\s*\{/);
});

test('generated stylesheet exactly matches the exported generator', async () => {
  assert.equal(await readFile(new URL('../css/tokens.css', import.meta.url), 'utf8'), generate(tokens));
});

test('small navigation counts and badges keep normal-text contrast in every appearance', async () => {
  const report = contrastMatrix(await loadTokenSources());
  const requiredPairs = [
    'small nav-count on surface',
    'small nav-count on surface-soft',
    'small nav-count on bg',
    'small nav-count on active accent-soft',
    'small neutral badge on bg',
    'small accent badge on accent-soft',
    'small notification count on accent',
    ...['success', 'warning', 'danger', 'info'].map(status => `small ${status} badge on ${status}-soft`),
  ];
  assert.equal(report.combinations, 96);
  for (const pair of requiredPairs) {
    const rows = report.results.filter(row => row.pair === pair);
    assert.equal(rows.length, report.combinations, pair);
    assert.equal(new Set(rows.map(({ theme, palette, kit, contrast }) => `${theme}/${palette}/${kit}/${contrast}`)).size, report.combinations, pair);
  }
  for (const row of report.results.filter(row => row.pair.startsWith('small '))) {
    assert.equal(row.minimum, 4.5, row.pair);
    assert.ok(row.pass, `${row.theme}/${row.palette}/${row.kit}/${row.contrast}: ${row.pair} ${row.ratio}`);
  }
  assert.ok(report.results.some(row => row.pair === 'small nav-count on glass over black'));
});
