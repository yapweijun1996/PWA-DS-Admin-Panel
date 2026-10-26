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
- Source: `tokens/tokens.json`. Generated: `css/tokens.css` via `node scripts/build-tokens.mjs`. Never edit the generated file.
- Components consume **semantic** tokens (`--color-surface`, `--color-text-primary`), not palette values.
- Dark theme overrides semantic tokens only; components never carry theme-specific colours.
- Spacing is a 4px scale (`space-1` = 4px ... `space-12` = 48px). Radius: sm 4, md 6, lg 8, xl 12.
- Status colours (success, warning, danger) are for dots and fills. Text uses the darker `*-text` tokens to meet 4.5:1.
- Every token change must keep light/dark parity (enforced by tests).

## Layout
- Top bar 64px, sticky, opaque. Icon rail 64px plus context panel ~260px; the toggle collapses only the panel.
- Phones (<768px): bottom tab bar and a More sheet. Tablet 768-1024px is its own breakpoint.
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
| Design Token | A named value (colour, spacing, radius...) in `tokens/tokens.json`. |
| Component | One reusable control (Button, Combobox, Chart, Card, Table...). |
| Layout / Template | A page structure (AppShell, Dashboard, Listing, Form, Detail, Master-Detail, Workspace, Masonry). |
| Pattern | Components combined for a task (search + filter + table, create/edit, bulk actions). |
| Design Kit (Preset) | A swappable look: token pack + style layer + optional layout preset. Lives INSIDE the Design System. |
| Design System | Everything: tokens, appearance axes, foundations, components, layouts, patterns, extensions, docs, governance. |

## Hierarchy (upper layers depend only on lower layers)
```text
L1 Design Tokens        tokens/*.json (single source), semantic tokens
L2 Appearance axes      Theme (light|dark|system), Palette (blue|indigo|violet|emerald...), Style (enterprise|liquid), Design Kit
L3 Foundations          typography, icons, density, motion, accessibility rules
L4 Components           Actions, Forms, Data Display (incl. Chart), Navigation, Feedback
L5 Layouts              AppShell, Dashboard/Bento, Listing, Form, Detail, Master-Detail, Workspace, Masonry
L6 Patterns             search+filter, create/edit, bulk actions, import/export, unsaved guard, permission gate
L7 Product extensions   ERP, CRM, School (mock data), IDP (optional)
L8 Pages                owned by each product
Cross-cutting           documentation (DS Guide), governance, quality gates, PWA
```

## Appearance axes
`<html data-theme data-palette data-style data-kit>` are independent; any combination must work and pass the contrast matrix.
- Style `enterprise` (default): solid surfaces. Style `liquid`: glass only on top bar, floating toolbars, popovers, modals, toasts.
- Dense content (tables, forms, invoice/PDF/JSON/code viewers) stays solid in every style.
- Glass falls back to solid under `prefers-reduced-transparency` or when `backdrop-filter` is unsupported.
- A Design Kit may not require component code changes; 3 to 5 kits are maintained at a time.

## Required components (owner)
Chart (own SVG: line, bar, stacked, area, donut, sparkline, with data-table fallback) and Combobox (single and multi, ARIA 1.2) are mandatory.
The DS Guide page (`#/learn`) renders documentation from the component registry so docs cannot drift from code.

## Visual references
`docs/design/` holds the owner sample designs (components page, documents listing, customers CRM). They define the target look; see `ROADMAP.md`.
