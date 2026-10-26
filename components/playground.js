let nextId = 0;
const detachCallbacks = new Map();
let detachObserver;

export function onDetach(node, cleanup) {
  detachCallbacks.set(node, cleanup);
  if (!detachObserver) {
    detachObserver = new MutationObserver(() => {
      for (const [target, dispose] of detachCallbacks) {
        if (!target.isConnected) { detachCallbacks.delete(target); dispose(); }
      }
      if (!detachCallbacks.size) { detachObserver.disconnect(); detachObserver = undefined; }
    });
    detachObserver.observe(document.body, { childList: true, subtree: true });
  }
}

export function text(english, chinese) {
  return typeof document !== 'undefined' && document.documentElement.lang.toLowerCase().startsWith('zh') ? chinese : english;
}

export function element(tag, attributes = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attributes)) {
    if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
    else if (key === 'className') node.className = value;
    else if (key === 'checked' || key === 'disabled' || key === 'hidden') node[key] = Boolean(value);
    else if (value !== undefined && value !== null) node.setAttribute(key, String(value));
  }
  for (const child of children.flat()) {
    if (child !== undefined && child !== null) node.append(child instanceof Node ? child : String(child));
  }
  return node;
}

export function escapeHTML(value) {
  return String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function uniqueId(prefix = 'component') {
  nextId += 1;
  return `${prefix}-${nextId}`;
}

export function playground(container, { title, description }) {
  const preview = element('div', { className: 'component-preview' });
  const controls = element('div', { className: 'component-controls' });
  const states = element('div', { className: 'component-states' });
  const code = element('code');
  const copyStatus = element('span', { className: 'component-status', role: 'status', 'aria-live': 'polite' });
  const copy = element('button', { type: 'button', className: 'ds-button ds-button-secondary', onclick: async () => {
    try {
      await copyText(code.textContent);
      copyStatus.textContent = text('HTML copied.', 'HTML 已复制。');
    } catch {
      copyStatus.textContent = text('Copy unavailable. Select and copy the HTML below.', '无法复制。请选择并复制下方 HTML。');
    }
  } }, text('Copy HTML', '复制 HTML'));
  const section = element('section', { className: 'component-playground' },
    element('header', { className: 'component-heading' }, element('h2', {}, title), element('p', {}, description)),
    element('section', { className: 'component-panel' }, element('h3', {}, text('Live preview', '实时预览')), preview),
    element('section', { className: 'component-panel' }, element('h3', {}, text('Playground props', '属性设置')), controls),
    element('section', { className: 'component-panel' }, element('h3', {}, text('States', '状态')), states),
    element('section', { className: 'component-panel' }, element('div', { className: 'component-code-heading' }, element('h3', {}, text('HTML snippet', 'HTML 代码')), copy), element('pre', { className: 'component-code', tabindex: '0' }, code), copyStatus)
  );
  container.replaceChildren(section);
  return { preview, controls, states, section, setSnippet(value) { code.textContent = value; copyStatus.textContent = ''; } };
}

export function renderGuide(guide) {
  const section = element('section', { className: 'component-panel component-guide' }, element('h3', {}, text('Usage guide', '使用指南')), element('p', {}, guide.purpose));
  const labels = { props: text('Props / API', '属性 / API'), variants: text('Variants', '样式'), tokens: text('Tokens', '设计令牌'), states: text('States', '状态'), keyboard: text('Keyboard', '键盘操作'), accessibility: text('Accessibility', '无障碍'), responsive: text('Responsive rules', '响应式规则'), do: text('Do', '推荐'), dont: text('Avoid', '避免') };
  const grid = element('div', { className: 'component-guide-grid' });
  for (const [key, label] of Object.entries(labels)) {
    const values = Array.isArray(guide[key]) ? guide[key] : [guide[key]];
    grid.append(element('section', {}, element('h4', {}, label), element('ul', {}, ...values.filter(Boolean).map(value => element('li', {}, value)))));
  }
  section.append(grid, element('h4', {}, text('Example', '示例')), element('pre', { className: 'component-code', tabindex: '0' }, element('code', {}, guide.example)));
  return section;
}

export async function copyText(value) {
  if (navigator.clipboard && window.isSecureContext) {
    try { await navigator.clipboard.writeText(value); return; } catch { /* Use the local selection fallback. */ }
  }
  const active = document.activeElement;
  const input = element('textarea', { className: 'component-copy-buffer', 'aria-label': text('Copy buffer', '复制内容') }, value);
  document.body.append(input);
  input.select();
  const copied = document.execCommand('copy');
  input.remove();
  active?.focus();
  if (!copied) throw new Error('Clipboard unavailable');
}

export function field(label, control, hint) {
  const id = control.id || uniqueId('prop');
  control.id = id;
  const wrapper = element('div', { className: 'component-field' }, element('label', { for: id }, label), control);
  if (hint) wrapper.append(element('small', {}, hint));
  return wrapper;
}

export function textControl(label, value, onChange, options = {}) {
  const input = element('input', { type: options.type || 'text', className: 'ds-input', value, ...options, oninput: event => onChange(event.target.value) });
  return field(label, input);
}

export function toggleControl(label, checked, onChange) {
  const input = element('input', { type: 'checkbox', className: 'ds-checkbox', checked, onchange: event => onChange(event.target.checked) });
  return element('label', { className: 'component-toggle' }, input, element('span', {}, label));
}

export function choiceControl(label, value, options, onChange) {
  const choice = customSelect({ label, value, options, onChange });
  return element('div', { className: 'component-field' }, element('span', { className: 'component-field-label', id: `${choice.id}-label` }, label), choice.element);
}

export function customSelect({ label, value, options, onChange = () => {}, disabled = false, error = false }) {
  const id = uniqueId('select');
  let currentValue = value;
  let isDisabled = disabled;
  let activeIndex = Math.max(0, options.findIndex(option => option.value === value));
  const list = element('div', { className: 'ds-select-options', id: `${id}-list`, role: 'listbox', 'aria-label': label, hidden: true });
  const trigger = element('button', { type: 'button', id, className: 'ds-select-trigger', 'aria-label': label, 'aria-haspopup': 'listbox', 'aria-expanded': 'false', 'aria-controls': list.id, 'aria-invalid': String(error), disabled });
  const root = element('div', { className: 'ds-select' }, trigger, list);
  const optionButtons = options.map((option, index) => {
    const button = element('button', { type: 'button', className: 'ds-select-option', role: 'option', tabindex: '-1', 'aria-selected': String(option.value === currentValue), onclick: () => choose(index) }, option.label);
    list.append(button);
    return button;
  });
  function refresh() {
    trigger.textContent = options.find(option => option.value === currentValue)?.label || text('Choose an option', '请选择');
    optionButtons.forEach((button, index) => button.setAttribute('aria-selected', String(options[index].value === currentValue)));
  }
  function close(returnFocus = false) {
    list.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside);
    if (returnFocus) trigger.focus();
  }
  function outside(event) { if (!root.contains(event.target)) close(); }
  function open() {
    if (isDisabled) return;
    list.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    activeIndex = Math.max(0, options.findIndex(option => option.value === currentValue));
    optionButtons[activeIndex]?.focus();
    document.addEventListener('pointerdown', outside);
  }
  function choose(index) {
    currentValue = options[index].value;
    refresh();
    close(true);
    onChange(currentValue);
  }
  trigger.addEventListener('click', () => list.hidden ? open() : close());
  trigger.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); open(); }
  });
  list.addEventListener('keydown', event => {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(true); return; }
    if (event.key === 'Tab') { close(true); return; }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    if (event.key === 'Home') activeIndex = 0;
    else if (event.key === 'End') activeIndex = options.length - 1;
    else activeIndex = (activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    optionButtons[activeIndex]?.focus();
  });
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) close(); });
  onDetach(root, close);
  refresh();
  return { id, element: root, trigger, get value() { return currentValue; }, setValue(next) { currentValue = next; refresh(); }, setDisabled(next) { isDisabled = next; trigger.disabled = next; close(); }, close };
}

