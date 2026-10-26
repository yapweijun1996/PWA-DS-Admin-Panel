# Design System Admin Panel

Dependency-free vanilla HTML, CSS and ES modules. Node.js 20 or newer is required for tooling. No installation step or package dependencies.

## Run

```sh
npm run build
node scripts/serve.mjs
```

Open the localhost URL printed by the server. An optional port is accepted: `node scripts/serve.mjs 8080`. Service workers require localhost or HTTPS.

## Verify

```sh
npm run verify
```

This generates tokens and PNG icons, stamps the build, runs the source ratchet and executes `node --test tests/`. `npm run check` and `npm test` can also run separately after a build. `tokens/primitives.json`, `tokens/semantics.json`, `tokens/palettes.json` and kit manifests are the token sources. `tokens/tokens.json`, `css/tokens.css` and `css/appearance.css` are generated; do not edit them manually. `version.json` is the only manually maintained application version.

The UI includes Overview, token editing with separate light/dark values, 29 component playgrounds, the `#/learn` Guide, Settings > Appearance and `#/kits`. Appearance provides independent theme, eight accent palettes, three design kits and density, persisted before first paint. Enterprise is the default; Liquid adds glass chrome with solid tables/forms and reduced-transparency fallback; Ops is a compact operations rail. The showcase contains working mock dashboard charts, customer listing/CSV import/detail drawer and guarded forms with searchable region Comboboxes. Token overrides and preferences live only in this browser's localStorage. Export tokens before clearing browser storage. Mock records are not a connected backend.

Global search (`Cmd/Ctrl+K`) finds pages, components and tokens. Notifications represent actual pending updates, unsaved changes and the five most recent token edits. `node scripts/contrast.mjs` checks all 48 theme × palette × kit combinations, including conservative glass backdrops; the same matrix runs in the source check.

The Guide renders live demos and usage metadata from `components/registry.js`; missing purpose, props, variants, states, keyboard/a11y notes or a demo fails the check. Design Tokens shows current resolved contrast ratios, semantic tokens and primitive scales. Guidelines include component choices, an interactive chart recommender and live layout examples. Every SVG chart has a source-data table, focus/hover tooltip and toggleable legend; semantic series colours have distinct line markers/dashes.

## Offline contract

After the first successful online load and service-worker installation, the app shell, tokens and component documentation work offline. There are no server writes. Browser-local overrides and preferences remain available offline. Initial installation and checking for a new build require a connection. Browser storage eviction or clearing caches removes offline availability until another successful online load.

A waiting service worker displays a new-version notification. Only **Update now** activates it; activation shows a loader and reloads once after controller change. Unsaved edits require Save, Discard or Cancel before updating. Cache clearing requires confirmation. Settings > PWA & Updates exposes connection, installation, version and update controls. Browser installation availability depends on platform support; iOS uses Share > Add to Home Screen.

## Source map

- `tokens/`, `kits/`, `scripts/build-tokens.mjs`, `css/tokens.css`, `css/appearance.css`, `css/kits/`: token sources, generated artifacts and kit treatments.
- `index.html`, `js/`, `css/app.css`: shell, routing, translations and pages.
- `components/`, `css/components/`: registered component implementations and styles.
- `manifest.webmanifest`, `sw.js`, `scripts/build-icons.mjs`, `scripts/stamp-build.mjs`: PWA assets and versioning.
- `scripts/check.mjs`, `tests/`: source-contract checks and unit tests.
- `docs/SPEC.md`, `docs/SPEC-phase2a.md`, `docs/SPEC-phase2b.md`: acceptance contracts; `docs/DECISIONS.md`: interpretations; `docs/SUMMARY-phase2b.md`: execution evidence and limitations; `docs/evidence/phase2b/`: real Chrome captures.
