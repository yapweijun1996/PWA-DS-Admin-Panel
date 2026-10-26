# Phase 4 — Product extensions: ERP, CRM, School examples (layer L7)

Read first: `docs/SPEC.md`, `SPEC-phase2a.md`, `SPEC-phase2b.md`, `SPEC-phase3.md` (all hard rules apply), `docs/ROADMAP.md`, `docs/DESIGN_SYSTEM.md`, `docs/GOVERNANCE.md`, `docs/ACCESSIBILITY.md`, `docs/DECISIONS.md`, `docs/design/` mockups.
Goal: prove the design system serves ERP, CRM and School systems. Extend existing code. Vanilla, no dependencies, tokens only, no kit JS, relative paths, English, labelled mock data, no server. Do not commit or push. Version becomes 0.5.0. Work efficiently; the previous phase hit the time limit, so build in this order and keep each step green: logic + tests -> new components -> ERP -> CRM -> School -> docs.

## Architecture rule (layer L7)
Examples live in `js/examples/<erp|crm|school>/` (+ `css/examples/`), compose ONLY shared components, layouts and patterns, never the other way round: a test fails if any file outside `js/examples/` or `css/examples/` imports from them (except the router/nav registration table). State is mock and local (in-memory + optional localStorage with a "Reset demo data" action). Each example must work in all 3 kits x 2 themes without example-specific colours.
Routes: `#/examples` (overview with three cards), `#/examples/erp/...`, `#/examples/crm/...`, `#/examples/school/...`. Sidebar group "Examples" (grouped, collapsible like Components). Every screen has a visible "Mock data" notice and appears in the command palette and global search.

## New shared components (registered with full metadata + label + playground, appear in `#/learn`)
1. **Kanban board**: columns with cards, drag and drop with pointer AND full keyboard alternative (focus card, Space to pick up, arrows to move between columns/positions, Space to drop, Escape cancels, live-region announcements), "Move to..." menu on every card, WIP count per column.
2. **Calendar** (month and week views; date grid logic reused from DatePicker; events list, keyboard navigation, today marker, event chips with status colours from tokens, locale week start).
3. **Data grid (editable table)**: cell editing with keyboard (Enter edit, Escape cancel, arrows move), per-cell validation messages, column types (text, number, currency, select, date), computed footer totals/averages, dirty-cell markers, unsaved-changes guard integration, ARIA grid pattern.

## ERP (`#/examples/erp`)
- Orders listing: ListingLayout, FilterBuilder, SavedViewSelector, ColumnVisibilityMenu, BulkActionToolbar (approve/cancel with ConfirmDialog), ExportDialog (CSV of the filtered rows), status pills, pagination.
- Order detail: DetailLayout, DescriptionList, AuditTimeline, line items table, totals, permission-aware actions via PermissionGate (mock roles switch in Settings).
- Inventory dashboard: DashboardLayout/Bento with KPI cards, a stock-by-category bar chart, a stock-trend line chart, low-stock alert list with progress bars.
- New invoice: FormLayout with FormSections, Combobox for customer, DatePicker for dates, a line-item Data grid with currency, tax and live totals, validation, UnsavedChangesGuard, ConfirmDialog on discard.

## CRM (`#/examples/crm`)
- Customers listing + detail drawer (reuse the pattern from `#/kits`, but with the new layouts).
- Sales pipeline: Kanban (Lead, Qualified, Proposal, Won, Lost) with deal value totals per column and a donut of deals by stage.
- Customer 360 detail: DetailLayout with tabs (Overview, Activity timeline, Deals, Notes), AvatarStack, contact DescriptionList.
- Activity calendar: Calendar with meetings and follow-ups, add-event modal with validation.

## School (`#/examples/school`)
- Students listing: ListingLayout with class filter (Combobox), status pills, search.
- Student profile: DetailLayout, tabs (Profile, Attendance, Grades), attendance sparkline and grade line chart, guardian contacts.
- Attendance sheet: a class roster with Present / Absent / Late per student (RadioGroup), date picker, "mark all present", summary donut, save with confirmation and unsaved guard.
- Gradebook: editable Data grid with assignment columns, validation (0-100), computed average and rank, bar chart of class distribution, CSV export.
- Timetable: Calendar week view of lessons (mock), class and teacher filters.

## Quality rules
- Everything keyboard accessible; destructive actions confirm; phone layouts usable (tables become scrollers with sticky first column or card lists; kanban becomes a column tab view on phones).
- Charts always have table alternatives; no raw colours; empty/loading/error states present for each list.
- Unit tests for pure logic: kanban move model, calendar grid/event placement, data grid edit/validation/totals, order totals and tax math, attendance summary, grade average/rank, filter/save-view integration, import-direction architecture test.
- Registry metadata for new components is enforced by `check.mjs` (including human label).

## Interpretation policy
Unstated cases: simplest option consistent with mockups and existing code; log one line in `docs/DECISIONS.md`; do not ask. Exact rules: no dependencies; layering test; mock data labelled; everything via shared components; paths relative.

## Acceptance (manager verifies in real Chrome, 3 kits x 2 themes, 390/768/1440)
`npm run verify` green; every example screen renders without overflow or console errors; kanban keyboard move works and announces; calendar and data grid keyboard flows work; invoice totals and validation correct; attendance and gradebook flows work; exports download; offline reload and SW update flow still pass; the layering test passes.

## Final report
`docs/SUMMARY-phase4.md` with files, commands and pass counts, decisions, not verified. Capture screenshots into `docs/evidence/phase4/` (3 kits, light and dark, 1440 and 390 for at least one screen of each example) and LOOK at them; say so if capture fails. Do not claim anything you did not run.
