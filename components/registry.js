import { text, renderGuide } from './playground.js';
import { render as renderButton } from './button.js';
import { render as renderInput } from './input.js';
import { render as renderSelect } from './select.js';
import { render as renderCheckbox } from './checkbox.js';
import { render as renderSwitch } from './switch.js';
import { render as renderTag } from './tag.js';
import { render as renderPill } from './pill.js';
import { render as renderTabs } from './tabs.js';
import { render as renderTable } from './table.js';
import { render as renderModal } from './modal.js';
import { render as renderToast } from './toast.js';
import { render as renderTooltip } from './tooltip.js';
import { render as renderPopover } from './popover.js';
import { render as renderBreadcrumbs } from './breadcrumbs.js';
import { render as renderCard } from './card.js';
import { render as renderKpiCard } from './kpi-card.js';
import { render as renderBadge } from './badge.js';
import { render as renderFilterChip } from './filter-chip.js';
import { render as renderAvatar } from './avatar.js';
import { render as renderAvatarStack } from './avatar-stack.js';
import { render as renderProgressBar } from './progress-bar.js';
import { render as renderAlert } from './alert.js';
import { render as renderDrawer } from './drawer.js';
import { render as renderDetailPanel } from './detail-panel.js';
import { render as renderDescriptionList } from './description-list.js';
import { render as renderPagination } from './pagination.js';
import { render as renderCombobox, guide as comboboxGuide } from './combobox.js';
import { render as renderChart, guide as chartGuide } from './chart.js';
import { render as renderMasonry, guide as masonryGuide } from './masonry.js';
import * as textarea from './textarea.js';
import * as numberInput from './number-input.js';
import * as currencyInput from './currency-input.js';
import * as radioGroup from './radio-group.js';
import * as formField from './form-field.js';
import * as formSection from './form-section.js';
import * as fileUpload from './file-upload.js';
import * as dragDropZone from './drag-drop-zone.js';
import * as datePicker from './date-picker.js';
import * as dateRangePicker from './date-range-picker.js';
import * as iconButton from './icon-button.js';
import * as buttonGroup from './button-group.js';
import * as splitButton from './split-button.js';
import * as dropdownButton from './dropdown-button.js';
import * as commandPalette from './command-palette.js';
import * as timeline from './timeline.js';
import * as auditTimeline from './audit-timeline.js';
import * as treeView from './tree-view.js';
import * as stepper from './stepper.js';
import * as confirmDialog from './confirm-dialog.js';
import * as skeleton from './skeleton.js';
import * as spinner from './spinner.js';
import * as emptyState from './empty-state.js';
import * as errorState from './error-state.js';
import * as permissionState from './permission-state.js';
import * as permissionGate from './permission-gate.js';
import * as unsavedChangesGuard from './unsaved-changes-guard.js';
import * as bulkActionToolbar from './bulk-action-toolbar.js';
import * as columnVisibilityMenu from './column-visibility-menu.js';
import * as savedViewSelector from './saved-view-selector.js';
import * as filterBuilder from './filter-builder.js';
import * as importWizard from './import-wizard.js';
import * as exportDialog from './export-dialog.js';
import * as masterDetailLayout from './master-detail-layout.js';
import * as workspaceLayout from './workspace-layout.js';
import * as dashboardLayout from './dashboard-layout.js';
import * as listingLayout from './listing-layout.js';
import * as formLayout from './form-layout.js';
import * as detailLayout from './detail-layout.js';
import * as kanban from './kanban.js';
import * as calendar from './calendar.js';
import * as dataGrid from './data-grid.js';

