# Component registry

Generated from `components/registry.js` by `scripts/build-registry-doc.mjs`. Do not edit; run `npm run docs:registry`.

The live Guide and playgrounds use these same implementations and metadata. Props below describe the public API; accessibility notes supplement `ACCESSIBILITY.md`.

| Name | Label | Category | Purpose |
|---|---|---|---|
| kanban | Kanban board | Data display | Organize work into ordered columns with equivalent pointer, keyboard, and Move to menu interactions. |
| calendar | Calendar | Data display | Browse date-only schedules in locale-aligned month and week views, with a complete keyboard model and accessible event lists. |
| data-grid | Data grid | Data display | Edit structured rows with a keyboard-accessible grid, inline validation, unsaved-cell marks and valid-only numeric totals. |
| dashboard-layout | Dashboard layout | Layouts | Compose a responsive twelve-column dashboard with balanced grid or Bento proportions while leaving card and chart behavior to shared components. |
| listing-layout | Listing layout | Layouts | Arrange the reusable parts of a record listing without taking ownership of search, table state, pagination or dialog behavior. |
| form-layout | Form layout | Layouts | Structure a sectioned form with optional guidance and a solid sticky action bar without replacing native form semantics. |
| detail-layout | Detail layout | Layouts | Present a record with a clear hierarchy of heading, summary, related views, main information, contextual side panel and audit history. |
| master-detail-layout | Master detail layout | Layouts | Compose a record list and detail into a keyboard-resizable split layout that becomes two separate views on narrow screens. |
| workspace-layout | Workspace layout | Layouts | Arrange three shared-component content panes in a persisted, resizable workspace without sacrificing narrow-screen access. |
| filter-builder | Filter builder | Enterprise | Build readable field/operator/value conditions and apply the shared pure predicate to real local data. |
| import-wizard | Import wizard | Enterprise | Import local mock CSV through three validated steps: choose a file or paste text, map columns, and review before an explicit local callback. |
| export-dialog | Export dialog | Enterprise | Preview and explicitly download CSV or JSON generated entirely in the browser from the supplied local rows. |
| permission-gate | Permission gate | Enterprise | Hide or disable mock permission-aware actions and explain why an action is unavailable. |
| unsaved-changes-guard | Unsaved changes guard | Enterprise | Protect dirty edits with one reusable Save / Discard / Keep editing decision before navigation or browser unload. |
| bulk-action-toolbar | Bulk action toolbar | Enterprise | Expose selection-aware bulk actions only when one or more records are selected. |
| column-visibility-menu | Column visibility menu | Enterprise | Toggle actual listing columns through a shared keyboard-operable menu while keeping at least one column visible. |
| saved-view-selector | Saved view selector | Enterprise | Save browser-local filter snapshots, restore them, and deliberately rename or delete saved views. |
| timeline | Timeline | Data display | Present an ordered sequence of events with readable timestamps and descriptions. |
| audit-timeline | Audit timeline | Data display | Explain who changed a record, what changed, and when using the shared Timeline. |
| tree-view | Tree view | Data display | Browse hierarchical records with expandable branches and a single roving keyboard stop. |
| stepper | Stepper | Navigation | Show meaningful current, completed and upcoming workflow steps with accessible navigation. |
| confirm-dialog | Confirm dialog | Feedback | Ask for explicit confirmation before a consequential action, optionally requiring exact typed text. |
| skeleton | Skeleton | Feedback | Reserve content space while real data is loading without presenting placeholders as records. |
| spinner | Spinner | Feedback | Announce an indeterminate operation without inventing a progress percentage. |
| empty-state | Empty state | Feedback | Explain an empty result and offer an appropriate next action. |
| error-state | Error state | Feedback | Explain a failed operation and provide a real retry action. |
| permission-state | Permission state | Feedback | Explain why content is unavailable and offer an authorized route to request access. |
| command-palette | Command palette | Navigation | Find and execute shared actions, pages and components in one searchable modal engine. |
| icon-button | Icon button | Actions | Offer a recognizable compact action by composing the canonical Button, SSOT SVG icons and Tooltip primitive. |
| button-group | Button group | Actions | Group related actions in a toolbar, or offer one mutually exclusive selection with radio semantics and roving keyboard focus. |
| split-button | Split button | Actions | Present a common primary action beside a separate, clearly named menu of less frequent alternative commands. |
| dropdown-button | Dropdown button | Actions | Reveal related commands behind one explicit menu trigger by composing the canonical Popover createMenu helper and shared Button styles. |
| date-picker | Date picker | Forms | Choose a date-only value with a locale-aware calendar, explicit unavailable days and complete keyboard navigation. |
| date-range-picker | Date range picker | Forms | Select an inclusive, continuous date range while preventing unavailable endpoints and disabled intervening dates. |
| textarea | Text area | Forms | Collect multiline text with a visible character count and optional maximum. |
| number-input | Number input | Forms | Enter bounded numeric values with precise step controls and inline validation. |
| currency-input | Currency input | Forms | Edit a localized monetary amount with Intl currency parsing and formatting. |
| radio-group | Radio group | Forms | Choose exactly one item from a short visible set of mutually exclusive options. |
| form-field | Form field | Forms | Associate a persistent label, hint and validation error with a real form control. |
| form-section | Form section | Forms | Group related fields into a named, readable form section. |
| file-upload | File upload | Forms | Select and validate local files with a removable list and explicitly simulated progress; no server upload. |
| drag-drop-zone | Drag and drop zone | Forms | Offer drag-and-drop local file selection alongside a fully keyboard-accessible native file chooser. |
| combobox | Combobox | Forms | Search a longer list and select one value or several removable values without leaving the current form. |
| chart | Charts | Charts | Visualize trends, comparisons and shares with dependency-free SVG charts and a complete accessible table alternative. |
| masonry | Masonry layout | Layouts | Arrange independent, variable-height cards into responsive columns without changing their source or keyboard order. |
| button | Button | Actions | Trigger a deliberate action with one clearly dominant primary action per task. |
| input | Input | Forms | Collect a single text value with a visible label, hint, and inline validation. |
| select | Select | Forms | Choose one item from a short, known set using the canonical custom listbox. |
| checkbox | Checkbox | Forms | Select independent items or a whole collection, including partial selection. |
| switch | Switch | Forms | Toggle an immediate on/off preference with a stable, descriptive label. |
| tag | Tag | Data display | Display compact metadata with optional status dot and explicit removal. |
| pill | Pill | Data display | A fully rounded variant of the canonical tag for compact statuses and counts. |
| tabs | Tabs | Navigation | Switch between related local content panels while preserving page context. |
| table | Table | Data display | Present structured mock records with real local search, filters, sorting, paging, and whole-row details. |
| modal | Modal | Feedback | Focus attention on one decision or a short editing task with a shared dialog lifecycle. |
| toast | Toast | Feedback | Announce non-critical, transient feedback without interrupting a task. |
| tooltip | Tooltip | Feedback | Provide a short supplementary label without replacing a visible label or control name. |
| popover | Popover menu | Feedback | Offer contextual actions in one reusable keyboard-navigable menu. |
| breadcrumbs | Breadcrumbs | Navigation | Show the current location and linked ancestors in a navigation hierarchy. |
| card | Card | Data display | Group related information under an optional heading, actions, and footer. |
| kpi-card | KPI card | Data display | Present a labelled metric, optional trend, and real contextual actions. |
| badge | Badge | Data display | Display a compact named status with semantic fill and contrast-safe text. |
| filter-chip | Filter chip | Data display | Represent and remove an active filter with an explicit named action. |
| avatar | Avatar | Data display | Identify a person or organisation with an image and accessible initials fallback. |
| avatar-stack | Avatar stack | Data display | Summarise a named member collection with visible avatars and explicit overflow. |
| progress-bar | Progress bar | Data display | Expose a determinate progress or capacity value with optional visible percentage. |
| alert | Alert | Feedback | Keep meaningful inline feedback visible until it is resolved or explicitly dismissed. |
| drawer | Drawer | Feedback | Open focused record details beside the current workspace using the shared modal lifecycle. |
| detail-panel | Detail panel | Feedback | Show record details inline without blocking the surrounding workspace. |
| description-list | Description list | Data display | Present readable semantic term/value pairs for record details. |
| pagination | Pagination | Navigation | Navigate bounded pages and adjust rows per page using the same controller as Table. |

