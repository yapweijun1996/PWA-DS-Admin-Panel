# Phase 5 — implementation and evidence
- Round 3: Calendar month/week counts now use `data-count` CSS generated content plus a token-sized dot (day DOM text only); shared DatePicker/DateRangePicker already have number-only day text. Self-check now includes visually rendered `aria-hidden` text, with the `26 1 ·` regression; real Chrome ran 97 routes × 3 kits and 18 open-grid checks (zero date-grid mismatches, but 342 other self-check findings: search shortcut, component-card previews, kit initials and step numbers; [raw results](evidence/phase5/a11y-round3-results.json)); calendar screenshot inspected; `npm run verify` passed all 175 tests. No axe/Lighthouse rerun, dependencies, commit or push.

Implemented locally at **0.6.0**, following A → B → C → D. Contract: `docs/SPEC-phase5.md`. No commits, pushes, deployment, dependencies, or changes outside this checkout.

## Round 2 label-in-name correction — verified locally
- **Manager-run Lighthouse in real Chrome (reported, not rerun here): Accessibility 100, Best Practices 100, SEO 100** on `#/learn`, `#/kits` (Ops dark), `#/examples/school/gradebook` and `#/examples/erp/invoice`. The manager still reported axe `label-content-name-mismatch` for counted sidebar links and calendar day decorations.
- Removed redundant sidebar link `aria-label`s, including Guide and Examples. Counts remain after their labels. Collapsed labels now use visually clipped content rather than `visibility: hidden` / Ops `display: none`, preserving content-derived names and hover/focus tooltips. Other sidebar count groups already derive names from content; the phone More sheet has no count elements or redundant link labels.
- Calendar month/week day-count spans already had `aria-hidden="true"` in this checkout; verified that behavior in Chrome rather than claiming a new calendar markup fix. Both picker variants share `components/date-picker.js`; their day names now start with the visible day number, followed by full date and range endpoint information. Their grids have no event-count decorations.
- Self-check compares lowercase, whitespace-collapsed, punctuation/symbol-stripped text, excluding `aria-hidden` descendants, with `aria-labelledby` taking precedence over `aria-label` and content. Numeric matches cannot begin/end inside another number: otherwise `26 2` accidentally matches the suffix of `2026 2 events`. The exact pair `Components 71` / `Components 71` correctly passes containment; an explicit name omitting `71` fails. Removing the redundant attribute avoids overriding browser content naming.
- Added four regression tests (13 accessibility tests total), including DOM traversal, counted links, the real calendar date/count string, hidden decoration and IDREF precedence. First run exposed two failures caused by that year-suffix false positive; after correcting numeric boundaries, **13 passed, 0 failed**.
- Installed Google Chrome: **97 routes × 3 kits = 291 current-DOM checks, zero violations**. Fresh document per route, requested hash and rendered kit asserted, service worker bypassed; Enterprise/Liquid light and Ops dark. Evidence: [a11y-round2-results.json](evidence/phase5/a11y-round2-results.json).
- Additional Chrome checks: calendar month/week views, opened DatePicker and DateRangePicker (42 days each, all names starting with the visible number), collapsed Ops rail, and phone More sheet: **zero self-check violations**. Looked at screenshots of expanded/collapsed Ops navigation and the phone sheet. No exhaustive interactive-state or width/theme matrix claimed.
- `npm run verify`: **175 passed, 0 failed**, source checks and 71-entry registry generation green. Refreshed default Enterprise export and all three kit bundles with `node scripts/export-kit.mjs --kit enterprise` and `npm run export:kits`.
- Refreshed Ops standalone `/dist-kits/ops/demo.html` loaded in Chrome, rendered its table content and returned **zero self-check violations**.
- No Lighthouse/axe rerun by this assistant, dependencies, commits or pushes. The self-check remains a focused smoke aid, not full axe parity or WCAG certification.


## Round 1 accessibility correction — verified locally
Manager-reported Lighthouse Accessibility 94–96 was treated as a failure. Shared fixes now preserve visible labels and selected values in names, including navigation/notification counts and collapsed Ops navigation; hide decorative glyphs; and supply contextual heading levels across components, Guide, playgrounds, examples and the exported demo.

