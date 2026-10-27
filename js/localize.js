// Runtime localizer: translates rendered text and accessible attributes through the zh message dictionary.
// Source code stays English; only text with a dictionary entry changes. Mark text that must stay as is with translate="no".
import { getLanguage, localizeText } from './i18n.js';

const attributes = ['aria-label', 'placeholder', 'title', 'alt', 'aria-description', 'aria-roledescription', 'aria-valuetext'];
const skipped = 'script,style,pre,code,[contenteditable="true"],[translate="no"]';
const skippedText = `${skipped},textarea`;
const originals = new WeakMap();
let observer;

function localizeTextNode(node) {
  const saved = originals.get(node);
  if (saved && node.nodeValue === saved.local) { if (getLanguage() !== 'zh') { node.nodeValue = saved.source; originals.delete(node); } return; }
  if (getLanguage() !== 'zh' || !node.parentElement || node.parentElement.closest(skippedText)) return;
  const source = node.nodeValue;
  const local = localizeText(source);
  if (local === source) return;
  originals.set(node, { source, local });
  node.nodeValue = local;
}

function localizeAttributes(element) {
  if (element.closest?.(skipped)) return;
  let saved = originals.get(element);
  for (const name of attributes) {
    if (!element.hasAttribute(name)) continue;
    const value = element.getAttribute(name);
    const entry = saved?.[name];
    if (entry && value === entry.local) { if (getLanguage() !== 'zh') { element.setAttribute(name, entry.source); delete saved[name]; } continue; }
    if (getLanguage() !== 'zh') continue;
    const local = localizeText(value);
    if (local === value) continue;
    if (!saved) { saved = {}; originals.set(element, saved); }
    saved[name] = { source: value, local };
    element.setAttribute(name, local);
  }
}

function localizeTree(root) {
  if (root.nodeType === Node.TEXT_NODE) { localizeTextNode(root); return; }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  if (root.nodeType === Node.ELEMENT_NODE) localizeAttributes(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const node = walker.currentNode;
    if (node.nodeType === Node.TEXT_NODE) localizeTextNode(node); else localizeAttributes(node);
  }
}

export function syncLocalization() { localizeTree(document.documentElement); }

export function startLocalizer() {
  if (observer) return;
  observer = new MutationObserver(records => {
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(localizeTree);
      else if (record.type === 'characterData') localizeTextNode(record.target);
      else if (record.type === 'attributes') localizeAttributes(record.target);
    }
  });
  observer.observe(document.documentElement, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes });
  window.addEventListener('app:language', syncLocalization);
  syncLocalization();
}