## Kanban board

- Name: `kanban`
- Category: Data display
- Purpose: Organize work into ordered columns with equivalent pointer, keyboard, and Move to menu interactions.

### Props / API

- createKanban({columns:[{id,label}],cards:[{id,column,title,value?}],onChange(cards),label="Kanban board",showTotals=true,formatValue,loading=false,error="",onRetry,headingLevel=3}) returns {element,getCards,setCards,destroy}. Set headingLevel (1–6) for column headings. IDs are unique strings and every card references a known column. Values are finite numbers.
- getCards returns a snapshot of committed cards. setCards replaces cards without calling onChange and cancels a move in progress. onChange receives a snapshot only after a changed drop or menu move. Array order determines order within a column. formatValue(number) formats card values and optional column totals. Loading/error are initial display states; replace the controller when loading completes.

### Accessibility summary

- Pickup buttons expose pressed state and linked instructions. A polite atomic live region announces pickup, destination, position, drop and cancellation. Column headings, WIP text and card lists remain readable without colour.
- Every card has a Move to menu: dragging is never the only path. Keyboard and pointer changes remain previews until explicitly dropped.

## Calendar

- Name: `calendar`
- Category: Data display
- Purpose: Browse date-only schedules in locale-aligned month and week views, with a complete keyboard model and accessible event lists.

### Props / API

- createCalendar({date="2026-10-26", view="month", events=[], locale="en-GB", headingLevel=3, onSelectDate, onSelectEvent}) returns {element, setEvents, getDate, setDate, setView, getView, destroy}. Set headingLevel (1–6) for the containing section; agenda/date headings follow it.
- Events are {id, title, date, time?, status?}; dates use ISO YYYY-MM-DD and optional times use HH:mm labels without timezone conversion. All-day events sort first, followed by time; equal times retain input order. Callbacks receive the selected ISO date or original event object.
- setEvents replaces records. setDate and setView update silently and return false for invalid input. Date selection, arrow navigation and period controls call onSelectDate.

### Accessibility summary

- Named date grid with column headers, row/gridcell roles, aria-selected on the selected cell and aria-current=date for today. Counts and full dates are included in day names.
- The selected period and date changes are announced. Every event is a full-width labelled button with visible title, time/all-day text and optional textual status; colour is never the only status cue.

## Data grid

- Name: `data-grid`
- Category: Data display
- Purpose: Edit structured rows with a keyboard-accessible grid, inline validation, unsaved-cell marks and valid-only numeric totals.

### Props / API

- createDataGrid({label, columns, rows, onChange(rows), onDirtyChange(boolean)}) returns {element, getRows(), isValid(), markSaved(), setRows(rows)}.
- Columns: {key,label,type:"text"\|"number"\|"currency"\|"select"\|"date",options?:[{value,label}],min?,max?,required?,aggregate?:"sum"\|"average",validate?(value,row,rowIndex),currency?,locale?}. The default type is text. Custom validation returns an error string or false; true, null or undefined accepts the value. Date bounds and values use ISO YYYY-MM-DD. Currency is in major units, with optional currency/locale defaulting to USD/en-US.
- getRows returns shallow row snapshots, including unparseable invalid drafts; parseable numeric edits become numbers without clamping. onChange fires for live drafts and Escape rollback. Consumers must call isValid before domain calculations or persistence. Footer sums/averages omit invalid and empty cells and display the included count.
- markSaved commits the active edit, returns false on invalid data, otherwise resets dirty marks. setRows silently replaces rows and the saved baseline; onDirtyChange fires only when dirty state changes, including live input and reverting to saved values.
- The consumer owns UnsavedChangesGuard: store onDirtyChange in a boolean; pass isDirty:()=&gt;dirty, onSave that validates/persists then calls markSaved(), and onDiscard:()=&gt;grid.setRows(savedRows). Destroy the guard on owner teardown. The grid does not install a second guard.

### Accessibility summary