- Added `js/a11y-selfcheck.js`, nine pure rule tests, and Settings → About → **Run accessibility self-check**, with live count and accessible results list.
- Final `npm run verify`: **171 passed, 0 failed**; source checks and generated 71-entry registry green. `npm run export:kits` regenerated all three bundles. `node scripts/contrast.mjs`: **96 combinations / 5,376 pairs passed**, including small navigation/count/badge pairs at 4.5:1.
- Final real Google Chrome sweep: **97 routes × 3 kits = 291 current-DOM checks, zero violations**. Each fresh document asserted its requested hash and rendered kit. Light theme, desktop viewport; this round does not claim a new exhaustive theme/width rendering matrix.
- Initial comparison: **1,815 violations across 291 rehydrated DOM snapshots**, including **29 on Guide per kit**, reduced to **0**. These are pre-integration snapshots captured while shared-module work had begun, not a pristine original-source baseline or Lighthouse counts. They preserve the original shell and Guide DOM; styles were loaded and each kit applied before checking. Raw before/after findings and exact route identities: [a11y-route-results.json](evidence/phase5/a11y-route-results.json).
- Browser iteration found an additional notification-count mismatch, then unnamed collapsed Ops sidebar links after dropping labels. Both were fixed at the shell level; the completed 291-check sweep ran afterward. Earlier hash-only navigation retained a prior kit; those invalid rows were discarded. A long fresh-document sweep timed out; the completed sweep used per-kit batches and load/module readiness instead of network-idle waits. Stale worker assets were bypassed for source QA.
- Settings button was clicked in real Chrome and produced **0 accessibility violations found** and **No violations found in the current DOM**. Captured and LOOKED at `a11y-settings-about-1440.png` and `a11y-selfcheck-results-1440.png` in `docs/evidence/phase5/`. Initial managed-headless screenshot attempts timed out and produced no files; dedicated installed Google Chrome captured both successfully.
- Liquid standalone `/dist-kits/liquid/demo.html` rendered its table/chart and returned zero self-check violations; favicon was `data:,`. App and exported demo templates include the empty data favicon.
- Documentation: this summary, `docs/ACCESSIBILITY.md`, `docs/DESIGN_SYSTEM.md`, generated registry and `CHANGELOG.md`. No dependencies, commits or pushes.
- Not rerun: Lighthouse scoring, physical-device/screen-reader audits, or every expanded interactive state. The checker is a focused DOM aid, not full WCAG certification.

### Round 1 route-by-route results
Each row lists the initial snapshot count **per kit** (Enterprise/Liquid/Ops were equal), followed by final live Chrome counts **Enterprise / Liquid / Ops**.

