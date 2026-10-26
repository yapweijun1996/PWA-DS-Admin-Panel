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
