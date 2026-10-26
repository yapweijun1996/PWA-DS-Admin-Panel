# Phase 3 — Remaining components, layout templates and patterns

Read first: `docs/SPEC.md`, `docs/SPEC-phase2a.md`, `docs/SPEC-phase2b.md` (all hard rules apply), `docs/ROADMAP.md`, `docs/DESIGN_SYSTEM.md`, `docs/GOVERNANCE.md`, `docs/ACCESSIBILITY.md`, `docs/DECISIONS.md`, `docs/design/` mockups.
Extend the existing code. Vanilla, no dependencies, tokens only (no raw colours), no kit JS, relative paths, English. Do not commit or push. Version becomes 0.4.0.

## A. Components (each: `components/<name>.js` + `css/components/<name>.css`, registered with FULL registry metadata so they appear in `#/learn` and pass the metadata check; keyboard + ARIA per `docs/ACCESSIBILITY.md`; token-only; correct in all 3 kits x 2 themes; 44px touch targets and 16px inputs on phones)
Actions: IconButton, ButtonGroup, SplitButton (primary action + menu), DropdownButton.
Forms: Textarea (counter), NumberInput (min/max/step/precision), CurrencyInput (locale formatting, no external lib), RadioGroup, DatePicker and DateRangePicker (own calendar grid, keyboard navigation, locale week start, min/max, disabled dates, no native date input), FileUpload with DragDropZone (client-side only: validates type/size, lists files, remove, progress simulation labelled mock, keyboard alternative), FormField (label, hint, error, required marker, `aria-describedby` wiring) and FormSection; migrate existing forms to FormField where natural.
Data: Timeline / AuditTimeline, TreeView (expand/collapse, roving tabindex, arrow keys, type-ahead), Stepper, DescriptionList already exists (reuse).
Feedback: ConfirmDialog (destructive variant, typed-confirmation option), Skeleton, Spinner, EmptyState, ErrorState (with retry), PermissionState.
Navigation: CommandPalette (Cmd/Ctrl+K opens a modal palette: searchable actions + pages + components, recent items in localStorage, full keyboard; the top-bar search field stays and opens the same engine).
Enterprise: PermissionGate (hides or disables by a mock permission set in settings, with reason text), UnsavedChangesGuard (reusable; already behaviour exists in the form demo, extract it), BulkActionToolbar (appears with selection count), ColumnVisibilityMenu, SavedViewSelector (saved filter views in localStorage), FilterBuilder (add/remove conditions: field, operator, value; produces a readable summary and a predicate applied to mock data), ImportWizard (3 steps: choose file, map columns, review; CSV parsed client-side; mock) and ExportDialog (CSV/JSON download generated client-side).

## B. Layout templates (js/layouts/ or components/layouts, registered and documented in `#/learn` > Guidelines with live examples; each uses only shared components and tokens; responsive; documented slots)
DashboardLayout (12-col grid + Bento variant), ListingLayout (header, toolbar, table, pagination, optional detail drawer), FormLayout (sections, sticky action bar), DetailLayout (header, summary, tabs, side panel, audit timeline), MasterDetailLayout (list + detail, resizable divider with keyboard support, persisted width, phone = separate views), WorkspaceLayout (3 resizable panes with persisted sizes, minimum widths, keyboard resize), Masonry already exists.
Refactor the `#/kits` showcase screens to use these layouts without changing their look.

## C. Patterns page
Add `#/learn` > Guidelines > "Patterns" section with live, working examples of: search-and-filter, create-and-edit, bulk actions, import/export, saved views, permission-aware actions, unsaved-changes guard.

## Registry and tests
- Every new component has complete metadata (purpose, props, variants/states, keyboard, a11y, do/don't, example, live demo); `scripts/check.mjs` fails otherwise (already enforced; keep it).
- Unit tests for pure logic: date math and locale week start, currency formatting, number precision, filter predicate, CSV parse/export, command palette ranking, tree keyboard model, layout width persistence.
- Contrast matrix still passes for any new tokens.

## Interpretation policy
Unstated cases: simplest option consistent with mockups and existing code; log one line in `docs/DECISIONS.md`; do not ask. Exact rules: no dependencies; no native date/select/details widgets; no raw colours; everything keyboard reachable; every destructive action asks for confirmation; mock data is labelled mock; paths relative.

## Acceptance (manager verifies in real Chrome, 3 kits x 2 themes, 390/768/1440)
`npm run verify` green; every new component has a working demo in `#/learn` and playground page; DatePicker full keyboard flow; CommandPalette opens with Cmd/Ctrl+K and navigates; FilterBuilder filters mock rows; ImportWizard parses a pasted CSV; layouts render without overflow; MasterDetail and Workspace resize with keyboard and persist; offline reload and SW update flow still pass; no console errors.

## Final report
`docs/SUMMARY-phase3.md`: files, commands with pass counts, decisions, not verified. Capture real screenshots into `docs/evidence/phase3/` (three kits, light and dark, 1440 and 390) and LOOK at them; say explicitly if capture fails. Do not claim anything you did not run.
