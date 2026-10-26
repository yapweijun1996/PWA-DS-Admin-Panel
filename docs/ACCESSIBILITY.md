# Accessibility

Target: WCAG 2.2 AA.

## Requirements
- Text contrast at least 4.5:1 (large text 3:1); non-text UI parts (borders, focus ring, icons) at least 3:1. Validate real foreground/background pairs, light and dark.
- Never use colour alone to convey state; add text or an icon.
- All functionality works with the keyboard; visible focus ring on every interactive element; logical tab order.
- Modals and drawers trap focus, close on Escape, and return focus to the trigger.
- Combobox, menus and tabs follow the WAI-ARIA authoring patterns (roles, `aria-expanded`, `aria-controls`, `aria-activedescendant`).
- Collapsed icon-only navigation has accessible names and tooltips on hover and focus.
- Forms: persistent labels, required marking, field-level errors linked with `aria-describedby`, input preserved on error.
- Tables: `caption`, `th` with scope, keyboard-operable sort controls.
- Charts: every chart has a data-table alternative and text summary.
- Respect `prefers-reduced-motion`; touch targets at least 44px on phones; inputs 16px on iOS.

## Verification
Automated tests cover tokens and structure. Keyboard-only and screen-size checks are done in a real browser per release.
Real screen-reader and physical iOS device checks are performed by the owner and listed as not verified until done.

## Development self-check
Settings → About → **Run accessibility self-check** runs `window.__a11yCheck()` against the current DOM and prints an announced count plus an accessible results list. `js/a11y-selfcheck.js` exports `checkAccessibility(root)`, `labelInName(visible, name)` and `headingOrder(levels)`.

Rules cover visible-label/name containment, unnamed interactive elements, heading skips, duplicate IDs, missing form labels, unnamed image roles and dangling `aria-controls`. Hidden/inert/decorative content is excluded from names; hidden referenced labels remain valid, and hidden duplicate IDs are still reported. Results contain `{ rule, message, element }` for inspection in developer tools. This focused checker is not the complete accessible-name specification or a WCAG certification; exercise opened dialogs, menus and changed states separately.

Label-in-name comparison lowercases, collapses whitespace and strips punctuation/symbols; numeric labels cannot match only part of another number. Visible text excludes `aria-hidden` descendants. Names use `aria-labelledby` before `aria-label` before content/native naming. Avoid redundant labels on text navigation links; keep calendar count/dot decoration `aria-hidden` and start day names with the displayed number. Regression coverage includes counted links and the `26 2 ·` calendar case, which must not match a year suffix such as `2026 2 events`.

Shared title components accept `headingLevel`; choose it from the document context, not visual size. Preserve visible control wording in accessible names, including selected values and navigation/notification counts; decorative glyphs must be explicitly hidden instead of replacing a text label.

