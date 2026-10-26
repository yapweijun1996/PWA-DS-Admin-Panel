import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { checkProject, validateRegistryLabels } from '../scripts/check.mjs';
import { generate } from '../scripts/build-tokens.mjs';
import { generateRegistryDoc } from '../scripts/build-registry-doc.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const names = ['button', 'input', 'select', 'checkbox', 'tag', 'tabs', 'table', 'modal', 'toast', 'tooltip', 'popover'];

test('registry labels reject missing and implementation identifiers while accepting human names', () => {
  for (const label of [undefined, '', '  ', 'DatePickerComponent', 'filterBuilder', 'import-wizard', 'file_upload']) {
    assert.equal(validateRegistryLabels([{ name: 'example', label }]).length, 1, String(label));
  }
  assert.deepEqual(validateRegistryLabels(['Date picker', 'Master-detail layout', 'Charts', 'Combobox'].map(label => ({ name: 'example', label }))), []);
});

async function fixture(context) {
  const directory = await mkdtemp(join(root, '.check-fixture-'));
  context.after(() => rm(directory, { recursive: true, force: true }));
  for (const path of ['tokens', 'css/components', 'components', 'docs']) await mkdir(join(directory, path), { recursive: true });
  const tokens = { Spacing: { space: { light: '16px', dark: '16px' } } };
  await writeFile(join(directory, 'tokens/tokens.json'), JSON.stringify(tokens));
  await writeFile(join(directory, 'css/tokens.css'), generate(tokens));
  const guide = { purpose: 'Trigger an action.', props: ['label'], variants: ['standard'], states: ['default'], keyboard: ['Enter activates'], accessibility: ['Accessible name'], do: ['Label actions'], dont: ['Avoid ambiguity'], example: 'button()' };
  await writeFile(join(directory, 'components/registry.js'), `export const registry = [${names.map(name => `{ name: '${name}', label: '${name}', category: 'Actions', guide: ${JSON.stringify(guide)}, render() {}, demo() {} }`).join(',')}];`);
  await writeFile(join(directory, 'docs/COMPONENT_REGISTRY.md'), generateRegistryDoc(names.map(name => ({ name, label: name, category: 'Actions', guide }))));
  for (const name of names) {
    await writeFile(join(directory, `components/${name}.js`), 'export function render() {}\n');
    await writeFile(join(directory, `css/components/${name}.css`), '.demo { color: var(--text); }\n');
  }
  return directory;
}

test('check accepts a complete token-driven fixture', async context => {
  assert.deepEqual(await checkProject(await fixture(context)), []);
});

test('check rejects each forbidden source pattern and generated-file drift', async context => {
  const directory = await fixture(context);
  const raw = ['#', '123456'].join('');
  await writeFile(join(directory, 'css/components/button.css'), `.button { color: ${raw}; }`);
  await writeFile(join(directory, 'components/select.js'), `const template = '${'<' + 'select>'}';`);
  await writeFile(join(directory, 'index.html'), '<' + 'details><' + 'summary>Native<' + '/summary><' + '/details>');
  await writeFile(join(directory, 'css/tokens.css'), ':root {}\n');
  await rm(join(directory, 'components/toast.js'));
  const errors = await checkProject(directory);
  for (const expected of ['raw colour', 'native disclosure', 'native select', 'out of sync', 'registered component file is missing']) {
    assert.ok(errors.some(error => error.includes(expected)), `${expected}: ${errors.join('\n')}`);
  }
});

test('check rejects raw functional colours in JavaScript', async context => {
  const directory = await fixture(context);
  await writeFile(join(directory, 'components/button.js'), `const colour = '${'r' + 'gb('}1, 2, 3)';`);
  assert.ok((await checkProject(directory)).some(error => error.includes('raw colour')));
});

test('check rejects duplicate and absent registry entries', async context => {
  const directory = await fixture(context);
  await writeFile(join(directory, 'components/registry.js'), "export const registry = [{ name: 'button' }, { name: 'button' }];");
  const errors = await checkProject(directory);
  assert.ok(errors.some(error => error.includes('duplicate')));
  assert.ok(errors.some(error => error.includes('missing required')));
});

test('check fails when a registered component lacks Guide metadata or a live demo', async context => {
  const directory = await fixture(context);
  await writeFile(join(directory, 'components/registry.js'), `export const registry = [${names.map(name => `{ name: '${name}', label: '${name}', category: 'Forms', render() {} }`).join(',')}];`);
  const errors = await checkProject(directory);
  for (const field of ['purpose', 'props', 'variants', 'states', 'keyboard', 'accessibility', 'live demo']) {
    assert.ok(errors.some(error => error.includes(field)), `${field}: ${errors.join('; ')}`);
  }
});

test('check rejects stale or missing generated registry documentation and accepts regeneration', async context => {
  const directory = await fixture(context);
  const path = join(directory, 'docs/COMPONENT_REGISTRY.md');
  await writeFile(path, '# Outdated component reference\n');
  assert.ok((await checkProject(directory)).some(error => error.includes('generated registry is missing or stale')));
  await rm(path);
  assert.ok((await checkProject(directory)).some(error => error.includes('generated registry is missing or stale')));
  const { registry } = await import(new URL(`../${directory.split('/').at(-1)}/components/registry.js`, import.meta.url));
  await writeFile(path, generateRegistryDoc(registry));
  assert.deepEqual(await checkProject(directory), []);
});
