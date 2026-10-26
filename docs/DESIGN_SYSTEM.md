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
