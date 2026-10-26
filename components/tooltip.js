import { element, text, playground, textControl, choiceControl, statePreview, statusMessage, button, uniqueId, escapeHTML, onDetach } from './playground.js';

export function createTooltip({ label, content, placement = 'top', trigger: suppliedTrigger, onToggle = () => {} }) {
  const id = uniqueId('tooltip');
  let pointerWasOpen = false;
  const trigger = suppliedTrigger || button(label, event => setOpen(event.detail > 0 ? !pointerWasOpen : tooltip.hidden), 'secondary');
  trigger.setAttribute('aria-describedby', [trigger.getAttribute('aria-describedby'), id].filter(Boolean).join(' '));
  const tooltip = element('span', { id, className: 'ds-tooltip', role: 'tooltip', hidden: true }, content);
  const root = element('span', { className: 'ds-tooltip-wrap' }, trigger, tooltip);
  let listening = false;
  function position() {
    if (tooltip.hidden) return;
    const rect = trigger.getBoundingClientRect();
    const bubble = tooltip.getBoundingClientRect();
    const gap = 10;
    let x = rect.left + (rect.width - bubble.width) / 2;
    let y = placement === 'bottom' ? rect.bottom + gap : rect.top - bubble.height - gap;
    if (placement === 'left') { x = rect.left - bubble.width - gap; y = rect.top + (rect.height - bubble.height) / 2; }
    if (placement === 'right') { x = rect.right + gap; y = rect.top + (rect.height - bubble.height) / 2; }
    tooltip.style.left = `${Math.max(8, Math.min(x, window.innerWidth - bubble.width - 8))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(y, window.innerHeight - bubble.height - 8))}px`;
  }
  function setOpen(open) {
    tooltip.hidden = !open;
    if (!suppliedTrigger) trigger.setAttribute('aria-expanded', String(open));
    if (open) {
      position();
      if (!listening) { window.addEventListener('resize', position); window.addEventListener('scroll', position, true); listening = true; }
    } else if (listening) {
      window.removeEventListener('resize', position); window.removeEventListener('scroll', position, true); listening = false;
    }
    onToggle(open);
  }
  root.addEventListener('mouseenter', () => setOpen(true));
  trigger.addEventListener('pointerdown', () => { pointerWasOpen = !tooltip.hidden; });
  root.addEventListener('mouseleave', () => { if (!root.contains(document.activeElement)) setOpen(false); });
  root.addEventListener('focusin', () => setOpen(true));
  root.addEventListener('focusout', event => { if (!root.contains(event.relatedTarget)) setOpen(false); });
  root.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); } });
  onDetach(root, () => setOpen(false));
  return { element: root, trigger, close: () => setOpen(false) };
}

export function render(container) {
  const page = playground(container, { title: text('Tooltip', '工具提示'), description: text('Instant supporting text on hover or focus. Tap to toggle on touch screens; Escape dismisses without moving focus. Position stays inside the viewport.', '悬停或聚焦时立即显示辅助文字。触屏点击可切换；Escape 关闭且保留焦点。提示位置始终保持在视口内。') });
  const props = { label: text('Workspace visibility', '工作区可见性'), content: text('Only invited members can access this mock workspace.', '只有受邀成员可以访问此模拟工作区。'), placement: 'top' };
  const preview = element('div', { className: 'ds-tooltip-demo' });
  const feedback = statusMessage(text('Hover, focus, or tap the trigger.', '悬停、聚焦或点击触发按钮。'));
  page.preview.append(element('div', { className: 'component-demo-stack' }, preview, feedback));
  let current;
  function update() {
    current?.close();
    current = createTooltip({ ...props, onToggle: open => { feedback.textContent = open ? text('Tooltip shown. Escape closes it.', '工具提示已显示。按 Escape 关闭。') : text('Tooltip hidden.', '工具提示已隐藏。'); } });
    preview.replaceChildren(current.element);
    page.setSnippet(`<span class="ds-tooltip-wrap">\n  <button type="button" class="ds-button ds-button-secondary" aria-describedby="visibility-tooltip">${escapeHTML(props.label)}</button>\n  <span id="visibility-tooltip" class="ds-tooltip" role="tooltip" hidden>${escapeHTML(props.content)}</span>\n</span>\n<!-- Show on hover / focus / tap; hide on Escape. Preferred placement: ${props.placement}. -->`);
  }
  page.controls.append(textControl(text('Trigger label', '触发文字'), props.label, value => { props.label = value; update(); }), textControl(text('Tooltip text', '提示文字'), props.content, value => { props.content = value; update(); }), choiceControl(text('Placement', '位置'), props.placement, [{ value: 'top', label: text('Top', '上方') }, { value: 'bottom', label: text('Bottom', '下方') }, { value: 'left', label: text('Left', '左侧') }, { value: 'right', label: text('Right', '右侧') }], value => { props.placement = value; update(); }));
  for (const [label, extra] of [[text('Default · hover to show', '默认 · 悬停显示'), ''], [text('Hover', '悬停'), 'is-hover'], [text('Focus', '聚焦'), 'is-focus']]) {
    const example = createTooltip({ label: text('More information', '更多信息'), content: text('Helpful context without interrupting your work.', '补充有用信息，而不打断当前工作。'), placement: 'top' });
    if (extra) example.element.querySelector('button').classList.add(extra);
    page.states.append(statePreview(label, example.element));
  }
  update();
}
