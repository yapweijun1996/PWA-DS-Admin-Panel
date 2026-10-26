# Phase 2a — Mockup alignment + three Design Kits

Read first: `docs/SPEC.md` (phase 1 rules still apply), `docs/ROADMAP.md` (owner decisions log, kit definitions), `docs/DESIGN_SYSTEM.md`,
`docs/GOVERNANCE.md`, and LOOK at the owner mockups in `docs/design/` (`mockup-ds-components.webp`, `mockup-listing-documents.webp`, `mockup-customers-crm.jpg`).
Existing code is the base: extend it, do not rewrite it. Same hard rules as phase 1 (vanilla, no dependencies, no raw colours outside tokens, no fake behaviour, English code/docs). Do not commit or push.

## Goal
1. Re-skin and restructure the app shell to match the mockups (neutral brand "Forma" stays; do not copy "IDP Studio" / "Untitled UI" / "Upgrade to Pro" content).
2. Implement independent appearance axes on `<html>`: `data-theme` (light|dark|system), `data-palette`, `data-kit` (`enterprise` default | `liquid` | `ops`), `data-density`.
3. Deliver the THREE kits and a `#/kits` showcase so the owner can compare them with the same reference screens.

## Shell (mockups)
- Sidebar ~240px (kit may change), collapsible to a 64px icon rail with accessible tooltips; grouped sections (Main / Analytics / System) with nested sub-navigation under the active item; count pills; account card at the bottom. Persist collapsed state. Phones <768px keep bottom tab bar + More sheet.
- Top bar ~56px (kit may change), sticky and opaque (except kit `liquid`): breadcrumbs left; global search centre that really works (filters pages, components, tokens; keyboard `Cmd/Ctrl+K` focuses it; results navigate); notification bell with a count that is REAL (pending app update + unsaved/recent token changes) and a menu listing them; theme menu; user menu (language, theme, about). No fake data.
- Replace the previous rail + context panel layout. Keep routes working.

## Tokens and palettes
- Split `tokens/` into primitives and semantics as in `docs/DESIGN_SYSTEM.md` (keep generating `css/tokens.css` via `scripts/build-tokens.mjs`; keep the generated-file sync check).
- Primary blue `#2563EB` family + slate neutrals as the default; status colours as fills/dots, darker `*-text` tokens for text (>= 4.5:1).
- Palette presets: blue (default), indigo, violet, emerald, teal, rose, orange, slate. A palette overrides ONLY the accent scale, for light and dark.
- Spacing 4px scale, radius sm 4 / md 6 / lg 8 / xl 12 / pill, shadows, type scale (Inter if self-hosted open-licence font is added to the repo with its licence file; otherwise a system stack — do not hotlink).
- Inline boot script in `index.html` applies stored axes before first paint (localStorage in try/catch; theme "system" follows `prefers-color-scheme`).
- New script `scripts/contrast.mjs` computes WCAG contrast; `scripts/check.mjs` runs it over theme x palette x kit for: text on surface (>= 4.5), muted text on surface (>= 4.5), accent button fill vs white label (>= 4.5), accent text on surface (>= 4.5), focus ring and borders vs surface (>= 3). Failing pairs fail the check. Fix tokens, never weaken the check.

## Kits (token pack + surface style layer + layout preset; ZERO component JS changes per kit)
Files: `kits/registry.json`, `kits/<name>/kit.json` (token overrides, defaults, layout preset), `css/kits/<name>.css` (only `[data-kit="<name>"]` surface treatment). Built into the generated CSS by the build script where tokens are involved.
1. `enterprise` (default): Stripe + Linear clean. Solid surfaces, 1px borders, light shadows, comfortable density, radius 8, sidebar 240, top bar 56, accent blue.
2. `liquid`: Apple-style liquid glass. Ambient gradient backdrop from the palette; translucent top bar, sidebar, popovers, menus, modals, toasts, drawers with `backdrop-filter: blur() saturate()` (+ `-webkit-` prefix) via tokens; thin light inner border + specular top highlight; radius 16-20 and pill controls; soft spring-like motion. Tables, forms and the detail viewers stay high-opacity (readable). Solid fallback under `prefers-reduced-transparency: reduce` and `@supports not (backdrop-filter: blur(1px))`. At most 3 large blurred layers on screen. Contrast must hold against the worst-case backdrop.
3. `ops`: dense dark-first operations console. Compact density, top bar 48, sidebar 56 rail-friendly, radius 4-6, tabular monospaced numerals for numbers/IDs, thin high-contrast lines, teal/green accent, default theme dark (light still supported).
Kit admission test (`tests/`): fails if any file under `kits/` or `css/kits/` is JS or if component `.js` files reference a kit name.

## Components needed for the reference screens (own code, token-only styling, registered in `components/registry.js` with playground/docs like phase 1)
Breadcrumbs, Card, KpiCard (label, value, trend pill, menu), Badge/Pill variants, FilterChip (removable), AvatarStack, ProgressBar, Alert, Drawer/DetailPanel, DescriptionList, Pagination (extend table), Avatar. Reuse existing Button, Input, Select, Tabs, Table, Modal, Toast, Tooltip, Popover, Checkbox, Switch.

## Settings and showcase
- Settings > Appearance: Theme (Light/Dark/System), Palette swatches, Kit picker (3 cards with preview), Density; live, persisted, applied without reload.
- Route `#/kits`: kit switcher at the top (applies to the whole showcase live) and three reference screens rendered with the real components and mock data (labelled mock): (a) Dashboard with KPI cards, recent activity list and an empty-state card (no charts yet; charts come in Phase 2b), (b) Customers listing: page header with import + primary action, tabs, filter chips + search, table with selection, avatar/logo cell, status pill, avatar stack, usage bar, pagination, and a detail drawer, (c) Form: grouped sections, validation, save/cancel with unsaved-changes guard.
- Add an "Appearance" card in `#/overview` that links to `#/kits`.

## Interpretation policy
Unstated cases: choose the simplest option consistent with the mockups and existing code, log one line in `docs/DECISIONS.md`. Do not ask. Colour values are chosen by you from the mockups' look and the contrast rules; log them. Exact rules: no raw colours outside tokens; no kit JS; glass never on tables/forms; Light is the default theme and `enterprise` the default kit; all paths relative (site is served under `/PWA-DS-Admin-Panel/`).

## Acceptance (manager verifies independently in real Chrome)
`npm run verify` green with the new contrast matrix; every route renders without console errors in every kit x theme at 390, 768 and 1440 (no page-level overflow); kit/palette/theme switch live and persist after reload with no flash; glass fallback works when reduced transparency is emulated; offline reload still works; SW update flow still works (phase 1 tests keep passing); search works; bell count is real.

## Final report
Write `docs/SUMMARY-phase2a.md`: files, commands with pass counts, colour decisions, what you did not verify. Do not claim anything you did not run.
