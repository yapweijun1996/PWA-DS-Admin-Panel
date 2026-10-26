import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import { inflateSync } from 'node:zlib';
import { VERSION, BUILD } from '../js/build-info.js';
import { generateIcon } from '../scripts/build-icons.mjs';

const root = new URL('../', import.meta.url);
const workerSource = await readFile(new URL('sw.js', root), 'utf8');
const palette = JSON.parse(await readFile(new URL('tokens/tokens.json', root), 'utf8')).Color;

function workerHarness() {
  const handlers = new Map();
  const stores = new Map();
  const scope = 'https://example.test/admin/';
  let skipped = 0;
  let claimed = 0;
  let offline = false;
  const key = request => typeof request === 'string' ? new URL(request, scope).href : request.url;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async addAll(paths) { for (const path of paths) entries.set(key(path), new Response(`cached ${path}`)); },
        async match(request) { return entries.get(key(request))?.clone(); },
        async put(request, response) { entries.set(key(request), response); },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const self = {
    registration: { scope }, location: { origin: 'https://example.test' },
    clients: { async claim() { claimed++; } },
    async skipWaiting() { skipped++; },
    addEventListener(type, listener) { handlers.set(type, listener); },
  };
  runInNewContext(workerSource, {
    self, caches, URL, Response, Set,
    fetch: async () => { if (offline) throw new TypeError('Offline'); return new Response('network'); },
  });
  async function event(type, properties = {}) {
    let pending;
    let response;
    handlers.get(type)({ ...properties, waitUntil(value) { pending = value; }, respondWith(value) { response = value; } });
    await pending;
    return response ? await response : undefined;
  }
  return { handlers, stores, caches, event, scope, get skipped() { return skipped; }, get claimed() { return claimed; }, setOffline(value) { offline = value; } };
}

test('manifest has standalone scope, theme tokens and complete install icons', async () => {
  const manifest = JSON.parse(await readFile(new URL('manifest.webmanifest', root), 'utf8'));
  for (const field of ['name', 'short_name', 'theme_color', 'background_color']) assert.ok(typeof manifest[field] === 'string' && manifest[field]);
  assert.equal(manifest.start_url, './');
  assert.equal(manifest.scope, './');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.theme_color, palette.surface.light);
  assert.equal(manifest.background_color, palette.bg.light);
  for (const size of ['192x192', '512x512']) assert.ok(manifest.icons.some(icon => icon.sizes === size && icon.purpose.includes('any')));
  assert.ok(manifest.icons.some(icon => icon.purpose.includes('maskable')));
  for (const icon of manifest.icons) {
    assert.equal(icon.type, 'image/png');
    const bytes = await readFile(new URL(icon.src, root));
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    const [width, height] = icon.sizes.split('x').map(Number);
    assert.equal(bytes.readUInt32BE(16), width);
    assert.equal(bytes.readUInt32BE(20), height);
  }
});

test('dependency-free icon encoder is deterministic and produces decodable image data', () => {
  const bytes = generateIcon(192, palette);
  assert.deepEqual(generateIcon(192, palette), bytes);
  let offset = 8;
  const data = [];
  const types = [];
  while (offset < bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    types.push(type);
    if (type === 'IDAT') data.push(bytes.subarray(offset + 8, offset + 8 + length));
    offset += length + 12;
  }
  assert.deepEqual(types, ['IHDR', 'IDAT', 'IEND']);
  assert.equal(inflateSync(Buffer.concat(data)).length, 192 * (192 * 3 + 1));
});

test('version and build truth agree across manual source, UI and service worker', async () => {
  assert.equal(VERSION, JSON.parse(await readFile(new URL('version.json', root), 'utf8')).version);
  assert.ok(BUILD && BUILD !== 'development');
  assert.equal(workerSource.match(/^const BUILD = '([^']+)';$/m)?.[1], BUILD);
});

test('worker precaches complete shell without docs, tests or tooling', async () => {
  const paths = JSON.parse(workerSource.match(/^const PRECACHE = (.+);$/m)[1]);
  for (const path of ['./index.html', './css/tokens.css', './tokens/tokens.json', './components/registry.js', './js/build-info.js', './manifest.webmanifest', './version.json', './icons/icon-192.png', './icons/icon-512.png']) assert.ok(paths.includes(path), path);
  assert.equal(new Set(paths).size, paths.length);
  assert.ok(!paths.some(path => /\/(?:docs|tests|scripts)\//.test(path)));
  const harness = workerHarness();
  await harness.event('install');
  assert.equal(harness.skipped, 0, 'install must not auto-activate an update');
  assert.ok(harness.stores.size > 0);
  assert.equal([...harness.stores.values()][0].size, paths.length);
});

test('worker activation cleans only obsolete caches in this application scope', async () => {
  const harness = workerHarness();
  await harness.event('install');
  const current = [...harness.stores.keys()][0];
  harness.stores.set('ds-admin-/admin/-obsolete', new Map());
  harness.stores.set('another-application', new Map());
  harness.stores.set('ds-admin-/other/-obsolete', new Map());
  await harness.event('activate');
  assert.ok(harness.stores.has(current));
  assert.ok(!harness.stores.has('ds-admin-/admin/-obsolete'));
  assert.ok(harness.stores.has('another-application'));
  assert.ok(harness.stores.has('ds-admin-/other/-obsolete'));
  assert.equal(harness.claimed, 1);
  assert.equal(harness.skipped, 0);
});

test('worker skips waiting only in response to explicit update message', async () => {
  const harness = workerHarness();
  await harness.event('message', { data: { type: 'UNKNOWN' }, ports: [] });
  assert.equal(harness.skipped, 0);
  await harness.event('message', { data: { type: 'SKIP_WAITING' }, ports: [] });
  assert.equal(harness.skipped, 1);
  let reply;
  await harness.event('message', { data: { type: 'GET_BUILD' }, ports: [{ postMessage(value) { reply = value; } }] });
  assert.equal(reply.build, BUILD);
  assert.equal((workerSource.match(/\.skipWaiting\s*\(/g) || []).length, 1);
});

test('worker serves navigations network-first and falls back to the cached shell offline', async () => {
  const harness = workerHarness();
  await harness.event('install');
  const request = { url: `${harness.scope}index.html`, method: 'GET', mode: 'navigate' };
  assert.equal(await (await harness.event('fetch', { request })).text(), 'network');
  harness.setOffline(true);
  assert.equal(await (await harness.event('fetch', { request })).text(), 'network');
  const unknown = { ...request, url: `${harness.scope}some-page` };
  assert.equal(await (await harness.event('fetch', { request: unknown })).text(), 'network');
});

test('worker serves precached static assets offline and ignores cross-origin and mutation requests', async () => {
  const harness = workerHarness();
  await harness.event('install');
  harness.setOffline(true);
  const request = { url: `${harness.scope}tokens/tokens.json`, method: 'GET', mode: 'cors' };
  assert.match(await (await harness.event('fetch', { request })).text(), /^cached /);
  assert.equal(await harness.event('fetch', { request: { ...request, url: 'https://other.test/file.js' } }), undefined);
  assert.equal(await harness.event('fetch', { request: { ...request, method: 'POST' } }), undefined);
});