const guides = {
  button: {
    purpose: 'Trigger a deliberate action with one clearly dominant primary action per task.',
    props: ['Label, variant, size, disabled, loading; use the shared button(label, onClick, variant, attributes) helper.'],
    variants: ['Primary, secondary, ghost, danger; small, medium, large.'],
    states: ['Default, hover, focus, disabled, loading.'],
    keyboard: ['Tab focuses; Enter or Space activates. Disabled and loading actions cannot activate.'],
    accessibility: ['Use a verb-based accessible name. Icon-only buttons require aria-label; loading uses aria-busy.'],
    example: 'button("Save changes", save, "primary")',
    do: ['Keep the primary action specific and place secondary actions nearby.'],
    dont: ['Do not use a button when the action is navigation; use a link.']
  },
  input: {
    purpose: 'Collect a single text value with a visible label, hint, and inline validation.',
    props: ['Label, placeholder, type, value, disabled, required, error.'],
    variants: ['Text, email, password, search; optional leading icon.'],
    states: ['Default, hover, focus, disabled, error.'],
    keyboard: ['Tab focuses; native text editing and form submission remain available.'],
    accessibility: ['Associate label with id. Link hints and errors with aria-describedby; set aria-invalid on errors.'],
    example: '<label for="customer-name">Name</label>\n<input id="customer-name" class="ds-input" required>',
    do: ['Validate the real value and keep errors next to the field.'],
    dont: ['Do not replace a visible label with a placeholder.']
  },
  select: {
    purpose: 'Choose one item from a short, known set using the canonical custom listbox.',
    props: ['customSelect({label, value, options:[{value,label}], onChange, disabled, error}) returns element, trigger, value, setValue, setDisabled, close.'],
    variants: ['Standard, disabled, error.'],
    states: ['Closed, expanded, focused option, selected, disabled.'],
    keyboard: ['Arrow keys open and move; Home/End jump; Enter/Space choose; Escape closes and returns focus; Tab exits.'],
    accessibility: ['Trigger exposes aria-expanded, aria-controls and aria-haspopup. Options expose aria-selected.'],
    example: 'customSelect({ label: "Status", value: "active", options: [{value: "active", label: "Active"}], onChange })',
    do: ['Keep options short and the selected value visible.'],
    dont: ['Do not use this component for a long searchable dataset.']
  },
  checkbox: {
    purpose: 'Select independent items or a whole collection, including partial selection.',
    props: ['Label, checked, disabled, indeterminate; use a native input with ds-checkbox.'],
    variants: ['Single choice and select-all collection.'],
    states: ['Unchecked, checked, indeterminate, disabled, error.'],
    keyboard: ['Tab focuses and Space toggles.'],
    accessibility: ['Use a visible label; set the input indeterminate property for partial selection.'],
    example: '<label><input type="checkbox" class="ds-checkbox"> Select customer</label>',
    do: ['Use indeterminate for a partially selected page of rows.'],
    dont: ['Do not substitute a checkbox for an immediate on/off preference.']
  },
  switch: {
    purpose: 'Toggle an immediate on/off preference with a stable, descriptive label.',
    props: ['Label, checked, disabled, description; role=switch and aria-checked reflect state.'],
    variants: ['Standard and described switch.'],
    states: ['Off, on, hover, focus, disabled.'],
    keyboard: ['Tab focuses; Enter or Space toggles.'],
    accessibility: ['Expose aria-checked; keep the label unchanged when the value changes.'],
    example: '<button type="button" class="ds-switch" role="switch" aria-checked="false" aria-label="Email notifications"></button>',
    do: ['Apply the change immediately and retain a visible label.'],
    dont: ['Do not use for selecting rows or mutually exclusive options.']
  },
  tag: {
    purpose: 'Display compact metadata with optional status dot and explicit removal.',
    props: ['createTag({label, tone, dot, pill, size, onRemove, disabled}) returns a DOM node.'],
    variants: ['Neutral, accent, success, warning, danger, info; medium or small; removable.'],
    states: ['Default, hover/focus removal, disabled removal, named status.'],
    keyboard: ['Static labels are not focusable. Tab reaches the removal button; Enter or Space removes.'],
    accessibility: ['Status is named in text; decorative dots are hidden. Removal names the label being removed.'],
    example: 'createTag({ label: "Active", tone: "success", dot: true })',
    do: ['Keep labels short and use semantic tones consistently.'],
    dont: ['Do not rely on dot colour alone to communicate status.']
  },
  pill: {
    purpose: 'A fully rounded variant of the canonical tag for compact statuses and counts.',
    props: ['createPill({label, tone, dot, size, onRemove, disabled}) returns a DOM node.'],
    variants: ['The same six tones and two sizes as Tag, with a pill radius.'],
    states: ['Default, status, removable, disabled removal.'],
    keyboard: ['Static pills do not receive focus; removal follows the Tag keyboard behavior.'],
    accessibility: ['Always include a text label, including count context when it is not adjacent.'],
    example: 'createPill({ label: "Customer", tone: "success", dot: true })',
    do: ['Use the shared implementation rather than restyling a second status component.'],
    dont: ['Do not present static pills as clickable controls.']
  },
  tabs: {
    purpose: 'Switch between related local content panels while preserving page context.',
    props: ['createTabs({items:[{label,content,disabled?}], label, active=0, variant="underline", orientation="horizontal", fullWidth=false, onChange}) returns a DOM node; content accepts shared component nodes or arrays.'],
    variants: ['Underline or segmented; horizontal or vertical; optional full width.'],
    states: ['Selected, hover, focus, disabled.'],
    keyboard: ['Left/Right (horizontal) or Up/Down (vertical) move and activate, skipping disabled tabs; Home/End jump; Tab enters the active tab or panel.'],
    accessibility: ['Use tablist/tab/tabpanel roles, aria-selected and aria-controls; only the active tab is in the tab sequence.'],
    example: 'createTabs({label:"Customer views", items:[{label:"Details",content:details},{label:"Activity",content:timeline}]})',
    do: ['Label the tab list and connect each tab to its panel.'],
    dont: ['Do not use tabs as unrelated page navigation.']
  },
  table: {
    purpose: 'Present structured mock records with real local search, filters, sorting, paging, and whole-row details.',
    props: ['createTable({caption, label, header, body, striped, className, onRowActivate(index,row)}) returns a responsive region.', 'Compose search and filters with the existing Input/Select and createPagination controller.'],
    variants: ['Standard and striped; loading, empty, error datasets in the playground.'],
    states: ['Sorted, filtered, paginated, loading, empty, error.'],
    keyboard: ['Tab reaches sorting, controls, and rows. Enter/Space activates a row; nested controls keep their own behavior.'],
    accessibility: ['Caption names the dataset; headers use scope and aria-sort; scroll region is named and keyboard reachable.'],
    responsive: ['The table scrolls inside a named region; the page itself must not overflow. Pagination collapses to a mobile page label.'],
    example: 'createTable({ caption: "Mock customers", header: headerRow, body: tableBody, onRowActivate: openCustomer })',
    do: ['Keep dense table content solid and label mock data explicitly.'],
    dont: ['Do not add redundant per-row Open buttons or swallow events from nested controls.']
  },
  modal: {
    purpose: 'Focus attention on one decision or a short editing task with a shared dialog lifecycle.',
    props: ['openModal({title, content, actions, onClose, dismissible, size}) returns element and close(reason).'],
    variants: ['Small, medium, large; dismissible or explicit-actions-only.'],
    states: ['Open, form error, mock saving, closed.'],
    keyboard: ['Tab/Shift+Tab are trapped. Escape closes when dismissible. Closing returns focus to the opener.'],
    accessibility: ['role=dialog, aria-modal and heading/description references; background scroll is locked.'],
    responsive: ['Panel fits the viewport and scrolls internally; actions wrap on phones.'],
    example: 'openModal({ title: "Edit workspace", content: form, actions: [{label: "Cancel", onClick: close => close()}] })',
    do: ['Give an explicit exit action when Escape/backdrop dismissal is disabled.'],
    dont: ['Do not stack multiple modal decisions.']
  },
  toast: {
    purpose: 'Announce non-critical, transient feedback without interrupting a task.',
    props: ['showToast({message, tone, duration, actionLabel, onAction}) returns element and dismiss().'],
    variants: ['Neutral and danger; optional action; timed or persistent.'],
    states: ['Visible, paused on hover/focus, dismissed.'],
    keyboard: ['Tab reaches action and dismissal. Focus pauses the dismissal timer.'],
    accessibility: ['Status or alert role announces content; an explicit dismiss action remains available.'],
    example: 'showToast({ message: "Mock changes saved", duration: 5000 })',
    do: ['Use for confirmations that do not need a persistent record.'],
    dont: ['Do not make a toast the only location of a blocking validation error.']
  },
  tooltip: {
    purpose: 'Provide a short supplementary label without replacing a visible label or control name.',
    props: ['Trigger text, tooltip text, placement, disabled; use the documented trigger association.'],
    variants: ['Top, bottom, start, end placement.'],
    states: ['Hidden, hover, focus, Escape-dismissed.'],
    keyboard: ['Focus shows the tooltip; Escape hides it; blur dismisses.'],
    accessibility: ['Tooltip uses role=tooltip and is associated through aria-describedby.'],
    example: '<button type="button" aria-describedby="help">Help</button>\n<span id="help" role="tooltip">Additional information</span>',
    do: ['Keep the content concise and supplemental.'],
    dont: ['Do not place interactive controls or essential instructions inside a tooltip.']
  },
  popover: {
    purpose: 'Offer contextual actions in one reusable keyboard-navigable menu.',
    props: ['createMenu({label, placement, disabled, items:[{label, action, disabled, danger}]}) returns element, trigger, close().'],
    variants: ['Start/end aligned; normal and destructive actions.'],
    states: ['Closed, open, focused item, disabled trigger/item.'],
    keyboard: ['Arrow keys move, Home/End jump, Enter/Space activate; Escape closes and restores focus; Tab exits.'],
    accessibility: ['Trigger exposes menu state; disabled items are skipped; opening places focus in the menu.'],
    example: 'createMenu({ label: "Actions", items: [{ label: "Rename", action: rename }] })',
    do: ['Use actual actions and give icon-only triggers a specific aria-label.'],
    dont: ['Do not use a menu for static record details.']
  },
  breadcrumbs: {
    purpose: 'Show the current location and linked ancestors in a navigation hierarchy.',
    props: ['createBreadcrumbs({items:[{label,href}], label}) returns a nav element. The last item is the current page.'],
    variants: ['Single current page or multiple linked ancestors.'],
    states: ['Linked ancestor, hovered/focused link, current page.'],
    keyboard: ['Tab reaches ancestor links; Enter follows their real href.'],
    accessibility: ['Named navigation and an ordered list; the last item exposes aria-current=page and is not a redundant link.'],
    responsive: ['Items wrap; ancestor links retain 44px touch height on phones.'],
    example: 'createBreadcrumbs({ items: [{label: "Components", href: "#/components"}, {label: "Card"}] })',
    do: ['Use real routes and concise ancestor names.'],
    dont: ['Do not use breadcrumbs as a replacement for primary navigation.']
  },
  card: {
    purpose: 'Group related information under an optional heading, actions, and footer.',
    props: ['createCard({title, description, content, actions, footer}) returns a section. Content/actions/footer accept DOM nodes or arrays.'],
    variants: ['Header/content/footer; content-only; empty-state composition.'],
    states: ['Static content; action states belong to the composed controls.'],
    keyboard: ['The card itself is not focusable; embedded actions follow their native keyboard behavior.'],
    accessibility: ['A title labels the section; preserve real heading and button semantics within the card.'],
    example: 'createCard({ title: "Workspace", description: "Mock data", content: details, footer: saveButton })',
    do: ['Compose existing controls and keep content readable on a solid surface.'],
    dont: ['Do not make a container look actionable unless it has a real action.']
  },
  'kpi-card': {
    purpose: 'Present a labelled metric, optional trend, and real contextual actions.',
    props: ['createKpiCard({label, value, trend, trendTone, menuItems, content}) returns a Card. menuItems use the shared Popover item API.'],
    variants: ['Positive, warning, negative, neutral trend; optional supporting content such as AvatarStack.'],
    states: ['Metric displayed, menu open, action feedback.'],
    keyboard: ['Tab reaches the menu trigger; shared Popover keyboard navigation applies.'],
    accessibility: ['Metric is named by its heading; trend contains text rather than colour alone; menu trigger names the metric.'],
    example: 'createKpiCard({ label: "Customers (mock)", value: "2,420", trend: "↑ 20%", trendTone: "success" })',
    do: ['Label demonstration metrics as mock and communicate direction explicitly.'],
    dont: ['Do not show a menu when there are no real actions.']
  },
  badge: {
    purpose: 'Display a compact named status with semantic fill and contrast-safe text.',
    props: ['createBadge({label, tone, dot, pill, size}) uses the canonical Tag implementation.'],
    variants: ['Neutral/Draft, accent/New, success/Paid, warning/Pending, danger/Failed, info/Information; rounded or pill.'],
    states: ['Static status; small or medium size.'],
    keyboard: ['No focus or key handling: a status label is not a control.'],
    accessibility: ['Label states the status; the optional dot is decorative.'],
    tokens: ['--accent-text/soft; --success-text/soft; --warning-text/soft; --danger-text/soft; --info-text/soft; --muted; --radius-pill.'],
    example: 'createBadge({ label: "Customer", tone: "success", dot: true, pill: true })',
    do: ['Use darker status text tokens on soft fills.'],
    dont: ['Do not use raw status fills as body text colours.']
  },
  'filter-chip': {
    purpose: 'Represent and remove an active filter with an explicit named action.',
    props: ['createFilterChip({label, onRemove, disabled}) returns a Tag with a removal button. It removes its DOM node and notifies the owner.'],
    variants: ['Removable or disabled removal.'],
    states: ['Applied, removal focused, disabled, removed.'],
    keyboard: ['Tab reaches Remove; Enter/Space remove. Focus moves to an adjacent chip when available; the owner handles an empty collection.'],
    accessibility: ['The removal button names the filter; the label remains available without colour.'],
    responsive: ['Chips wrap and their removal targets are at least 44px on phones.'],
    example: 'createFilterChip({ label: "Country: US", onRemove: () => removeFilter("country") })',
    do: ['Update the actual filtering state when notified of removal.'],
    dont: ['Do not render inactive filters as removable active chips.']
  },
  avatar: {
    purpose: 'Identify a person or organisation with an image and accessible initials fallback.',
    props: ['createAvatar({name, src, size, shape}) returns a named image-role element. src is optional.'],
    variants: ['Small, medium, large; circle or square organisation avatar.'],
    states: ['Image, initials fallback, unavailable image, unnamed fallback.'],
    keyboard: ['No key handling; an avatar is not a control. Wrap in a real named control if it opens a menu.'],
    accessibility: ['The root exposes the name; image alt is empty to avoid duplicate announcements. An absent name becomes Unknown person.'],
    example: 'createAvatar({ name: "Olivia Rhye", size: "small" })',
    do: ['Provide an actual name and use local or approved image sources.'],
    dont: ['Do not require remote stock portraits to identify a record.']
  },
  'avatar-stack': {
    purpose: 'Summarise a named member collection with visible avatars and explicit overflow.',
    props: ['createAvatarStack({users:[{name,src}], max, size, label}) returns a named list. max defaults to 4.'],
    variants: ['One member, full set, overflow +N, empty.'],
    states: ['Visible members, overflow names, empty collection.'],
    keyboard: ['No key handling for the static collection.'],
    accessibility: ['Every visible member is named; the overflow label names remaining members; empty collections state No members.'],
    example: 'createAvatarStack({ users: [{name: "Olivia Rhye"}, {name: "Phoenix Baker"}], max: 1 })',
    do: ['Use overflow to preserve a compact table cell without dropping member names.'],
    dont: ['Do not use anonymous decorative portraits for real membership data.']
  },
  'progress-bar': {
    purpose: 'Expose a determinate progress or capacity value with optional visible percentage.',
    props: ['createProgressBar({value, max=100, label, tone, showValue}) returns a progressbar wrapper; values clamp to 0…max.'],
    variants: ['Accent, success, warning, danger, info, neutral; optional percentage.'],
    states: ['Zero, partial, complete, near-limit.'],
    keyboard: ['No key handling: this is a read-only value, not a slider.'],
    accessibility: ['A named progressbar exposes minimum, maximum, current value, and percentage text.'],
    tokens: ['--accent; --success; --warning; --danger; --info; --bg; --border; --radius-pill.'],
    example: 'createProgressBar({ value: 68, label: "Licence usage", showValue: true })',
    do: ['Provide a meaningful label and use actual measured values.'],
    dont: ['Do not animate fake progress or imply that a usage bar is a confidence guarantee.']
  },
  alert: {
    purpose: 'Keep meaningful inline feedback visible until it is resolved or explicitly dismissed.',
    props: ['createAlert({title, message, tone, onDismiss}) returns an alert/status element. A dismiss action is shown only when onDismiss is supplied.'],
    variants: ['Success, info, warning, danger; optional dismissal.'],
    states: ['Visible, dismissed, restored in the playground.'],
    keyboard: ['Tab reaches dismiss; Enter/Space dismiss. The owner should restore focus to a nearby control.'],
    accessibility: ['Danger uses role=alert; other tones use role=status; text and an icon accompany semantic colour.'],
    tokens: ['--success-text/soft; --warning-text/soft; --danger-text/soft; --info-text/soft.'],
    example: 'createAlert({ title: "Review required", message: "Check the customer email.", tone: "warning" })',
    do: ['Use an inline alert for errors that must remain discoverable.'],
    dont: ['Do not dismiss critical errors automatically.']
  },
  drawer: {
    purpose: 'Open focused record details beside the current workspace using the shared modal lifecycle.',
    props: ['openDrawer({title, content, actions, onClose, dismissible}) returns element and close(reason).'],
    variants: ['Modal side drawer; explicit action-only dismissal when dismissible=false.'],
    states: ['Open, closed, focus returned.'],
    keyboard: ['Tab/Shift+Tab remain inside; Escape closes when allowed; focus returns to the opener.'],
    accessibility: ['Inherits dialog labelling, modal semantics and scroll locking from openModal; navigation closes the panel.'],
    responsive: ['Side panel on larger screens; full-width overlay on phones with safe-area padding.'],
    example: 'openDrawer({ title: "Customer", content: details, actions: [{label: "Close", onClick: close => close()}] })',
    do: ['Supply an explicit close action if passive dismissal is disabled.'],
    dont: ['Do not recreate a second focus trap or show dense record details on a translucent background.']
  },
  'detail-panel': {
    purpose: 'Show record details inline without blocking the surrounding workspace.',
    props: ['createDetailPanel({title, content, onClose}) from drawer.js returns a named section. onClose is optional.'],
    variants: ['Read-only panel or closeable panel.'],
    states: ['Displayed, closed, restored in playground.'],
    keyboard: ['Normal document tab order; optional Close uses Enter/Space. No focus trapping.'],
    accessibility: ['The title labels the section; the owner manages focus when closing the panel.'],
    responsive: ['Fits its parent; long values wrap. Use Drawer for a modal mobile detail view.'],
    example: 'createDetailPanel({ title: "Customer details", content: descriptionList, onClose: hideDetails })',
    do: ['Use for side-by-side details that do not block editing the list.'],
    dont: ['Do not add aria-modal to an inline panel.']
  },
  'description-list': {
    purpose: 'Present readable semantic term/value pairs for record details.',
    props: ['createDescriptionList({items:[{term,value}], columns=1}) returns a dl. Values may be text or DOM; null values display Not provided.'],
    variants: ['One or two columns; plain or component values.'],
    states: ['Value present, missing value, long wrapping value.'],
    keyboard: ['No custom keys; any embedded link/control retains native behavior.'],
    accessibility: ['dt and dd preserve explicit term/value relationships in semantic groups.'],
    responsive: ['Two columns collapse to one on phones; identifiers wrap rather than overflow.'],
    example: 'createDescriptionList({ items: [{term: "Email", value: "olivia@example.com"}] })',
    do: ['Keep terms concise and preserve full values.'],
    dont: ['Do not imitate term/value relationships with unrelated divs.']
  },
  pagination: {
    purpose: 'Navigate bounded pages and adjust rows per page using the same controller as Table.',
    props: ['createPagination({total, page, pageSize, onPageChange, onPageSizeChange, pageSizes, disabled}) returns element, setState(next), state.', 'Changing page size resets to page 1; total/page inputs clamp to valid bounds.'],
    variants: ['Numbered desktop pages; compact mobile Previous / Page x of y / Next; optional rows-per-page control.'],
    states: ['First, middle, last, no results, disabled/loading.'],
    keyboard: ['Tab reaches page actions and the shared custom Select. Enter/Space activates; current focus survives data updates.'],
    accessibility: ['Named navigation; active number has aria-current=page; result range is announced; unavailable directions are disabled.'],
    responsive: ['Controls wrap. Numbers collapse to a concise page label on phones.'],
    example: 'createPagination({ total: 248, page: 1, pageSize: 10, onPageChange: loadPage, onPageSizeChange: resizePage })',
    do: ['Call setState after filtering or changing the dataset.'],
    dont: ['Do not let Next advance past the final page or create a separate pagination implementation.']
  }
};

