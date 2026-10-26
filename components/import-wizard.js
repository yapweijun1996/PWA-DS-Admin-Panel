import { element, button, customSelect, playground, statusMessage, openModal, uniqueId, onDetach } from './playground.js';
import { createFormField } from './form-field.js';
import { createTextarea } from './textarea.js';
import { createFileUpload } from './file-upload.js';
import { createRadioGroup } from './radio-group.js';
import { createStepper } from './stepper.js';
import { createPagination } from './pagination.js';
import { parseCSV } from '../js/logic/csv.js';

const defaultFields = [{ key: 'name', label: 'Name', required: true }, { key: 'email', label: 'Email', required: true }, { key: 'status', label: 'Status' }];
const sampleCSV = 'Name,Email,Status\nCatalog,hello@catalog.example,Active\nLayers,team@layers.example,Paused\nOrbit,contact@orbit.example,Active';

export function createImportWizard({ fields = defaultFields, initialCSV = '', maxSize = 2 * 1024 * 1024, maxRows = Infinity, validateRows = () => {}, onImport, onComplete = () => {} } = {}) {
  if (!fields.length || fields.some(field => !field.key) || new Set(fields.map(field => field.key)).size !== fields.length) throw new TypeError('Import fields require unique, non-empty keys.');
  if (typeof onImport !== 'function') throw new TypeError('ImportWizard requires an explicit local mock onImport(rows) callback.');
  let step = 0;
  let source = 'paste';
  let fileText = '';
  let reading = false;
  let fileVersion = 0;
  let headers = [];
  let records = [];
  let mapping = {};
  let reviewRows = [];
  let busy = false;
  let imported = false;
  let destroyed = false;
  let reviewPage = 1;
  const root = element('section', { className: 'ds-import-wizard', 'aria-label': 'Local mock CSV import' });
  const error = element('p', { id: uniqueId('import-error'), className: 'component-error', role: 'alert' });
  const status = statusMessage('Local mock import only. No file or record is sent to a server.');
  const stepper = createStepper({ label: 'CSV import progress', steps: [{ id: 'choose', label: 'Choose file or paste CSV' }, { id: 'map', label: 'Map columns' }, { id: 'review', label: 'Review and import' }] });
  const panel = element('div', { className: 'ds-import-panel' });
  const backButton = button('Back', back);
  const nextButton = button('Continue to mapping', () => { void next(); }, 'primary');
  const actions = element('div', { className: 'ds-import-actions' }, backButton, nextButton);
  const paste = createTextarea({ label: 'Paste CSV', value: initialCSV, rows: 6, maxLength: null, hint: 'First row must contain unique column names. Quoted commas and multiline values are supported.', onChange() { clearError(); } });
  const upload = createFileUpload({ label: 'Choose one local CSV file', accept: '.csv,text/csv', multiple: false, maxSize, onChange(files) {
    const version = ++fileVersion;
    fileText = ''; clearError();
    if (!files.length) { reading = false; status.textContent = 'No local file selected.'; updateActions(); return; }
    reading = true; status.textContent = `Reading ${files[0].name} locally…`; updateActions();
    files[0].text().then(value => {
      if (destroyed || version !== fileVersion) return;
      fileText = value; reading = false; status.textContent = `${files[0].name} is ready for local CSV parsing. Nothing was uploaded.`; updateActions();
    }, failure => {
      if (destroyed || version !== fileVersion) return;
      reading = false; showError(failure instanceof Error ? failure.message : 'This file could not be read.'); updateActions();
    });
  } });
  paste.input.setAttribute('aria-describedby', `${paste.input.getAttribute('aria-describedby') || ''} ${error.id}`.trim());
  upload.input.setAttribute('aria-describedby', `${upload.input.getAttribute('aria-describedby') || ''} ${error.id}`.trim());
  const sourceChoice = createRadioGroup({ label: 'CSV source', value: source, options: [{ value: 'paste', label: 'Paste CSV' }, { value: 'file', label: 'Choose file' }], onChange(value) {
    source = value; clearError(); showSource();
    status.textContent = value === 'paste' ? 'Pasted CSV is used. Any selected file is ignored.' : 'Selected CSV file is used. Pasted text is ignored.';
  } });
  const choosePanel = element('div', { className: 'ds-import-source' }, sourceChoice.element, paste.element, upload.element);
  root.append(element('p', { className: 'ds-import-notice' }, 'Mock workflow · client-side CSV parsing · session-only import'), stepper, panel, error, status, actions);

  function showSource() { paste.element.hidden = source !== 'paste'; upload.element.hidden = source !== 'file'; updateActions(); }
  function clearError() {
    error.textContent = '';
    paste.input.setAttribute('aria-invalid', 'false'); upload.input.setAttribute('aria-invalid', 'false');
    panel.querySelectorAll('[aria-invalid="true"]').forEach(control => control.setAttribute('aria-invalid', 'false'));
  }
  function showError(message) { error.textContent = message; }
  function updateActions() {
    backButton.hidden = step === 0;
    backButton.disabled = busy || imported;
    nextButton.disabled = busy || imported || (step === 0 && source === 'file' && reading);
    nextButton.textContent = imported ? 'Mock import complete' : busy ? 'Importing locally…' : step === 0 ? 'Continue to mapping' : step === 1 ? 'Continue to review' : `Import ${reviewRows.length} mock rows locally`;
    root.setAttribute('aria-busy', String(busy || reading));
  }
  function draw(focusHeading = false) {
    stepper.setCurrent(step);
    stepper.setCompleted(imported ? [0, 1, 2] : step === 2 ? [0, 1] : step === 1 ? [0] : []);
    const heading = element('h3', { tabindex: '-1' }, `${step + 1}. ${['Choose a CSV source', 'Map source columns to fields', 'Review local mock rows'][step]}`);
    panel.replaceChildren(heading);
    if (step === 0) { panel.append(choosePanel); showSource(); }
    else if (step === 1) {
      const grid = element('div', { className: 'ds-import-mapping' });
      fields.forEach(field => {
        const choice = customSelect({ label: `CSV column for ${field.label || field.key}`, value: mapping[field.key] ?? '', options: [{ value: '', label: field.required ? 'Choose a source column' : 'Skip this field' }, ...headers.map((header, index) => ({ value: String(index), label: header }))], onChange(value) { mapping[field.key] = value; clearError(); } });
        choice.trigger.setAttribute('aria-describedby', error.id);
        grid.append(createFormField({ label: field.label || field.key, control: choice.element, required: field.required, hint: field.required ? 'Required destination field.' : 'Optional; unmapped fields are omitted.' }).element);
      });
      panel.append(element('p', {}, `${records.length} mock rows parsed. Assign each source column at most once.`), grid);
    } else {
      const activeFields = fields.filter(field => mapping[field.key] !== '');
      const body = element('tbody');
      const table = element('table', { className: 'ds-import-table' }, element('caption', {}, `${reviewRows.length} local mock rows ready for import`), element('thead', {}, element('tr', {}, ...activeFields.map(field => element('th', { scope: 'col' }, field.label || field.key)))), body);
      function drawPage() {
        body.replaceChildren(...reviewRows.slice((reviewPage - 1) * 10, reviewPage * 10).map(row => element('tr', {}, ...activeFields.map(field => element('td', {}, row[field.key])))));
      }
      const pagination = createPagination({ total: reviewRows.length, page: reviewPage, pageSize: 10, onPageChange(page) { reviewPage = page; drawPage(); } });
      panel.append(element('p', {}, 'Check the mapped values before explicitly importing. Import invokes only the local callback; it does not upload or persist anything.'), element('div', { className: 'ds-import-table-scroll', tabindex: '0', role: 'region', 'aria-label': 'Mapped mock row preview' }, table), pagination.element);
      drawPage();
    }
    updateActions();
    if (focusHeading) heading.focus();
  }
  function parseSource() {
    const csv = source === 'paste' ? paste.value : fileText;
    if (source === 'file' && reading) throw new Error('Wait for the selected CSV file to finish reading.');
    if (!csv.trim()) throw new Error(source === 'paste' ? 'Paste CSV with a header row and at least one data row.' : 'Choose a non-empty CSV file before continuing.');
    if (new Blob([csv]).size > maxSize) throw new Error(`CSV exceeds the local limit of ${Math.round(maxSize / 1024)} KB.`);
    const parsed = parseCSV(csv);
    const nextHeaders = (parsed[0] || []).map(header => header.trim());
    if (!nextHeaders.length || nextHeaders.some(header => !header)) throw new Error('Every CSV column must have a non-empty header.');
    if (new Set(nextHeaders.map(header => header.toLocaleLowerCase())).size !== nextHeaders.length) throw new Error('CSV header names must be unique.');
    const nextRecords = parsed.slice(1).filter(row => row.some(value => value.trim()));
    if (!nextRecords.length) throw new Error('CSV must contain at least one non-empty data row.');
    if (nextRecords.length > maxRows) throw new Error(`CSV contains ${nextRecords.length} rows; the maximum is ${maxRows}.`);
    const badRow = nextRecords.findIndex(row => row.length !== nextHeaders.length);
    if (badRow >= 0) throw new Error(`Data row ${badRow + 1} has ${nextRecords[badRow].length} columns; expected ${nextHeaders.length}. Check commas and quoted values.`);
    headers = nextHeaders; records = nextRecords;
    mapping = Object.fromEntries(fields.map(field => {
      const index = headers.findIndex(header => [field.key, field.label].filter(Boolean).some(label => header.toLocaleLowerCase() === label.toLocaleLowerCase()));
      return [field.key, index < 0 ? '' : String(index)];
    }));
  }
  function mapRows() {
    const missing = fields.find(field => field.required && mapping[field.key] === '');
    if (missing) throw new Error(`Choose a source column for ${missing.label || missing.key}.`);
    const mappedFields = fields.filter(field => mapping[field.key] !== '');
    if (!mappedFields.length) throw new Error('Map at least one destination field.');
    const columns = mappedFields.map(field => mapping[field.key]);
    if (new Set(columns).size !== columns.length) throw new Error('Map each source column only once.');
    reviewRows = records.map(row => Object.fromEntries(mappedFields.map(field => [field.key, row[Number(mapping[field.key])]])));
    const emptyRequired = reviewRows.findIndex(row => fields.some(field => field.required && !String(row[field.key] ?? '').trim()));
    if (emptyRequired >= 0) throw new Error(`Data row ${emptyRequired + 1} is missing a required mapped value.`);
    validateMappedRows();
    reviewPage = 1;
  }
  function validateMappedRows() {
    const result = validateRows(reviewRows.map(row => ({ ...row })));
    if (result && typeof result.then === 'function') throw new TypeError('validateRows must be synchronous.');
    if (result === false || (typeof result === 'string' && result.trim())) throw new Error(typeof result === 'string' ? result : 'The mapped rows failed local validation.');
  }
  async function next() {
    if (destroyed || busy || imported) return false;
    clearError();
    try {
      if (step === 0) { parseSource(); step = 1; status.textContent = `${records.length} mock rows parsed locally. Map the columns.`; draw(true); }
      else if (step === 1) { mapRows(); step = 2; status.textContent = 'Mapping is valid. Review all rows before importing.'; draw(true); }
      else {
        validateMappedRows();
        busy = true; updateActions();
        await onImport(reviewRows.map(row => ({ ...row })));
        if (destroyed) return true;
        imported = true; busy = false; draw();
        status.textContent = `${reviewRows.length} mock rows imported through the local callback. No server write was made.`;
        status.tabIndex = -1; status.focus();
        onComplete(reviewRows.map(row => ({ ...row })));
      }
      return true;
    } catch (failure) {
      busy = false; updateActions(); showError(failure instanceof Error ? failure.message : 'The local import failed. Try again.');
      if (step === 0) {
        const input = source === 'paste' ? paste.input : upload.input;
        input.setAttribute('aria-invalid', 'true'); input.focus();
      } else { error.tabIndex = -1; error.focus(); }
      return false;
    }
  }
  function back() { if (destroyed || busy || imported || step === 0) return; step--; clearError(); draw(true); }
  function destroy() { destroyed = true; fileVersion++; upload.destroy(); }
  draw(); onDetach(root, destroy);
  return { element: root, get step() { return step; }, get rows() { return reviewRows.map(row => ({ ...row })); }, next, back, destroy };
}

