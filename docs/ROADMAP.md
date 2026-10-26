# Roadmap — Enterprise Admin Panel SSOT Design System (owner spec "v1.0.0 Proposed")

Source: owner-provided "Enterprise Admin Panel — SSOT Design System" (14 sections: tokens, layouts, ~70 components,
IDP extension, SSOT architecture, AI-agent governance, quality gates). Phase 1 (`docs/SPEC.md`) stays the foundation;
this file maps the rest of the owner spec onto later phases.

## Decisions on conflicts (recorded, change on owner request)
| Topic | Owner spec | Phase 1 spec (KB standard + addendum v2.1) | Decision |
|---|---|---|---|
| Sidebar | 240px expanded / 64px collapsed | 64px rail + ~260px context panel | Keep rail + panel (owner-approved addendum); collapsed state = rail only, so the 64px rule is met. |
| Top bar height | 56px | 64px | Keep 64px token `--topbar-height`; value is a token, trivial to change. |
| Spacing / radius | 4px scale, radius 4/6/8/12 | not fixed | Adopt owner scale as tokens (`space-1..12`, `radius-sm..xl`). |
| Colour | primary `#2563EB`, neutral slate | emerald accent | Adopt owner primary blue + slate neutrals. Emerald accent from addendum is dropped for DS chrome (one accent rule kept). |
| Status colours | success `#16A34A`, warning `#D97706` | text-safe darker | Owner doc says validate contrast. `#16A34A` and `#D97706` fail 4.5:1 as TEXT on white: keep them for dots/fills, add darker `*-text` tokens (e.g. `#15803d`, `#b45309`). |
| Framework | "adapt to existing framework" | vanilla ES Modules | Stay vanilla (matches owner spec 10.1 note). Revisit React only on owner request. |
| Mobile nav | accessible drawer | bottom tab bar + More sheet | Keep owner-approved bottom tab bar (addendum); drawer for tablets if needed. |

## Phases
- **Phase 1 (running)**: tokens SSOT, app shell, 10 core components, token editor, PWA + updates, check ratchet, tests.
- **Phase 2 — Foundation completion**: split tokens (colors/typography/spacing/radius/shadows/breakpoints/layout), light + dark semantic themes,
  Inter + CJK fallback stack (open-licence fonts only), contrast validator script in `check.mjs`, `docs/DESIGN_SYSTEM.md`,
  `COMPONENT_REGISTRY.md`, `GOVERNANCE.md`, `ACCESSIBILITY.md`, agent workflow rules (spec 11).
- **Phase 3 — Components**: remaining navigation / action / form / data / feedback components from spec section 5
  (Breadcrumbs, Pagination, CommandPalette, Combobox, MultiSelect, DatePicker, FormField, FormSection, StatusBadge, KpiCard,
  DescriptionList, Timeline, Alert, Drawer, ConfirmDialog, Skeleton, EmptyState, ErrorState, PermissionState...). Each with the
  12-point component spec (section 6) rendered on its docs page.
- **Phase 4 — Layouts and patterns**: Dashboard, Listing, Form, Detail, Master-Detail, Workspace templates; search-and-filter,
  create-and-edit, bulk-actions, import-export patterns; enterprise components (PermissionGate, UnsavedChangesGuard, SavedViewSelector...).
- **Phase 5 — IDP extension**: three-pane document review workspace (20/45/35, resizable, persisted), evidence highlight, confidence indicator
  (never implies correctness), multi-document model. UI + mock data only, no backend.
- **Phase 6 — Quality and premium polish**: Playwright-free visual regression via screenshot script, axe-style manual a11y checklist,
  keyboard audit, performance checks, design-direction review with screenshots, migration guide, production-readiness report.

## Definition of done (owner)
Independent agents can build ERP / CRM / IDP pages from the same tokens, components, patterns without inconsistency;
working, documented, tested, versioned — not mockups.

