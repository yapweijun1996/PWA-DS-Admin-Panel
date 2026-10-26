# Governance

Rules for humans and AI coding agents who change this design system.

## Agent workflow (mandatory)
1. Read `DESIGN_SYSTEM.md`, `COMPONENT_REGISTRY.md` and `ROADMAP.md` (decision log).
2. Inspect existing components, tokens and layouts; reuse before creating.
3. Implement the smallest correct change.
4. Run `npm run verify`; check UI in a real browser.
5. Report any deviation from the design system.

## Agents must not
- Invent colour, spacing or radius values outside `tokens/tokens.json`.
- Add a second Button, Input, Modal or other duplicate foundational component.
- Add a UI framework, bundler or runtime dependency without owner approval.
- Change global tokens to fix a local issue without impact analysis.
- Skip accessibility requirements or weaken tests and checks to get green.
- Push, deploy or change production settings without explicit authorization.

## Component admission
1. Search `COMPONENT_REGISTRY.md`.
2. Confirm composition or a new variant cannot cover the need.
3. Write the component spec (purpose, props, variants, states, keyboard, accessibility, responsive, anti-patterns).
4. Implement, add tests, add the docs page, register it.
5. Release with a version bump and a `CHANGELOG.md` entry.

## Versioning
- Semantic versioning. `version.json` is the only manual version source; `scripts/stamp-build.mjs` derives the build id.
- Breaking changes (token rename, prop removal) need a migration note in `CHANGELOG.md`.

## Decisions and exceptions
- Owner decisions and manager decisions are logged in `ROADMAP.md` (Owner decisions log) and `DECISIONS.md`.
- Any exception to a rule is documented with a reason and an owner.

## Release authority
Local commits and merges follow the task. Pushing to `main` triggers the GitHub Pages deployment, so it happens only after
`npm run verify` is green and the change was checked in a browser.
