import test from 'node:test';
import assert from 'node:assert/strict';
import { stat } from 'node:fs/promises';
import { registry } from '../components/registry.js';
import { routes, resolveRoute } from '../js/router.js';
import { translations, locales } from '../js/i18n.js';

const root = new URL('../', import.meta.url);
const required = ['button', 'input', 'select', 'checkbox', 'tag', 'tabs', 'table', 'modal', 'toast', 'tooltip', 'popover'];

test('registry exposes each required component with an implementation and stylesheet', async () => {
  const names = registry.map(entry => entry.name);
  assert.equal(new Set(names).size, names.length, 'registry names are unique');
  for (const name of required) assert.ok(names.includes(name), `missing ${name}`);
  for (const entry of registry) {
    assert.ok((await stat(new URL(`components/${entry.name}.js`, root))).isFile());
    assert.ok((await stat(new URL(`css/components/${entry.name}.css`, root))).isFile());
    assert.equal(typeof entry.render, 'function');
    assert.ok(typeof entry.label === 'string' && entry.label.trim());
  }
});

test('route table includes every specified page and no duplicates', () => {
  const paths = routes.map(route => route.path);
  assert.equal(new Set(paths).size, paths.length);
  for (const path of ['/overview', '/tokens', '/components', '/components/:name', '/settings/general', '/settings/appearance', '/settings/about', '/settings/pwa']) assert.ok(paths.includes(path), path);
  for (const route of routes) assert.ok(['overview', 'tokens', 'components', 'settings'].includes(route.module));
});

test('router resolves hashes, default landing, component names, settings and invalid routes', () => {
  assert.equal(resolveRoute('#/overview').module, 'overview');
  assert.equal(resolveRoute('#/tokens').module, 'tokens');
  assert.equal(resolveRoute('', '/tokens').module, 'tokens');
  assert.equal(resolveRoute('#/components/button').params.name, 'button');
  assert.equal(resolveRoute('#/components/pill%2Dtag').params.name, 'pill-tag');
  assert.equal(resolveRoute('#/settings/appearance').section, 'appearance');
  assert.equal(resolveRoute('#/settings').section, 'general');
  assert.equal(resolveRoute('#/unknown').valid, false);
  assert.equal(resolveRoute('#/components/%ZZ').valid, false);
  assert.equal(resolveRoute('#/components/button/extra').valid, false);
});

function leafKeys(value, prefix = '') {
  return Object.entries(value).flatMap(([key, entry]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return entry && typeof entry === 'object' ? leafKeys(entry, path) : [path];
  }).sort();
}

test('English and Chinese dictionaries expose identical, nonempty translation keys', () => {
  assert.deepEqual([...locales].sort(), ['en', 'zh']);
  assert.deepEqual(leafKeys(translations.en), leafKeys(translations.zh));
  for (const [locale, dictionary] of Object.entries(translations)) {
    for (const [key, value] of Object.entries(dictionary)) assert.ok(typeof value === 'string' && value.trim(), `${locale}.${key}`);
  }
});