- ARIA grid, rowgroups, row/column indices and counts, column headers and a caption. Roving cell tabindex keeps navigation efficient; every editor has a row-specific label.
- aria-invalid and described errors associate invalid cells and controls with visible messages. A polite status summarizes validation and unsaved state. Unsaved text conveys dirty state without colour alone.

## Dashboard layout

- Name: `dashboard-layout`
- Category: Layouts
- Purpose: Compose a responsive twelve-column dashboard with balanced grid or Bento proportions while leaving card and chart behavior to shared components.

### Props / API

- createDashboardLayout({header, metrics, content, footer, variant, className}) returns a DOM node.
- header, metrics and footer accept a DOM node or arrays of nodes. Optional slots are omitted when null or undefined.
- content accepts nodes, arrays, or {element: DOMNode, span: 1..12, rowSpan: positive integer} descriptors. Span metadata belongs to wrapper cells; supplied nodes and classes are preserved.
- variant is grid (default) or bento. className appends application classes without replacing layout classes. Slot wrappers expose data-layout-slot and ds-dashboard-layout-&lt;slot&gt;.

### Accessibility summary

- Keep named headings in supplied cards. Do not communicate dashboard meaning through tile size alone.
- The layout does not reorder or clone supplied DOM nodes; chart table alternatives remain available.

## Listing layout

- Name: `listing-layout`
- Category: Layouts
- Purpose: Arrange the reusable parts of a record listing without taking ownership of search, table state, pagination or dialog behavior.

### Props / API

- createListingLayout({header, summary, toolbar, table, pagination, detail, className}) returns a DOM node.
- Every slot accepts an existing DOM node or arrays of nodes; null and undefined omit the slot. Nodes are moved, not cloned or restyled.
- header holds the page heading/actions; summary holds counts or metrics; toolbar holds shared search/filter controls; table holds the canonical Table; pagination holds createPagination(...).element.
- detail is optional inline DetailPanel content or a shared drawer launcher. For overlays call openDrawer; the layout never invents dialog behavior.
- className appends caller classes. Wrappers expose data-layout-slot and ds-listing-layout-&lt;slot&gt;; table/pagination are grouped in ds-listing-layout-main, alongside the detail slot.

### Accessibility summary

- Use a caption on the canonical table and persistent labels on search/filter controls.
- Inline details do not trap focus. Shared Drawer owns its dialog label, focus trap, Escape handling and focus return.

## Form layout

- Name: `form-layout`
- Category: Layouts
- Purpose: Structure a sectioned form with optional guidance and a solid sticky action bar without replacing native form semantics.

### Props / API

- createFormLayout({header, notice, sections, actions, className}) returns a DOM div, not a form.
- Every slot accepts a DOM node or arrays of nodes; null and undefined omit the slot. Existing nodes, listeners and classes are preserved.
- header is the page heading; notice holds shared Alert feedback; sections holds shared FormSection nodes or an existing form containing them; actions holds status and action nodes.
- If actions are outside the supplied form, associate submit buttons with its id using the native form attribute, as in the live example.
- className appends caller classes. Direct root wrappers expose data-layout-slot and ds-form-layout-&lt;slot&gt;. --form-action-offset can override the sticky bottom offset for the host shell.

### Accessibility summary

- Compose persistent FormField labels, descriptions and errors with named FormSections.
- Retain one real form owner and associate external submit buttons explicitly. The layout adds no misleading form or dialog roles.

## Detail layout

- Name: `detail-layout`
- Category: Layouts
- Purpose: Present a record with a clear hierarchy of heading, summary, related views, main information, contextual side panel and audit history.

### Props / API

- createDetailLayout({header, summary, tabs, content, sidePanel, timeline, className}) returns a DOM node.
- Every slot accepts a DOM node or arrays of nodes; null and undefined omit it. Existing nodes, classes and event listeners are preserved.
- header holds the record heading/actions; summary holds metrics or description cards; tabs holds canonical createTabs(...) including its associated panels.
- content is persistent main information; sidePanel is optional inline context; timeline holds the shared AuditTimeline, optionally within a named Card.
- className appends caller classes. Wrappers expose data-layout-slot and ds-detail-layout-&lt;slot&gt;; content and sidePanel share ds-detail-layout-body.

### Accessibility summary

- Supply a clear record heading and labelled shared cards. The inline side panel is not a modal and never traps focus.
- Canonical Tabs owns tab/panel IDs and selection; AuditTimeline names actors, actions and semantic timestamps in source order.

## Master detail layout

- Name: `master-detail-layout`
- Category: Layouts
- Purpose: Compose a record list and detail into a keyboard-resizable split layout that becomes two separate views on narrow screens.

### Props / API

- createMasterDetailLayout({list, detail, storageKey, label, listLabel, detailLabel, widths:[320,640], minWidths:[200,240], maxWidths:[]}) returns {element, listPane, detailPane, separator, widths, showList, showDetail, destroy}.
- Slots: list and detail accept shared component DOM nodes. Layout owns pane sizing and the compact Back/View details actions, not record selection.
- Call showDetail() from list activation and showList() to return; each accepts {focus:false} to keep deliberate caller focus. widths is a read-only snapshot in pixels. destroy() releases listeners/observers and removes the element.
- storageKey opts into localStorage preferences; omit it for ephemeral sizes. Storage denial or invalid saved values falls back safely.

### Accessibility summary

- Named regions and a focusable separator expose orientation, controlled pane IDs and current/min/max pixel values.
- Only the active compact pane is exposed; changing views moves focus into the new region and Back restores list focus.

## Workspace layout

- Name: `workspace-layout`
- Category: Layouts
- Purpose: Arrange three shared-component content panes in a persisted, resizable workspace without sacrificing narrow-screen access.

### Props / API

- createWorkspaceLayout({panes:[{label,content}, {label,content}, {label,content}], storageKey, label, widths:[240,540,420], minWidths:[180,240,200], maxWidths:[], activePane:0}) returns {element, panes, separators, tabs, activePane, widths, showPane, destroy}.
- Slots: exactly three labelled content DOM nodes, typically a TreeView or list, a Card preview and a DescriptionList/form inspector. The layout does not manufacture record data or selection behavior.
- showPane(index, {focus:true}) selects a compact pane or focuses its desktop region. Pass focus:false to preserve caller focus. widths and activePane are read-only snapshots.
- storageKey opts into guarded localStorage preferences. destroy() releases all layout listeners and observers and removes its element.

