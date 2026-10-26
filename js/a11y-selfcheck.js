// A focused DOM smoke check, not a replacement for a browser accessibility audit.
const interactiveRoles = new Set(['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'treeitem', 'textbox', 'searchbox', 'combobox', 'listbox', 'slider', 'spinbutton', 'scrollbar']);
const contentNameRoles = new Set(['button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'option', 'treeitem']);
const formRoles = new Set(['textbox', 'searchbox', 'combobox', 'listbox', 'slider', 'spinbutton']);
const normalize = value => String(value ?? '').normalize('NFC').replace(/\s+/gu, ' ').trim();
const tokens = value => normalize(value).split(' ').filter(Boolean);
const roleOf = element => tokens(element.getAttribute('role'))[0] || '';
const tagOf = element => element?.localName?.toLowerCase() || '';

/** Whether the accessible name contains the complete visible label, in order. */
export function labelInName(visible, name) {
  const comparable = value => normalize(String(value ?? '').replace(/[\p{P}\p{S}]/gu, '')).toLowerCase();
  const label = comparable(visible);
  const accessible = comparable(name);
  if (!label) return true;
  // Do not mistake a date/year suffix ("2026 2") for the day/count "26 2".
  for (let index = accessible.indexOf(label); index !== -1; index = accessible.indexOf(label, index + 1)) {
    if (/^\p{N}/u.test(label) && /\p{N}/u.test(accessible[index - 1] || '')) continue;
    if (/\p{N}$/u.test(label) && /\p{N}/u.test(accessible[index + label.length] || '')) continue;
    return true;
  }
  return false;
}

/** Report forward heading jumps; a first heading or a move up is not a skip. */
export function headingOrder(levels) {
  const skips = [];
  let previous = null;
  Array.from(levels).forEach((value, index) => {
    const level = Number(value);
    if (!Number.isInteger(level) || level < 1) return;
    if (previous !== null && level > previous + 1) skips.push({ index, previous, level });
    previous = level;
  });
  return skips;
}

function styleOf(element) {
  return element.ownerDocument?.defaultView?.getComputedStyle(element);
}

function isHidden(element, { visual = false, aria = true } = {}) {
  for (let current = element; current?.nodeType === 1; current = current.parentElement) {
    if (current.hasAttribute('hidden') || current.hasAttribute('inert') || (aria && current.getAttribute('aria-hidden')?.toLowerCase() === 'true')) return true;
    if (tagOf(current) === 'input' && current.type === 'hidden') return true;
    const style = styleOf(current);
    if (style?.display === 'none' || style?.contentVisibility === 'hidden') return true;
    // Visibility is inherited, but a descendant can explicitly restore it.
    if (current === element && (style?.visibility === 'hidden' || style?.visibility === 'collapse')) return true;
    if (visual && style) {
      const clipped = (style.clip && style.clip !== 'auto' && /^rect\(0(?:px)?[, ]+0(?:px)?[, ]+0(?:px)?[, ]+0(?:px)?\)$/u.test(style.clip)) || /inset\(50%\)/u.test(style.clipPath || '');
      if (clipped || Number(style.opacity) === 0) return true;
    }
    const details = current.parentElement;
    if (tagOf(details) === 'details' && !details.open) {
      const summary = Array.from(details.children).find(child => tagOf(child) === 'summary');
      if (current !== summary) return true;
    }
  }
  return false;
}

function referenced(element, attribute) {
  const scope = element.getRootNode();
  return tokens(element.getAttribute(attribute)).map(id => scope.getElementById?.(id)).filter(Boolean);
}

function textOf(element, { visible = false, includeHidden = false, exclude = null, seen = new Set() } = {}) {
  if (element === exclude || seen.has(element)) return '';
  const tag = tagOf(element);
  if (['script', 'style', 'template', 'noscript'].includes(tag)) return '';
  if (!includeHidden && isHidden(element, { visual: visible, aria: !visible })) return '';
  if (visible && ['svg', 'img'].includes(tag)) return '';
  // Embedded controls contribute their value to a surrounding label, never to
  // their own accessible name (a text field's value is not its label).
  if (['input', 'textarea', 'select'].includes(tag)) {
    if (tag === 'select') return Array.from(element.selectedOptions || []).map(option => option.textContent).join(' ');
    return element.value || '';
  }
  if (!visible) {
    if (tag === 'img' || tag === 'area') return element.getAttribute('alt') || '';
    const label = normalize(element.getAttribute('aria-label'));
    if (label) return label;
  }
  const parts = [];
  for (const node of element.childNodes) {
    if (node.nodeType === 3) parts.push(node.textContent);
    else if (node.nodeType === 1 && node !== exclude) {
      if (!visible && (includeHidden || !isHidden(node)) && referenced(node, 'aria-labelledby').length) parts.push(accessibleName(node, seen, { includeHidden }));
      else parts.push(textOf(node, { visible, includeHidden, exclude, seen }));
    }
  }
  return normalize(parts.join(' '));
}

function accessibleName(element, seen = new Set(), { referencedNode = false, includeHidden = false } = {}) {
  if (seen.has(element)) return '';
  const nextSeen = new Set(seen).add(element);
  const labels = referenced(element, 'aria-labelledby');
  // A valid but empty reference must not silently fall back to an aria-label.
  // A referenced node does not follow another aria-labelledby chain.
  if (!referencedNode && labels.length) {
    return normalize(labels.map(label => {
      const hidden = isHidden(label);
      if (label === element) return ownName(element, nextSeen, { includeHidden: hidden });
      return accessibleName(label, nextSeen, { referencedNode: true, includeHidden: hidden });
    }).join(' '));
  }
  return ownName(element, nextSeen, { referencedNode, includeHidden });
}

function ownName(element, seen, { referencedNode = false, includeHidden = false } = {}) {
  const ariaLabel = normalize(element.getAttribute('aria-label'));
  if (ariaLabel) return ariaLabel;
  const labels = Array.from(element.labels || []);
  if (labels.length) return normalize(labels.map(label => textOf(label, { exclude: element, includeHidden: isHidden(label), seen })).join(' '));
  const tag = tagOf(element);
  const type = element.type;
  if (tag === 'img' || tag === 'area' || (tag === 'input' && type === 'image')) {
    if (element.hasAttribute('alt')) return normalize(element.getAttribute('alt'));
  }
  if (tag === 'input' && ['button', 'submit', 'reset'].includes(type)) {
    // Native defaults apply only when value is absent, not explicitly empty.
    if (element.hasAttribute('value')) return normalize(element.value);
    return type === 'submit' ? 'Submit' : type === 'reset' ? 'Reset' : normalize(element.value);
  }
  if (tag === 'svg') {
    const title = Array.from(element.children).find(child => tagOf(child) === 'title');
    if (title) return normalize(title.textContent);
  }
  if (referencedNode || ['button', 'a', 'summary', 'label', 'option'].includes(tag) || contentNameRoles.has(roleOf(element))) {
    const content = textOf(element, { includeHidden, seen: new Set([...seen].filter(node => node !== element)) });
    if (content) return content;
  }
  return normalize(element.getAttribute('title'));
}

function isInteractive(element) {
  const tag = tagOf(element);
  if (interactiveRoles.has(roleOf(element)) || element.isContentEditable) return true;
  return ['button', 'select', 'textarea', 'summary'].includes(tag) || (tag === 'input' && element.type !== 'hidden') || (['a', 'area'].includes(tag) && element.hasAttribute('href'));
}

function isFormControl(element) {
  const tag = tagOf(element);
  return ['select', 'textarea'].includes(tag) || (tag === 'input' && !['hidden', 'button', 'submit', 'reset', 'image'].includes(element.type)) || formRoles.has(roleOf(element));
}

function visibleLabel(element) {
  const tag = tagOf(element);
  // A button trigger's displayed value is its visible label, even when an
  // external native label supplies its accessible name (e.g. a select trigger).
  if (tag === 'button') {
    const content = textOf(element, { visible: true });
    if (content) return content;
  }
  const labels = Array.from(element.labels || []);
  if (labels.length) return normalize(labels.map(label => textOf(label, { visible: true, exclude: element })).join(' '));
  if (tag === 'input') {
    return ['button', 'submit', 'reset'].includes(element.type) ? normalize(element.value || (!element.hasAttribute('value') && (element.type === 'submit' ? 'Submit' : element.type === 'reset' ? 'Reset' : ''))) : '';
  }
  if (isFormControl(element)) return '';
  const content = textOf(element, { visible: true });
  if (content) return content;
  // ARIA labels may point at a separate, visibly rendered label (e.g. switch).
  return normalize(referenced(element, 'aria-labelledby').map(label => textOf(label, { visible: true })).join(' '));
}

/**
 * Return { rule, message, element } violations without altering the DOM.
 * The root itself is included. IDREFs resolve in their document/shadow root;
 * duplicate IDs are checked even when hidden, since they still break IDREFs.
 */
export function checkAccessibility(root = document) {
  const elements = [...(root.nodeType === 1 ? [root] : []), ...root.querySelectorAll('*')];
  const violations = [];
  const report = (rule, message, element) => violations.push({ rule, message, element });
  const ids = new Map();
  const headings = [];
  const levels = [];
  for (const element of elements) {
    const id = element.getAttribute('id');
    if (id) {
      if (ids.has(id)) report('duplicate-id', `Duplicate id "${id}".`, element);
      else ids.set(id, element);
    }
    if (isHidden(element)) continue;
    const tag = tagOf(element);
    const role = roleOf(element);
    const interactive = isInteractive(element);
    const form = isFormControl(element);
    const image = role === 'img' || (tag === 'img' && !['none', 'presentation'].includes(role));
    const name = interactive || form || image ? accessibleName(element) : '';
    if (interactive && !name) report('unnamed-interactive', 'Interactive element has no accessible name.', element);
    if (form && !name) report('missing-form-label', 'Form control has no associated accessible label.', element);
    // An empty native alt is decorative; an explicit role=img is not.
    if (image && !name && !(tag === 'img' && role !== 'img' && element.getAttribute('alt') === '')) report('unnamed-image', 'Image has no accessible name or decorative empty alt.', element);
    if (interactive) {
      const visible = visibleLabel(element);
      if (visible && !labelInName(visible, name)) report('label-in-name', `Accessible name "${name}" does not contain visible label "${visible}".`, element);
    }
    const nativeHeading = /^h[1-6]$/u.test(tag);
    if (nativeHeading || role === 'heading') {
      const level = role === 'heading' && element.hasAttribute('aria-level') ? Number(element.getAttribute('aria-level')) : nativeHeading ? Number(tag[1]) : 2;
      if (Number.isInteger(level) && level > 0) {
        headings.push(element);
        levels.push(level);
      }
    }
    const scope = element.getRootNode();
    for (const controlled of tokens(element.getAttribute('aria-controls'))) {
      if (!scope.getElementById?.(controlled)) report('dangling-aria-controls', `aria-controls references missing id "${controlled}".`, element);
    }
  }
  for (const skip of headingOrder(levels)) report('heading-skip', `Heading level jumps from ${skip.previous} to ${skip.level}.`, headings[skip.index]);
  return violations;
}

if (typeof window !== 'undefined') window.__a11yCheck = checkAccessibility;
