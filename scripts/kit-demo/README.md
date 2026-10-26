# __KIT__ design kit · __PALETTE__ palette

A dependency-free static design-system library. The bundle includes both light and dark themes, one kit and one accent palette. Its version and current source build are recorded in `kit-manifest.json`.

## Ten-line quick start

Serve this directory over HTTP with a static server, open `demo.html`, and use the following as your consumer page. ES modules need an HTTP origin rather than a file URL. Paths are relative to this bundle; it can live under any deployment subpath.

```html
<!doctype html>
<html lang="en" data-kit="__KIT__" data-palette="__PALETTE__" data-theme="light" data-density="comfortable">
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./boot.js"></script>
<link rel="stylesheet" href="./tokens.css">
<link rel="stylesheet" href="./components.css">
<link rel="stylesheet" href="./appearance.css">
<div id="example"></div>
<script type="module">import { button } from './components/playground.js'; document.getElementById('example').append(button('Try me', () => alert('Hello from your kit'), 'primary'));</script>
</html>
```

## Adoption basics

- Copy the complete bundle into your project, preserving its relative directory layout. There is no package installation, build step, CDN, router, service worker or app-shell JavaScript.
- Load `tokens.css`, `components.css`, then `appearance.css`, in that order. `components.css` includes the existing shared CSS foundations and every component stylesheet. `appearance.css` contains only this kit and palette, with both themes and the chosen kit's style layer.
- Set `data-kit="__KIT__"` and `data-palette="__PALETTE__"` on your `html` element. Switch `data-theme` between `light` and `dark`; optionally choose `data-density="comfortable"` or `compact`. Other kit or palette IDs are not bundled.
- `boot-snippet.html` is a copyable head snippet. Its synchronous `boot.js` restores the optional local theme preference before CSS loads, defaulting to light. The demo's working theme button stores that preference separately for each kit/palette. The library works when local storage is unavailable.
- Import factories directly from `components/`. The helper `button(label, onClick, variant, attributes)` and labelled native `.ds-input` controls are the canonical Button and Input implementations. `createCombobox(options).element`, `createTable({caption,header,body})` and `createChart({type,title,labels,series})` are demonstrated in `demo.js`.
- `components/registry.js` is the shared component catalog and includes factory/playground documentation. `js/` contains only the shared dependency closure; `js/icons.js` is the single icon source. Components do not branch on kit IDs.
- Keep visible labels, keyboard behavior, focus styles, table captions and the chart's source-data alternative. Chart and Combobox lifecycle controllers support cleanup; remove or destroy consumers when they are no longer needed.
- Style your layout with the included semantic CSS custom properties (`--space-4`, `--content-gap`, `--surface`, `--text`, `--radius`) instead of hardcoded visual values. `demo.css` is optional consumer layout styling, not a second component implementation.
- Every record and chart in the standalone demo is labelled Mock data. Its greeting, combobox selection, table row activation, chart legend, data-table toggle and light/dark switch are local interactions; no backend is implied.

## Integrity and upgrades

`kit-manifest.json` records version, BUILD, kit, palette and SHA-256 hashes keyed by relative file path. It hashes every bundled file except itself and contains no export timestamp or machine-specific paths. Re-exporting unchanged sources is byte-for-byte deterministic.

The exporter replaces only a recognized, unmodified previous export. It refuses unknown extra files, modified generated files, symlinks, and destinations outside the source checkout. Keep your consumer changes elsewhere, or export into a fresh directory before adopting an upgrade.
