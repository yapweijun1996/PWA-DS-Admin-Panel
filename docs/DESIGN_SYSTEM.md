# Design System

Single source of truth (SSOT) for the PWA Design System Admin Panel. Targets ERP, CRM and School systems.
Stack: vanilla HTML, CSS custom properties, ES Modules. No framework, no bundler, no runtime dependency (owner decision, see `ROADMAP.md`).

## Principles
1. **Consistency**: one canonical implementation per component, one stylesheet per component.
2. **Clarity**: predictable layouts, explicit states, no inert controls.
3. **Efficiency**: dense, keyboard-friendly workflows.
4. **Scalability**: tokens and components work for a small admin and a large ERP.
5. **Accessibility**: WCAG 2.2 AA target, verified with real browser checks.
6. **SSOT compliance**: no raw colour, spacing or radius values outside tokens.
7. **Data integrity**: destructive and financial actions are explicit and reviewable.

## Tokens
- Sources: `tokens/primitives.json` (scales), `tokens/semantics.json` (light/dark roles), `tokens/palettes.json` (accent-only presets), `kits/<id>/kit.json` (surface/layout overrides). `scripts/build-tokens.mjs` generates `tokens/tokens.json` for the editor, `css/tokens.css` for base semantics and `css/appearance.css` for axes. Never edit generated artifacts.
- Components consume **semantic** tokens (`--color-surface`, `--color-text-primary`), not palette values.
- Dark theme overrides semantic tokens only; components never carry theme-specific colours.
- Spacing is a 4px scale (`space-1` = 4px ... `space-12` = 48px). Radius: sm 4, md 6, lg 8, xl 12.
- Status colours (success, warning, danger) are for dots and fills. Text uses the darker `*-text` tokens to meet 4.5:1.
- Every token change must keep light/dark parity (enforced by tests).

## Layout
- Sticky 56px top bar with breadcrumbs, working global search, real notification menu, theme and account controls. One grouped 240px sidebar with active nested navigation and a persisted 64px collapsed rail.
- Phones (<768px): bottom tab bar and More sheet. Tablet defaults to the collapsed sidebar. Ops uses a 56px rail and 48px top bar.
- Default theme is Light. Density: Comfortable or Compact (token-driven).
- Content max width 1600px; full-width option for data-heavy workspaces.

## Components
- Live in `components/<name>.js` plus `css/components/<name>.css`, registered in `components/registry.js`.
- Each component documents purpose, props, variants, tokens, states, keyboard behaviour, accessibility, responsive rules, example, anti-patterns.
- Icons come from the single `js/icons.js` set.
- No native `<details>/<summary>` carets or native `<select>`; menus and selects are custom popovers.
- Whole list and table rows are clickable; touch targets are at least 44px on phones.

## Dependency direction
Tokens, then themes, then core components, then layouts, then patterns, then product extensions (ERP, CRM, School), then pages.
Lower layers never import from higher layers.

## Quality gate
`npm run verify` = build tokens + `scripts/check.mjs` (ratchet) + `npm test`. A change is not done until it passes, and UI changes are
also checked in a real browser at 390, 768 and 1440px in light and dark.

## Terminology
| Term | Meaning in this project |
|---|---|
| Design Token | A named primitive or semantic value in the split `tokens/` sources; generated grouped values feed the editor. |
| Component | One reusable control (Button, Combobox, Chart, Card, Table...). |
| Layout / Template | A page structure (AppShell, Dashboard, Listing, Form, Detail, Master-Detail, Workspace, Masonry). |
| Pattern | Components combined for a task (search + filter + table, create/edit, bulk actions). |
| Design Kit (Preset) | A swappable look: token pack + style layer + optional layout preset. Lives INSIDE the Design System. |
| Design System | Everything: tokens, appearance axes, foundations, components, layouts, patterns, extensions, docs, governance. |

