# Phase 1 interpretation decisions

- Tokens use group → CSS-variable name → `{light, dark}` values; every token has both modes, including identical non-colour values.
- The minimal initial palette is neutral surfaces/text/borders with emerald accent and a semantic danger colour; typography, spacing, radius and shadow groups each expose editable primitives.
- Node.js built-ins implement every build/server/test capability; there is no dependency installation step.
- Browser-local settings and token changes are not server writes; exporting is the portable backup path.
- System theme is opt-in; first-visit appearance remains Light as required by the specification.
- The product identity is Forma, a browser-local workspace; the account menu has no fictional authentication actions.
- Token input previews immediately; Save persists it, Cancel restores saved values, and navigation/update uses Save/Discard/Cancel.
- Non-colour values use property-specific CSS validation and reject unresolved or circular token references.
- Token history includes actual edits and resets, capped at the latest 50 entries.
- The token editing mode is independent of the active application theme.
- The desktop context panel defaults expanded and tablet panel defaults collapsed until an explicit preference is saved.
- Clipboard denial exposes selectable CSS rather than claiming successful copying.
- Build IDs use millisecond timestamps; the version remains sourced only from `version.json`.
- PNG icon artwork and manifest colours derive from token values; maskable artwork stays within its safe zone.
- Cache operations are scope-specific; clearing requires connectivity and confirmation, then reloads for a fresh offline copy.
- PWA localization follows document language and the shell's language-change event.
- Tests use repository-local temporary fixtures and remove them afterward.
- The explicit specification's sticky 64px top bar takes precedence over the PWA standard's conditional smart-hiding default.
- Checkbox/switch and tag/pill have independent registry entries and source/style pairs (13 components total).
- Playground prop changes are transient examples, not persisted application token edits; the table uses explicitly mock records.
- The table initializes its page size from General settings and additionally supports 25 rows in its local playground.
- Toast timers pause while hovered or focused and restart afterward.
- Copyable component snippets demonstrate markup; the matching ES modules provide interactive behavior.
- `tests/index.js` supplies the directory entrypoint required by the installed Node runtime while preserving the specified `node --test tests/` command.
- Registry tests validate exported entries rather than pinning the incidental source syntax of translated label getters.
- A same-origin CSP allows inline styles for token previews and generated component styles, but disallows inline scripts, plugins and foreign network connections.

## Phase 2a

- Phase 2a supersedes the old rail/context shell and emerald default: one grouped sidebar, 56px top bar, blue accent and slate neutrals.
- Use the system font stack; no font download or dependency is needed.
- Theme preference `system` is persisted separately from the resolved `data-theme` light/dark value so CSS and token editing retain their existing contract.
- Kit defaults apply only to axes the user has not explicitly selected; explicit theme, palette and density choices remain independent.
- The notification count is pending update plus unsaved changes plus the five most recent persisted token edits; no fictional inbox.
- Global search indexes real routes, registered components and loaded token names; token results open the existing filtered token editor.
- A SHA-256 CSP allowlist authorizes only the pre-paint appearance script; other inline scripts remain blocked.
- Reference customer data and dashboard activity are labelled mock and stay browser-local; imports do not imply server writes.
- The default accent is blue 600 (`#2563eb`); palette button fills use darker emerald/teal/orange steps where necessary for white-label contrast. Accent text has its own light/dark values.
- Slate 500 light borders and slate 400 dark borders satisfy the explicit 3:1 control-boundary requirement; subtler decorative borders remain a separate token.
- Status fills/dots use green/amber/red primitives; text uses darker light-theme and lighter dark-theme `*-text` roles. Dense surfaces remain solid in Liquid.
- Generated grouped tokens retain existing editor/export shape while primitive/semantic sources become authoritative; extra Layout/Motion/Surface groups use property-specific validation and textual previews.
- Color aliases expose a text editor for hex overrides rather than passing a CSS variable expression to the browser's hex-only color picker.

## Phase 2a visual correction

- Decorative outlines use `--color-border-subtle` (slate 200 light / slate 700 dark); input, select, checkbox and switch boundaries retain the strong border role and its 3:1 checks. Decorative lines are not control-boundary contrast pairs.
- Keep exactly one breadcrumb in the top bar, using the route's page title; Design kits belongs to MAIN.
- Sidebar expansion is a user preference, not a kit setting. Ops supplies the collapsed default only when no valid preference exists and supports a full-width expanded sidebar.
- Tab underlines and list separators have square ends; sidebar initials use a fixed, centered inline-flex avatar box.
- Liquid uses `.68` light / `.72` dark chrome and `.80` / `.82` cards over a palette mesh. Cards share one content-column blur instead of allocating a blur per card; top bar, sidebar and content form the three large base layers. Floating overlays replace base blur layers; dense text, tables and forms remain opaque.
- Liquid foregrounds use slate 700/200 muted text and palette 950/200 accent text to retain contrast at the lower opacity. The matrix retains conservative black/white backdrops and adds mesh extrema and saturated composites; thresholds remain 4.5:1 text and 3:1 control boundaries/focus.
- Kit semantic overrides resolve after the selected palette, while palette scales remain the hue source; generated CSS and contrast resolution use the same precedence.

