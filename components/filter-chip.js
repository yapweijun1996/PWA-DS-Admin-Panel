import { element, text, playground, textControl, toggleControl, statePreview, statusMessage, button } from './playground.js';
import { createTag } from './tag.js';

export function createFilterChip({ label, onRemove, disabled = false } = {}) {
  let chip;
  chip = createTag({ label, tone: 'accent', disabled, onRemove: event => {
    const nextFocus = chip.nextElementSibling?.querySelector('button') || chip.previousElementSibling?.querySelector('button');
    chip.remove();
    onRemove?.(event);
    if (!nextFocus?.isConnected) return;
    nextFocus.focus();
  } });
  chip.classList.add('ds-filter-chip');
  return chip;
}

export function render(container) {
  const page = playground(container, { title: text('FilterChip', '筛选标签'), description: text('A named active filter with a keyboard-accessible removal action. Removing a chip updates the local filter collection.', '表示已启用的筛选条件，可通过键盘移除。移除后会更新当前示例的筛选集合。') });
  const props = { label: text('All time', '全部时间'), disabled: false };
  const feedback = statusMessage();
  const slot = element('div', { className: 'component-row' });
  const restore = button(text('Restore filter', '恢复筛选'), () => { update(); feedback.textContent = text('Filter restored.', '筛选已恢复。'); });
  function removed() { feedback.textContent = text('Active filter removed.', '已移除筛选条件。'); restore.hidden = false; restore.focus(); }
  function update() {
    const chip = createFilterChip({ ...props, onRemove: removed });
    slot.replaceChildren(chip);
    restore.hidden = true;
    page.setSnippet(chip.outerHTML);
  }
  page.preview.append(element('div', { className: 'component-demo-stack' }, slot, restore, feedback));
  page.controls.append(textControl(text('Filter label', '筛选文字'), props.label, value => { props.label = value; update(); }), toggleControl(text('Disabled removal', '禁用移除'), false, value => { props.disabled = value; update(); }));
  page.states.append(statePreview(text('Removable', '可移除'), createFilterChip({ label: text('Country: US, AU +4', '地区：US、AU +4'), onRemove: () => { feedback.textContent = text('Country filter removed.', '地区筛选已移除。'); restore.hidden = false; restore.focus(); } })), statePreview(text('Disabled', '禁用'), createFilterChip({ label: text('Required scope', '必要范围'), disabled: true })));
  update();
}