### Accessibility summary

- Separators expose vertical orientation, controlled regions and updated minimum/current/maximum pixel values.
- Compact views use a labelled tablist, selected tabs, controlled tabpanels and hidden inactive panes; desktop uses named regions.

## Filter builder

- Name: `filter-builder`
- Category: Enterprise
- Purpose: Build readable field/operator/value conditions and apply the shared pure predicate to real local data.

### Props / API

- createFilterBuilder({fields:[{key,label,type}],value:conditions[],match="all",disabled,onChange(value,predicate,{match,summary})}) returns element,value,match,summary,predicate,setValue(value,{match}),setDisabled,destroy. setValue is silent; predicates use case-insensitive text and numeric comparisons from js/logic/filter.js.

### Accessibility summary

- Numbered fieldsets, persistent FormField labels, named removal buttons and a polite readable summary.

## Import wizard

- Name: `import-wizard`
- Category: Enterprise
- Purpose: Import local mock CSV through three validated steps: choose a file or paste text, map columns, and review before an explicit local callback.

### Props / API

- createImportWizard({fields:[{key,label,required}],initialCSV,maxSize=2097152,maxRows=Infinity,validateRows(mappedRows),onImport(rows),onComplete(rows)}) returns element,step,rows,next(),back(),destroy(). onImport is required and may return a promise. validateRows is synchronous, runs before review and import, and rejects by throwing, returning false or an error string. Limits apply to both pasted text and files. openImportWizard({...options,title,onClose}) returns the shared Modal controller plus wizard.

### Accessibility summary

- Shared Stepper marks current/completed steps; persistent field labels, required mapping hints, associated alert errors, captioned review table and polite status.

## Export dialog

- Name: `export-dialog`
- Category: Enterprise
- Purpose: Preview and explicitly download CSV or JSON generated entirely in the browser from the supplied local rows.

### Props / API

- openExportDialog({rows,columns:[{key,label}],filename="mock-export",format="csv",title,onExport(result),onClose}) returns the shared Modal controller. downloadData(rows,{format,columns,filename}) returns {content,format,filename,mime,blob} after requesting download. serializeData(rows,options) is the pure exporter and returns the same metadata without blob. columns may also be string keys; JSON includes only selected columns when provided.

### Accessibility summary

- Shared Modal traps focus and supplies accessible title; persistent FormField label and errors, native format radios and polite download status.

## Permission gate

- Name: `permission-gate`
- Category: Enterprise
- Purpose: Hide or disable mock permission-aware actions and explain why an action is unavailable.

### Props / API

- createPermissionGate({permission,content:Node,mode="disable",reason}) returns element,refresh,destroy. getMockPermissions() returns permission IDs; setMockPermissions(ids) persists and broadcasts app:permissions-changed; MOCK_PERMISSIONS lists setting labels and descriptions.

### Accessibility summary

- Visible reason text explains denial; disabled controls reference that text. The wrapper exposes aria-disabled.

## Unsaved changes guard

- Name: `unsaved-changes-guard`
- Category: Enterprise
- Purpose: Protect dirty edits with one reusable Save / Discard / Keep editing decision before navigation or browser unload.

### Props / API

- createUnsavedChangesGuard({isDirty,onSave,onDiscard,title,description}) returns resolve():Promise&lt;boolean&gt; and destroy(). Callbacks may be async; false blocks navigation. A successful callback must clear isDirty. Destroy settles any outstanding decision false.

### Accessibility summary

- Shared Modal traps and restores focus, names the dialog and announces callback failures; busy actions disable duplicate activation.

## Bulk action toolbar

- Name: `bulk-action-toolbar`
- Category: Enterprise
- Purpose: Expose selection-aware bulk actions only when one or more records are selected.

### Props / API

- createBulkActionToolbar({count=0,actions:[{label,onAction(count),danger,disabled}],onClear}) returns element,setCount(count),destroy. Async actions disable duplicate activation and show failures.

### Accessibility summary

- Named toolbar and live selection count; native disabled buttons while busy.

## Column visibility menu

- Name: `column-visibility-menu`
- Category: Enterprise
- Purpose: Toggle actual listing columns through a shared keyboard-operable menu while keeping at least one column visible.

### Props / API

- createColumnVisibilityMenu({columns:[{id,label,visible=true,locked=false,onChange(visible)}],onChange(id,visible,columns),label="Columns"}) returns element,trigger,columns,setColumns,destroy. Callbacks apply visibility to the owning table.

### Accessibility summary

- Named trigger has aria-expanded and aria-controls; menuitemcheckbox exposes aria-checked; required and last-visible items cannot be hidden.

## Saved view selector

- Name: `saved-view-selector`
- Category: Enterprise
- Purpose: Save browser-local filter snapshots, restore them, and deliberately rename or delete saved views.

### Props / API

- createSavedViewSelector({storageKey,getState,onSelect(state,view),label="Saved views"}) returns element,refresh,getViews,destroy. getState supplies JSON-compatible filter state. onSelect restores a cloned snapshot. storageKey isolates a listing; refresh reloads external updates.

### Accessibility summary

- Named menu trigger exposes selection, expanded state and controls; labelled naming input has linked validation; live feedback reports changes.

## Timeline

- Name: `timeline`
- Category: Data display
- Purpose: Present an ordered sequence of events with readable timestamps and descriptions.

### Props / API

- createTimeline({items:[{title,description,time,dateTime}],label,compact}) returns an ordered-list element.

### Accessibility summary

- An ordered list preserves event order; machine-readable dates use time datetime.

## Audit timeline

- Name: `audit-timeline`
- Category: Data display
- Purpose: Explain who changed a record, what changed, and when using the shared Timeline.

### Props / API

- createAuditTimeline({events:[{actor,action,target,time,dateTime,details}],label,compact}) returns an element.

### Accessibility summary

- Ordered records include actor, action and target as text, with semantic timestamps.

