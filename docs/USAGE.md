# Adopt the design system

Forma is one vanilla design system with three appearance kits. Consumers copy a static bundle; they do not fork component implementations or install runtime packages.

## Export a look

Use Node 20 or newer in this repository:

```sh
npm run build
node scripts/export-kit.mjs --kit enterprise --palette blue --out dist-kit
npm run export:kits
```

The single export defaults to palette `blue` and output `dist-kit/`. `export:kits` creates `dist-kits/enterprise/`, `dist-kits/liquid/`, and `dist-kits/ops/`. These generated directories are git-ignored. Choose `enterprise` for solid balanced surfaces, `liquid` for expressive glass chrome with solid dense content, or `ops` for compact operational interfaces. Palettes: blue, indigo, violet, emerald, teal, rose, orange, slate. Each bundle contains only the selected kit and palette, with both themes.

Copy the **whole bundle**, preserving its internal directories, into a static project, for example `vendor/forma/`. Serve over HTTP(S), including on localhost; browser ES modules are not a `file://` workflow. Open `vendor/forma/demo.html` to check the bundle independently. Its button, input, combobox, table and chart use no files from the documentation app.

## Link styles and boot before paint

Use relative URLs from the consumer page to the bundle. Internal component imports remain relative and need no import map, bundler or server rewrites. Do not load the admin app's `js/app.js`, router, product examples or service worker into a consumer.

Follow the generated bundle's ten-line `README.md` quick start and `boot-snippet.html`. Link `tokens.css`, `components.css` (shared base and component styles), then `appearance.css` so the chosen axes override the base defaults. Include `boot.js` before the styles to resolve a `system` theme before first paint. On your document root set `data-kit` to the exported kit, `data-palette` to its exported palette, and `data-theme="light"` or `"dark"` (`"system"` can be resolved by the boot script). Set `data-density="comfortable"` or `"compact"` independently. The bundle is intentionally not a runtime kit/palette chooser: export a different bundle to change those axes.

## Add components

The exported `components/` modules and styles are the same implementations used by the Guide. Consult `COMPONENT_REGISTRY.md` in this repository or the live Guide for API, accessibility and keyboard rules. Button and input are lightweight markup with canonical classes; `button()` is the shared interactive helper:

```js
import { button, element } from './vendor/forma/components/playground.js';
import { createCombobox } from './vendor/forma/components/combobox.js';
import { createChart } from './vendor/forma/components/chart.js';

const status = element('p', { role: 'status' });
document.querySelector('main').append(
  button('Save', () => { status.textContent = 'Saved locally'; }, 'primary'),
  createCombobox({
    label: 'Region',
    options: [{ value: 'sg', label: 'Singapore' }],
    onChange: value => { status.textContent = `Region: ${value}`; },
  }).element,
  createChart({
    title: 'Mock signups', type: 'bar', labels: ['Mon', 'Tue'],
    series: [{ name: 'Mock signups', values: [4, 7] }],
  }),
  status,
);
```

Give inputs persistent labels and hint/error associations. Use semantic token variables for custom composition, not literal colours or kit branches. Charts retain their table alternative; preserve component keyboard handlers and ARIA attributes. Destroy component controllers when your application's lifecycle requires it. Form guards, permissions and record persistence are consumer responsibilities, not a backend supplied by this bundle.

## Upgrade safely

1. Read the target release's `CHANGELOG.md`, especially Migration entries and any token or prop changes.
2. Export again from that release after `npm run build`, preferably into a fresh output directory. The exporter refuses unrelated files, added consumer files, modified hashed files and symlink destinations instead of deleting them. Compare `kit-manifest.json` version, build, kit, palette and SHA-256 file hashes with the deployed bundle.
3. Replace the bundle as one unit; do not mix component modules or token files from different builds. Preserve your application code separately, not edits inside generated files.
4. Exercise your real forms, tables, keyboard flows, both themes, phone width and accessibility preferences. The bundle does not register a service worker; if your consumer has one, update its own precache and explicit update UX atomically.

No dependency, licence or production backend is implied by export. Licence to be decided by the owner; no licence file has been added.
