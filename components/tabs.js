import { element, text, playground, choiceControl, toggleControl, statePreview, statusMessage, uniqueId } from './playground.js';

export function createTabs({ items = [], label = 'Sections', active = 0, variant = 'underline', orientation = 'horizontal', fullWidth = false, onChange } = {}) {
  const vertical = orientation === 'vertical';
  const root = element('div', { className: `ds-tabs ds-tabs-${variant === 'segmented' ? 'segmented' : 'underline'} ds-tabs-${vertical ? 'vertical' : 'horizontal'}${fullWidth ? ' ds-tabs-full' : ''}` });
  const prefix = uniqueId('tabs');
  const list = element('div', { className: 'ds-tab-list', role: 'tablist', 'aria-label': label, 'aria-orientation': vertical ? 'vertical' : 'horizontal' });
  const panels = items.map((item, index) => element('section', { id: `${prefix}-panel-${index}`, className: 'ds-tab-panel', role: 'tabpanel', 'aria-labelledby': `${prefix}-tab-${index}`, tabindex: '0' }, item.content));
  let selected = items[active] && !items[active].disabled ? active : items.findIndex(item => !item.disabled);
  const buttons = items.map((item, index) => {
    const tab = element('button', { type: 'button', className: 'ds-tab', id: `${prefix}-tab-${index}`, role: 'tab', 'aria-controls': panels[index].id, disabled: item.disabled, onclick: () => select(index) }, item.label);
    list.append(tab);
    return tab;
  });
  function refresh() {
    buttons.forEach((tab, index) => { tab.setAttribute('aria-selected', String(index === selected)); tab.tabIndex = index === selected ? 0 : -1; panels[index].hidden = index !== selected; });
  }
  function select(index) {
    if (!buttons[index] || buttons[index].disabled) return;
    selected = index; refresh(); onChange?.(index);
  }
  list.addEventListener('keydown', event => {
    const arrows = vertical ? ['ArrowDown', 'ArrowUp'] : ['ArrowRight', 'ArrowLeft'];
    if (![...arrows, 'Home', 'End'].includes(event.key)) return;
    const enabled = buttons.map((tab, index) => ({ tab, index })).filter(item => !item.tab.disabled);
    if (!enabled.length) return;
    event.preventDefault();
    let position = enabled.findIndex(item => item.index === selected);
    if (event.key === 'Home') position = 0;
    else if (event.key === 'End') position = enabled.length - 1;
    else position = (position + (event.key === arrows[0] ? 1 : -1) + enabled.length) % enabled.length;
    select(enabled[position].index); enabled[position].tab.focus();
  });
  root.append(list, ...panels); refresh(); return root;
}

export function render(container) {
  const page = playground(container, { title: text('Tabs', '选项卡'), description: text('Related views with one active panel. Use arrow keys, Home, or End; focus and selection move together.', '在相关视图之间切换，同时仅显示一个面板。支持方向键、Home 和 End，焦点与选择同步移动。') });
  const props = { active: 0, variant: 'underline', orientation: 'horizontal', disableLast: false, fullWidth: false };
  const items = [
    { label: text('Overview', '概览'), title: text('A clear view of your workspace', '清晰了解工作区'), description: text('Mock workspace overview: 24 members, 8 projects, and one shared design language.', '模拟工作区概况：24 位成员、8 个项目，以及统一的设计语言。') },
    { label: text('Usage', '使用情况'), title: text('Designed to be reused', '为复用而设计'), description: text('Mock usage summary: components are used across 12 screens. Tokens keep every surface consistent.', '模拟使用摘要：组件用于 12 个界面，设计令牌让所有页面保持一致。') },
    { label: text('Activity', '活动'), title: text('Recent mock activity', '最近的模拟活动'), description: text('A workspace was created, the accent token was reviewed, and three components were documented.', '创建了工作区、检查了强调色令牌，并记录了三个组件。') }
  ];
  const feedback = statusMessage();
  let root;
  function update() {
    if (props.disableLast && props.active === 2) props.active = 0;
    root = createTabs({ items: items.map((item, index) => ({ label: item.label, content: [element('h3', {}, item.title), element('p', {}, item.description)], disabled: props.disableLast && index === 2 })), label: text('Mock workspace sections', '模拟工作区分区'), ...props, onChange: index => { props.active = index; describe(); } });
    page.preview.replaceChildren(root, feedback);
    describe();
  }
  function describe() {
    feedback.textContent = text('Active view: ', '当前视图：') + items[props.active].label;
    page.setSnippet(root.outerHTML);
  }
  page.controls.append(choiceControl(text('Style', '样式'), props.variant, [{ value: 'underline', label: text('Underline', '下划线') }, { value: 'segmented', label: text('Segmented', '分段') }], value => { props.variant = value; update(); }), choiceControl(text('Orientation', '方向'), props.orientation, [{ value: 'horizontal', label: text('Horizontal', '水平') }, { value: 'vertical', label: text('Vertical', '垂直') }], value => { props.orientation = value; update(); }), toggleControl(text('Disable last tab', '禁用最后一项'), false, value => { props.disableLast = value; update(); }), toggleControl(text('Full width', '占满宽度'), false, value => { props.fullWidth = value; update(); }));
  for (const [name, extra, disabled] of [[text('Default', '默认'), '', false], [text('Hover', '悬停'), 'is-hover', false], [text('Focus', '聚焦'), 'is-focus', false], [text('Selected', '选中'), 'is-selected', false], [text('Disabled', '禁用'), '', true]]) page.states.append(statePreview(name, element('button', { type: 'button', className: `ds-tab ${extra}`, disabled, onclick: () => { props.active = (props.active + 1) % (props.disableLast ? 2 : 3); update(); } }, text('Workspace', '工作区'))));
  update();
}
