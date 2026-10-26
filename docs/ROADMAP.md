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