## Tree view

- Name: `tree-view`
- Category: Data display
- Purpose: Browse hierarchical records with expandable branches and a single roving keyboard stop.

### Props / API

- createTreeView({nodes:[{id,label,disabled,children}],label,expandedIds,selectedId,onSelect}) returns a tree element with getState() and setExpanded(ids). IDs must be unique.

### Accessibility summary

- Tree items expose level, sibling position, expanded, disabled and selected state. Disabled items remain discoverable but cannot be selected.

## Stepper

- Name: `stepper`
- Category: Navigation
- Purpose: Show meaningful current, completed and upcoming workflow steps with accessible navigation.

### Props / API

- createStepper({steps:[{id,label,description,disabled}],current:0,completed:[],onChange(index,step),label}) returns an element with setCurrent(index), setCompleted(indices), and value. Completion is explicit, not inferred from position.

### Accessibility summary

- Ordered steps use aria-current="step" and textual Complete/Current/Upcoming indicators.

## Confirm dialog

- Name: `confirm-dialog`
- Category: Feedback
- Purpose: Ask for explicit confirmation before a consequential action, optionally requiring exact typed text.

### Props / API

- openConfirmDialog({title,description,confirmLabel,cancelLabel,destructive,confirmationText,onConfirm,onClose}) returns the shared modal controller. onConfirm may return a promise; rejection keeps the dialog open with an error.

### Accessibility summary

- The shared Modal supplies focus trap, accessible title/description and focus return. Typed confirmation has a persistent label.

## Skeleton

- Name: `skeleton`
- Category: Feedback
- Purpose: Reserve content space while real data is loading without presenting placeholders as records.

### Props / API

- createSkeleton({lines:3,label:"Loading content",avatar:false}) returns a labeled busy region.

### Accessibility summary

- A single status label describes loading; decorative shapes are hidden.

## Spinner

- Name: `spinner`
- Category: Feedback
- Purpose: Announce an indeterminate operation without inventing a progress percentage.

### Props / API

- createSpinner({label="Loading"}) returns a status element using the existing ds-spinner styles.

### Accessibility summary

- Visible status text names the work; the spinning mark is hidden from assistive technology.

## Empty state

- Name: `empty-state`
- Category: Feedback
- Purpose: Explain an empty result and offer an appropriate next action.

### Props / API

- createEmptyState({title,description,actionLabel,onAction,headingLevel=3}) returns an element; the action renders only when a callback is supplied. Set headingLevel (1–6) for the containing section.

### Accessibility summary

- Visible heading and description explain the state without relying on an illustration.

## Error state

- Name: `error-state`
- Category: Feedback
- Purpose: Explain a failed operation and provide a real retry action.

### Props / API

- createErrorState({title,description,retryLabel,onRetry,headingLevel=3}) returns an element. Set headingLevel (1–6) for the containing section. onRetry may return a promise; rejection is announced and permits another retry.

### Accessibility summary

- Errors use an alert; retry progress is announced in a polite status region.

## Permission state

- Name: `permission-state`
- Category: Feedback
- Purpose: Explain why content is unavailable and offer an authorized route to request access.

### Props / API

- createPermissionState({title,description,permission,actionLabel,onRequestAccess}) returns an element; permission is descriptive only and is not authorization enforcement.

### Accessibility summary

- A visible heading and reason communicate access restrictions without color alone.

## Command palette

- Name: `command-palette`
- Category: Navigation
- Purpose: Find and execute shared actions, pages and components in one searchable modal engine.

### Props / API

- createCommandPalette({items: array or getter, label, storageKey, onExecute}) returns open(query), close(), setItems(), destroy(), isOpen.
- Items are {id,label,keywords,category,action or href,disabled}; ranking uses exact, prefix, substring and keywords, with local recents breaking ties.

### Accessibility summary

- Named focus-trapped modal, labelled combobox controlling a listbox, active descendant and selected options; result count is announced. Focus returns to the opener.

## Icon button

- Name: `icon-button`
- Category: Actions
- Purpose: Offer a recognizable compact action by composing the canonical Button, SSOT SVG icons and Tooltip primitive.

### Props / API

- createIconButton({label, icon="more", variant="secondary", size="medium", disabled=false, loading=false, pressed?, tooltip=label, onClick}) returns {element, button, close}.
- label supplies the accessible action name; tooltip is supporting text, or false to omit it. pressed is optional and controlled by the caller.

### Accessibility summary

- The native button always has an aria-label, and decorative SSOT SVG is hidden from assistive technology.
- The existing tooltip is connected with aria-describedby; loading exposes aria-busy and preserves the accessible action name.

## Button group

- Name: `button-group`
- Category: Actions
- Purpose: Group related actions in a toolbar, or offer one mutually exclusive selection with radio semantics and roving keyboard focus.

### Props / API

- createButtonGroup({label, items:[{value,label,disabled?,action?}], value?, selection=false, orientation="horizontal", disabled=false, onChange}) returns {element, buttons, value, setValue, setDisabled}.
- onChange(value,item) fires for user selection; setValue is silent. Item action(event) runs on explicit activation, not arrow-key focus.

### Accessibility summary

- The group has a required meaningful aria-label and aria-orientation; selection uses radiogroup/radio with aria-checked, actions use toolbar/native buttons.
- Disabled items are omitted from the roving focus model; the group does not impersonate tabs or page navigation.

## Split button

- Name: `split-button`
- Category: Actions
- Purpose: Present a common primary action beside a separate, clearly named menu of less frequent alternative commands.

### Props / API

- createSplitButton({label="Save", onAction, items:[{label,action,disabled?,danger?}], menuLabel?, variant="primary", size="medium", disabled=false, loading=false, placement="end"}) returns {element, primary, trigger, close}.
- onAction(event) runs only from the primary button. Menu actions use the existing createMenu callbacks. loading blocks both halves; empty items disable only the menu half.

### Accessibility summary

- A named group contains two native buttons, with a distinct aria-label on the icon-only menu trigger.
- The menu half alone has aria-haspopup, aria-expanded and aria-controls. Primary loading exposes aria-busy; the SSOT chevron and spinner are decorative.