export function openImportWizard(options = {}) {
  let dialog;
  const wizard = createImportWizard({ ...options, onComplete(rows) { options.onComplete?.(rows); dialog?.close('imported'); } });
  dialog = openModal({ title: options.title || 'Import mock CSV', content: wizard.element, size: 'large', onClose(reason) { wizard.destroy(); options.onClose?.(reason); } });
  return { ...dialog, wizard };
}

export const guide = {
  purpose: 'Import local mock CSV through three validated steps: choose a file or paste text, map columns, and review before an explicit local callback.',
  props: ['createImportWizard({fields:[{key,label,required}],initialCSV,maxSize=2097152,maxRows=Infinity,validateRows(mappedRows),onImport(rows),onComplete(rows)}) returns element,step,rows,next(),back(),destroy(). onImport is required and may return a promise. validateRows is synchronous, runs before review and import, and rejects by throwing, returning false or an error string. Limits apply to both pasted text and files. openImportWizard({...options,title,onClose}) returns the shared Modal controller plus wizard.'],
  variants: ['Inline wizard or focus-trapped dialog; pasted CSV or a single local CSV file.'],
  states: ['Source empty, local file reading, CSV parse error, mapping error, paginated review, callback pending, imported, callback failure.'],
  keyboard: ['Tab reaches source radios, textarea/file chooser, custom mapping selects and Back/Continue/Import actions; dialog Escape closes and returns focus. Step headings receive focus after transitions.'],
  accessibility: ['Shared Stepper marks current/completed steps; persistent field labels, required mapping hints, associated alert errors, captioned review table and polite status.'],
  tokens: ['--space-2, --space-3, --space-4, --color-border-subtle, --surface, --muted'],
  responsive: ['Mapping stacks on phones, table scrolls within its own focusable region, controls retain 44px targets and 16px input text.'],
  do: ['Keep the mock callback session-local and review mapped values before importing; all field values remain strings.'],
  dont: ['Do not imply backend persistence or guess around malformed CSV, duplicate headers, duplicate column mappings or missing required data.'],
  example: 'openImportWizard({fields:[{key:"name",label:"Name",required:true}],onImport: rows => mockRows.push(...rows)});'
};

export function render(container) {
  const page = playground(container, { title: 'ImportWizard', description: 'A complete three-step, client-side mock CSV workflow. The sample can be edited or replaced with a local file.' });
  const imported = [];
  const feedback = statusMessage('No mock rows imported in this playground session.');
  const list = element('ul', { className: 'ds-import-demo-results', 'aria-label': 'Locally imported mock rows' });
  function receive(rows) {
    imported.push(...rows);
    feedback.textContent = `${imported.length} mock rows in local session memory. Nothing was uploaded.`;
    list.replaceChildren(...imported.map(row => element('li', {}, `${row.name} · ${row.email} · ${row.status || 'No status'}`)));
  }
  const wizard = createImportWizard({ initialCSV: sampleCSV, onImport: receive });
  page.preview.append(wizard.element, feedback, list);
  page.controls.append(button('Open a separate mock import dialog', () => openImportWizard({ initialCSV: sampleCSV, onImport: receive })));
  page.states.append(element('p', {}, 'Try invalid quotes or a missing required mapping to see actionable errors. Back preserves the current CSV source.'));
  page.setSnippet(guide.example);
}