## Phase 2b

- Categorical series use eight semantic light/dark colours, independent of the accent palette; blue/orange/green/magenta/purple/vermillion/olive/slate marks use distinct line markers and dashes because colour alone cannot guarantee differentiation for every colour-vision condition.
- Series colours are validated at ≥3:1 against solid `--surface`; chart plots remain solid even in Liquid rather than weakening contrast for a translucent backdrop.
- Combobox uses the manual Popover API top layer while keeping DOM ownership inside Modal/Drawer; captured Escape closes the list, then clears a clearable selection, before dismissing its dialog.
- PageUp/PageDown move five enabled results; closing discards uncommitted search; `setValue` is silent, deduplicates known values and applies the multi-selection limit.
- Mock delay is explicitly local; creatable options belong to one controller; searchable country labels preserve existing region-code values and required form defaults.
- Charts include zero in axis domains; zero-only data uses 0–1; signed stacks separate positive and negative baselines; missing values remain gaps rather than fabricated zeroes.
- Donut treats the first series as labelled slices; numbered slices match its ordered legend; negative data shows guidance and retains the unmodified source table.
- Guide demos reuse real playground previews, not duplicate implementations; expandable usage contains metadata-derived props tables and snippets. Masonry is documented as an L5 layout under Data display.
- Guide contrast previews resolve current computed CSS, including local overrides; build-time validation remains authoritative for the complete theme × palette × kit matrix.

## Phase 2b visual/quality fix round 1

- Legend glyphs describe chart geometry: filled rounded squares for bar/stacked/area/donut, line plus marker only for line/sparkline; donut keys retain slice numbering and add formatted values without changing mark patterns.
- Guidelines compose existing shared primitives rather than registry playgrounds or duplicate controls; mock interactions are local, and every pattern includes a usage sentence.
- Learn reuses page-subtitle/component-field conventions and spacing tokens for title, tabs, toolbar, count and grid; chart-choice guidance uses token-coloured SVG type icons with bold names.
- Legend regression renders all six types, including updates and donut formatting; visible Chrome evidence covers all Learn tabs and charts in three kits, both themes and both requested widths.

## Phase 3

- Date-only values use strict ISO Gregorian dates and UTC arithmetic; min/max are inclusive, and locale week starts come from Intl with an explicit override available.
- DatePicker and DateRangePicker share one calendar inside the existing Modal, reusing focus trap, Escape and focus return rather than adding another overlay lifecycle.
- Continuous ranges cannot cross disabled dates; the first selection emits `{start,end:null}`, Escape preserves it, and an earlier second choice sorts endpoints.
- NumberInput retains invalid typed text, while programmatic values round/clamp; numeric ties round symmetrically away from zero and stepping avoids decimal drift.
- CurrencyInput uses Intl formatting and locale-aware separators/digits/accounting parsing; blur/Enter commits formatting and invalid trailing input is rejected.
- Textarea counters follow native UTF-16 maxlength semantics; upload progress is explicitly mock and advances 25% per named action rather than background timers.
- DragDropZone delegates validation, selection and confirmed removal to FileUpload; the native file chooser remains the keyboard alternative.
- Action groups reuse Button; IconButton reuses Tooltip; split/dropdown buttons reuse the existing menu keyboard model.
- Filter text comparisons are case-insensitive; conditions default to AND with optional OR, and removing a condition confirms its effect without deleting source records.
- CSV parsing rejects malformed quoting and preserves embedded newline sequences; exports use CRLF and neutralize spreadsheet-formula text, including whitespace-prefixed formulas.
- Command match strength precedes recency; recent stable IDs break ties and lead empty-query results, with at most eight browser-local entries.
- Tree navigation stops at boundaries except wrapping typeahead; disabled nodes remain discoverable/focusable but cannot be selected.
- Layout templates live in registered `components/*-layout.js` pairs so the existing metadata, CSS-loading and precache contracts remain authoritative.
- Resizable layouts keep preferred widths separate from temporary container fits; impossible pure-model minima scale to available width, while UI layouts switch to separate compact views.
- Pane separators resize by 10px, Shift by 40px, with Home/End limits; optional per-layout storage keys isolate preferences and unavailable/malformed storage falls back safely.
- Static layout slots preserve supplied nodes/classes/listeners; showcase adapters retain existing screen styling and use native form-ID association for sticky external Save actions.
- Tabs exposes a shared factory instead of constructing hidden playgrounds for template consumers.
- Mock permissions are a catalog of browser-local customer actions in Settings > General, not authentication or backend authorization.
- UnsavedChangesGuard owns reusable decision/listener lifecycle; PWA actions consult registered guards even when the legacy global dirty flag is false.
- Customer import uses shared CSV parsing/mapping plus consumer-specific validation before review/import: 1–200 rows, 1 MB, supported region/status, valid domain/email and required identity fields.
- Saved views persist JSON filter snapshots only; records remain session-only. Command recents, permissions and pane widths are also preference data, never secrets.
- Guidelines patterns share one mock dataset and canonical editor composition; Guide tab switches resolve dirty edits before replacing editor DOM.
- Visual review found status pills collapsing into vertical letters in narrow tables; table badges remain single-line and contribute their intrinsic width to the existing internal horizontal scroll region.

