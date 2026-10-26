import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const repoRoot = fileURLToPath(new URL('../', import.meta.url));
const markdown = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('|', '\\|').replaceAll('`', '&#96;').replace(/\s*\n\s*/g, ' ');

export function generateRegistryDoc(registry) {
  const lines = [
    '# Component registry', '',
    'Generated from `components/registry.js` by `scripts/build-registry-doc.mjs`. Do not edit; run `npm run docs:registry`.', '',
    'The live Guide and playgrounds use these same implementations and metadata. Props below describe the public API; accessibility notes supplement `ACCESSIBILITY.md`.', '',
    '| Name | Label | Category | Purpose |',
    '|---|---|---|---|',
    ...registry.map(entry => `| ${markdown(entry.name)} | ${markdown(entry.label)} | ${markdown(entry.category)} | ${markdown(entry.guide?.purpose)} |`),
    '',
  ];
  for (const entry of registry) {
    lines.push(`## ${markdown(entry.label)}`, '', `- Name: \`${entry.name}\``, `- Category: ${markdown(entry.category)}`, `- Purpose: ${markdown(entry.guide?.purpose)}`, '', '### Props / API', '');
    for (const prop of entry.guide?.props ?? []) lines.push(`- ${markdown(prop)}`);
    lines.push('', '### Accessibility summary', '');
    for (const note of entry.guide?.accessibility ?? []) lines.push(`- ${markdown(note)}`);
    lines.push('');
  }
  return lines.join('\n');
}

export async function buildRegistryDoc(root = repoRoot) {
  const { registry } = await import(`${pathToFileURL(join(root, 'components/registry.js')).href}?registry-doc=${Date.now()}`);
  const content = generateRegistryDoc(registry);
  await mkdir(join(root, 'docs'), { recursive: true });
  await writeFile(join(root, 'docs/COMPONENT_REGISTRY.md'), content);
  return { count: registry.length, content };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = await buildRegistryDoc();
  console.log(`Generated component registry: ${result.count} entries.`);
}