## Hierarchy (upper layers depend only on lower layers)
```text
L1 Design Tokens        tokens/*.json (single source), semantic tokens
L2 Appearance axes      Theme (light|dark|system), Palette (eight presets), Design Kit (enterprise|liquid|ops), Density
L3 Foundations          typography, icons, density, motion, accessibility rules
L4 Components           Actions, Forms, Data Display (incl. Chart), Navigation, Feedback
L5 Layouts              AppShell, Dashboard/Bento, Listing, Form, Detail, Master-Detail, Workspace, Masonry
L6 Patterns             search+filter, create/edit, bulk actions, import/export, unsaved guard, permission gate
L7 Product extensions   ERP, CRM, School (mock data), IDP (optional)
L8 Pages                owned by each product
Cross-cutting           documentation (DS Guide), governance, quality gates, PWA
```

## Appearance axes
`<html data-theme data-palette data-kit data-density>` are independent. The theme preference (`light|dark|system`) is stored separately and resolved to light/dark for CSS. A CSP-hashed inline boot script applies saved values before styles load.
- Enterprise: solid surfaces, balanced spacing, 240px sidebar, 56px top bar, blue default.
- Liquid: palette-derived ambient backdrop and glass chrome, menus, dialogs, drawers and toasts; dense content stays solid. Glass falls back to solid under reduced transparency or missing backdrop-filter support, and large overlays suspend chrome blur.
- Ops: compact dark-first operations preset, teal default, 56px rail, 48px top bar, tabular monospaced values. Light remains supported.
- Kit defaults apply only to axes without an explicit user selection. Kit changes never require component JavaScript branches.
- `scripts/contrast.mjs` checks all 48 theme × palette × kit combinations: primary/muted/accent/status text ≥4.5, white accent-button labels ≥4.5, control borders/focus rings ≥3, including worst-case glass backdrop checks. Decorative `--color-border-subtle` lines are excluded from control-boundary requirements; thresholds are never lowered.
- Color literals are confined to token sources and generated outputs. Use `--accent` for fills, `--accent-text` for foreground text, `--accent-contrast` for button labels and status `*-text` roles for status text.

## Required components (owner)
Chart (own SVG: line, bar, stacked, area, donut, sparkline, with data-table fallback) and Combobox (single and multi, ARIA 1.2) are mandatory.
The DS Guide page (`#/learn`) renders documentation from the component registry so docs cannot drift from code.

## Visual references
`docs/design/` holds the owner sample designs (components page, documents listing, customers CRM). They define the target look; see `ROADMAP.md`.

## Phase 2a surfaces and component documentation

`components/registry.js` is the canonical component catalog, including guide metadata and live playground renderers; no parallel hand-maintained component catalog is required. New primitives include Breadcrumbs, Card/KpiCard, Badge, FilterChip, Avatar/AvatarStack, ProgressBar, Alert, Drawer, DescriptionList and Pagination. Table and its showcase consumer share responsive table composition and row activation; the existing playground uses the shared pagination control.

Settings > Appearance changes axes live. `#/kits` compares the same mock dashboard, customers and form screens. Customer imports and saves are session-only demonstrations, not backend integration.

## Phase 2b Guide and data components

`#/learn` has Components, Design Tokens and Guidelines tabs. Registry entries supply category, purpose, props, variants, states, keyboard, accessibility, do/don't, example and live demo; `components/metadata.js` validates the contract during `scripts/check.mjs`. Existing playground previews are reused rather than copied. Usage sections expose props tables and copyable snippets.

`createCombobox()` supports scalar and array values, grouped options, case-insensitive label/keyword search, removable chips, disabled options, clear, local creation, limits and mock delay. The input owns the active descendant; the popover retains dialog DOM ownership and uses the browser top layer. Searchable region fields preserve country-code values in the showcase.

`createChart()` returns a DOM element with `update()` and `destroy()`. Types are line, bar, stacked, area, donut and sparkline; labels align with each series' `values`. Charts use solid surfaces, generated summaries, focus/hover tooltips, toggleable legends and source-data tables. Donut uses the first series as slices; negative values show explicit guidance without hiding the source table. Signed stacks use separate positive/negative baselines. Resize observers disconnect on removal.

