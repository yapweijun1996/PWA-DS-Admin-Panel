# Changelog

All notable changes are documented here. Format follows Keep a Changelog; versions follow semantic versioning.

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