## Owner decisions log
- 2026-10-26: Owner approved NO React and NO Vite. Stack stays vanilla HTML/CSS/ES Modules. Manager has authority on remaining open choices.
- 2026-10-26 (manager): sidebar = icon rail + context panel (option A); top bar 64px; owner primary blue + slate neutrals.
- 2026-10-26 (owner): "Premium" = visual quality, driven by image mockups the owner will provide later. Phase 6 design direction waits for those mockups; until then use the owner spec tokens.
- 2026-10-26 (owner): Target products = ERP, CRM, School system (generic admin panel, not IDP-specific). Consequences: IDP extension (Phase 5) becomes optional; add ERP / CRM / School example extensions with mock data in Phase 5; add brand-skin token layer (accent + logo override without touching components) and EN/中文 i18n as first-class in Phase 2.
- 2026-10-26 (owner): MUST have Chart and Combobox. Manager decision: both are the FIRST items of Phase 2 (Phase 1 scope is frozen while OMP builds it).
  - Combobox: searchable single + multi select, ARIA 1.2 combobox/listbox pattern, full keyboard (arrows, Enter, Escape, type-ahead), async/option groups, empty and loading states, no native select.
  - Charts: own dependency-free SVG components (line, bar, stacked bar, area, donut, sparkline), colours only from tokens (categorical palette tokens, light/dark validated for contrast), tooltip + legend, responsive, reduced-motion aware, and an accessible data-table fallback for every chart. No chart library (keeps no-dependency rule and licence risk at zero).
