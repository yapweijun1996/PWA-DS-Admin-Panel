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
