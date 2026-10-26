import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generate } from './build-tokens.mjs';

const requiredComponents = ['button', 'input', 'select', 'checkbox', 'tag', 'tabs', 'table', 'modal', 'toast', 'tooltip', 'popover'];
const rawColor = /#[\da-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/i;
const nativeDisclosure = /<\s*(?:details|summary)\b/i;
const nativeSelect = /<\s*select\b/i;

export function registryNames(source) {
  return [...source.matchAll(/\bname\s*:\s*['"]([a-z][a-z\d-]*)['"]/g)].map(match => match[1]);
}

async function exists(path) {
  try { return (await stat(path)).isFile(); } catch { return false; }
}

export async function checkProject(root = fileURLToPath(new URL('../', import.meta.url))) {
  root = resolve(root);
  const errors = [];
  const files = [];
  async function walk(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      if (['.git', 'node_modules'].includes(entry.name)) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) await walk(path);
      else if (entry.isFile() && /\.(?:css|js|mjs|html)$/i.test(entry.name)) files.push(path);
    }
  }
  await walk(root);
  for (const path of files) {
    const local = relative(root, path).split('\\').join('/');
    const source = await readFile(path, 'utf8');
    if (/\.(?:css|js|mjs)$/i.test(path) && local !== 'css/tokens.css' && rawColor.test(source)) errors.push(`${local}: raw colour literal; use a design token.`);
    if (/\.(?:html|js|mjs)$/i.test(path) && nativeDisclosure.test(source)) errors.push(`${local}: native disclosure element is forbidden.`);
    if (local.startsWith('components/') && /\.js$/i.test(path) && nativeSelect.test(source)) errors.push(`${local}: use a custom popover, not a native select.`);
  }
  try {
    const tokens = JSON.parse(await readFile(join(root, 'tokens/tokens.json'), 'utf8'));
    const css = await readFile(join(root, 'css/tokens.css'), 'utf8');
    if (css !== generate(tokens)) errors.push('css/tokens.css: generated tokens are out of sync; run npm run build.');
  } catch (error) { errors.push(`Token generation: ${error.message}`); }
  try {
    const source = await readFile(join(root, 'components/registry.js'), 'utf8');
    const names = registryNames(source);
    if (names.length === 0) errors.push('components/registry.js: no explicit component entries found.');
    if (new Set(names).size !== names.length) errors.push('components/registry.js: duplicate component names.');
    for (const name of requiredComponents) if (!names.includes(name)) errors.push(`components/registry.js: missing required ${name} entry.`);
    for (const name of names) {
      for (const path of [`components/${name}.js`, `css/components/${name}.css`]) {
        if (!(await exists(join(root, path)))) errors.push(`${path}: registered component file is missing.`);
      }
    }
  } catch (error) { errors.push(`Component registry: ${error.message}`); }
  return errors;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const errors = await checkProject(process.argv[2]);
  if (errors.length) {
    for (const error of errors) console.error(error);
    process.exitCode = 1;
  } else console.log('Source checks passed.');
}