## Dropdown button

- Name: `dropdown-button`
- Category: Actions
- Purpose: Reveal related commands behind one explicit menu trigger by composing the canonical Popover createMenu helper and shared Button styles.

### Props / API

- createDropdownButton({label="Actions", items:[{label,action,disabled?,danger?}], variant="secondary", size="medium", icon?, placement="end", disabled=false, loading=false}) returns {element, trigger, close}.
- items and their callbacks use the existing createMenu contract. Empty items disable the trigger; loading also disables activation. close(returnFocus?) dismisses the menu.

### Accessibility summary

- Native trigger exposes aria-haspopup=menu, aria-controls, aria-expanded and aria-busy; createMenu supplies menu/menuitem roles and disabled states.
- Icons and chevron are decorative; visible text names both the trigger and its menu.

## Date picker

- Name: `date-picker`
- Category: Forms
- Purpose: Choose a date-only value with a locale-aware calendar, explicit unavailable days and complete keyboard navigation.

### Props / API

- createDatePicker({label, value, locale, weekStartsOn, min, max, disabledDates, disabled, required, clearable, hint, error, name, placeholder, initialMonth, onChange}) returns element, trigger, value, setValue, setDisabled, open, close and destroy.
- Values, bounds and initialMonth are ISO YYYY-MM-DD strings. disabledDates accepts an array, Set or predicate. Bounds are inclusive. setValue is silent and returns false without changing the value when unavailable. A named hidden input carries the ISO value.

### Accessibility summary

- Persistent label, hint/error descriptions, required state and named modal. The calendar uses grid/row/gridcell roles with exactly one day in the tab sequence, aria-selected for selection and aria-current=date for today.
- Month changes and selection instructions are announced. All calculations are date-only UTC; localized display always uses the Gregorian calendar to match ISO values.

## Date range picker

- Name: `date-range-picker`
- Category: Forms
- Purpose: Select an inclusive, continuous date range while preventing unavailable endpoints and disabled intervening dates.

### Props / API

- createDateRangePicker({label, value:{start,end}, locale, weekStartsOn, min, max, disabledDates, disabled, required, clearable, hint, error, name, placeholder, initialMonth, onChange}) returns element, trigger, value, setValue, setDisabled, open, close and destroy.
- start/end are ISO YYYY-MM-DD strings or null. onChange receives {start,end:null} after the first selection and {start,end} after completion. Choosing an earlier end sorts the endpoints. A completed selection starts a new range on the next choice.
- setValue is silent; false means the range was rejected without mutation. Disabled dates accept an array, Set or predicate. With name, hidden inputs use name-start and name-end.

### Accessibility summary

- The shared DatePicker calendar uses a named modal, grid/row/gridcell semantics, aria-multiselectable, selected-range aria-selected and aria-current=date for today.
- Readable visible range, full-date start/end names and live instructions do not rely on colour. Rejected ranges announce the disabled intervening-date reason without losing the start.

## Text area

- Name: `textarea`
- Category: Forms
- Purpose: Collect multiline text with a visible character count and optional maximum.

### Props / API

- createTextarea({label,value,maxLength=500,rows=4,required,disabled,hint,onChange}) returns element, input, value, setValue, setError and setDisabled. Set maxLength:null for an unlimited counter.

### Accessibility summary

- Persistent FormField label and error association; counter is an associated polite live region. Character limits follow native UTF-16 maxlength semantics.

## Number input

- Name: `number-input`
- Category: Forms
- Purpose: Enter bounded numeric values with precise step controls and inline validation.

### Props / API

- createNumberInput({label,value,min,max,step=1,precision,disabled,required,hint,onChange}) returns element,input,value,setValue,validate,setError,setDisabled. setValue rounds/clamps using shared number logic; typed invalid values remain visible.

### Accessibility summary

- Spinbutton exposes current value and bounds; named step buttons and FormField error descriptions.

## Currency input

- Name: `currency-input`
- Category: Forms
- Purpose: Edit a localized monetary amount with Intl currency parsing and formatting.

### Props / API

- createCurrencyInput({label,value,locale="en-US",currency="USD",disabled,required,onChange,...IntlOptions}) returns element,input,value,setValue,validate,setError,setDisabled. Values are numbers or null.

### Accessibility summary

- Persistent label and visible currency/locale instructions; invalid text is preserved with an associated error.

## Radio group

- Name: `radio-group`
- Category: Forms
- Purpose: Choose exactly one item from a short visible set of mutually exclusive options.

### Props / API

- createRadioGroup({label,name,options:[{value,label,disabled}],value,required,disabled,onChange}) returns element,inputs,value,setValue,setError,setDisabled.

### Accessibility summary

- Native fieldset/legend and same-name radio semantics; labels have 44px targets; errors are linked to every option.

## Form field

- Name: `form-field`
- Category: Forms
- Purpose: Associate a persistent label, hint and validation error with a real form control.

### Props / API

- createFormField({label, control, hint, error, required}) returns {element, setError(message)}. Existing description IDs are preserved.

### Accessibility summary

- Label for/id association, aria-required, aria-invalid and merged aria-describedby IDs. Errors are announced politely.

## Form section

- Name: `form-section`
- Category: Forms
- Purpose: Group related fields into a named, readable form section.

### Props / API

- createFormSection({title, description, content, headingLevel=3}) returns a section DOM node; content is a node or array of nodes. Set headingLevel (1–6) to follow the containing section.

### Accessibility summary

- A visible heading labels the semantic section through aria-labelledby.

## File upload

- Name: `file-upload`
- Category: Forms
- Purpose: Select and validate local files with a removable list and explicitly simulated progress; no server upload.

### Props / API

- createFileUpload({label,accept,maxSize=5242880,multiple=true,disabled,dropZone=false,onChange}) returns element,input,files,addFiles,setDisabled,destroy. accept supports extensions, MIME types and MIME wildcards; maxSize is bytes per file.

### Accessibility summary

- Visible chooser label, linked type/size instructions, alert validation, named per-file progress and removal buttons, polite selection status.

## Drag and drop zone

- Name: `drag-drop-zone`
- Category: Forms
- Purpose: Offer drag-and-drop local file selection alongside a fully keyboard-accessible native file chooser.

