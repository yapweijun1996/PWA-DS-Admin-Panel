import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, relative, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generate, buildArtifacts } from './build-tokens.mjs';
import { contrastMatrix } from './contrast.mjs';
import { validateMetadata } from '../components/metadata.js';

const requiredComponents = ['button', 'input', 'select', 'checkbox', 'tag', 'tabs', 'table', 'modal', 'toast', 'tooltip', 'popover'];
const rawColor = /#[\da-f]{3,8}\b|\brgba?\s*\(|\bhsla?\s*\(/i;
const nativeDisclosure = /<\s*(?:details|summary)\b/i;
const nativeSelect = /<\s*select\b/i;

export function registryNames(source) {
  return [...source.matchAll(/\bname\s*:\s*['"]([a-z][a-z\d-]*)['"]/g)].map(match => match[1]);
}

export function validateRegistryLabels(registry) {
  const errors = [];
  const codeStyle = /[a-z][A-Z]|[A-Z]{2,}[a-z]|[_`()[\]{}<>]|^[a-z\d]+(?:[-.][a-z\d]+)+$/u;
  for (const entry of registry) {
    if (typeof entry.label !== 'string' || !entry.label.trim()) {
      errors.push(`components/registry.js: ${entry.name} requires a human-readable label.`);
    } else if (codeStyle.test(entry.label)) {
      errors.push(`components/registry.js: ${entry.name} label must use human-readable words, not a code identifier.`);
    }
  }
  return errors;
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
      else if (entry.isFile() && /\.(?:css|js|mjs|cjs|html|json)$/i.test(entry.name)) files.push(path);
    }
  }
  await walk(root);
  for (const path of files) {
    const local = relative(root, path).split('\\').join('/');
    const source = await readFile(path, 'utf8');
    if (/\.(?:css|js|mjs|cjs)$/i.test(path) && !['css/tokens.css', 'css/appearance.css'].includes(local) && rawColor.test(source)) errors.push(`${local}: raw colour literal; use a design token.`);
    if (local.startsWith('kits/') && /\.json$/i.test(path) && rawColor.test(source)) errors.push(`${local}: raw colour literal; reference a token primitive.`);
    if (/^(?:kits|css\/kits)\//.test(local) && /\.(?:js|mjs|cjs)$/i.test(path)) errors.push(`${local}: design kits may not contain JavaScript.`);
    if (local.startsWith('components/') && /\.js$/i.test(path) && /(['"`])(?:enterprise|liquid|ops)\1/.test(source)) errors.push(`${local}: components must not reference design kit names.`);
    if (/\.(?:html|js|mjs)$/i.test(path) && nativeDisclosure.test(source)) errors.push(`${local}: native disclosure element is forbidden.`);
    if (local.startsWith('components/') && /\.js$/i.test(path) && nativeSelect.test(source)) errors.push(`${local}: use a custom popover, not a native select.`);
  }
  try {
    const tokens = JSON.parse(await readFile(join(root, 'tokens/tokens.json'), 'utf8'));
    const css = await readFile(join(root, 'css/tokens.css'), 'utf8');
    if (css !== generate(tokens)) errors.push('css/tokens.css: generated tokens are out of sync; run npm run build.');
    const splitSources = ['tokens/primitives.json', 'tokens/semantics.json', 'tokens/palettes.json', 'kits/registry.json'];
    if ((await Promise.all(splitSources.map(path => exists(join(root, path))))).some(Boolean)) {
      const artifacts = await buildArtifacts(root);
      if (await readFile(join(root, 'tokens/tokens.json'), 'utf8') !== artifacts.tokens) errors.push('tokens/tokens.json: resolved token export is out of sync; run npm run build.');
      if (css !== artifacts.css) errors.push('css/tokens.css: split token sources are out of sync; run npm run build.');
      if (await readFile(join(root, 'css/appearance.css'), 'utf8') !== artifacts.appearance) errors.push('css/appearance.css: generated appearance tokens are out of sync; run npm run build.');
      const paletteIds = ['blue', 'indigo', 'violet', 'emerald', 'teal', 'rose', 'orange', 'slate'];
      for (const id of paletteIds) if (!artifacts.sources.palettes[id]) errors.push(`tokens/palettes.json: missing ${id} palette.`);
      for (const [id, palette] of Object.entries(artifacts.sources.palettes)) {
        if (Object.keys(palette.tokens).some(name => !name.startsWith('accent'))) errors.push(`tokens/palettes.json: ${id} may override only accent tokens.`);
      }
      for (const id of ['enterprise', 'liquid', 'ops']) {
        if (!artifacts.sources.kits.some(kit => kit.id === id)) errors.push(`kits/registry.json: missing ${id} kit.`);
        if (!(await exists(join(root, `css/kits/${id}.css`)))) errors.push(`css/kits/${id}.css: kit surface stylesheet is missing.`);
      }
      errors.push(...contrastMatrix(artifacts.sources).errors);
    }
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
    const { registry } = await import(`${pathToFileURL(join(root, 'components/registry.js')).href}?check=${Date.now()}`);
    errors.push(...validateMetadata(registry));
    errors.push(...validateRegistryLabels(registry));
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
