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

Version 0.5.0 includes Overview, token editing with separate light/dark values, 71 registered component/layout playgrounds, the `#/learn` Guide, Settings > Appearance, `#/kits` and `#/examples`. Appearance provides independent theme, eight accent palettes, three design kits and density, persisted before first paint. Enterprise is the default; Liquid adds glass chrome with solid tables/forms and reduced-transparency fallback; Ops is a compact operations rail. The showcase uses shared Dashboard, Listing and Form layouts, with mock charts, selectable customer records, mapped CSV import, CSV/JSON export, a detail drawer and guarded forms. Mock records are session-only, not a connected backend.

Global search and `Cmd/Ctrl+K` open the same modal CommandPalette for actions, pages, components and tokens; arrows, Home/End, PageUp/PageDown and Enter navigate results. Recent commands persist locally. Notifications represent actual pending updates, unsaved changes and the five most recent token edits. `node scripts/contrast.mjs` checks all 48 theme × palette × kit combinations, including conservative glass backdrops; the same matrix runs in the source check.

The Guide renders live demos and usage metadata from `components/registry.js`; missing purpose, props, variants, states, keyboard/a11y notes or a demo fails the check. Design Tokens shows current resolved contrast ratios, semantic tokens and primitive scales. Guidelines include component choices, an interactive chart recommender and live layout examples. Every SVG chart has a source-data table, focus/hover tooltip and toggleable legend; semantic series colours have distinct line markers/dashes.

## Components, layouts and patterns

The catalog includes custom calendar DatePicker/DateRangePicker, locale CurrencyInput, precision-aware NumberInput, labelled FormField/FormSection, validated local FileUpload/DragDropZone, action groups and split menus, TreeView, timelines, Stepper, typed ConfirmDialog and feedback states. No native date/select widgets or runtime libraries are used.

Shared layouts: Dashboard (12 columns/Bento), Listing, Form (sticky actions), Detail, MasterDetail, Workspace and existing Masonry. MasterDetail/Workspace use keyboard-operable dividers and persisted sizes; phones show separate accessible views. Layout slot/API documentation and working examples are in Guide > Guidelines and the component playgrounds.

Guide > Guidelines > Patterns demonstrates search/filter, create/edit, bulk actions, mapped CSV import/export, saved views, permission-aware actions and unsaved-edit protection. Settings > General contains **Mock permissions**; these browser-local switches are UI demonstrations, not server authorization. Import accepts a local CSV or pasted text; review and explicit import precede session-only mutation. Upload progress is explicitly mock and advances through its named action.

Local storage holds preferences, token overrides/history, command recents, named filter views, mock permission IDs and optional pane widths. Never store sensitive data in demos. Export tokens before clearing storage. CSV exports neutralize spreadsheet-formula text; JSON preserves source values. Storage denial falls back to session behavior where possible; no server persistence is implied.

## Product examples

`#/examples` links to three L7 workspaces. Every screen is labelled **Mock data** and has confirmed **Reset demo data**; reload restores the session datasets.
- **ERP:** orders with filters/saved views, column visibility, confirmed bulk actions, filtered CSV export and order details; inventory KPI/charts/stock alerts; guarded invoice editor with customer/date controls, editable line items and integer-cent tax totals.
- **CRM:** searchable customers with detail drawer and Customer 360 tabs; five-stage sales pipeline with keyboard/pointer Kanban and stage chart; activity calendar with validated local event editing.
- **School:** student directory/profiles; dated class attendance with radio choices, confirmation and a summary chart; validated gradebook with computed averages/ranks, distribution and CSV; weekly timetable filtered by class and teacher.

Kanban: focus a card, Space picks up, arrows move columns/positions, Space drops, Escape cancels; each card also has a **Move to…** menu. Phones use column tabs. Calendar: arrows move days/weeks, Home/End use locale week boundaries, PageUp/PageDown changes period. Data grid: arrows navigate cells, Enter edits/commits, Escape cancels; invalid values remain visible with cell errors and cannot be saved. Numeric footers exclude invalid values. All three are documented in the registry/Guide.

`js/example-routes.js` owns product route metadata and dispatch. Product modules/styles live only in `js/examples/` and `css/examples/`; the source check rejects reverse imports outside that registration boundary. Pure models remain under `js/logic/` for reuse and independent testing.

## Offline contract

After the first successful online load and service-worker installation, the app shell, tokens, component documentation and local product examples work offline. There are no server writes. Browser-local overrides and preferences remain available offline. Initial installation and checking for a new build require a connection. Browser storage eviction or clearing caches removes offline availability until another successful online load.

A waiting service worker displays a new-version notification. Only **Update now** activates it; activation shows a loader and reloads once after controller change. Unsaved edits require Save, Discard or Cancel before updating. Cache clearing requires confirmation. Settings > PWA & Updates exposes connection, installation, version and update controls. Browser installation availability depends on platform support; iOS uses Share > Add to Home Screen.

## Source map

- `tokens/`, `kits/`, `scripts/build-tokens.mjs`, `css/tokens.css`, `css/appearance.css`, `css/kits/`: token sources, generated artifacts and kit treatments.
- `index.html`, `js/`, `css/app.css`: shell, routing, translations and pages.
- `components/`, `css/components/`: registered component implementations and styles.
- `js/logic/`: tested date, currency, number, filter, CSV, ranking, tree, pane-width, Kanban, calendar, grid and domain models; `js/pane-resizer.js`: DOM resize adapter; `js/patterns.js`: shared workflow examples.
- `js/examples/`, `css/examples/`, `js/example-routes.js`: ERP/CRM/School compositions and their sole route-registration boundary.
- `manifest.webmanifest`, `sw.js`, `scripts/build-icons.mjs`, `scripts/stamp-build.mjs`: PWA assets and versioning.
- `scripts/check.mjs`, `tests/`: source-contract checks and unit tests.
- `docs/SPEC.md`, `docs/SPEC-phase2a.md`, `docs/SPEC-phase2b.md`, `docs/SPEC-phase3.md`, `docs/SPEC-phase4.md`: acceptance contracts; `docs/DECISIONS.md`: interpretations; `docs/SUMMARY-phase4.md`: current execution evidence and limitations; `docs/evidence/phase4/`: browser captures and inspected CSV exports.
