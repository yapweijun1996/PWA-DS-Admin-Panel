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