| Route | Initial per kit | Final E / L / O |
| --- | ---: | --- |
| `/overview` | 5 | 0 / 0 / 0 |
| `/tokens` | 4 | 0 / 0 / 0 |
| `/components` | 4 | 0 / 0 / 0 |
| `/settings/general` | 4 | 0 / 0 / 0 |
| `/settings/appearance` | 4 | 0 / 0 / 0 |
| `/settings/about` | 4 | 0 / 0 / 0 |
| `/settings/pwa` | 4 | 0 / 0 / 0 |
| `/kits` | 4 | 0 / 0 / 0 |
| `/learn` | 29 | 0 / 0 / 0 |
| `/examples` | 5 | 0 / 0 / 0 |
| `/examples/erp` | 7 | 0 / 0 / 0 |
| `/examples/erp/orders` | 7 | 0 / 0 / 0 |
| `/examples/erp/order/SO-1042` | 5 | 0 / 0 / 0 |
| `/examples/erp/inventory` | 5 | 0 / 0 / 0 |
| `/examples/erp/invoice` | 5 | 0 / 0 / 0 |
| `/examples/crm` | 7 | 0 / 0 / 0 |
| `/examples/crm/customers` | 7 | 0 / 0 / 0 |
| `/examples/crm/customer/CRM-001` | 5 | 0 / 0 / 0 |
| `/examples/crm/pipeline` | 14 | 0 / 0 / 0 |
| `/examples/crm/calendar` | 7 | 0 / 0 / 0 |
| `/examples/school` | 4 | 0 / 0 / 0 |
| `/examples/school/students` | 4 | 0 / 0 / 0 |
| `/examples/school/student/STU-001` | 5 | 0 / 0 / 0 |
| `/examples/school/attendance` | 5 | 0 / 0 / 0 |
| `/examples/school/gradebook` | 5 | 0 / 0 / 0 |
| `/examples/school/timetable` | 15 | 0 / 0 / 0 |
| `/components/kanban` | 10 | 0 / 0 / 0 |
| `/components/calendar` | 14 | 0 / 0 / 0 |
| `/components/data-grid` | 5 | 0 / 0 / 0 |
| `/components/dashboard-layout` | 6 | 0 / 0 / 0 |
| `/components/listing-layout` | 5 | 0 / 0 / 0 |
| `/components/form-layout` | 5 | 0 / 0 / 0 |
| `/components/detail-layout` | 5 | 0 / 0 / 0 |
| `/components/master-detail-layout` | 5 | 0 / 0 / 0 |
| `/components/workspace-layout` | 5 | 0 / 0 / 0 |
| `/components/filter-builder` | 8 | 0 / 0 / 0 |
| `/components/import-wizard` | 5 | 0 / 0 / 0 |
| `/components/export-dialog` | 5 | 0 / 0 / 0 |
| `/components/permission-gate` | 6 | 0 / 0 / 0 |
| `/components/unsaved-changes-guard` | 5 | 0 / 0 / 0 |
| `/components/bulk-action-toolbar` | 5 | 0 / 0 / 0 |
| `/components/column-visibility-menu` | 5 | 0 / 0 / 0 |
| `/components/saved-view-selector` | 6 | 0 / 0 / 0 |
| `/components/timeline` | 5 | 0 / 0 / 0 |
| `/components/audit-timeline` | 5 | 0 / 0 / 0 |
| `/components/tree-view` | 5 | 0 / 0 / 0 |
| `/components/stepper` | 5 | 0 / 0 / 0 |
| `/components/confirm-dialog` | 5 | 0 / 0 / 0 |
| `/components/skeleton` | 6 | 0 / 0 / 0 |
| `/components/spinner` | 5 | 0 / 0 / 0 |
| `/components/empty-state` | 5 | 0 / 0 / 0 |
| `/components/error-state` | 5 | 0 / 0 / 0 |
| `/components/permission-state` | 5 | 0 / 0 / 0 |
| `/components/command-palette` | 5 | 0 / 0 / 0 |
| `/components/icon-button` | 8 | 0 / 0 / 0 |
| `/components/button-group` | 6 | 0 / 0 / 0 |
| `/components/split-button` | 8 | 0 / 0 / 0 |
| `/components/dropdown-button` | 9 | 0 / 0 / 0 |
| `/components/date-picker` | 6 | 0 / 0 / 0 |
| `/components/date-range-picker` | 6 | 0 / 0 / 0 |
| `/components/textarea` | 5 | 0 / 0 / 0 |
| `/components/number-input` | 9 | 0 / 0 / 0 |
| `/components/currency-input` | 6 | 0 / 0 / 0 |
| `/components/radio-group` | 5 | 0 / 0 / 0 |
| `/components/form-field` | 5 | 0 / 0 / 0 |
| `/components/form-section` | 5 | 0 / 0 / 0 |
| `/components/file-upload` | 5 | 0 / 0 / 0 |
| `/components/drag-drop-zone` | 5 | 0 / 0 / 0 |
| `/components/combobox` | 5 | 0 / 0 / 0 |
| `/components/chart` | 6 | 0 / 0 / 0 |
| `/components/masonry` | 5 | 0 / 0 / 0 |
| `/components/button` | 7 | 0 / 0 / 0 |
| `/components/input` | 6 | 0 / 0 / 0 |
| `/components/select` | 11 | 0 / 0 / 0 |
| `/components/checkbox` | 5 | 0 / 0 / 0 |
| `/components/switch` | 5 | 0 / 0 / 0 |
| `/components/tag` | 7 | 0 / 0 / 0 |
| `/components/pill` | 7 | 0 / 0 / 0 |
| `/components/tabs` | 7 | 0 / 0 / 0 |
| `/components/table` | 9 | 0 / 0 / 0 |
| `/components/modal` | 6 | 0 / 0 / 0 |
| `/components/toast` | 7 | 0 / 0 / 0 |
| `/components/tooltip` | 6 | 0 / 0 / 0 |
| `/components/popover` | 6 | 0 / 0 / 0 |
| `/components/breadcrumbs` | 5 | 0 / 0 / 0 |
| `/components/card` | 5 | 0 / 0 / 0 |
| `/components/kpi-card` | 6 | 0 / 0 / 0 |
| `/components/badge` | 7 | 0 / 0 / 0 |
| `/components/filter-chip` | 5 | 0 / 0 / 0 |
| `/components/avatar` | 7 | 0 / 0 / 0 |
| `/components/avatar-stack` | 6 | 0 / 0 / 0 |
| `/components/progress-bar` | 6 | 0 / 0 / 0 |
| `/components/alert` | 7 | 0 / 0 / 0 |
| `/components/drawer` | 5 | 0 / 0 / 0 |
| `/components/detail-panel` | 6 | 0 / 0 / 0 |
| `/components/description-list` | 6 | 0 / 0 / 0 |
| `/components/pagination` | 6 | 0 / 0 / 0 |

