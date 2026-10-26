import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';

export const themes = ['light', 'dark'];
export const highContrastTokens = {
  text: 'var(--contrast-text)', muted: 'var(--contrast-muted)',
  border: 'var(--contrast-border)', 'border-subtle': 'var(--contrast-border)',
  'surface-alpha': '1', 'card-alpha': '1',
  'surface-glass': 'var(--surface)', 'surface-card': 'var(--surface)',
  'ambient-start': 'var(--bg)', 'ambient-end': 'var(--bg)',
};

function resolveValue(value, primitives) {
  if (typeof value !== 'string') throw new Error('Token values must be strings.');
  return value.replace(/\{([\w.-]+)\}/g, (_, path) => {
    const result = path.split('.').reduce((current, key) => current?.[key], primitives);
    if (typeof result !== 'string') throw new Error(`Unknown primitive: ${path}`);
    return result;
  });
}

function resolveGroups(groups, primitives) {
  return Object.fromEntries(Object.entries(groups).map(([group, entries]) => [
    group, Object.fromEntries(Object.entries(entries).map(([name, values]) => {
      if (!values.light || !values.dark) throw new Error(`Token ${name} needs both themes.`);
      return [name, Object.fromEntries(themes.map(theme => [theme, resolveValue(values[theme], primitives)]))];
    }))
  ]));
}

function flatten(tokens, theme) {
  return Object.fromEntries(Object.values(tokens).flatMap(group => Object.entries(group).map(([name, values]) => [name, values[theme]])));
}

function block(selector, values) {
  return `${selector} {\n${Object.entries(values).map(([name, value]) => `  --${name}: ${value};`).join('\n')}\n}`;
}

// Keep the phase-one generator and editable grouped token export compatible.
export function generate(tokens) {
  return themes.map(theme => block(theme === 'light' ? ':root' : '[data-theme=dark]', flatten(tokens, theme))).join('\n') + '\n';
}

export async function loadTokenSources(root = '.') {
  const json = async path => JSON.parse(await readFile(join(root, path), 'utf8'));
  const [primitives, semantics, palettes, registry] = await Promise.all([
    json('tokens/primitives.json'), json('tokens/semantics.json'), json('tokens/palettes.json'), json('kits/registry.json')
  ]);
  const kits = await Promise.all(registry.map(async entry => {
    if (!/^[a-z][a-z-]*$/.test(entry.id) || entry.path !== `kits/${entry.id}/kit.json`) throw new Error('Invalid kit registry path.');
    const kit = await json(entry.path);
    if (kit.id !== entry.id) throw new Error(`Kit identity mismatch: ${entry.id}`);
    return { ...kit, tokens: resolveGroups(kit.tokens, primitives) };
  }));
  if (new Set(kits.map(kit => kit.id)).size !== kits.length) throw new Error('Duplicate design kit.');
  const resolvedPalettes = Object.fromEntries(Object.entries(palettes).map(([id, palette]) => [
    id, {
      ...palette,
      scale: Object.fromEntries(Object.entries(palette.scale).map(([step, value]) => [step, resolveValue(value, primitives)])),
      tokens: Object.fromEntries(Object.entries(palette.tokens).map(([name, values]) => [
        name, Object.fromEntries(themes.map(theme => [theme, resolveValue(values[theme], primitives)]))
      ]))
    }
  ]));
  return { primitives, tokens: resolveGroups(semantics, primitives), palettes: resolvedPalettes, kits, registry };
}

export function resolveTokens(sources, theme, paletteId = 'blue', kitId = 'enterprise') {
  if (!themes.includes(theme)) throw new Error(`Unknown theme: ${theme}`);
  const palette = sources.palettes[paletteId];
  const kit = sources.kits.find(item => item.id === kitId);
  if (!palette || !kit) throw new Error(`Unknown appearance: ${paletteId}/${kitId}`);
  return {
    ...Object.fromEntries(Object.entries(palette.scale).map(([step, value]) => [`accent-${step}`, value])),
    ...flatten(sources.tokens, theme),
    ...Object.fromEntries(Object.entries(palette.tokens).map(([name, values]) => [name, values[theme]])),
    ...flatten(kit.tokens, theme)
  };
}

export function generateAppearance(sources) {
  const rules = ['/* Generated from tokens/ and kits/. Do not edit. */'];
  for (const [id, palette] of Object.entries(sources.palettes)) {
    const selector = `:root[data-palette="${id}"]`;
    const light = Object.fromEntries(Object.entries(palette.tokens).map(([name, values]) => [name, values.light]));
    const dark = Object.fromEntries(Object.entries(palette.tokens).filter(([, values]) => values.dark !== values.light).map(([name, values]) => [name, values.dark]));
    rules.push(block(selector, { ...Object.fromEntries(Object.entries(palette.scale).map(([step, value]) => [`accent-${step}`, value])), ...light }));
    rules.push(block(`${selector}[data-theme="dark"]`, dark));
    rules.push(`.palette-dot.palette-${id} { background: ${palette.tokens.accent.light}; }`);
  }
  for (const kit of sources.kits) {
    const selector = `:root[data-kit="${kit.id}"]`;
    const light = flatten(kit.tokens, 'light');
    // Emit every dark kit value, including values shared with light: these
    // semantic overrides must outrank the palette's equally specific dark rule.
    const dark = flatten(kit.tokens, 'dark');
    rules.push(block(selector, {
      ...light,
      'sidebar-width': kit.layout.sidebarWidth,
      'sidebar-collapsed-width': kit.layout.sidebarCollapsedWidth,
      'topbar-height': kit.layout.topbarHeight
    }));
    if (Object.keys(dark).length) rules.push(block(`${selector}[data-theme="dark"]`, dark));
  }
  rules.push(block(':root[data-density="comfortable"]', { space: 'var(--space-4)', 'content-gap': 'var(--space-6)', 'control-height': '44px', 'table-cell-padding': 'var(--space-4)', 'table-cell-padding-block': 'var(--space-4)', 'table-header-padding-block': 'var(--space-3)' }));
  rules.push(block(':root[data-density="compact"]', { space: 'var(--space-3)', 'content-gap': 'var(--space-4)', 'control-height': '36px', 'table-cell-padding': 'var(--space-2)', 'table-cell-padding-block': 'var(--space-2)', 'table-header-padding-block': 'var(--space-2)' }));
  rules.push('@media (max-width: 767px) {\n  :root[data-density] { --control-height: 44px; }\n}');
  rules.push(`@media (prefers-contrast: more) {\n${block(':root[data-kit][data-theme]', highContrastTokens)}\n}`);
  return rules.join('\n') + '\n';
}

export async function buildArtifacts(root = '.') {
  const sources = await loadTokenSources(root);
  return { sources, tokens: JSON.stringify(sources.tokens, null, 2) + '\n', css: generate(sources.tokens), appearance: generateAppearance(sources) };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const artifacts = await buildArtifacts();
  await mkdir('css', { recursive: true });
  await Promise.all([
    writeFile('tokens/tokens.json', artifacts.tokens),
    writeFile('css/tokens.css', artifacts.css),
    writeFile('css/appearance.css', artifacts.appearance)
  ]);
}
