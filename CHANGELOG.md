# Changelog

All notable changes are documented here. Format follows Keep a Changelog; versions follow semantic versioning.

## [0.6.1] — Mobile polish
### Fixed
- Phone "More" sheet: bottom-anchored full-width sheet, one data-driven list with an icon on every row, divider between Explore and Settings; removed the post-hoc link injection.
- Distinct icons for Settings sections (General, Appearance, About, PWA) and for all 71 component tiles (previously a generic dots icon).
### Added
- ~45 SVG icons plus `componentIcons` / `settingsIcons` maps in `js/icons.js`, and `tests/icons.test.mjs` which fails on unknown icon names, unmapped components and duplicate settings icons.

## [0.6.0] — Phase 5
### Added
- Dependency-free kit export CLI (`--kit`, `--palette`, `--out`) and `npm run export:kits`, with selected axes, both themes, shared component modules/styles, icons, pre-paint boot snippet, deterministic SHA-256 manifest and standalone consumer demo.
- `docs/USAGE.md` adoption/upgrade guide and generated `docs/COMPONENT_REGISTRY.md`; `npm run docs:registry` regenerates the reference and `check.mjs` rejects stale output.
- `prefers-contrast: more` semantic tokens and an expanded 96-combination contrast gate.
- Dependency-free current-DOM accessibility self-check, Settings/About results list, and pure naming/heading rule tests.
### Fixed
- Precache requests bypass stale HTTP caches with `?v=BUILD` and reload semantics; mismatched or missing fetched build identity rejects installation and retains the previous worker/cache.
- Unknown routes force update discovery and offer the shared explicit Update now flow for waiting/installing workers, retaining search and Home when current. Startup and visible-tab checks share a ten-minute automatic throttle.
- Example demo-state/reset controls move into a session-remembered, initially collapsed disclosure after page headers; toggles preserve editor drafts.
- Shared density-aware table header/cell padding, page-rhythm tokens and distinct Guide/Design kits/Examples navigation icons.
- Accessible names preserve visible labels, selected values and counts; contextual component heading levels eliminate skipped headings in playgrounds, Guide and examples.
- Navigation counts use opaque text contrast; small count/badge pairs are gated at 4.5:1. Standalone demo and app suppress implicit favicon requests with an inline empty icon.
- Counted sidebar links derive names from content, collapsed labels remain in the accessibility tree, and picker day names begin with their visible number. Label-in-name checks strip punctuation/symbols, exclude hidden decorations and reject numeric substring collisions with date years.
### Migration
- Replace exported bundles as one unit after reading this changelog; do not mix builds. Exporter preserves unrelated files and refuses overwriting modified exports. Consumers own their persistence and service-worker lifecycle.
- Version remains sourced from `version.json`; rebuild generated assets and registry docs. Verification and browser evidence: `docs/SUMMARY-phase5.md`.

## [0.5.0] — Phase 4
### Added
- Shared Kanban board with pointer drag/drop, keyboard pickup/move/drop/cancel, per-card move menus, WIP counts, value totals and phone column tabs.
- Shared month/week Calendar reusing DatePicker date math, locale week boundaries, keyboard navigation, today markers and complete event agendas.
- Shared editable ARIA Data grid with typed editors, retained validation errors, dirty markers, valid-only sum/average footers and consumer-owned unsaved guards.
- ERP orders/detail, inventory and invoice; CRM customers/360, pipeline and activity calendar; School students/profile, attendance, gradebook and timetable. All compose shared components/layouts with visible mock notices and confirmed reset.
- Grouped Examples navigation, global command/search entries, reverse-import source gate, and pure behavioral tests for component/domain models.
### Migration
- Browser-local mock records are demonstrations, not backend transactions. Pure domain models live under `js/logic/`; only `js/example-routes.js` dispatches into product modules. No dependencies, kit-specific behavior or earlier-phase rewrites.

