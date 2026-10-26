# Phase 2b — Combobox, SVG charts, DS Guide (`#/learn`)

Read first: `docs/SPEC.md`, `docs/SPEC-phase2a.md` (all hard rules still apply), `docs/ROADMAP.md` (owner decisions), `docs/DESIGN_SYSTEM.md`, `docs/GOVERNANCE.md`, `docs/ACCESSIBILITY.md`, `docs/DECISIONS.md`, and `docs/design/` mockups.
Extend the existing code. Vanilla, no dependencies, no raw colours outside tokens, no kit JS, all paths relative, English code/docs. Do not commit or push.

## Goal
Deliver the owner's three MUST-HAVES and make them learnable: (1) Combobox, (2) Charts, (3) the DS Guide page that teaches the design system.

## 1. Combobox (components/combobox.js + css/components/combobox.css, registered with playground + docs)
- Single and multi select, searchable (type to filter, case-insensitive, matches label and keywords), option groups, disabled options, clearable, async-style loading state (mock delay) and empty state ("No results"), max-selected limit for multi, creatable option ("Create 'x'") behind a prop.
- WAI-ARIA 1.2 combobox pattern: input role="combobox", `aria-expanded`, `aria-controls`, `aria-activedescendant`, listbox/option roles, `aria-selected`, multi-select chips with remove buttons that are keyboard reachable and announced; label and error association.
- Full keyboard: Arrow Up/Down, Home/End, PageUp/PageDown, Enter select, Escape close/clear, Tab closes, Backspace removes last chip in multi, type-ahead; mouse and touch; popover repositions (flip) and never causes page overflow; works inside Modal and Drawer.
- Uses existing popover/token styling, 44px touch targets on phones, 16px font on phones.
- Use it in the `#/kits` customer form (region field) and in the customers listing filters, replacing the plain select where searching helps.

## 2. Charts (own dependency-free SVG; components/chart-*.js or one chart module + css/components/chart.css, registered)
Types: line (multi-series), bar (grouped), stacked bar, area, donut, sparkline. Each with: responsive width (ResizeObserver, no overflow), nice axis ticks, gridlines using subtle border token, legend (clickable to toggle series, keyboard accessible), tooltip on hover AND keyboard focus (focusable data points/bars), value formatting prop, empty and loading states, reduced-motion respected (animations optional and short).
- Colours ONLY from tokens: add a categorical series palette (at least 8 colours, colour-blind-distinguishable, plus pattern/marker differences for line charts) as semantic tokens for light and dark, included in the contrast matrix (>= 3:1 vs surface for marks).
- Accessibility: every chart has `role="img"` with a text summary (`aria-label` generated from data: type, series, min/max/trend) and a toggle "View as table" that shows the same data in an accessible table.
- No fake data presented as real: demo data is labelled mock.
- Use charts on the `#/overview` page (replace placeholder cards where sensible) and in the `#/kits` dashboard (KPI sparkline, trend line, donut of customer status, bar of plan usage). They must look right in all three kits and both themes.

## 3. DS Guide (`#/learn`, sidebar item "Guide" under MAIN)
Layout follows `docs/design/mockup-ds-components.webp`: page title + subtitle, tabs **Components | Design Tokens | Guidelines**, responsive card grid; each card = icon + title + one-line description + live demo area.
- **Components tab**: generated FROM `components/registry.js` metadata (do not hand-copy docs): for each component show purpose, props table, variants, states, keyboard behaviour, accessibility notes, do/don't, copyable snippet, and a live demo using the real component. Add a search field and category filter (Actions, Forms, Data display, Navigation, Feedback, Charts).
- **Design Tokens tab**: colour scales and semantic tokens (with live contrast ratio of text/surface pairs for the current theme x palette x kit), typography scale, spacing scale, radius, shadows, density, series palette, glass tokens; each swatch copies its token name.
- **Guidelines tab**: "Choosing the right component" decision guides rendered from data (not free-floating prose): Select vs Combobox vs Multi-select vs Radio; chart type chooser (line = trend over time, bar = compare categories, stacked = parts of totals across categories, area = volume over time, donut = share of a whole with few slices, sparkline = tiny trend in tables/KPIs) with an interactive "what do you want to show?" picker that recommends a chart and renders a live example; Modal vs Drawer vs Popover; Table vs Card list; Layout patterns (Listing, Form, Detail, Dashboard/Bento, Master-Detail, Masonry) with a short live example each (Masonry is a layout pattern: implement a small `masonry` layout component with CSS columns or grid, documented and registered).
  Also: appearance guide (theme x palette x kit), accessibility checklist, terminology (Token, Component, Layout, Pattern, Design Kit, Design System) and the layer hierarchy L1-L8 from `docs/DESIGN_SYSTEM.md`.
- Registry metadata becomes mandatory: every registered component must provide the fields the Guide needs. Extend `scripts/check.mjs` / tests so the build FAILS if a registered component lacks purpose, props, variants/states, keyboard and a11y notes, or a live demo.
- Everything works offline (service worker precache updated automatically by the build) and under the subpath.

## Interpretation policy
Unstated cases: choose the simplest option consistent with the mockups and existing code; log one line in `docs/DECISIONS.md`; do not ask. Exact rules: no new dependencies; no raw colours outside tokens; charts and combobox have no kit-specific JS; every chart has a table alternative; every interactive element is keyboard reachable; the version becomes 0.3.0 in `version.json`.

## Acceptance (manager verifies independently in real Chrome, all three kits, both themes, 390/768/1440)
`npm run verify` green (contrast matrix includes the series palette); combobox full keyboard flow, multi-select chips, async/empty states, inside a modal; all six chart types render in every kit/theme without overflow, tooltips on hover and focus, legend toggles, table view; `#/learn` three tabs with live demos generated from the registry; guideline chart picker recommends and renders; masonry demo; offline reload and the update flow still work; no console errors.

## Final report
Write `docs/SUMMARY-phase2b.md`: files, commands with pass counts, token/colour decisions, what you did not verify. Take real screenshots of the Guide, one chart page and the combobox in each kit (save under `docs/evidence/phase2b/`) and look at them; if screenshot capture fails, say so explicitly. Do not claim anything you did not run.
