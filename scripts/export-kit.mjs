import { createHash } from 'node:crypto';
import { lstat, mkdir, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { dirname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { generate, generateAppearance, loadTokenSources } from './build-tokens.mjs';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const kitIds = ['enterprise', 'liquid', 'ops'];
const manifestName = 'kit-manifest.json';
const usage = 'Usage: node scripts/export-kit.mjs --kit <enterprise|liquid|ops> [--palette blue] [--out dist-kit]\n       node scripts/export-kit.mjs --all [--palette blue]';
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const portable = path => path.split(sep).join('/');

function inside(root, path) {
  const value = relative(root, path);
  return value !== '' && value !== '..' && !value.startsWith(`..${sep}`) && !isAbsolute(value);
}

function safeRelativePath(path) {
  return typeof path === 'string' && path.split('/').every(part => /^[a-zA-Z0-9][\w.-]*$/.test(part) && part !== '.' && part !== '..');
}

async function statIfPresent(path) {
  try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

// Reject symlinks even when they currently resolve inside the checkout: exports
// must not depend on a link target changing between validation and replacement.
async function noSymlinks(root, path) {
  if (path !== root && !inside(root, path)) throw new Error('Export paths must stay inside the checkout.');
  let current = root;
  for (const part of relative(root, path).split(sep).filter(Boolean)) {
    current = join(current, part);
    const stat = await statIfPresent(current);
    if (stat?.isSymbolicLink()) throw new Error(`Symlinks are not allowed in export paths: ${portable(relative(root, current))}`);
  }
}

async function sourceFile(root, path) {
  const absolute = resolve(root, path);
  await noSymlinks(root, absolute);
  const stat = await lstat(absolute);
  if (!stat.isFile()) throw new Error(`Expected a source file: ${path}`);
  return readFile(absolute);
}

async function sourceNames(root, directory, extension) {
  await noSymlinks(root, resolve(root, directory));
  const entries = await readdir(join(root, directory), { withFileTypes: true });
  return entries.filter(entry => entry.name.endsWith(extension)).map(entry => `${directory}/${entry.name}`).sort();
}

function moduleReferences(source) {
  const references = [];
  const staticImport = /^\s*(?:import|export)\s+(?:[^'";]*?\bfrom\s*)?['"]([^'"\n]+)['"]/gm;
  const dynamicImport = /\bimport\s*\(\s*['"]([^'"\n]+)['"]\s*\)/g;
  for (const pattern of [staticImport, dynamicImport]) {
    for (const match of source.matchAll(pattern)) references.push(match[1]);
  }
  return references;
}

async function componentModules(root, files) {
  const queue = await sourceNames(root, 'components', '.js');
  // The icon set is an explicit public bundle asset, even if a future component
  // catalog no longer happens to import it.
  queue.push('js/icons.js');
  for (let index = 0; index < queue.length; index += 1) {
    const path = queue[index];
    if (files.has(path)) continue;
    if (!/^(?:components\/[\w-]+\.js|js\/(?:icons|pane-resizer|i18n)\.js|js\/i18n\/(?:match|zh\/[\w-]+)\.js|js\/logic\/[\w-]+\.js)$/.test(path)) {
      throw new Error(`Component dependency is outside the shared library: ${path}`);
    }
    const bytes = await sourceFile(root, path);
    files.set(path, bytes);
    for (const reference of moduleReferences(bytes.toString('utf8'))) {
      if (!reference.startsWith('./') && !reference.startsWith('../')) throw new Error(`Non-relative module dependency in ${path}: ${reference}`);
      const dependency = resolve(root, dirname(path), reference);
      if (!inside(root, dependency)) throw new Error(`Component dependency escapes the checkout: ${reference}`);
      queue.push(portable(relative(root, dependency)));
    }
  }
}

async function existingFiles(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(join(directory, prefix), { withFileTypes: true })) {
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isSymbolicLink()) throw new Error(`Refusing to replace an output containing a symlink: ${path}`);
    if (entry.isDirectory()) result.push(...await existingFiles(directory, path));
    else if (entry.isFile()) result.push(path);
    else throw new Error(`Unrecognized output entry: ${path}`);
  }
  return result.sort();
}

async function replacementFiles(directory) {
  const stat = await statIfPresent(directory);
  if (!stat) return [];
  if (!stat.isDirectory()) throw new Error('The export destination must be a directory.');
  const paths = await existingFiles(directory);
  if (!paths.length) return [];
  if (!paths.includes(manifestName)) throw new Error('Refusing to overwrite a nonempty directory without a kit manifest.');
  let previous;
  try { previous = JSON.parse(await readFile(join(directory, manifestName), 'utf8')); } catch { throw new Error('Invalid existing kit manifest; no files were changed.'); }
  if (!kitIds.includes(previous?.kit) || typeof previous.version !== 'string' || typeof previous.build !== 'string' || typeof previous.palette !== 'string' || !previous.files || typeof previous.files !== 'object' || Array.isArray(previous.files)) {
    throw new Error('Invalid existing kit manifest; no files were changed.');
  }
  const owned = Object.entries(previous.files);
  if (!owned.length || owned.some(([path, digest]) => !safeRelativePath(path) || path === manifestName || !/^[a-f0-9]{64}$/.test(digest))) {
    throw new Error('Invalid existing kit file ownership; no files were changed.');
  }
  const ownedPaths = new Set(owned.map(([path]) => path));
  for (const path of paths) {
    if (path !== manifestName && !ownedPaths.has(path)) throw new Error(`Refusing to overwrite an unrecognized file: ${path}`);
    if (path !== manifestName && hash(await readFile(join(directory, path))) !== previous.files[path]) {
      throw new Error(`Refusing to overwrite a modified exported file: ${path}`);
    }
  }
  return paths.filter(path => path !== manifestName);
}

/** Generate an independent static consumer library without running the CLI. */
export async function exportKit({ kit, palette = 'blue', out = 'dist-kit', root = repoRoot } = {}) {
  if (!kitIds.includes(kit)) throw new Error(`Unknown kit: ${kit}. Choose enterprise, liquid, or ops.`);
  if (typeof palette !== 'string' || !/^[a-z][a-z-]*$/.test(palette)) throw new Error(`Invalid palette: ${palette}`);
  if (typeof out !== 'string' || !out.trim()) throw new Error('An export output directory is required.');
  root = await realpath(resolve(root));
  const directory = resolve(root, out);
  if (!inside(root, directory)) throw new Error('The output directory must be inside the checkout and cannot be its root.');
  await noSymlinks(root, directory);
  for (const path of ['tokens/primitives.json', 'tokens/semantics.json', 'tokens/palettes.json']) {
    await noSymlinks(root, resolve(root, path));
  }
  const registry = JSON.parse((await sourceFile(root, 'kits/registry.json')).toString('utf8'));
  for (const entry of registry) await noSymlinks(root, resolve(root, entry.path));
  const sources = await loadTokenSources(root);
  if (!Object.hasOwn(sources.palettes, palette)) throw new Error(`Unknown palette: ${palette}`);
  const chosenKit = sources.kits.find(item => item.id === kit);
  if (!chosenKit) throw new Error(`Kit source is missing: ${kit}`);
  const files = new Map();
  files.set('tokens.css', generate(sources.tokens));
  files.set('appearance.css', generateAppearance({ ...sources, palettes: { [palette]: sources.palettes[palette] }, kits: [chosenKit] }) + '\n' + (await sourceFile(root, `css/kits/${kit}.css`)).toString('utf8'));
  files.set('css/app.css', await sourceFile(root, 'css/app.css'));
  const styles = await sourceNames(root, 'css/components', '.css');
  for (const path of styles) files.set(path, await sourceFile(root, path));
  files.set('components.css', ['css/app.css', ...styles].map(path => `@import './${path}';`).join('\n') + '\n');
  await componentModules(root, files);
  const replacements = { __KIT__: kit, __PALETTE__: palette };
  for (const name of ['demo.html', 'demo.js', 'demo.css', 'boot.js', 'boot-snippet.html', 'README.md']) {
    let template = (await sourceFile(root, `scripts/kit-demo/${name}`)).toString('utf8');
    for (const [placeholder, value] of Object.entries(replacements)) template = template.replaceAll(placeholder, value);
    files.set(name, template);
  }
  const version = JSON.parse((await sourceFile(root, 'version.json')).toString('utf8')).version;
  const buildSource = (await sourceFile(root, 'js/build-info.js')).toString('utf8');
  const build = buildSource.match(/export\s+const\s+BUILD\s*=\s*(['"])([^'"\r\n]+)\1\s*;/)?.[2];
  if (typeof version !== 'string' || !version || !build) throw new Error('The current version and stamped BUILD are required.');
  const sorted = [...files.entries()].sort(([left], [right]) => left < right ? -1 : left > right ? 1 : 0);
  const manifest = { version, build, kit, palette, files: Object.fromEntries(sorted.map(([path, bytes]) => [path, hash(bytes)])) };
  // Collect and validate everything before changing any destination file.
  const previous = await replacementFiles(directory);
  await mkdir(directory, { recursive: true });
  for (const [path, bytes] of sorted) {
    const target = join(directory, path);
    await mkdir(dirname(target), { recursive: true });
    await writeFile(target, bytes);
  }
  for (const path of previous) if (!files.has(path)) await rm(join(directory, path));
  await writeFile(join(directory, manifestName), JSON.stringify(manifest, null, 2) + '\n');
  return { directory, manifest };
}

async function cli(args) {
  if (args.length === 1 && args[0] === '--help') { console.log(usage); return; }
  const options = {};
  let all = false;
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (flag === '--all') {
      if (all) throw new Error('Duplicate --all argument.');
      all = true;
      continue;
    }
    const key = { '--kit': 'kit', '--palette': 'palette', '--out': 'out' }[flag];
    if (!key) throw new Error(`Unknown argument: ${flag}`);
    if (Object.hasOwn(options, key)) throw new Error(`Duplicate argument: ${flag}`);
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}.`);
    options[key] = value;
  }
  if (all && (options.kit || options.out)) throw new Error('--all cannot be combined with --kit or --out.');
  if (!all && !options.kit) throw new Error('--kit or --all is required.');
  for (const kit of all ? kitIds : [options.kit]) {
    const result = await exportKit({ ...options, kit, ...(all ? { out: `dist-kits/${kit}` } : {}) });
    console.log(`Exported ${kit}/${result.manifest.palette} to ${portable(relative(repoRoot, result.directory))}`);
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { await cli(process.argv.slice(2)); } catch (error) {
    console.error(`${error.message}\n${usage}`);
    process.exitCode = 1;
  }
}
