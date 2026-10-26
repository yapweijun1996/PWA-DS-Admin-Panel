import { element, button, playground, statusMessage, openModal, uniqueId } from './playground.js';
import { createFormField } from './form-field.js';
import { createRadioGroup } from './radio-group.js';
import { exportCSV } from '../js/logic/csv.js';

/** Pure serialization, also used for the preview so the downloaded content cannot drift. */
export function serializeData(rows, { format = 'csv', columns, filename = 'mock-export' } = {}) {
  if (!Array.isArray(rows)) throw new TypeError('Export rows must be an array.');
  if (!['csv', 'json'].includes(format)) throw new TypeError('Export format must be csv or json.');
  const selected = columns?.map(column => typeof column === 'string' ? { key: column, label: column } : column);
  const content = format === 'csv' ? exportCSV(rows, { columns: selected }) : JSON.stringify(selected ? rows.map(row => Object.fromEntries(selected.map(column => [column.key, row?.[column.key] ?? null]))) : rows, null, 2);
  const base = String(filename).trim().replace(/\.(csv|json)$/i, '').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').replace(/^\.+/, '') || 'mock-export';
  return { content, format, filename: `${base}.${format}`, mime: format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json;charset=utf-8' };
}

/** Request a browser-local download. A returned result is not proof that the user saved it. */
export function downloadData(rows, options = {}) {
  const result = serializeData(rows, options);
  const blob = new Blob([result.content], { type: result.mime });
  const url = URL.createObjectURL(blob);
  const link = element('a', { href: url, download: result.filename, hidden: true });
  document.body.append(link);
  try { link.click(); }
  finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
  return { ...result, blob };
}

export function openExportDialog({ rows = [], columns, filename = 'mock-export', format = 'csv', title = 'Export local data', onExport = () => {}, onClose } = {}) {
  // Validate the requested format and data before opening an interactive surface.
  serializeData(rows, { columns, filename, format });
  let selectedFormat = format;
  let dialog;
  const status = statusMessage(`${rows.length} rows available. Generated locally; no server request is made.`);
  const error = element('p', { id: uniqueId('export-error'), className: 'component-error', role: 'alert' });
  const name = element('input', { type: 'text', className: 'ds-input', value: filename, required: true, 'aria-describedby': error.id, oninput() { nameField.setError(''); refresh(); } });
  const nameField = createFormField({ label: 'File name', control: name, hint: 'The selected format supplies the extension. Path characters are replaced with underscores.', required: true });
  const preview = element('pre', { className: 'ds-export-preview', tabindex: '0', 'aria-label': 'Exact generated export preview' });
  const fileInfo = element('p', { className: 'ds-export-info' });
  const formatChoice = createRadioGroup({ label: 'Download format', value: selectedFormat, options: [{ value: 'csv', label: 'CSV spreadsheet' }, { value: 'json', label: 'JSON records' }], onChange(next) { selectedFormat = next; refresh(); } });
  const content = element('form', { className: 'ds-export-dialog', onsubmit(event) { event.preventDefault(); download(); } }, element('p', {}, 'Client-side export. CSV includes headers, quoted cells and spreadsheet-formula protection. JSON preserves values as structured records.'), formatChoice.element, nameField.element, fileInfo, preview, error, status);
  dialog = openModal({ title, content, size: 'large', actions: [{ label: 'Cancel', onClick: close => close('cancel') }, { label: 'Download CSV', variant: 'primary', onClick: download }], onClose });
  function refresh() {
    try {
      const result = serializeData(rows, { columns, filename: name.value, format: selectedFormat });
      preview.textContent = result.content || '(No rows or columns to export.)';
      fileInfo.textContent = `${result.filename} · ${rows.length} rows · ${new Blob([result.content]).size} bytes`;
      error.textContent = '';
      const action = dialog?.element.querySelector('.ds-modal-footer .ds-button-primary');
      if (action) { action.textContent = `Download ${selectedFormat.toUpperCase()}`; action.disabled = rows.length === 0; }
      if (!rows.length) status.textContent = 'No rows to export. Close this dialog and choose a dataset first.';
    } catch (failure) {
      error.textContent = failure instanceof Error ? failure.message : 'Data could not be exported.';
      const action = dialog?.element.querySelector('.ds-modal-footer .ds-button-primary');
      if (action) action.disabled = true;
    }
  }
  function download() {
    if (!rows.length) return;
    if (!name.value.trim()) { nameField.setError('Enter a file name.'); name.focus(); return; }
    try {
      const result = downloadData(rows, { columns, filename: name.value, format: selectedFormat });
      status.textContent = `Download requested: ${result.filename}. Your browser controls where it is saved.`;
      error.textContent = '';
      onExport(result);
    } catch (failure) { error.textContent = failure instanceof Error ? failure.message : 'The browser could not start the download.'; }
  }
  refresh();
  return dialog;
}

export const guide = {
  purpose: 'Preview and explicitly download CSV or JSON generated entirely in the browser from the supplied local rows.',
  props: ['openExportDialog({rows,columns:[{key,label}],filename="mock-export",format="csv",title,onExport(result),onClose}) returns the shared Modal controller. downloadData(rows,{format,columns,filename}) returns {content,format,filename,mime,blob} after requesting download. serializeData(rows,options) is the pure exporter and returns the same metadata without blob. columns may also be string keys; JSON includes only selected columns when provided.'],
  variants: ['CSV spreadsheet or JSON records; all columns or caller-selected columns.'],
  states: ['Preview, CSV/JSON format change, empty dataset, required file-name error, download requested, browser/export error.'],
  keyboard: ['Tab reaches format radios, filename, preview and actions; arrows select formats; Enter submits the filename form; Escape closes and returns focus to the opener.'],
  accessibility: ['Shared Modal traps focus and supplies accessible title; persistent FormField label and errors, native format radios and polite download status.'],
  tokens: ['--space-3, --space-4, --color-border-subtle, --surface, --bg, --muted'],
  responsive: ['Preview scrolls within the dialog without page overflow; phone inputs use 16px text and 44px targets.'],
  do: ['Supply exactly the visible or selected dataset that the export action promises; label mock datasets in the invoking UI.'],
  dont: ['Do not claim a file has been saved merely because the browser download was requested.'],
  example: 'openExportDialog({rows: mockRows, columns:[{key:"name",label:"Name"}], filename:"mock-customers"});\nconst preview = serializeData(mockRows, {format:"json"});\ndownloadData(mockRows, {format:"csv",filename:"mock-customers"});'
};

export function render(container) {
  const page = playground(container, { title: 'ExportDialog', description: 'Real client-side CSV and JSON downloads of clearly labelled mock customer records.' });
  const rows = [{ name: 'Catalog', email: 'hello@catalog.example', status: 'Active' }, { name: 'Layers, Inc.', email: 'team@layers.example', status: 'Paused' }];
  const columns = [{ key: 'name', label: 'Customer name' }, { key: 'email', label: 'Email' }, { key: 'status', label: 'Status' }];
  const feedback = statusMessage('Two mock customer rows are available for export.');
  page.preview.append(element('div', { className: 'ds-export-demo' }, element('p', {}, 'Mock customers: Catalog (Active), Layers, Inc. (Paused).'), button('Export mock customers', () => openExportDialog({ rows, columns, filename: 'mock-customers', title: 'Export mock customers', onExport(result) { feedback.textContent = `Browser download requested: ${result.filename} (${result.blob.size} bytes).`; } }), 'primary'), feedback));
  page.controls.append(button('Open empty dataset state', () => openExportDialog({ rows: [], columns, title: 'Export empty mock dataset' })));
  page.states.append(element('p', {}, 'Change the format or file name in the dialog: the exact preview and extension update together. CSV quoting preserves the comma in “Layers, Inc.”.'));
  page.setSnippet(guide.example);
}