### Props / API

- createDragDropZone({label,accept,maxSize,multiple,disabled,onChange}) shares the FileUpload controller: element,input,files,addFiles,setDisabled,destroy.

### Accessibility summary

- Visible chooser label, linked type/size instructions, alert validation, named per-file progress and removal buttons, polite selection status.

## Combobox

- Name: `combobox`
- Category: Forms
- Purpose: Search a longer list and select one value or several removable values without leaving the current form.

### Props / API

- createCombobox({label, options, value, multiple, onChange, placeholder, disabled, clearable, maxSelected, creatable, asyncDelay, loading, error, hint, required, hideLabel, name}).
- Options: {value, label, keywords?: string\|string[], group?, disabled?}; groups also accept {label, options:[…]}. Value is a scalar/null or an array in multiple mode. onChange receives that value.
- Returns {id, element, input, value getter, setValue(value), close(), setDisabled(boolean)}. setValue is silent and accepts existing values only; name emits hidden successful form controls.

### Accessibility summary

- ARIA 1.2 input combobox keeps focus and points aria-activedescendant at listbox options. Group labels, selected/disabled states, live results/removal feedback, visible label and linked hints/errors are provided.
- A manual top-layer popover stays within its original dialog DOM so modal/drawer focus trapping still works; the first Escape dismisses only this popover.

## Charts

- Name: `chart`
- Category: Charts
- Purpose: Visualize trends, comparisons and shares with dependency-free SVG charts and a complete accessible table alternative.

### Props / API

- createChart({type, labels, series:[{name,values}], formatValue, loading, title, headingLevel=3}) returns a DOM element with update(nextOptions) and destroy(). Set headingLevel (1–6) to follow the containing section.
- Values are finite numbers; missing values are gaps. Donut uses the first series with labels as slices, requires non-negative values, and its legend toggles slices and displays formatted slice values.
- formatValue(number) formats ticks, tooltips, summaries, donut legend values and table cells. destroy() is automatic on DOM removal; call it explicitly when disposing an unmounted chart.

### Accessibility summary

- Every SVG has role=img and a generated type, series, min/max and trend summary.
- Every chart has a captioned source-data table with row and column headers, including hidden values.
- Tooltips appear on hover and focus. Eight distinct markers and dash sequences supplement token colours; legends expose aria-pressed. No animations are required.

## Masonry layout

- Name: `masonry`
- Category: Layouts
- Purpose: Arrange independent, variable-height cards into responsive columns without changing their source or keyboard order.

### Props / API

- createMasonry({items: DOMNode[], label}) returns a named list DOM element.
- Pass real card or article elements as items; this layout owns spacing and columns, not card behaviour.

### Accessibility summary

- A named list contains list items. Cards remain in DOM order; no JavaScript rearrangement or absolute positioning is used.
- Use independent content only; this is not a tabular comparison or a chronological row-based feed.

## Button

- Name: `button`
- Category: Actions
- Purpose: Trigger a deliberate action with one clearly dominant primary action per task.

### Props / API

- Label, variant, size, disabled, loading; use the shared button(label, onClick, variant, attributes) helper.

### Accessibility summary

- Use a verb-based accessible name. Icon-only buttons require aria-label; loading uses aria-busy.

## Input

- Name: `input`
- Category: Forms
- Purpose: Collect a single text value with a visible label, hint, and inline validation.

### Props / API

- Label, placeholder, type, value, disabled, required, error.

### Accessibility summary

- Associate label with id. Link hints and errors with aria-describedby; set aria-invalid on errors.

## Select

- Name: `select`
- Category: Forms
- Purpose: Choose one item from a short, known set using the canonical custom listbox.

### Props / API

- customSelect({label, value, options:[{value,label}], onChange, disabled, error}) returns element, trigger, value, setValue, setDisabled, close.

### Accessibility summary

- Trigger exposes aria-expanded, aria-controls and aria-haspopup. Options expose aria-selected.

## Checkbox

- Name: `checkbox`
- Category: Forms
- Purpose: Select independent items or a whole collection, including partial selection.

### Props / API

- Label, checked, disabled, indeterminate; use a native input with ds-checkbox.

### Accessibility summary

- Use a visible label; set the input indeterminate property for partial selection.

## Switch

- Name: `switch`
- Category: Forms
- Purpose: Toggle an immediate on/off preference with a stable, descriptive label.

### Props / API

- Label, checked, disabled, description; role=switch and aria-checked reflect state.

### Accessibility summary

- Expose aria-checked; keep the label unchanged when the value changes.

## Tag

- Name: `tag`
- Category: Data display
- Purpose: Display compact metadata with optional status dot and explicit removal.

### Props / API

- createTag({label, tone, dot, pill, size, onRemove, disabled}) returns a DOM node.

### Accessibility summary

- Status is named in text; decorative dots are hidden. Removal names the label being removed.

## Pill

- Name: `pill`
- Category: Data display
- Purpose: A fully rounded variant of the canonical tag for compact statuses and counts.

### Props / API

- createPill({label, tone, dot, size, onRemove, disabled}) returns a DOM node.

### Accessibility summary

- Always include a text label, including count context when it is not adjacent.

## Tabs

- Name: `tabs`
- Category: Navigation
- Purpose: Switch between related local content panels while preserving page context.

### Props / API

- createTabs({items:[{label,content,disabled?}], label, active=0, variant="underline", orientation="horizontal", fullWidth=false, onChange}) returns a DOM node; content accepts shared component nodes or arrays.

### Accessibility summary

- Use tablist/tab/tabpanel roles, aria-selected and aria-controls; only the active tab is in the tab sequence.

## Table

- Name: `table`
- Category: Data display
- Purpose: Present structured mock records with real local search, filters, sorting, paging, and whole-row details.

### Props / API

- createTable({caption, label, header, body, striped, className, onRowActivate(index,row)}) returns a responsive region.
- Compose search and filters with the existing Input/Select and createPagination controller.

### Accessibility summary

- Caption names the dataset; headers use scope and aria-sort; scroll region is named and keyboard reachable.

## Modal