- 2026-10-26 (owner): MUST have an SSOT Design System preview and learning page, to learn the DS knowledge (combobox, chart types, and so on).
  Manager decision: route `#/learn` ("DS Guide"), Phase 2 deliverable, built so it cannot drift from the code:
  - Content is rendered FROM `components/registry.js` metadata (purpose, props, variants, states, keyboard, a11y, do/don't, example). No hand-copied duplicate docs.
  - Live demos use the real components (the same code the apps ship), with playground controls and a copyable snippet.
  - Choosing guides (decision help): Select vs Combobox vs MultiSelect vs Radio; chart type chooser (line = trend over time, bar = compare categories, stacked bar = parts across categories, area = volume over time, donut = share of a whole with few slices, sparkline = tiny trend in a table/KPI); modal vs drawer vs popover; table vs card list.
  - Foundations pages: colour (palette, semantic, contrast pairs), typography scale, spacing, radius, shadow, icons, density, themes.
  - Pattern pages: listing, form, detail, dashboard, workspace, with annotated screenshots-free live examples.
  - `check.mjs` ratchet fails if a registered component has no guide metadata.
- 2026-10-26 (owner): Sample design received: `docs/design/mockup-ds-components.webp` (a "Design System Components" page). It is the visual reference for "premium" and OVERRIDES the earlier sidebar choice.
  Superseded: sidebar option A (icon rail + context panel). New: traditional sidebar ~240px (collapsible to a 64px icon rail), grouped sections (Main / Analytics / System) with
  nested sub-navigation under the active item (e.g. Settings > General, Team Members, Integrations, Design System, Audit Logs), user/account card at the bottom. Top bar ~56px:
  breadcrumbs left, global search with Cmd+K hint centre, notification bell with count badge, theme toggle, user menu right. Phone behaviour unchanged (bottom tab bar + More sheet).
  Brand in the mockup ("IDP Studio Pro", "Upgrade to Pro" card) is sample content only; DS ships a neutral brand via the brand-skin token layer.
  The mockup's page IS the DS Guide layout (`#/learn`): page title + subtitle, tabs "Components / Design Tokens / Guidelines", responsive card grid, each card = icon + title + subtitle + live demo.
  Extracted spec to build (Phase 2, first item "mockup alignment", done before new components):
  - Tokens: colour swatches blue (primary), light blue, green, amber, red, purple, slate; Inter; spacing 4/8/12/16/24/32; radius 0/4/8/12/16. Exact hex values are sampled from the image in a real browser (canvas getImageData) and checked for contrast before use.
  - Buttons: Primary / Secondary(soft blue) / Outline / Ghost / Danger(soft red) x sizes Large / Default / Small.
  - Badges: Default, Success (Paid, Active), Warning (Pending, Review), Danger (Failed, High), Info (Info, Beta), Neutral (Draft, Archived); soft tinted background + text colour.
  - Inputs: text with leading icon, select, search, textarea; toggle (enabled/disabled), checkbox (checked/unchecked/indeterminate), radio, switch with label + description.
  - Tabs (underline), Card with actions, Alerts (success/info/warning/danger with dismiss), Toasts (stacked, title + time, dismiss), Table (row selection checkboxes, status badges, row action menu),
    Pagination (page buttons + "Showing x to y of z" + rows per page), Breadcrumbs, Modal preview trigger, Empty state (icon, message, action).
  - Visual language: white cards on light grey app background, 1px soft borders, large radius, soft tinted state colours, generous icon use (Lucide-style, one SSOT).
- 2026-10-26 (owner): Second sample design: `docs/design/mockup-listing-documents.webp` (Documents listing with detail side panel). Reference for the Listing and Master-Detail templates (Phase 4), same shell as the first mockup.
  Extracted spec:
  - Page header: title + one-line description left, ONE dominant primary action right (split button "Upload Documents" with dropdown arrow).
  - Filter bar in a white card: search input, four filter dropdowns with leading icons (status with colour dot, date, document type, saved views), all same height.
  - Table card: result count "1-10 of 248", column visibility menu ("Columns") top right; header row with select-all checkbox and sortable column (arrow on Upload Date);
    columns = ID (blue link), name, type pill (tinted per type), pages, uploaded by, date, status badge with dot, confidence = percentage + progress bar (green high, blue mid, red low), row actions "...".
    Selected row = light blue tint + checked box. Footer: "Show [10] per page" and numbered pagination with ellipsis, prev/next, active page filled blue.
  - Right detail panel (drawer-style, ~30% width): title, close X, id + type pill, preview image area, tabs (Details / Extracted Data / Activity), key-value rows with icons (DescriptionList), status badge, confidence bar.
  - Below the table: two cards side by side. "Bulk Actions" (empty state text + disabled buttons Process / Download / Move / Delete / more) and "Recent Uploads" (list with status badge + relative time, "View All" link).
  - Sidebar here shows items Main (Dashboard, Documents, Transactions, Customers, Sales, Purchases), Analytics (Reports), System (Settings), plan card "Upgrade to Pro" and company switcher at the bottom.
  - New components implied: SplitButton, FilterDropdown with icon, SavedViews, ColumnVisibilityMenu, ProgressBar (inline in table), TypePill, DescriptionList, Drawer/DetailPanel, BulkActionToolbar, RecentList, CompanySwitcher.
  Brand text and "Upgrade to Pro" remain sample content only. Document-processing semantics (confidence, extraction) belong to the optional IDP extension, not the core DS.
- 2026-10-26 (owner): Admin panel MUST offer three user-selectable appearance axes: THEME (light, dark), COLOR PALETTE, STYLE (premium, apple-style liquid glass).
  Manager design (Phase 2 foundation; Phase 1 only ships light/dark/system):
  - Three independent attributes on `<html>`: `data-theme="light|dark"` (plus "system" preference resolved by script), `data-palette="<name>"`, `data-style="premium|glass"`. Persisted in localStorage, applied before first paint (inline boot script) to avoid flash. Any combination must work: 2 themes x N palettes x 2 styles.
  - Layering of tokens (SSOT, `tokens/*.json` -> generated CSS): primitive palette scales -> semantic tokens per theme -> palette overrides ONLY the accent scale (`--color-accent-*`) -> style overrides ONLY surface treatment tokens (radius, border, shadow, blur, surface alpha, motion). Components consume semantic tokens only and never know the axis values.
  - Palettes: curated presets (blue default, indigo, violet, emerald, teal, rose, orange, slate), each validated for contrast in light and dark (accent as button fill with white text >= 4.5:1, accent text on surface >= 4.5:1). Optional custom accent hex: scale generated by script and rejected if contrast fails.
  - Style "premium": solid white/near-black surfaces, 1px soft borders, soft layered shadows, large radius (matches the owner mockups).
  - Style "glass" (Apple-style liquid glass): translucent surfaces with `backdrop-filter: blur() saturate()`, thin light inner border and specular highlight, soft ambient background (gradient mesh from the palette), pill/large radii, gentle spring-like motion. Applied to top bar, sidebar, cards, popovers, modals, toasts; tables and form inputs keep a more opaque surface for readability.
  - Safety rules for glass: text/background contrast verified against the WORST-CASE backdrop (not just the base colour); automatic solid fallback when `prefers-reduced-transparency: reduce` or `backdrop-filter` unsupported; `-webkit-backdrop-filter` for Safari; limit blurred layers per screen (performance); respects `prefers-reduced-motion`.
  - UI: Settings > Appearance has Theme (Light/Dark/System), Palette (swatches), Style (Premium/Glass) with live preview; DS Guide page shows every component under each axis; the token editor edits per axis. `check.mjs` gains a matrix contrast test over theme x palette x style.
- 2026-10-26 (owner): Third sample design `docs/design/mockup-customers-crm.jpg` (Customers CRM page, desktop + phone view) plus owner-supplied style research
  (10 admin styles; hybrid "Enterprise Liquid" recommendation: Liquid Glass ~15% on chrome, Linear minimalism ~35% on navigation/workspace, Stripe enterprise clean ~35% on tables/forms,
  Bento ~15% on dashboards). The percentages are a design direction, not code. Manager decisions:
  - Style axis values become `enterprise` (default, solid surfaces = Linear + Stripe clean + Bento dashboards) and `liquid` (the hybrid: glass ONLY on top bar, floating toolbars, dropdowns/popovers, modals, toasts; sidebar light glass optional).
    DataTable, forms, invoice/PDF/JSON/code viewers and all dense content stay solid in BOTH styles (Apple guidance: avoid glass in content areas; readability beats effect).
  - Not building Neumorphism, Neo-Brutalism or full Glassmorphism (low suitability for ERP/CRM/School, unclear control boundaries). Dark Fintech is covered by the dark theme with Compact density, not a separate style.
  - Bento grid is a Dashboard layout pattern (Phase 4), not a global style.
  - Mockup 3 spec: sidebar (Home, Dashboard active with tinted bg + icon, Projects, Tasks with count pill, Reporting, Users) and bottom group (Notifications with count, Support, Settings) + user card with avatar and chevron;
    page header with Import (outline) and Add customer (primary); underline tabs (Overview, Table, List view, Segment, Custom); KPI cards (label, big number, trend pill with arrow, kebab menu; one card with avatar stack);
    removable filter chips ("All time x", "US, AU, +4 x") + "More filters" + search; table with select-all (indeterminate), sortable column, company cell = logo avatar + name + domain, status pill (Customer green / Churned neutral),
    two-line about text, avatar stack with +N, thin usage bar, footer Previous / "Page 1 of 10" / Next. Phone view: top bar with menu icon, stacked KPI cards, full-width search + "Edit filters", horizontally scrollable tabs, compact table.
    Accent here is indigo-blue: palette presets include both this indigo and the earlier blue.
  - New components from mockup 3: AvatarStack, FilterChip (removable), KpiCard with trend pill, CountPill (nav counts), UserCard menu, Logo/Avatar cell, usage ProgressBar.
