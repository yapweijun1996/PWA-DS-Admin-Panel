import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { icons, componentIcons, settingsIcons } from '../js/icons.js';
import { registry } from '../components/registry.js';

test('every registered component has a mapped, existing icon', () => {
  for (const entry of registry) assert.ok(componentIcons[entry.name], `no icon for ${entry.name}`);
  for (const [name, glyph] of Object.entries({ ...componentIcons, ...settingsIcons })) assert.ok(icons.includes(glyph), `${name} -> unknown icon ${glyph}`);
});

test('settings sections use distinct icons', () => {
  const glyphs = Object.values(settingsIcons);
  assert.equal(new Set(glyphs).size, glyphs.length);
});

test('literal icon names used in source exist in the icon set', async () => {
  const files = [];
  for (const dir of ['js', 'components', 'js/examples/erp', 'js/examples/crm', 'js/examples/school']) for (const f of await readdir(dir)) if (f.endsWith('.js')) files.push(`${dir}/${f}`);
  const unknown = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/\bicon\('([A-Za-z0-9]+)'/g)) if (!icons.includes(match[1])) unknown.push(`${file}: ${match[1]}`);
  }
  assert.deepEqual(unknown, []);
});