## Delivery checkpoints
- Version target: 0.6.0; A (PWA robustness) first, then B (kit export), C (documentation), D (polish).
- A: delivered; `npm run verify` **157 passed, 0 failed**, source and contrast checks green.
- B: delivered; `npm run verify` **160 passed, 0 failed**; all three kit exports created and exercised in real Chrome under `/dist-kits/<kit>/`.
- C: delivered; `npm run verify` **161 passed, 0 failed**, generated reference in sync.
- D: delivered; `npm run verify` **161 passed, 0 failed**; contrast **96 combinations / 4,080 pairs** passed. Final browser render/screenshot matrix and offline proof completed below.

## Commands and observed results
- `node --test tests/pwa.test.mjs` during A implementation: **10 passed, 1 failed**. The failure was the expected unstamped `js/build-info.js` version (0.5.0) after the early `version.json` bump to 0.6.0; build regeneration is deferred to the integrated A checkpoint. Mixed-version rejection/retry, failed-fetch preservation, cache-busted reload requests and offline query variants passed.
- Real Chrome baseline at `http://127.0.0.1:4185/admin/`: active worker controlled the 0.5.0 page; CDP offline reload rendered Overview with `navigator.onLine === false`. Final-version offline proof follows below.
- A integrated real Chrome: unknown route rendered Home and Search; Search opened the existing command palette. Updated app reported 0.6.0 and an activated worker. Its post-reload automation wait timed out; measured activation evidence follows below instead of counting that attempt.
- A recovery evidence: captured and LOOKED at `not-found-update-1440.png` showing **A newer version is available - Update now** for a real installed waiting worker. Clicking it changed build `20261026145640201` → `20261026150047127`, observed the loader via DOM mutation, activated control, cleared waiting state and emitted **exactly one main-frame reload**.
- B first integrated `npm run verify`: **157 passed, 3 failed**. The exporter mistook registry example strings for real imports (`components/components/button-group.js`); restricting discovery to module declarations fixed the dependency closure. The export test also imports the exported registry to exercise actual module resolution.
- B `node --test tests/phase5-export.test.mjs`: **3 passed, 0 failed**; deterministic byte comparisons across all kits, SHA-256 verification, complete relative file graph, selected/nondefault axes and non-destructive output/symlink protections.
- B `npm run verify && npm run export:kits`: **160 passed, 0 failed**, build/source/contrast passed; exported Enterprise, Liquid and Ops. Chrome loaded each from its own plain static subpath without service-worker control, rendered three mock rows, combobox and chart, and switched to dark without overflow. Enterprise greeting/input, keyboard Australia selection and chart table alternative worked.
- C `npm run docs:registry`: generated **71 entries**; inspected the generated name/label/category/purpose table, API and a11y sections. `node --test tests/check.test.mjs`: **7 passed, 0 failed**, including stale/missing documentation rejection and regeneration.
- C integrated `npm run verify`: **161 passed, 0 failed**; generator emitted 71 entries and source/contrast checks passed.
- D `npm run verify && npm run export:kits && node scripts/contrast.mjs`: **161 passed, 0 failed**, all exports refreshed; **96 combinations / 4,080 pairs** passed.
- Real Chrome D smoke: CRM disclosure opened with Space, loading selection rendered the mock loading state, Finish demo loading restored five rows, and Enter collapsed it with hidden panel/session preference. A grade changed 88 → 89 remained dirty and the exact grid DOM node survived open/close toggles. More-contrast media emulation changed text/muted/border tokens and opaque surfaces in all **6 kit/theme combinations**, without page overflow.
- A final Guide table review found its local compact-table padding still bypassed the shared tokens; it now uses the same header/cell tokens. Subsequent `npm run verify && npm run export:kits`: **161 passed, 0 failed**, all bundles refreshed.
- Final Chrome render matrix: **1,512 checks** = (71 component routes + 13 product screens) × 3 kits × 2 themes × 3 widths (390/768/1440). All had their expected heading and preview/mock content, with no page-level overflow or error-level console messages. Every example had one initially collapsed disclosure directly after its header, containing reset. Twelve additional Guide table-padding checks recorded comfortable `12px 16px` and Ops compact `8px` headers.
- Final export matrix: **12 checks** (3 kits × 2 themes × 390/1440), with all five component types, three table rows, no page overflow and no documentation-app service-worker control. **12 real waiting-worker unknown-route captures** retained the required Update now offer.
- Final offline reloads: ERP inventory, CRM pipeline and School gradebook all rendered version 0.6.0, their demo disclosure and an active controller with `navigator.onLine === false` under actual CDP offline networking.
- Additional interactions: ERP error → Retry → five rows → confirmed reset, with open disclosure persisting across reload; School empty → Restore mock view → confirmed reset; CRM error → Retry → confirmed reset. Blocking sessionStorage still allowed the disclosure and its in-memory domain preference to work.
- Automation limits encountered: rapid scripted hash-only component transitions occasionally read/reverted the prior route; the completed component matrix uses fresh document loads, while product checks use the actual hash router. An injected module import failed during the first offline probe; the completed offline proof observes the rendered app without injected imports. Early selector mistakes were corrected to accessible role/name targets; they are not claimed as successful interactions.
- Final release command `npm run verify && node scripts/export-kit.mjs --kit enterprise && npm run export:kits && node scripts/contrast.mjs`: **161 passed, 0 failed**, 71 registry entries generated, source sync green, default `dist-kit/` and all three `dist-kits/` exports generated, **96 contrast combinations / 4,080 pairs** green.
- Final real update flow on dirty grades: **Keep editing** retained score 89, dirty state and the waiting worker. A second Update now → **Discard changes** showed the loader, activated build `20261026155447510` and produced **exactly one main-frame reload**. Final DOM inspection confirmed restored score 88, hidden dirty marker, disabled Save grades, active control and no waiting worker. The first assertion read hidden marker text (`88Unsaved`); inspection corrected the observation without repeating activation.
- Final post-evidence `npm run check`: **passed**. No temporary export/tooling/check fixture directories remained. The default CLI bundle loaded independently at `/dist-kit/demo.html`; its manifest reported Enterprise/blue, version **0.6.0**, build **20261026155447510**, without app-worker control.

