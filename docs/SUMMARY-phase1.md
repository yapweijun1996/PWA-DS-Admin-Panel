# Phase 1 implementation summary

## Delivered files

- Entry and package contracts: `index.html`, `package.json`, `version.json`.
- Token source/build: `tokens/tokens.json`, `scripts/build-tokens.mjs`, generated `css/tokens.css`.
- Shell/pages: `js/app.js`, `js/router.js`, `js/i18n.js`, `js/icons.js`, `css/app.css`.
- Component registry/shared playground: `components/registry.js`, `components/playground.js`, `css/components/playground.css`.
- Component JS/CSS pairs in `components/` and `css/components/`: button, input, select, checkbox, switch, tag, pill, tabs, table, modal, toast, tooltip, popover (13 registered components).
- PWA: `js/pwa.js`, generated `js/build-info.js`, `sw.js`, `manifest.webmanifest`, `scripts/build-icons.mjs`, `scripts/stamp-build.mjs`, and generated `icons/icon-192.png`, `icons/icon-512.png`, `icons/icon-maskable-512.png`.
- Tooling: `scripts/serve.mjs`, `scripts/check.mjs`.
- Tests: `tests/index.js`, `tests/tokens.test.mjs`, `tests/check.test.mjs`, `tests/pwa.test.mjs`, `tests/contracts.test.mjs`, `tests/tooling.test.mjs`.
- Documentation: `README.md`, `docs/DECISIONS.md`, this summary. `docs/SPEC.md` remains the contract and was read fully before implementation.

No dependencies added. No commit, push or deployment performed.

## Commands actually run

| Command | Observed result |
| --- | --- |
| `node scripts/build-tokens.mjs` | Passed; generated token stylesheet. |
| Inline Node token-generation smoke | Passed 3 invariants: generated-file equality, deterministic output, complete light/dark pairs. |
| `npm run verify` — initial attempt | Failed: this Node runtime did not resolve the `tests/` directory without an entrypoint; 0 passed / 1 failed test wrapper. |
| `npm run verify` — second attempt | Build/check passed; tests 20 passed / 1 failed because a source-regex test rejected translated label getters. |
| `npm run verify` — three subsequent attempts | Each passed build, source checks and all 21 tests; 0 failed, skipped or cancelled. Final full run includes the CSP and exact colour-validation message. |
| `npm test` — final test-only cleanup check | 21 passed / 0 failed / 0 skipped / 0 cancelled. |
| `node scripts/serve.mjs 4173` | Started successfully and printed its localhost URL. Browser fetches observed `index.html` HTTP 200 and `sw.js` HTTP 200. |

The directory entrypoint now preserves the exact specified `node --test tests/` command. Registry integrity tests inspect exported entries rather than incidental source formatting.

## Browser evidence actually observed

Real headless Chromium, served over localhost:

- 20 routes at each of 390, 768 and 1440 CSS px: **60 route/viewport checks passed**, each rendered its heading with no page-level horizontal overflow and no boot-error surface. Includes all 13 component detail routes and all four Settings sections.
- Browser page-error log remained empty. Final console-error query was empty.
- Desktop light and mobile dark/light surfaces inspected through screenshots.
- Token colour ` #0F0 ` previewed as normalized `#00ff00`, saved and survived reload in localStorage and the active CSS variable.
- Invalid `#12` left the active variable unchanged and disabled Save. Invalid `red` displayed the exact required English hex-colour example message after the wording correction.
- Separate dark token editing applied `#0a0` as `#00aa00`; reset restored the original dark value. Light and dark overrides were reset independently.
- Unsaved token prompt: Cancel retained the editor, Discard closed the dialogs without saving, Save normalized and persisted `#abc` as `#aabbcc` after reload.
- Dark theme persisted after reload. Language toggle changed document language and the Tokens heading into Chinese, then back to English.
- Table: searching Amelia reduced the result to Amelia Davis; Clear restored rows; member sort changed order; Next changed page; a whole-row click opened matching member details; Escape closed the dialog; Active status filter returned only Active rows.
- Modal: Tab from the final action wrapped to the first action; Shift+Tab wrapped back; focus stayed inside; Escape closed it and returned focus to Open modal.
- Button label prop changed the preview. Custom select keyboard navigation selected Engineering. Tabs switched from Overview content to Usage content.
- Service worker registered and controlled the page. Offline reload worked; Tokens, Select docs and Table docs remained usable offline with an explicit offline banner and no overflow. Final CSP-enabled build also reloaded Overview offline successfully.
- Real waiting-worker update exercised twice using newly stamped builds. First update changed loaded and active build identifiers together and caused exactly **one** top-level navigation.
- Second update while a token was dirty showed Save/Discard/Cancel. Cancel retained the editor and waiting-worker banner. Discard then allowed activation. A DOM observer recorded the visible “Installing update…” loader and its explanatory message before reload; navigation count increased by exactly **one**, and dialogs were gone afterward.

## Interpretation decisions

Full one-line decision log: `docs/DECISIONS.md`. Key choices: grouped paired-mode tokens; explicit Save with live preview; local-only workspace identity; separate checkbox/switch and tag/pill entries; transient playground examples; timestamp build IDs; token-derived PNG/manifest colours; scope-specific cache cleanup; repository-local fixtures; same-origin CSP with inline styles for previews; sticky top bar as explicitly required by the specification.

## Not done / not independently verified

- No real iPhone/iPad, Safari standalone, OS installation, home-screen launch or physical safe-area validation. CSS safe-area support and viewport configuration exist; Chromium responsive screenshots are not proof of iOS behavior.
- No manual OS install-prompt acceptance, clipboard-denial exercise, downloaded-file inspection, storage-quota failure, update-timeout/retry failure injection or browser cache-eviction exercise.
- Not every prop, state button, toast timer, tooltip keyboard path or reduced-motion combination was individually exercised in the browser. All component routes rendered; the interactions listed above are the ones actually run.
- No automated accessibility audit or full cross-browser audit; the modal keyboard boundaries above were explicitly exercised.
- No backend exists or is required. Table records and saving demonstrations are explicitly mock; there are no server writes.