- Name: `modal`
- Category: Feedback
- Purpose: Focus attention on one decision or a short editing task with a shared dialog lifecycle.

### Props / API

- openModal({title, content, actions, onClose, dismissible, size}) returns element and close(reason).

### Accessibility summary

- role=dialog, aria-modal and heading/description references; background scroll is locked.

## Toast

- Name: `toast`
- Category: Feedback
- Purpose: Announce non-critical, transient feedback without interrupting a task.

### Props / API

- showToast({message, tone, duration, actionLabel, onAction}) returns element and dismiss().

### Accessibility summary

- Status or alert role announces content; an explicit dismiss action remains available.

## Tooltip

- Name: `tooltip`
- Category: Feedback
- Purpose: Provide a short supplementary label without replacing a visible label or control name.

### Props / API

- Trigger text, tooltip text, placement, disabled; use the documented trigger association.

### Accessibility summary

- Tooltip uses role=tooltip and is associated through aria-describedby.

## Popover menu

- Name: `popover`
- Category: Feedback
- Purpose: Offer contextual actions in one reusable keyboard-navigable menu.

### Props / API

- createMenu({label, placement, disabled, items:[{label, action, disabled, danger}]}) returns element, trigger, close().

### Accessibility summary

- Trigger exposes menu state; disabled items are skipped; opening places focus in the menu.

## Breadcrumbs

- Name: `breadcrumbs`
- Category: Navigation
- Purpose: Show the current location and linked ancestors in a navigation hierarchy.

### Props / API

- createBreadcrumbs({items:[{label,href}], label}) returns a nav element. The last item is the current page.

### Accessibility summary

- Named navigation and an ordered list; the last item exposes aria-current=page and is not a redundant link.

## Card

- Name: `card`
- Category: Data display
- Purpose: Group related information under an optional heading, actions, and footer.

### Props / API

- createCard({title, description, content, actions, footer, headingLevel=3}) returns a section. Set headingLevel (1–6) to follow the containing section. Content/actions/footer accept DOM nodes or arrays.

### Accessibility summary

- A title labels the section; preserve real heading and button semantics within the card.

## KPI card

- Name: `kpi-card`
- Category: Data display
- Purpose: Present a labelled metric, optional trend, and real contextual actions.

### Props / API

- createKpiCard({label, value, trend, trendTone, menuItems, content, headingLevel=3}) returns a Card. Set headingLevel (1–6) to follow the containing section. menuItems use the shared Popover item API.

### Accessibility summary

- Metric is named by its heading; trend contains text rather than colour alone; menu trigger names the metric.

## Badge

- Name: `badge`
- Category: Data display
- Purpose: Display a compact named status with semantic fill and contrast-safe text.

### Props / API

- createBadge({label, tone, dot, pill, size}) uses the canonical Tag implementation.

### Accessibility summary

- Label states the status; the optional dot is decorative.

## Filter chip

- Name: `filter-chip`
- Category: Data display
- Purpose: Represent and remove an active filter with an explicit named action.

### Props / API

- createFilterChip({label, onRemove, disabled}) returns a Tag with a removal button. It removes its DOM node and notifies the owner.

### Accessibility summary

- The removal button names the filter; the label remains available without colour.

## Avatar

- Name: `avatar`
- Category: Data display
- Purpose: Identify a person or organisation with an image and accessible initials fallback.

### Props / API

- createAvatar({name, src, size, shape}) returns a named image-role element. src is optional.

### Accessibility summary

- The root exposes the name; image alt is empty to avoid duplicate announcements. An absent name becomes Unknown person.

## Avatar stack

- Name: `avatar-stack`
- Category: Data display
- Purpose: Summarise a named member collection with visible avatars and explicit overflow.

### Props / API

- createAvatarStack({users:[{name,src}], max, size, label}) returns a named list. max defaults to 4.

### Accessibility summary

- Every visible member is named; the overflow label names remaining members; empty collections state No members.

## Progress bar

- Name: `progress-bar`
- Category: Data display
- Purpose: Expose a determinate progress or capacity value with optional visible percentage.

### Props / API

- createProgressBar({value, max=100, label, tone, showValue}) returns a progressbar wrapper; values clamp to 0…max.

### Accessibility summary

- A named progressbar exposes minimum, maximum, current value, and percentage text.

## Alert

- Name: `alert`
- Category: Feedback
- Purpose: Keep meaningful inline feedback visible until it is resolved or explicitly dismissed.

### Props / API

- createAlert({title, message, tone, onDismiss}) returns an alert/status element. A dismiss action is shown only when onDismiss is supplied.

### Accessibility summary

- Danger uses role=alert; other tones use role=status; text and an icon accompany semantic colour.

## Drawer

- Name: `drawer`
- Category: Feedback
- Purpose: Open focused record details beside the current workspace using the shared modal lifecycle.

### Props / API

- openDrawer({title, content, actions, onClose, dismissible}) returns element and close(reason).

### Accessibility summary

- Inherits dialog labelling, modal semantics and scroll locking from openModal; navigation closes the panel.

## Detail panel

- Name: `detail-panel`
- Category: Feedback
- Purpose: Show record details inline without blocking the surrounding workspace.

### Props / API

- createDetailPanel({title, content, onClose}) from drawer.js returns a named section. onClose is optional.

### Accessibility summary

- The title labels the section; the owner manages focus when closing the panel.

## Description list

- Name: `description-list`
- Category: Data display
- Purpose: Present readable semantic term/value pairs for record details.

### Props / API

- createDescriptionList({items:[{term,value}], columns=1}) returns a dl. Values may be text or DOM; null values display Not provided.

### Accessibility summary

- dt and dd preserve explicit term/value relationships in semantic groups.

## Pagination

- Name: `pagination`
- Category: Navigation
- Purpose: Navigate bounded pages and adjust rows per page using the same controller as Table.

### Props / API

- createPagination({total, page, pageSize, onPageChange, onPageSizeChange, pageSizes, disabled}) returns element, setState(next), state.
- Changing page size resets to page 1; total/page inputs clamp to valid bounds.

### Accessibility summary

- Named navigation; active number has aria-current=page; result range is announced; unavailable directions are disabled.