export function statePreview(label, content, className = '') {
  return element('div', { className: `component-state ${className}` }, element('span', { className: 'component-state-label' }, label), content);
}

export function statusMessage(value = '') {
  return element('p', { className: 'component-feedback', role: 'status', 'aria-live': 'polite' }, value);
}

export function button(label, onClick, variant = 'secondary', attributes = {}) {
  return element('button', { type: 'button', className: `ds-button ds-button-${variant}`, onclick: onClick, ...attributes }, label);
}

export function loadingIndicator(label = text('Loading', '加载中')) {
  return element('span', { className: 'ds-loading', role: 'status' }, element('span', { className: 'ds-spinner', 'aria-hidden': 'true' }), label);
}

export function openModal({ title, content, actions = [], onClose, dismissible = true, size = 'medium' }) {
  const previousFocus = document.activeElement;
  const headingId = uniqueId('dialog-title');
  const bodyId = uniqueId('dialog-body');
  const heading = element('h2', { id: headingId }, title);
  const body = element('div', { className: 'ds-modal-body', id: bodyId }, content);
  const panel = element('div', { className: `ds-modal ds-modal-${size}`, role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': headingId, 'aria-describedby': bodyId, tabindex: '-1' });
  const backdrop = element('div', { className: 'ds-modal-backdrop' }, panel);
  const header = element('div', { className: 'ds-modal-header' }, heading);
  let closed = false;
  function close(reason = 'close') {
    if (closed) return;
    closed = true;
    backdrop.remove();
    document.body.style.overflow = previousOverflow;
    document.removeEventListener('focusin', containFocus, true);
    document.removeEventListener('keydown', handleKey, true);
    window.removeEventListener('hashchange', closeForNavigation);
    if (previousFocus?.isConnected) previousFocus.focus();
    onClose?.(reason);
  }
  function closeForNavigation() { close('navigation'); }
  if (dismissible) header.append(button(text('Close', '关闭'), () => close('close'), 'ghost', { 'aria-label': text('Close dialog', '关闭对话框') }));
  panel.append(header, body);
  const footer = element('div', { className: 'ds-modal-footer' });
  for (const action of actions) footer.append(button(action.label, () => action.onClick?.(close), action.variant || 'secondary'));
  if (actions.length) panel.append(footer);
  function focusables() {
    return [...panel.querySelectorAll('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"]')].filter(node => !node.hidden && node.getClientRects().length);
  }
  function containFocus(event) { if (!panel.contains(event.target)) (focusables()[0] || panel).focus(); }
  function handleKey(event) {
    if (event.key === 'Escape' && dismissible) { event.preventDefault(); event.stopPropagation(); close('escape'); }
    if (event.key !== 'Tab') return;
    const nodes = focusables();
    if (!nodes.length) { event.preventDefault(); panel.focus(); return; }
    const first = nodes[0];
    const last = nodes.at(-1);
    if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  backdrop.addEventListener('click', event => { if (event.target === backdrop && dismissible) close('backdrop'); });
  const previousOverflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  document.body.append(backdrop);
  document.addEventListener('focusin', containFocus, true);
  document.addEventListener('keydown', handleKey, true);
  window.addEventListener('hashchange', closeForNavigation);
  onDetach(previousFocus, closeForNavigation);
  (focusables()[0] || panel).focus();
  return { close, element: panel };
}

export function showToast({ message, tone = 'neutral', duration = 5000, actionLabel, onAction }) {
  let region = document.querySelector('.ds-toast-region');
  if (!region) {
    region = element('div', { className: 'ds-toast-region', 'aria-label': text('Notifications', '通知') });
    document.body.append(region);
  }
  let timer;
  const toast = element('div', { className: `ds-toast ds-toast-${tone}`, role: tone === 'danger' ? 'alert' : 'status' }, element('span', { className: 'ds-toast-dot', 'aria-hidden': 'true' }), element('span', { className: 'ds-toast-message' }, message));
  function dismiss() { clearTimeout(timer); toast.remove(); if (!region.childElementCount) region.remove(); }
  if (actionLabel) toast.append(button(actionLabel, () => { onAction?.(); dismiss(); }, 'ghost'));
  toast.append(button(text('Dismiss', '关闭'), dismiss, 'ghost', { 'aria-label': text('Dismiss notification', '关闭通知') }));
  const schedule = () => { clearTimeout(timer); if (duration > 0) timer = setTimeout(dismiss, duration); };
  toast.addEventListener('mouseenter', () => clearTimeout(timer));
  toast.addEventListener('mouseleave', schedule);
  toast.addEventListener('focusin', () => clearTimeout(timer));
  toast.addEventListener('focusout', event => { if (!toast.contains(event.relatedTarget)) schedule(); });
  region.append(toast);
  schedule();
  return { dismiss, element: toast };
}