## [0.4.0] — Phase 3
### Added
- Ten form components: Textarea, NumberInput, CurrencyInput, RadioGroup, DatePicker, DateRangePicker, FileUpload, DragDropZone, FormField and FormSection.
- IconButton, ButtonGroup, SplitButton and DropdownButton; Timeline, AuditTimeline, TreeView and Stepper; ConfirmDialog, Skeleton, Spinner, EmptyState, ErrorState and PermissionState.
- Shared CommandPalette with ranked actions/pages/components/tokens, full keyboard navigation and browser-local recents.
- PermissionGate with Settings-backed mock permissions, reusable UnsavedChangesGuard, BulkActionToolbar, ColumnVisibilityMenu, SavedViewSelector, FilterBuilder, three-step ImportWizard and CSV/JSON ExportDialog.
- Six reusable layouts: Dashboard/Bento, Listing, Form, Detail, MasterDetail and Workspace. Resizable layouts persist preferred widths and expose separate phone views.
- Pure logic modules and 38 behavioral unit tests for dates/locales, currency, precision, filters, CSV, command ranking, tree navigation and pane persistence.
### Changed
- The catalog contains 68 registered components/layouts with mandatory metadata and live demos. Guidelines includes actual layout templates and seven working workflow patterns.
- Kit reference screens compose shared layouts, FormField/FormSection, import/export and the extracted unsaved guard without replacing earlier-phase functionality.
- Top-bar search and Cmd/Ctrl+K share one modal engine instead of a separate results dropdown. Tabs exposes a reusable `createTabs()` factory used by its playground and layout consumers.
- PWA update/cache actions consult registered dirty-edit owners even when the legacy global dirty flag is false.
### Fixed
- Narrow table status pills keep their intrinsic single-line width rather than collapsing into vertical letters; the existing table region handles horizontal scrolling.
- Registry human labels replace implementation identifiers across navigation, breadcrumbs, Guide and command search; search results include their component category.
- Components navigation uses eight counted, keyboard-accessible category disclosures, with the active page's category initially expanded.
- Detail pages show one title and the registry purpose. Date triggers use the shared calendar icon.
- Workspace and master-detail panes stretch consistently with subtle decorative borders; record trees use shared chevron/file/folder icons.
### Migration
- Application version remains manually sourced only from `version.json`; rebuild to regenerate build information and precache all new modules/styles.
- Command history, saved views, mock permissions and pane preferences are browser-local; mock records remain session-only. No dependencies, backend integration or kit-specific component JavaScript were added.

## [0.3.0] — Phase 2b
### Added
- Searchable single/multi Combobox with groups, disabled options, removable chips, creation, limits, mock loading and modal/drawer support.
- Dependency-free line, grouped bar, stacked bar, area, donut and sparkline charts with focus/hover tooltips, interactive legends, summaries and data tables.
- Eight light/dark categorical series tokens, checked at 3:1 against solid chart surfaces in all 48 appearance combinations.
- Registry-generated `#/learn` Guide with Components, Design Tokens and data-driven Guidelines; responsive Masonry layout.
- Mandatory registry metadata validation and chart domain/summary regression coverage.
### Changed
- Overview includes an explicitly mock trend; kit dashboards include KPI sparklines, trend, customer status and plan usage charts.
- Customer forms and region filters use the shared Combobox. Build discovery automatically precaches the Guide and new components.
### Fixed
- Chart legends now distinguish filled chart types from line/sparkline keys; donut keys show matching swatches, slice numbers and formatted values, with six-type regression coverage.
- Guide layout examples compose shared components with working local interactions, labelled validation, chart-choice icons and consistent token-based header/card spacing.

## [Unreleased]
### Added
- Phase 2a: primitive/semantic token split, blue/slate default, eight accent palettes and a 48-combination WCAG contrast gate.
- Three data-and-CSS-only design kits: Enterprise, Liquid glass and compact Operations; persisted pre-paint appearance axes.
- Traditional grouped sidebar, global keyboard search, real notifications, 13 additional documented components and shared pagination/table composition.
- `#/kits` working mock dashboard, customer listing/import/detail drawer and validated form with unsaved-change protection.
### Changed
- Application version is 0.2.0. Token authors now edit split sources and rebuild; `tokens/tokens.json` is generated for the existing editor/export contract. Existing short semantic variable names remain available.
- Phase 2a replaces the previous rail/context layout and emerald default with a collapsible sidebar and blue accent.
- Phase 2a visual correction: subtle decorative hairlines, visible Liquid glass/ambient mesh, a single human-labelled breadcrumb, straight tab/list separators, centered account initials and kit-independent sidebar preferences.
### Previously added
- Phase 1 foundation: design tokens SSOT, app shell, core components, token editor, settings, PWA with user-controlled updates.
- Standard documentation: design system, governance, accessibility, deployment, roadmap.
- GitHub Pages deployment through GitHub Actions.
