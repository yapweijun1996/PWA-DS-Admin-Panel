# Phase 4 implementation record

## Status
Implemented locally at version **0.5.0**. No commits, pushes, deployments or dependencies added. The registry contains **71** component/layout entries. Evidence below distinguishes render-matrix checks from representative interaction checks.

## Scope and files
- Contract and prerequisite specifications, design-system governance/accessibility documentation, decisions and all three owner mockups read and viewed.
- `js/example-routes.js`, `js/router.js`, `js/app.js`, `js/examples/index.js`: example overview, route registration/dispatch, grouped sidebar and command/global-search integration.
- Shared components: `components/{kanban,calendar,data-grid}.js`, matching `css/components/`, registry entries and pure `js/logic/` models.
- Products: `js/examples/{erp,crm,school}/index.js`, matching `css/examples/`, and `js/logic/{erp,crm,school}.js`.
- Seven Phase 4 test modules cover architecture, board, calendar, grid, ERP, CRM and School; all are imported by `tests/index.js`.
- `version.json`, `CHANGELOG.md`, `README.md`, `docs/DESIGN_SYSTEM.md`, `docs/DECISIONS.md`: release, usage/API documentation and interpretation record.

## Commands and results
- Initial `npm run verify` exposed a prohibited test → product-model import; pure domain models were moved to `js/logic/` rather than exempting tests.
- Logic checkpoint `npm run verify`: **105 tests passed, 0 failed**, build and source/contrast checks passed.
- `node --test tests/phase4-kanban.test.mjs tests/phase4-calendar.test.mjs tests/phase4-school.test.mjs tests/phase4-architecture.test.mjs`: **28 passed, 0 failed**.
- Real Chromium smoke: overview renders; Kanban Space → Right → Space announces “Dropped Mock Acme renewal, Qualified, position 1 of 2.” Calendar Right moves focus to 27 October and announces selection. No page errors observed in these smoke runs.
- Integrated component/domain, review-fix and final `npm run verify` checkpoints: **144 tests passed, 0 failed** each; build and source/contrast checks passed. Products shared an integrated checkpoint rather than separate per-domain verification runs.
- Real Chrome render matrix ran twice, including after final behavioral fixes: **234 checks per complete run** (13 screens × 3 kits × 2 themes × 390/768/1440), zero page-level horizontal overflow, headings and Mock data notices present. Final run had no page errors or error-level console entries.
- Captured **36 required screenshots** (ERP inventory, CRM pipeline, School gradebook × three kits × both themes × 390/1440) and LOOKED at all through six generated contact sheets; additional overview and phone Kanban interaction captures inspected individually.
- Initial managed headless screenshot calls timed out. Real Chrome capture succeeded. Two matrix attempts stopped on stale worker-cached School headings; clearing the development registration/cache exposed the current source, then the complete matrix passed.
- Exercised invoice 3 × $125.50 + 9% = $410.39, Escape cancellation, customer-required and quantity-minimum validation, successful save and navigation discard guard.
- Exercised order confirmed bulk approval, saved search view restore and actual filtered CSV download; inspected `mock-erp-orders.csv` (one approved SO-1042 row).
- Exercised attendance Mark all present → 4/0/0 summary → confirmed save; grade 101 rejected, 100 accepted → average 94/rank 1 → confirmed save and inspected `mock-gradebook-7A.csv`.
- Exercised CRM event title/time validation and saved event visible in agenda; pipeline keyboard commit/cancel, pointer drag, Move to menu and phone column tabs.
- Exercised Data grid select and DatePicker editors; selected date committed to ISO 2026-10-27.
- Customer search → keyboard row activation opened the detail drawer; actual filtered CRM export inspected in `crm-mock-customers.csv` (one Catalog row). Command search navigated to School timetable; combined class/teacher filters reduced lessons to two; keyboard day movement and phone calendar screenshot inspected.
- Settings Viewer role disabled both order actions with reasons; Administrator restored capabilities.
- Real offline emulation reported `navigator.onLine === false`; reloads of ERP inventory, CRM pipeline and School gradebook rendered with activated service-worker control.
- Waiting-worker flow: Update now on dirty grades opened the guard; Keep editing retained score 89 and left the worker waiting. Update now → Discard changes activated the worker and produced **one observed reload**, activated controller and restored seed score 88.

## Review fixes and regression smoke
- Reproduced currency `12.345` becoming `$12.35` after Enter; fixed raw-draft ownership. Rechecked Enter and blur: `12.345`/`12.3456` stay invalid and invoice totals are unavailable rather than silently rounded.
- Reproduced invoice draft resetting from `$410.39` to `$273.59` on sidebar toggle; shell-only rerenders now retain mounted editors. Rechecked invoice sidebar/theme changes, gradebook theme changes and attendance theme changes; dirty values and later navigation guards survive.
- Reproduced CRM date arrows opening Add activity and filter changes reverting Week to Month; date browsing no longer opens a modal and Week survives customer filtering. Nested focus-trap recursion occurred while reproducing the old modal bug; no errors remained after fixes and final matrix/interaction checks.
- Reproduced a hidden invoice grid remaining displayed beside simulated loading; root hidden styling now yields `display: none`.
- Attendance save-through-navigation was exercised without a second stacked dialog.
- These DOM/event regressions were verified in real Chrome; no dependency/browser-test framework was added solely to automate them. Pure model tests remain permanent.

## Decisions
- Product records are local mock/session state; saved filter views remain browser preferences.
- The explicit registration/dispatch boundary is `js/example-routes.js`; lower layers may not import product modules or styles.
- Currency/tax calculations use integer cents, line-level half-up rounding and basis-point tax rates.

## Not verified
- Physical iOS/Safari devices, installed-mode device UX and real screen-reader testing.
- The render matrix is not an exhaustive every-control interaction/keyboard audit in every kit/theme/width. Representative interactions above were exercised in Chrome, including phone Kanban/calendar and desktop editors.
- No backend, real authentication, real financial operations or real student/customer data exist by design.
