import { element, uniqueId, button, playground, toggleControl, openModal, onDetach } from './playground.js';

export function createFileUpload({label = 'Choose files', accept = '.csv,.pdf,image/*', maxSize = 5 * 1024 * 1024, multiple = true, disabled = false, dropZone = false, onChange = () => {}} = {}) {
  let entries = [];
  let dialog;
  const input = element('input', {id: uniqueId('files'), className: 'ds-upload-input', type:'file', accept, multiple, disabled});
  const help = element('p', {id: uniqueId('upload-help'), className:'ds-upload-help'}, `Client-side only. Accepted: ${accept || 'all types'}. Maximum ${Math.round(maxSize / 1024)} KB per file. Progress is mock; nothing is uploaded.`);
  input.multiple = multiple;
  input.setAttribute('aria-describedby', help.id);
  const errors = element('p', {className:'component-error', role:'alert'});
  const list = element('ul', {className:'ds-upload-list', 'aria-label':'Selected files'});
  const status = element('p', {role:'status', 'aria-live':'polite'}, 'No files selected.');
  const zone = element('div', {className: dropZone ? 'ds-drag-drop-zone' : 'ds-file-upload-chooser'}, dropZone ? element('p', {}, 'Drop files here or use the keyboard-accessible file chooser below.') : null, element('label', {for:input.id}, label), input);
  const root = element('div', {className:'ds-file-upload'}, zone, help, errors, list, status);
  const advance = button('Advance mock progress', () => {
    entries.forEach(entry => { entry.progress = Math.min(100, entry.progress + 25); });
    refresh();
  });
  root.append(advance);
  function validType(file) {
    return !accept || accept.split(',').some(raw => {
      const type = raw.trim().toLowerCase();
      return type.startsWith('.') ? file.name.toLowerCase().endsWith(type) : type.endsWith('/*') ? file.type.toLowerCase().startsWith(type.slice(0,-1)) : file.type.toLowerCase() === type;
    });
  }
  function addFiles(files) {
    if (disabled) return;
    const rejected = [];
    const accepted = [];
    for (const file of files) {
      if (!validType(file)) rejected.push(`${file.name}: unsupported file type.`);
      else if (file.size > maxSize) rejected.push(`${file.name}: exceeds ${Math.round(maxSize / 1024)} KB.`);
      else accepted.push(file);
    }
    if (!multiple && (entries.length || accepted.length > 1)) {
      rejected.push('Only one file is allowed. Remove the current file before replacing it.');
      if (entries.length) accepted.length = 0; else accepted.splice(1);
    }
    for (const file of accepted) entries.push({id:uniqueId('upload-file'),file,progress:0});
    errors.textContent = rejected.join(' ');
    input.value = '';
    refresh(); onChange(entries.map(entry => entry.file));
  }
  function remove(entry) {
    dialog?.close('replace');
    dialog = openModal({title:'Remove selected file?',content:element('p',{},`Remove ${entry.file.name} from this local selection?`),actions:[{label:'Cancel',onClick:close=>close('cancel')},{label:'Remove file',variant:'danger',onClick:close=>{
      entries = entries.filter(item=>item.id !== entry.id); refresh(); onChange(entries.map(item=>item.file)); close('removed'); input.focus();
    }}],onClose:()=>{dialog=undefined;}});
  }
  function refresh() {
    list.replaceChildren(...entries.map(entry => {
      const progress = element('progress', {max:100,value:entry.progress,'aria-label':`${entry.file.name}: mock progress`});
      return element('li', {className:'ds-upload-file'}, element('span',{className:'ds-upload-name'},`${entry.file.name} · ${Math.ceil(entry.file.size / 1024)} KB`), element('span',{className:'ds-upload-progress'},progress,`${entry.progress}% mock`),button('Remove',()=>remove(entry),'ghost',{'aria-label':`Remove ${entry.file.name}`,disabled}));
    }));
    status.textContent = entries.length ? `${entries.length} local file${entries.length === 1 ? '' : 's'} selected. ${entries.filter(entry=>entry.progress===100).length} mock complete; no network upload.` : 'No files selected.';
    advance.disabled = disabled || !entries.length || entries.every(entry=>entry.progress===100);
  }
  input.addEventListener('change',()=>addFiles([...input.files]));
  if (dropZone) {
    zone.addEventListener('dragover',event=>{event.preventDefault(); if (!disabled) zone.classList.add('is-dragging');});
    zone.addEventListener('dragleave',()=>zone.classList.remove('is-dragging'));
    zone.addEventListener('drop',event=>{event.preventDefault();zone.classList.remove('is-dragging');addFiles([...event.dataTransfer.files]);});
  }
  onDetach(root,()=>dialog?.close('navigation'));
  refresh();
  return {element:root,input,addFiles,get files(){return entries.map(entry=>entry.file);},setDisabled(next){disabled=Boolean(next);input.disabled=disabled;root.classList.toggle('is-disabled',disabled);refresh();},destroy(){dialog?.close('destroy');}};
}
export const guide = {
  purpose:'Select and validate local files with a removable list and explicitly simulated progress; no server upload.',
  props:['createFileUpload({label,accept,maxSize=5242880,multiple=true,disabled,dropZone=false,onChange}) returns element,input,files,addFiles,setDisabled,destroy. accept supports extensions, MIME types and MIME wildcards; maxSize is bytes per file.'],
  variants:['Native file chooser or shared drag/drop presentation.'],states:['Empty, selected, rejected type/size, mock progress, mock complete, disabled, removal confirmation.'],
  keyboard:['Native file chooser supports keyboard activation; Tab reaches mock progress and removal actions; removal uses shared focus-trapped Modal.'],
  accessibility:['Visible chooser label, linked type/size instructions, alert validation, named per-file progress and removal buttons, polite selection status.'],
  tokens:['--space-2, --space-4, --border, --surface, --muted'],responsive:['File names wrap; native chooser and actions have 44px targets and 16px phone text.'],
  do:['Treat client-side validation as UX, not a security boundary; clearly label mock progress.'],dont:['Do not imply that selected files are persisted or uploaded.'],
  example:'createFileUpload({label:"Mock attachments", accept:".pdf,image/*", maxSize:5242880})'
};
export function render(container) {
  const page=playground(container,{title:'FileUpload',description:'Local attachments only. Progress is mock and advances by 25% per activation.'});
  const upload=createFileUpload({label:'Mock attachments'});
  page.preview.append(upload.element);
  page.controls.append(toggleControl('Disabled',false,value=>upload.setDisabled(value)));
  page.states.append(element('p',{},'Choose a file to see validation, mock progress and confirmed removal.'));
  page.setSnippet(guide.example);
}
