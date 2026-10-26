import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { stampBuild } from '../scripts/stamp-build.mjs';
import { createStaticServer } from '../scripts/serve.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
async function fixture(context) {
  const directory = await mkdtemp(join(root, '.tooling-fixture-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}

test('build stamps UI and worker identically after recursively discovering shell artifacts', async context => {
  const directory = await fixture(context);
  for (const path of ['css/components', 'js/nested', 'components', 'tokens', 'icons', 'tests', 'docs']) await mkdir(join(directory, path), { recursive: true });
  const files = {
    'version.json': JSON.stringify({ version: '2.3.4' }),
    'manifest.webmanifest': '{}', 'index.html': '<main>Shell</main>',
    'css/components/button.css': '.button {}', 'js/nested/helper.js': 'export const helper = true;',
    'components/button.js': 'export function render() {}', 'tokens/tokens.json': '{}', 'icons/icon-192.png': 'icon bytes',
    'tests/ignored.js': 'test only', 'docs/ignored.js': 'documentation only',
    'sw.js': "const BUILD = 'development';\nconst PRECACHE = [];\n",
  };
  for (const [path, content] of Object.entries(files)) await writeFile(join(directory, path), content);
  const result = await stampBuild(pathToFileURL(`${directory}/`), 'fixture-build-a');
  assert.equal(result.version, '2.3.4');
  assert.equal(result.build, 'fixture-build-a');
  for (const path of ['./index.html', './js/build-info.js', './js/nested/helper.js', './css/components/button.css', './components/button.js', './tokens/tokens.json', './icons/icon-192.png', './manifest.webmanifest', './version.json']) assert.ok(result.assets.includes(path), path);
  assert.ok(!result.assets.some(path => path.includes('/tests/') || path.includes('/docs/') || path === './sw.js'));
  assert.match(await readFile(join(directory, 'js/build-info.js'), 'utf8'), /export const BUILD = "fixture-build-a";/);
  assert.match(await readFile(join(directory, 'sw.js'), 'utf8'), /const BUILD = 'fixture-build-a';/);
  await writeFile(join(directory, 'js/added.js'), 'export const added = true;');
  const next = await stampBuild(pathToFileURL(`${directory}/`), 'fixture-build-b');
  assert.ok(next.assets.includes('./js/added.js'));
  assert.match(await readFile(join(directory, 'sw.js'), 'utf8'), /const BUILD = 'fixture-build-b';/);
});

test('static server supplies correct MIME, uncached HTML and worker, HEAD and honest errors', async context => {
  const directory = await fixture(context);
  for (const [path, content] of Object.entries({ 'index.html': '<main>Shell</main>', 'sw.js': 'worker', 'app.css': 'body {}', 'manifest.webmanifest': '{}', '.private': 'hidden' })) await writeFile(join(directory, path), content);
  const server = createStaticServer(directory);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  context.after(() => new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve())));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(`${origin}/`);
  assert.equal(page.status, 200);
  assert.match(page.headers.get('content-type'), /^text\/html/);
  assert.equal(page.headers.get('cache-control'), 'no-cache');
  assert.equal(await page.text(), '<main>Shell</main>');
  const worker = await fetch(`${origin}/sw.js`);
  assert.match(worker.headers.get('content-type'), /javascript/);
  assert.equal(worker.headers.get('cache-control'), 'no-cache');
  const style = await fetch(`${origin}/app.css`);
  assert.match(style.headers.get('content-type'), /^text\/css/);
  const manifest = await fetch(`${origin}/manifest.webmanifest`);
  assert.match(manifest.headers.get('content-type'), /^application\/manifest\+json/);
  const head = await fetch(`${origin}/`, { method: 'HEAD' });
  assert.equal(head.status, 200);
  assert.equal(await head.text(), '');
  assert.equal((await fetch(`${origin}/missing`)).status, 404);
  assert.equal((await fetch(`${origin}/.private`)).status, 403);
  assert.equal((await fetch(`${origin}/`, { method: 'POST' })).status, 405);
});