## Files
- Release tracking: `version.json`, `CHANGELOG.md`, this summary.
- A: `sw.js`, `js/pwa.js`, `js/app.js`, `tests/pwa.test.mjs`, `tests/phase5-update.test.mjs`, `tests/index.js`, `docs/DEPLOYMENT.md`, `docs/DECISIONS.md`; generated `js/build-info.js` and worker precache refreshed by the build.
- B: `scripts/export-kit.mjs`, `scripts/kit-demo/` templates, `tests/phase5-export.test.mjs`, `.gitignore`, `package.json`, source-check output exclusions and `docs/USAGE.md`; outputs remain git-ignored.
- C: `scripts/build-registry-doc.mjs`, generated `docs/COMPONENT_REGISTRY.md`, `scripts/check.mjs`, `tests/check.test.mjs`, `package.json`, rewritten `README.md`, `docs/DESIGN_SYSTEM.md`, `docs/ROADMAP.md`, `CHANGELOG.md`.
- D: token semantics/generator/contrast gate, shared table CSS, `css/{app,learn,showcase}.css`, icon SSOT/sidebar callsites, example-domain composition/styles, shared example disclosure helper/common CSS and route stylesheet loading.

## Interpretation decisions
Interpretations are recorded in `docs/DECISIONS.md`: build-identity validation without an optional hash manifest; shared/throttled checks; deterministic, selected-axis exports and conservative output ownership; generated registry order; per-domain disclosure session state; shared rhythm/padding; token-only stronger contrast.

## Browser and visual evidence
All **72 final matrix screenshots** were captured in real Chrome and LOOKED at through **18 contact sheets**, covering Examples headers, Guide Listing tables, more-contrast Guide, Kits headers, real not-found update prompts and exported consumer demos. Each surface covers Enterprise/Liquid/Ops, light/dark, 1440/390. The earlier `not-found-update-1440.png` was inspected separately. No screenshot capture failed. Pillow was unavailable for montage creation; Chrome created the contact sheets without adding a dependency.

Evidence: `docs/evidence/phase5/render-matrix.json`, `runtime-smoke.json`, named PNG captures and `contact-*.png`. Table screenshots are element crops; other app captures are viewport images, exported demos are full-page. This is visual inspection, not a physical-device or screen-reader certification.

## Not verified
- Live GitHub Pages deployment/CDN propagation was not exercised; no push or deployment was performed. Mixed-version rejection/retry is simulated by fake fetch/CacheStorage tests; normal installation, offline reload and explicit activation ran in real Chrome.
- Physical iOS/Safari, Firefox, installed-device UX, real screen readers and an exhaustive every-control interaction audit across the whole matrix remain unverified. The matrix proves rendering/geometry and representative interactions listed above, not all possible workflows.
- No backend, real authentication or real financial/student/customer operations exist by design. PWA integrity checks build identity, not hashes of every precached file; bundle manifests do hash every shipped bundle file except themselves.