## Phase 3 round 1 correction

- Human labels are required registry data, separate from route IDs and exported factory names; do not derive visible titles from class-style identifiers.
- Component categories are shared between Guide, command results and counted sidebar groups. Only the active category starts expanded; button disclosures preserve native Enter/Space behavior without forbidden details widgets.
- A component detail host owns the page title and purpose; standalone playgrounds retain their headers.
- Calendar and tree marks belong to the icon SSOT; decorative pane borders use the subtle token, not the control-boundary token.
- Equal-height desktop panes retain compact single-pane navigation on phones; no kit-specific JavaScript or new dependencies are introduced.

## Phase 4

- Product records remain session-local mock data; reset restores seed records after confirmation and does not erase saved filter preferences.
- `js/example-routes.js` is the sole registration/dispatch exception to the L7 import boundary; domain pure models live under `js/logic/` so external tests never import product modules.
- ERP tax uses integer cents, per-line half-up rounding and basis-point tax rates; invoice totals never treat invalid edits as valid financial amounts.
- ERP actions reuse the existing Settings mock permission catalog: customer edit/delete/create/export capabilities map to order approval/cancellation, invoice creation and export, with explanatory UI rather than pretend authorization.
- Calendar month view shows the selected date's agenda; week view lists the complete week's events. Narrow date grids scroll internally to preserve touch-target size.
- Example pages use English as required by the Phase 4 contract; the existing shell language preference remains unchanged.
- Settings adds Administrator (all existing capabilities) and Viewer (none) role presets; individual switches yield Custom permissions. Roles remain local UI demonstrations, not authentication.
- Shell-only sidebar/theme changes preserve the mounted example main node and its guard rather than reinitializing editor drafts.
- Grid currency validation owns the raw typed draft independently of CurrencyInput's display formatting; Enter/blur cannot silently round a rejected financial value into a valid amount.
- CRM date navigation only browses; Add activity opens the event editor. Calendar's built-in view controls are canonical, with the current view retained when filters rebuild the calendar.
- Late counts as attended; missing grades are excluded from averages and unrounded ties share competition ranks (1, 1, 3). Gradebook computed results use an adjacent shared Table.
- The attendance guard's Save changes decision already confirms persistence; its callback saves directly rather than stacking a second confirmation modal.

## Phase 5

- Precache validates the fetched build module before writing canonical, query-free cache entries; no optional per-file hash manifest is added. A failed candidate cannot replace the active worker/cache, and CDN cache-busting applies to every asset.
- Automatic update checks share registration/in-flight work and a ten-minute throttle; unknown routes and explicit Settings checks bypass it. A recovery click waits for an installing worker and reuses the existing dirty guard, overlay and one-reload activation path.
- Kit export defaults to blue regardless of kit, emits only the chosen palette/kit plus both themes, and copies the shared component dependency closure without the documentation app, product modules or service worker. Load tokens → component styles → appearance so axis overrides win.
- Export manifests hash every shipped file except themselves and omit timestamps; re-exporting the same stamped source is deterministic. Existing output must be an unmodified, owned export; unknown additions, consumer edits and symlink paths are refused rather than deleted.
- Registry Markdown is generated in canonical registry order using English labels and API/accessibility metadata; the standalone check rejects missing or stale output and the normal build regenerates it.
- Demo disclosures are example-layer composition, not a new foundational component. Session keys are `forma-example-demo-controls-${domain}`; blocked storage falls back to in-memory state, and toggles never rerender product editors.
- Shared page-rhythm and density-aware table padding tokens replace local header spacing; sortable headers keep their 44px button target while plain headers get their own padding.
- More-contrast overrides apply after kit/theme tokens, strengthen primary/muted text and both border roles, and make Liquid surfaces opaque; the same override map is checked across all 96 appearance/preference combinations without lowering thresholds.
- 2026-10-27 i18n completion: the long tail of UI text (components, Guide, examples, kits) is translated by a runtime localizer plus English-source-keyed dictionaries instead of wrapping every string in source; this supersedes the earlier decision that example pages stay English. Reason: 2,377 untranslated strings across 97 routes, and a data-only dictionary can be generated, validated mechanically (scan + sweep + tests) and kept complete. `t(key, vars)` stays for new code. Details in `docs/I18N.md`.