for (const guide of Object.values(guides)) {
  guide.tokens ||= ['--surface, --text, --muted, --border, --accent and its text/soft variants; --space-1…12; semantic radius and shadow tokens.'];
  guide.responsive ||= ['Fits the parent container; content wraps and interactive controls retain at least 44px touch targets on phones.'];
}

export const registry = [
  { name: 'kanban', label: 'Kanban board', category: 'Data display', render: kanban.render, guide: kanban.guide },
  { name: 'calendar', label: 'Calendar', category: 'Data display', render: calendar.render, guide: calendar.guide },
  { name: 'data-grid', label: 'Data grid', category: 'Data display', render: dataGrid.render, guide: dataGrid.guide },
  { name: 'dashboard-layout', label: 'Dashboard layout', category: 'Layouts', render: dashboardLayout.render, guide: dashboardLayout.guide },
  { name: 'listing-layout', label: 'Listing layout', category: 'Layouts', render: listingLayout.render, guide: listingLayout.guide },
  { name: 'form-layout', label: 'Form layout', category: 'Layouts', render: formLayout.render, guide: formLayout.guide },
  { name: 'detail-layout', label: 'Detail layout', category: 'Layouts', render: detailLayout.render, guide: detailLayout.guide },
  { name: 'master-detail-layout', label: 'Master detail layout', category: 'Layouts', render: masterDetailLayout.render, guide: masterDetailLayout.guide },
  { name: 'workspace-layout', label: 'Workspace layout', category: 'Layouts', render: workspaceLayout.render, guide: workspaceLayout.guide },
  { name: 'filter-builder', label: 'Filter builder', category: 'Enterprise', render: filterBuilder.render, guide: filterBuilder.guide },
  { name: 'import-wizard', label: 'Import wizard', category: 'Enterprise', render: importWizard.render, guide: importWizard.guide },
  { name: 'export-dialog', label: 'Export dialog', category: 'Enterprise', render: exportDialog.render, guide: exportDialog.guide },
  { name: 'permission-gate', label: 'Permission gate', category: 'Enterprise', render: permissionGate.render, guide: permissionGate.guide },
  { name: 'unsaved-changes-guard', label: 'Unsaved changes guard', category: 'Enterprise', render: unsavedChangesGuard.render, guide: unsavedChangesGuard.guide },
  { name: 'bulk-action-toolbar', label: 'Bulk action toolbar', category: 'Enterprise', render: bulkActionToolbar.render, guide: bulkActionToolbar.guide },
  { name: 'column-visibility-menu', label: 'Column visibility menu', category: 'Enterprise', render: columnVisibilityMenu.render, guide: columnVisibilityMenu.guide },
  { name: 'saved-view-selector', label: 'Saved view selector', category: 'Enterprise', render: savedViewSelector.render, guide: savedViewSelector.guide },
  { name: 'timeline', label: 'Timeline', category: 'Data display', render: timeline.render, guide: timeline.guide },
  { name: 'audit-timeline', label: 'Audit timeline', category: 'Data display', render: auditTimeline.render, guide: auditTimeline.guide },
  { name: 'tree-view', label: 'Tree view', category: 'Data display', render: treeView.render, guide: treeView.guide },
  { name: 'stepper', label: 'Stepper', category: 'Navigation', render: stepper.render, guide: stepper.guide },
  { name: 'confirm-dialog', label: 'Confirm dialog', category: 'Feedback', render: confirmDialog.render, guide: confirmDialog.guide },
  { name: 'skeleton', label: 'Skeleton', category: 'Feedback', render: skeleton.render, guide: skeleton.guide },
  { name: 'spinner', label: 'Spinner', category: 'Feedback', render: spinner.render, guide: spinner.guide },
  { name: 'empty-state', label: 'Empty state', category: 'Feedback', render: emptyState.render, guide: emptyState.guide },
  { name: 'error-state', label: 'Error state', category: 'Feedback', render: errorState.render, guide: errorState.guide },
  { name: 'permission-state', label: 'Permission state', category: 'Feedback', render: permissionState.render, guide: permissionState.guide },
  { name: 'command-palette', label: 'Command palette', category: 'Navigation', render: commandPalette.render, guide: commandPalette.guide },
  { name: 'icon-button', label: 'Icon button', category: 'Actions', render: iconButton.render, guide: iconButton.guide },
  { name: 'button-group', label: 'Button group', category: 'Actions', render: buttonGroup.render, guide: buttonGroup.guide },
  { name: 'split-button', label: 'Split button', category: 'Actions', render: splitButton.render, guide: splitButton.guide },
  { name: 'dropdown-button', label: 'Dropdown button', category: 'Actions', render: dropdownButton.render, guide: dropdownButton.guide },
  { name: 'date-picker', label: 'Date picker', category: 'Forms', render: datePicker.render, guide: datePicker.guide },
  { name: 'date-range-picker', label: 'Date range picker', category: 'Forms', render: dateRangePicker.render, guide: dateRangePicker.guide },
  { name: 'textarea', label: 'Text area', category: 'Forms', render: textarea.render, guide: textarea.guide },
  { name: 'number-input', label: 'Number input', category: 'Forms', render: numberInput.render, guide: numberInput.guide },
  { name: 'currency-input', label: 'Currency input', category: 'Forms', render: currencyInput.render, guide: currencyInput.guide },
  { name: 'radio-group', label: 'Radio group', category: 'Forms', render: radioGroup.render, guide: radioGroup.guide },
  { name: 'form-field', label: 'Form field', category: 'Forms', render: formField.render, guide: formField.guide },
  { name: 'form-section', label: 'Form section', category: 'Forms', render: formSection.render, guide: formSection.guide },
  { name: 'file-upload', label: 'File upload', category: 'Forms', render: fileUpload.render, guide: fileUpload.guide },
  { name: 'drag-drop-zone', label: 'Drag and drop zone', category: 'Forms', render: dragDropZone.render, guide: dragDropZone.guide },
  { name: 'combobox', label: 'Combobox', category: 'Forms', render: renderCombobox, guide: comboboxGuide },
  { name: 'chart', label: 'Charts', category: 'Charts', render: renderChart, guide: chartGuide },
  { name: 'masonry', label: 'Masonry layout', category: 'Layouts', render: renderMasonry, guide: masonryGuide },
  { name: 'button', get label() { return text('Button', '按钮'); }, render: renderButton, guide: guides.button },
  { name: 'input', get label() { return text('Input', '输入框'); }, render: renderInput, guide: guides.input },
  { name: 'select', get label() { return text('Select', '选择器'); }, render: renderSelect, guide: guides.select },
  { name: 'checkbox', get label() { return text('Checkbox', '复选框'); }, render: renderCheckbox, guide: guides.checkbox },
  { name: 'switch', get label() { return text('Switch', '开关'); }, render: renderSwitch, guide: guides.switch },
  { name: 'tag', get label() { return text('Tag', '标签'); }, render: renderTag, guide: guides.tag },
  { name: 'pill', get label() { return text('Pill', '状态胶囊'); }, render: renderPill, guide: guides.pill },
  { name: 'tabs', get label() { return text('Tabs', '选项卡'); }, render: renderTabs, guide: guides.tabs },
  { name: 'table', get label() { return text('Table', '数据表格'); }, render: renderTable, guide: guides.table },
  { name: 'modal', get label() { return text('Modal', '模态对话框'); }, render: renderModal, guide: guides.modal },
  { name: 'toast', get label() { return text('Toast', '通知提示'); }, render: renderToast, guide: guides.toast },
  { name: 'tooltip', get label() { return text('Tooltip', '工具提示'); }, render: renderTooltip, guide: guides.tooltip },
  { name: 'popover', get label() { return text('Popover menu', '弹出菜单'); }, render: renderPopover, guide: guides.popover },
  { name: 'breadcrumbs', get label() { return text('Breadcrumbs', '面包屑导航'); }, render: renderBreadcrumbs, guide: guides.breadcrumbs },
  { name: 'card', get label() { return text('Card', '卡片'); }, render: renderCard, guide: guides.card },
  { name: 'kpi-card', get label() { return text('KPI card', '指标卡片'); }, render: renderKpiCard, guide: guides['kpi-card'] },
  { name: 'badge', get label() { return text('Badge', '徽章'); }, render: renderBadge, guide: guides.badge },
  { name: 'filter-chip', get label() { return text('Filter chip', '筛选标签'); }, render: renderFilterChip, guide: guides['filter-chip'] },
  { name: 'avatar', get label() { return text('Avatar', '头像'); }, render: renderAvatar, guide: guides.avatar },
  { name: 'avatar-stack', get label() { return text('Avatar stack', '头像组'); }, render: renderAvatarStack, guide: guides['avatar-stack'] },
  { name: 'progress-bar', get label() { return text('Progress bar', '进度条'); }, render: renderProgressBar, guide: guides['progress-bar'] },
  { name: 'alert', get label() { return text('Alert', '提示'); }, render: renderAlert, guide: guides.alert },
  { name: 'drawer', get label() { return text('Drawer', '抽屉面板'); }, render: renderDrawer, guide: guides.drawer },
  { name: 'detail-panel', get label() { return text('Detail panel', '详情面板'); }, render: renderDetailPanel, guide: guides['detail-panel'] },
  { name: 'description-list', get label() { return text('Description list', '描述列表'); }, render: renderDescriptionList, guide: guides['description-list'] },
  { name: 'pagination', get label() { return text('Pagination', '分页'); }, render: renderPagination, guide: guides.pagination }
];

for (const entry of registry) {
  if (typeof entry.render !== 'function') throw new Error(`${entry.name}: missing live demo renderer`);
  entry.category ||= ['button'].includes(entry.name) ? 'Actions' : ['input', 'select', 'checkbox', 'switch'].includes(entry.name) ? 'Forms' : ['tabs', 'breadcrumbs', 'pagination'].includes(entry.name) ? 'Navigation' : ['modal', 'drawer', 'detail-panel', 'toast', 'tooltip', 'popover', 'alert'].includes(entry.name) ? 'Feedback' : 'Data display';
  entry.demo = container => {
    const staging = document.createElement('div');
    render(staging);
    const preview = staging.querySelector('.component-preview');
    container.append(...(preview ? [...preview.childNodes] : [...staging.childNodes]));
  };
  const render = entry.render;
  entry.render = container => {
    render(container);
    (container.querySelector('.component-playground') || container).append(renderGuide(entry.guide));
  };
}

if (typeof document !== 'undefined') {
  for (const name of ['playground', ...registry.map(entry => entry.name)]) {
    if (document.querySelector(`link[data-component-style="${name}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(`../css/components/${name}.css`, import.meta.url).href;
    link.dataset.componentStyle = name;
    document.head.append(link);
  }
}
