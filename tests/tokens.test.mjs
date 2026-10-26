import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generate } from '../scripts/build-tokens.mjs';

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
