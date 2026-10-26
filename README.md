# Forma — PWA Design System Admin Panel

A dependency-free design system, living Guide and reference admin app for ERP, CRM and School interfaces. Built with vanilla HTML, CSS custom properties and ES modules: one token source, shared components and layouts, and three interchangeable Design Kits.

**[Open the live demo](https://yapweijun1996.github.io/PWA-DS-Admin-Panel/)** · [Adopt a kit](docs/USAGE.md) · [Component registry](docs/COMPONENT_REGISTRY.md) · [Design system](docs/DESIGN_SYSTEM.md)

The app uses **mock data and has no backend**. Example records are fictional and session-local; imports, edits, uploads and permission switches demonstrate browser-local UI, not production persistence, file transfer or server authorization. Version `0.6.0` delivers PWA robustness, static kit export, generated documentation and low-risk polish; see the [Phase 5 summary](docs/SUMMARY-phase5.md) for actual verification and remaining limitations.

## Quick start

Use **Node.js 20 or newer**. There is no dependency installation step.

```sh
npm run build
npm run serve
```

Open the localhost URL printed by the server. To choose a port, use `npm run serve -- 8080`. Serve over HTTP(S), not `file://`; service workers require localhost or HTTPS.

## Explore

- **Guide — `#/learn`:** Components, Design Tokens and Guidelines, with live demos, usage snippets, keyboard/a11y notes, component-choice guidance and working layout/pattern examples. The Guide reads `components/registry.js`, not a second catalog.
- **Tokens — `#/tokens`:** edit separate light/dark values, preview across the app, save/reset overrides, inspect history and export JSON or CSS. Design Tokens shows resolved contrast ratios for the current appearance.
- **Design Kits — `#/kits`:** compare the same Dashboard, Customers listing and Form under each kit. Settings > Appearance controls theme, eight accent palettes, kit and density independently, persisted before first paint.
- **Components:** 71 registered component/layout playgrounds, including searchable Combobox/MultiSelect, six SVG chart types, date/range pickers, number/currency inputs, validated form fields, file controls, feedback states and enterprise workflows. Charts retain source-data tables, keyboard/focus tooltips and toggleable legends; markers/dashes supplement colour.
- **Layouts and patterns:** Dashboard/Bento, Listing, Form with sticky actions, Detail, MasterDetail, Workspace and Masonry; search/filter, saved views, create/edit, bulk actions, mapped CSV import/export, permission-aware actions and unsaved-edit protection. Resizable panes support keyboard operation and compact phone views.
- **Search and notifications:** top-bar search and `Cmd/Ctrl+K` share one CommandPalette for actions, routes, components and tokens. Notifications reflect pending updates, unsaved changes and recent token edits, not a fictional inbox.

### Product examples — `#/examples`

Every screen is labelled **Mock data**; confirmed **Reset demo data** restores seed records, and reload restores the session datasets. State simulation and reset live in a compact **Demo controls** disclosure after the page header, closed by default with per-domain session persistence.

| Workspace | Working reference flows |
|---|---|
| ERP | Orders, saved filters, column visibility, confirmed bulk actions, CSV export and details; inventory KPI/charts; guarded invoice editor with customer/date controls, editable line items and integer-cent tax totals. |
| CRM | Customers and Customer 360 tabs; five-stage pipeline with keyboard/pointer Kanban and stage chart; activity calendar with validated local event editing. |
| School | Student directory/profiles; dated attendance with confirmation and summary chart; validated gradebook with averages/ranks, distribution and CSV; weekly timetable with class/teacher filters. |

Kanban supports Space to pick up/drop, arrows to move, Escape to cancel and a **Move to…** menu. Calendar supports arrows, locale-aware Home/End and PageUp/PageDown. Data grid supports cell arrows, Enter to edit/commit and Escape to cancel; invalid drafts remain visible with errors and cannot be saved. Full contracts are in the Guide and [component registry](docs/COMPONENT_REGISTRY.md).

## Choose and export a kit

| Kit | Look |
|---|---|
| `enterprise` (default) | Solid surfaces, restrained shadows and balanced enterprise spacing. |
| `liquid` | Palette-derived ambient backdrop and glass chrome; dense tables/forms remain solid, with reduced-transparency fallback. |
| `ops` | Compact, dark-first operations console with a narrow rail and tabular numerals; light theme remains supported. |

Kits change tokens, surface treatments and layout presets, **not component JavaScript**. The app supports blue, indigo, violet, emerald, teal, rose, orange and slate palettes. Theme, palette and density remain independent of the selected kit.

```sh
npm run build
node scripts/export-kit.mjs --kit enterprise --palette blue --out dist-kit
npm run export:kits
```

A single export defaults to palette `blue` and directory `dist-kit/`; `export:kits` writes all three into `dist-kits/{enterprise,liquid,ops}/`. A bundle contains the selected kit/palette with both themes, shared CSS and component modules, their relative runtime dependencies and icons, pre-paint boot assets, a hash manifest, a ten-line quick start and a working `demo.html`. Load `tokens.css`, `components.css`, then `appearance.css`. Export does not include or register the documentation app's service worker. Follow [USAGE](docs/USAGE.md) for embedding, safe replacement and upgrades.

## Scripts and generated sources

| Command | Purpose |
|---|---|
| `npm run build` | Generate tokens/appearance CSS, PNG icons and registry documentation, then stamp build identity and PWA precache. |
| `npm run serve -- [port]` | Run the dependency-free local static server. |
| `npm run docs:registry` | Regenerate `docs/COMPONENT_REGISTRY.md` from the canonical component registry. |
| `npm run check` | Run source-contract, metadata, generated-file sync, architecture and contrast checks; stale registry documentation fails. |
| `npm test` | Execute `node --test tests/`. |
| `npm run verify` | Run build, check and tests in order. |
| `npm run export:kits` | Export all three static kit bundles to git-ignored `dist-kits/`. |
| `node scripts/contrast.mjs` | Inspect 96 theme × palette × kit × contrast-preference combinations (4,080 pairs), including conservative glass backdrops. |

Run `check` or tests separately after a build when needed. `tokens/primitives.json`, `tokens/semantics.json`, `tokens/palettes.json` and kit manifests are token sources. `tokens/tokens.json`, `css/tokens.css`, `css/appearance.css` and `docs/COMPONENT_REGISTRY.md` are generated; change their sources, not their output. `version.json` is the sole manually maintained application version.

## Offline and update contract

After a successful online load and service-worker installation, the app shell, token editor, component documentation and local product examples work offline. Browser-local preferences and overrides remain available; there are no server writes. First installation and update checks require connectivity. Storage eviction or clearing caches removes offline availability until a new successful online load.

A waiting worker offers **Update now**; only explicit activation shows the loader and reloads once after controller change. Unsaved edits require Save, Discard or Cancel first. Settings > PWA & Updates exposes actual connection, installation, version and update controls; cache clearing requires confirmation. Installation availability depends on browser/platform support; iOS uses Share > Add to Home Screen.

GitHub Pages can briefly mix CDN asset versions. Precache uses build-busted reload requests and rejects installation if fetched build identity differs from the worker, preserving the active version. Automatic startup/visible-tab checks are throttled to ten minutes; unknown routes force an update check and offer the shared guarded update flow when a newer worker exists. This is not a per-file cryptographic integrity guarantee. See [deployment](docs/DEPLOYMENT.md) for the precise boundaries and relative-subpath requirements.

## Local data and privacy

Local storage holds appearance/preferences, token overrides/history, command recents, named filter views, mock permission IDs and optional pane widths. Records stay in session memory. Never enter sensitive data in demos, and export token overrides before clearing storage. Storage denial falls back to session behavior where possible; no server persistence is implied. CSV exports neutralize spreadsheet-formula text; JSON preserves source values. File progress is explicitly mock, and local files are never uploaded.

## Repository structure

| Path | Responsibility |
|---|---|
| `tokens/`, `kits/`, `css/kits/` | Canonical token sources, kit manifests and surface treatments. |
| `components/`, `css/components/` | Shared implementations/styles and canonical `components/registry.js` metadata. |
| `index.html`, `js/`, `css/app.css` | Documentation/admin shell, routing, translations and pages; `js/icons.js` is the icon SSOT. |
| `js/logic/`, `js/patterns.js` | Pure models and shared workflow compositions. |
| `js/examples/`, `css/examples/` | ERP/CRM/School compositions; `js/example-routes.js` is their sole route-registration boundary. |
| `manifest.webmanifest`, `sw.js` | App-shell installation, offline caching and explicit updates. |
| `scripts/`, `tests/` | Generators, static server, exporter, source-contract checks and unit tests. |
| `docs/` | Contracts, design/adoption guidance, decisions, phase summaries and browser evidence. |

## Governance and contributing

Start with [DESIGN_SYSTEM](docs/DESIGN_SYSTEM.md), [GOVERNANCE](docs/GOVERNANCE.md), the [component registry](docs/COMPONENT_REGISTRY.md) and [ROADMAP](docs/ROADMAP.md). Reuse existing components/layouts before adding one; preserve semantic-token styling, lower-layer dependency direction, relative URLs and kit-independent behavior. No framework, bundler or runtime dependency is required or added by this project.

Follow the [accessibility requirements](docs/ACCESSIBILITY.md): keyboard operation, visible focus, persistent labels, contrast, chart tables and reduced-motion support. New components need complete registry metadata and a live demo; changing their metadata regenerates both Guide content and the static registry document. Run `npm run verify`, then inspect affected UI in a real browser across kits, both themes and phone/tablet/desktop widths. Automated checks alone are not an accessibility certification.

Record interpretations in [DECISIONS](docs/DECISIONS.md); update [CHANGELOG](CHANGELOG.md) and add migration guidance for breaking changes. Push/deployment requires explicit authorization. [DEPLOYMENT](docs/DEPLOYMENT.md) documents GitHub Pages, and [SUMMARY-phase5](docs/SUMMARY-phase5.md) records current evidence and anything not verified. Actual implementation phases and preserved historical owner decisions are mapped in [ROADMAP](docs/ROADMAP.md).

## Licence

licence to be decided by the owner. No licence file has been added.
