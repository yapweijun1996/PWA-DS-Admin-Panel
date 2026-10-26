# Phase 3 — v0.4.0

## Status and provenance

The first implementation run was cut off by the deadline ("Deadline exceeded") before its summary was written. This round completes the shared presentation corrections and documentation. No commit or push was made; no project dependencies were added.

The manager reported the earlier 76-test pass, 516 Chrome renders, DatePicker grid keyboard, FilterBuilder filtering, MasterDetail resize persistence and TreeView keyboard checks. Those are manager-provided prior evidence, not checks rerun or claimed by this round.

## Implementation files

- Phase 3 adds 39 registered component/layout implementation and stylesheet pairs, bringing the registry to 68. Actions, forms, feedback, TreeView/timelines, command palette, enterprise workflows and six layout templates are described in `docs/SPEC-phase3.md` and `docs/DESIGN_SYSTEM.md`.
- `js/logic/` owns pure date, number, currency, filter, CSV, command ranking, tree navigation and pane persistence models. `js/pane-resizer.js` adapts pane sizing to DOM; `js/patterns.js` composes live workflow examples. `js/kits-showcase.js` reuses shared layouts and form/workflow components.
- This correction updates `components/registry.js`, `components/metadata.js`, `scripts/check.mjs`, `tests/check.test.mjs`, `js/app.js`, `js/learn.js` and `css/shell.css`: required human labels, eight canonical categories, counted accessible category disclosures, label/category command results, registry-purpose detail headers and no duplicated playground heading in detail hosts.
- `js/icons.js`, `components/date-picker.js`, `components/tree-view.js`, `css/components/tree-view.css`, `components/workspace-layout.js`, `components/master-detail-layout.js`, `css/components/workspace-layout.css` and `css/components/master-detail-layout.css`: calendar triggers (including the range picker through shared implementation), SSOT tree icons, equal stretched panes, consistent Card padding and subtle decorative borders.
- `CHANGELOG.md`, `docs/DESIGN_SYSTEM.md`, `docs/DECISIONS.md` and this summary document v0.4.0. Build regenerates token CSS/exports, install icons, build information, manifest and worker cache metadata.

## Decisions

- Stable registry `name` remains a route/implementation ID; required `label` is presentation data. Missing/blank and code-style labels fail the check gate. A behavioral validation regression covers rejected identifiers and accepted human labels.
- The category SSOT includes Actions, Forms, Data display, Navigation, Feedback, Charts, Layouts and Enterprise. Sidebar buttons control hidden groups with `aria-expanded`/`aria-controls`; the current page category starts expanded, others collapsed. Rail and phone navigation remain separate responsive surfaces.
- Detail pages own the title and purpose; standalone Guide previews retain playground headings. Component command results show human label plus actual registry category.
- Desktop workspace panes are 360px high in the checked examples; master-detail panes also measured 360px each. Compact views retain their existing separate-pane navigation rather than shrinking three desktop columns onto a phone.
- Decorative borders use `--color-border-subtle`; control/focus contrast thresholds are unchanged. Icons come only from `js/icons.js`. No kit-specific JavaScript was introduced.

## Commands and measured results

| Command | Result |
|---|---|
| `npm run serve -- 4187` | Started the local static server for browser checks. |
| `npm run verify` (initial attempt in this round) | Failed because metadata's category allowlist did not yet include Layouts/Enterprise. Updated the canonical allowlist and made sidebar consume it. |
| `npm run verify` (after correction) | PASS: build, source/metadata/label/contrast checks, **77 tests passed**, 0 failed, skipped or cancelled. |
| `node scripts/contrast.mjs` | PASS: **48** theme × palette × kit combinations, **2,640** pairs, including worst-case glass backdrops. |

An initial server invocation with `--port 4173` failed because this server takes a positional port; the successful invocation above used the documented implementation contract.

## Fresh browser evidence

Real Chrome captures are in `docs/evidence/phase3/`, named `<kit>-<theme>-<width>-<surface>.png`:

- **48 screenshots**: Enterprise, Liquid and Ops × light/dark × exact 1440/390 CSS-pixel widths × sidebar, detail, workspace and palette.
- Desktop sidebar captures show all eight collapsed category headers and counts on the catalog. Phone sidebar captures show the existing More sheet because the desktop sidebar is intentionally hidden on phones.
- Detail captures use Date picker; workspace captures show equal desktop panes or the compact Records tab; palette captures search `layout` and visibly show human labels plus Layouts category.
- All 48 final screenshots were opened and visually inspected in four contact sheets. Exact-width measurements were checked in-page; every captured surface reported no document horizontal overflow. Workspace measured `[360,360,360]` desktop and `[360]` for the single visible compact pane in every kit/theme.
- Browser smoke also exercised category pointer/Space toggling, current-category expansion on route changes, Cmd+K, filtered command Enter navigation to Filter builder, MasterDetail ArrowRight resizing from 353 to 363 with a localStorage preference key, and TreeView Left collapse / Right expand / Down focus movement to Welcome packet. DateRangePicker's rendered trigger contains the shared calendar SVG.

Capture recovery: the first managed-headless screenshot path timed out, and one Chrome connector was unavailable due to an existing profile lock. The alternate connected Chrome tools succeeded. Ordinary window resizing clamped narrow widths to 500px; those preliminary images were overwritten using explicit viewport emulation and checked `innerWidth === 390`. Only the final exact-width images are retained.

## Not verified in this round

- The manager's complete 516-render route matrix was not repeated. Fresh evidence is limited to the corrected surfaces and the focused interactions listed above.
- No fresh complete 768px matrix, exhaustive DatePicker grid keyboard sequence, FilterBuilder predicate UI flow, CSV import/export UI flow, pointer-drag persistence cycle, offline reload/update lifecycle, screen-reader session, physical phone, Safari or Firefox run.
- No claim of a fresh full console-error audit: overflow measurements and screenshots were collected, but a complete console log pass was not performed in this round.
- Evidence uses blue palette, comfortable density and explicitly expanded desktop navigation. The static contrast gate, not the screenshot set, covers all palette combinations.
