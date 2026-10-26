import { element, text, playground, textControl, choiceControl, toggleControl, statePreview, statusMessage, button } from './playground.js';
import { icon } from '../js/icons.js';

export function createAlert({ title, message, tone = 'info', onDismiss } = {}) {
  const kind = ['success', 'warning', 'danger', 'info'].includes(tone) ? tone : 'info';
  const symbol = element('span', { className: 'ds-alert-icon', 'aria-hidden': 'true' });
  symbol.innerHTML = icon(kind === 'success' ? 'check' : 'info');
  const alert = element('div', { className: `ds-alert ds-alert-${kind}`, role: kind === 'danger' ? 'alert' : 'status' }, symbol, element('div', { className: 'ds-alert-content' }, title ? element('strong', {}, title) : null, message ? element('p', {}, message) : null));
  if (onDismiss) alert.append(button('×', () => { alert.remove(); onDismiss(); }, 'ghost', { className: 'ds-button ds-button-ghost ds-alert-dismiss', 'aria-label': text('Dismiss alert', '关闭提示') }));
  return alert;
}

export function render(container) {
  const page = playground(container, { title: text('Alert', '提示'), description: text('Persistent inline feedback with named semantic tones, an icon, and optional dismissal. Important errors remain in the page rather than only in a toast.', '持久显示的行内提示，包含语义色、图标及可选关闭操作。重要错误保留在页面中，而不仅显示通知。') });
  const props = { title: text('Changes saved', '更改已保存'), message: text('This is a mock confirmation message.', '这是模拟确认消息。'), tone: 'success', dismissible: true };
  const feedback = statusMessage();
  const slot = element('div');
  const restore = button(text('Restore alert', '恢复提示'), () => { update(); restore.hidden = true; });
  function update() {
    const alert = createAlert({ ...props, onDismiss: props.dismissible ? () => { feedback.textContent = text('Alert dismissed.', '提示已关闭。'); restore.hidden = false; restore.focus(); } : undefined });
    slot.replaceChildren(alert); restore.hidden = true; page.setSnippet(alert.outerHTML);
  }
  page.preview.append(element('div', { className: 'component-demo-stack' }, slot, restore, feedback));
  page.controls.append(textControl(text('Title', '标题'), props.title, value => { props.title = value; update(); }), textControl(text('Message', '消息'), props.message, value => { props.message = value; update(); }), choiceControl(text('Tone', '色调'), props.tone, ['success', 'info', 'warning', 'danger'].map(value => ({ value, label: value })), value => { props.tone = value; update(); }), toggleControl(text('Dismissible', '可关闭'), true, value => { props.dismissible = value; update(); }));
  for (const tone of ['success', 'info', 'warning', 'danger']) page.states.append(statePreview(tone, createAlert({ title: tone, message: text('Mock feedback message.', '模拟提示消息。'), tone })));
  update();
}