`--series-1` through `--series-8` are semantic light/dark categorical colours, independent of accent palettes. Marks meet ≥3:1 against solid surface in every kit/theme/palette. Numbered donut slices and distinct line markers/dashes supplement colour. The Guide exposes live resolved text/surface ratios; the build remains the authoritative full appearance matrix gate.

Masonry is an L5 layout, registered for learning alongside components. CSS columns preserve source and keyboard order; avoid it when cross-column comparison or row ordering matters.

## Phase 3 components and workflows (0.4.0)

The registry contains 68 components/layouts. Each has its own implementation/style pair, complete guide metadata and a working playground; Guide previews reuse those renderers. Forms compose `createFormField({label,control,hint,error,required})` with `setError(message)` and `createFormSection({title,description,content})`. Existing customer forms and learning editors use the same field/error associations.
Registry `name` is a stable route/implementation ID; required `label` is the human-facing name. The check gate rejects missing labels and code-style identifiers. Sidebar, breadcrumbs, detail headings, Guide cards and command results consume labels; command results also display the registry category. Categories are Actions, Forms, Data display, Navigation, Feedback, Charts, Layouts and Enterprise. Sidebar category buttons expose `aria-expanded` and `aria-controls`; only the current page's group starts expanded. No native details widgets are used.

Detail hosts supply the sole page title and `guide.purpose`; embedded playgrounds omit their redundant title/description while retaining standalone headings in Guide previews. Calendar triggers and tree chevron/file/folder marks use the icon SSOT. Resizable layout panes stretch to a shared minimum height of 360px, with consistent token padding and decorative subtle borders; phone pane switching remains independent of desktop sizing.


- DatePicker and DateRangePicker use a shared date-only Gregorian calendar inside the canonical Modal. Values are ISO dates, arithmetic is UTC, display/week start is locale-aware, bounds are inclusive, and disabled days cannot be selected or crossed by a continuous range. Arrow keys move days/weeks; Home/End use locale week boundaries; PageUp/PageDown move months and Shift moves years. Escape retains a partial range and returns focus.
- NumberInput preserves invalid typed text for correction and validates bounds/step/precision; programmatic values normalize through shared number logic. CurrencyInput uses `Intl`, localized parsing, and blur/Enter formatting. Textarea counters follow native UTF-16 maxlength semantics.
- FileUpload owns local type/size validation, confirmed removal and a keyboard file chooser. DragDropZone composes it. Progress is explicitly mock and advances by a named button; files are never uploaded.
- Action components compose Button, Tooltip and Popover rather than duplicate them. TreeView consumes a pure hierarchy/keyboard model. Timelines, Stepper and feedback states communicate status in text as well as visual styling.
- CommandPalette is the only global search engine. It accepts a command array/getter with stable IDs, ranks exact/prefix/substring/keyword matches, then uses local recency to break ties. Top-bar search and Cmd/Ctrl+K open the same modal, with combobox/listbox active-descendant navigation.
- PermissionGate subscribes to the mock permission set in Settings > General; hidden/disabled actions retain explanatory reasons. This is not server authorization. UnsavedChangesGuard registers with `app:resolve-dirty` and browser unload, exposes `resolve()`/`destroy()`, and protects local save/discard decisions. PWA actions consult all registered owners.
- FilterBuilder emits a readable summary and predicate; conditions use AND by default or optional OR. SavedViewSelector stores JSON filter snapshots, not records. BulkActionToolbar follows the actual selected count; ColumnVisibilityMenu prevents hiding the last visible column.
- ImportWizard parses a file or pasted CSV, maps columns, previews rows and requires explicit local import. Domain consumers validate mapped records before review/mutation. ExportDialog generates CSV/JSON on-device; CSV neutralizes spreadsheet formulas while JSON preserves source values.

Pure models live in `js/logic/`: date, currency, number, filter, CSV, command ranking, tree navigation and layout persistence. They have no DOM dependency. `js/pane-resizer.js` adapts pane logic to DOM events; `js/patterns.js` composes shared workflows without introducing business-specific components.

### Layout slots

