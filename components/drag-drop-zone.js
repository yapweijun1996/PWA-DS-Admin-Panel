import { element, playground, toggleControl } from './playground.js';
import { createFileUpload, guide as uploadGuide } from './file-upload.js';

export function createDragDropZone(options = {}) { return createFileUpload({...options,dropZone:true}); }
export const guide = {
  ...uploadGuide,
  purpose:'Offer drag-and-drop local file selection alongside a fully keyboard-accessible native file chooser.',
  props:['createDragDropZone({label,accept,maxSize,multiple,disabled,onChange}) shares the FileUpload controller: element,input,files,addFiles,setDisabled,destroy.'],
  variants:['Drop zone with native chooser; accepts extensions, MIME types and MIME wildcards.'],
  keyboard:['Tab to the native file chooser and activate it; dragging is never required. Removal uses the shared confirmation Modal.'],
  example:'createDragDropZone({label:"Mock documents",accept:".pdf,.csv",maxSize:5242880})'
};
export function render(container) {
  const page=playground(container,{title:'DragDropZone',description:'Drop local files or choose with the keyboard. No network upload; progress is explicitly mock.'});
  const upload=createDragDropZone({label:'Choose mock documents'});
  page.preview.append(upload.element);
  page.controls.append(toggleControl('Disabled',false,value=>upload.setDisabled(value)));
  page.states.append(element('p',{},'Type and size rejection, file list, confirmed removal and mock progress share the FileUpload implementation.'));
  page.setSnippet(guide.example);
}
