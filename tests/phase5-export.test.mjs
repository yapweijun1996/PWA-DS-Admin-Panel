import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readdir, readFile, rm, writeFile, mkdir, symlink } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve, relative, dirname, join, isAbsolute } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { exportKit } from '../scripts/export-kit.mjs';
import { BUILD } from '../js/build-info.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
async function fixture(context) {
  const directory = await mkdtemp(join(root, '.export-fixture-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  return directory;
}
async function tree(directory, prefix = '') {
  const files = {};
  for (const entry of (await readdir(join(directory, prefix), { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
    const path = `${prefix}${entry.name}`;
    assert.ok(!entry.isSymbolicLink(), `No symlinks in bundle: ${path}`);
    if (entry.isDirectory()) Object.assign(files, await tree(directory, `${path}/`));
    else files[path] = await readFile(join(directory, path));
  }
  return files;
}
function dependency(files, from, target) {
  if (target.startsWith('#') || target.startsWith('data:')) return;
  assert.ok(!/^(?:[a-z]+:|\/\/|\/)/i.test(target), `${from} has non-relative dependency ${target}`);
  const path = relative('/', resolve('/', dirname(from), target.split(/[?#]/)[0]));
  assert.ok(!path.startsWith('..') && !isAbsolute(path), `${from} escapes bundle: ${target}`);
  assert.ok(files[path], `${from} missing dependency: ${target}`);
}

test('all three kit exports are deterministic, self-contained and hash every shipped file', async context => {
  const directory = await fixture(context);
  for (const kit of ['enterprise', 'liquid', 'ops']) {
    const out = join(directory, kit);
    await exportKit({ root, kit, palette: 'blue', out });
    const files = await tree(out);
    const manifest = JSON.parse(files['kit-manifest.json']);
    assert.equal(manifest.version, JSON.parse(await readFile(join(root, 'version.json'), 'utf8')).version);
    assert.equal(manifest.build, BUILD);
    assert.equal(manifest.kit, kit);
    assert.equal(manifest.palette, 'blue');
    assert.deepEqual(Object.keys(manifest.files).sort(), Object.keys(files).filter(path => path !== 'kit-manifest.json').sort());
    for (const [path, hash] of Object.entries(manifest.files)) assert.equal(digest(files[path]), hash, path);
    for (const path of ['tokens.css', 'appearance.css', 'components/combobox.js', 'components/table.js', 'components/chart.js', 'js/icons.js', 'demo.html', 'README.md', 'boot-snippet.html']) assert.ok(files[path], path);
    const appearance = files['appearance.css'].toString();
    assert.match(appearance, /data-theme[=\s]*["']?dark/);
    for (const other of ['enterprise', 'liquid', 'ops'].filter(id => id !== kit)) assert.ok(!appearance.includes(`data-kit="${other}"`), other);
    for (const other of ['indigo', 'violet', 'emerald', 'teal', 'rose', 'orange', 'slate']) assert.ok(!appearance.includes(`data-palette="${other}"`), other);
    for (const [path, bytes] of Object.entries(files)) {
      const source = bytes.toString();
      if (path.endsWith('.js')) {
        for (const match of source.matchAll(/^\s*(?:import|export)\s+(?:[^'";]*?\bfrom\s*)?['"]([^'"\n]+)['"]/gm)) dependency(files, path, match[1]);
      }
      if (path.endsWith('.html')) for (const match of source.matchAll(/(?:src|href)=["']([^"']+)["']/g)) dependency(files, path, match[1]);
      if (path.endsWith('.css')) for (const match of source.matchAll(/(?:@import\s+['"]|url\(\s*['"]?)([^'"\s)]+)['"]?\)?/g)) dependency(files, path, match[1]);
    }
    const { registry } = await import(pathToFileURL(join(out, 'components/registry.js')).href);
    assert.ok(registry.some(entry => entry.name === 'combobox'));
    assert.ok(!Object.keys(files).some(path => /^(?:js\/(?:app|pwa|router|example-routes)\.js|js\/examples\/|tokens\/|docs\/|tests\/)/.test(path)));
    const second = join(directory, `${kit}-again`);
    await exportKit({ root, kit, palette: 'blue', out: second });
    assert.deepEqual(await tree(second), files);
    await exportKit({ root, kit, palette: 'blue', out });
    assert.deepEqual(await tree(out), files);
  }
});

test('export validates appearance choices and protects source and unowned output files', async context => {
  const directory = await fixture(context);
  await assert.rejects(exportKit({ root, kit: 'missing', out: join(directory, 'invalid') }));
  await assert.rejects(exportKit({ root, kit: 'enterprise', palette: 'missing', out: join(directory, 'invalid') }));
  for (const out of [root, join(root, 'components'), resolve(root, '..', 'outside-kit')]) await assert.rejects(exportKit({ root, kit: 'enterprise', out }));
  const out = join(directory, 'owned-by-consumer');
  await mkdir(out);
  await writeFile(join(out, 'consumer.txt'), 'Keep this file');
  await assert.rejects(exportKit({ root, kit: 'enterprise', out }));
  assert.equal(await readFile(join(out, 'consumer.txt'), 'utf8'), 'Keep this file');
  const generated = join(directory, 'generated');
  await exportKit({ root, kit: 'enterprise', out: generated });
  await writeFile(join(generated, 'consumer.txt'), 'Keep this addition too');
  await assert.rejects(exportKit({ root, kit: 'enterprise', out: generated }));
  assert.equal(await readFile(join(generated, 'consumer.txt'), 'utf8'), 'Keep this addition too');
  const modified = join(directory, 'modified');
  await exportKit({ root, kit: 'enterprise', out: modified });
  await writeFile(join(modified, 'components/combobox.js'), '// Consumer edit must survive\n');
  await assert.rejects(exportKit({ root, kit: 'enterprise', out: modified }));
  assert.equal(await readFile(join(modified, 'components/combobox.js'), 'utf8'), '// Consumer edit must survive\n');
  const target = join(directory, 'symlink-target');
  await mkdir(target);
  const linked = join(directory, 'linked-output');
  await symlink(target, linked);
  await assert.rejects(exportKit({ root, kit: 'enterprise', out: linked }));
  assert.deepEqual(await readdir(target), []);
});

test('nondefault palette stays limited to its selected accents in both themes', async context => {
  const directory = await fixture(context);
  const out = join(directory, 'violet');
  await exportKit({ root, kit: 'liquid', palette: 'violet', out });
  const files = await tree(out);
  const appearance = files['appearance.css'].toString();
  assert.match(appearance, /data-palette="violet"/);
  assert.ok(!appearance.includes('data-palette="blue"'));
  assert.equal(JSON.parse(files['kit-manifest.json']).palette, 'violet');
});