| Template / factory | Slots and behavior |
|---|---|
| `createDashboardLayout` | `header`, `metrics`, `content`, `footer`; 12 columns, `grid` or `bento`; content nodes or `{element,span,rowSpan}` descriptors. |
| `createListingLayout` | `header`, `summary`, `toolbar`, `table`, `pagination`, optional `detail`; table/drawer behavior stays with supplied components. |
| `createFormLayout` | `header`, `notice`, `sections`, sticky `actions`; external submit buttons associate with the supplied native form's ID. `--form-action-offset` accommodates shell overlays. |
| `createDetailLayout` | `header`, `summary`, `tabs`, `content`, `sidePanel`, `timeline`; optional side panel stacks responsively. |
| `createMasterDetailLayout` | `list`, `detail`; returns controller with `element`, `widths`, `showList`, `showDetail`, `destroy`; phone list/detail views include Back. |
| `createWorkspaceLayout` | Three `{label,content}` `panes`; controller includes `element`, `widths`, `showPane`, `destroy`; phone views use accessible tabs. |

Static templates return DOM nodes, preserve supplied nodes/listeners and support optional slots and `className`. Resizable templates accept `storageKey`, preferred `widths`, `minWidths` and optional `maxWidths`. Focusable separators expose current/min/max pixel values; Left/Right changes 10px, Shift changes 40px, Home/End reaches limits. Container fitting never overwrites persisted preferred sizes. Pointer listeners and observers are released on detach. Existing Masonry remains the independent variable-height layout.

`createTabs({items:[{label,content,disabled?}],label,active,variant,orientation,fullWidth,onChange})` is the canonical reusable tabs factory and also powers its playground. Templates and Guide examples use shared components; kit reference screens now compose Dashboard, Listing and Form templates without a separate layout convention.

Guide > Guidelines documents slots with live examples and includes a **Patterns** section: search/filter, create/edit, bulk actions, import/export, saved views, permission-aware actions and unsaved-change protection. Demonstrations are labelled mock, store records only in session memory and confirm destructive actions. Appearance remains independent; no component branches on kit names and no new colour tokens were required.

## Phase 4 product extensions (0.5.0)

The registry now has 71 components/layouts. Kanban, Calendar and Data grid expose the same required human labels, metadata, playgrounds and Guide demos as the existing catalog.

- `createKanban({columns,cards,onChange})` returns `element`, `getCards`, `setCards`, `destroy`. Cards have stable IDs, a column ID, title and optional numeric value. Pointer/keyboard movement previews until drop; Escape restores the pickup snapshot. Move-menu actions append to a destination. WIP and value totals reflect committed moves; phone column tabs retain all columns.
- `createCalendar({date,view,events,locale,onSelectDate,onSelectEvent})` returns `element`, `getDate`, `setDate`, `getView`, `setView`, `setEvents`, `destroy`. Date-only grid math comes from the DatePicker model. Month provides a selected-date agenda; week provides the whole week's agenda, preserving all events on phones.
- `createDataGrid({label,columns,rows,onChange,onDirtyChange})` returns `element`, `getRows`, `isValid`, `markSaved`, `setRows`. Columns support text, number, currency, select and date, required/bounds/custom validation and numeric sum/average footers. Invalid drafts are retained and excluded from aggregates. `markSaved` refuses invalid data; `setRows` silently establishes a new clean baseline. Consumers retain their saved snapshots and wire `onDirtyChange` into UnsavedChangesGuard.

`#/examples` composes the three L7 workspaces from shared components/layouts/patterns. Product code lives in `js/examples/{erp,crm,school}/`, styles in `css/examples/`; only `js/example-routes.js` imports product modules for dispatch. `scripts/check.mjs` rejects reverse product imports, including dynamic imports and CSS imports. Domain models live under `js/logic/`, so tests do not bypass the boundary.

ERP uses integer-cent, per-line half-up tax math and maps existing Settings mock customer capabilities to labelled order/invoice actions. CRM activity times are local demonstration labels, not timezone-aware timestamps. School treats Late as attended, excludes missing scores from averages and uses competition rank on unrounded averages (1, 1, 3). Gradebook calculations appear in an adjacent shared Table rather than inventing a second grid implementation. Product records are fictional and session-local; confirmed reset restores seeds without erasing saved view preferences.
