import { text } from './playground.js';
import { render as renderButton } from './button.js';
import { render as renderInput } from './input.js';
import { render as renderSelect } from './select.js';
import { render as renderCheckbox } from './checkbox.js';
import { render as renderSwitch } from './switch.js';
import { render as renderTag } from './tag.js';
import { render as renderPill } from './pill.js';
import { render as renderTabs } from './tabs.js';
import { render as renderTable } from './table.js';
import { render as renderModal } from './modal.js';
import { render as renderToast } from './toast.js';
import { render as renderTooltip } from './tooltip.js';
import { render as renderPopover } from './popover.js';

export const registry = [
  { name: 'button', get label() { return text('Button', '按钮'); }, render: renderButton },
  { name: 'input', get label() { return text('Input', '输入框'); }, render: renderInput },
  { name: 'select', get label() { return text('Select', '选择器'); }, render: renderSelect },
  { name: 'checkbox', get label() { return text('Checkbox', '复选框'); }, render: renderCheckbox },
  { name: 'switch', get label() { return text('Switch', '开关'); }, render: renderSwitch },
  { name: 'tag', get label() { return text('Tag', '标签'); }, render: renderTag },
  { name: 'pill', get label() { return text('Pill', '状态胶囊'); }, render: renderPill },
  { name: 'tabs', get label() { return text('Tabs', '选项卡'); }, render: renderTabs },
  { name: 'table', get label() { return text('Table', '数据表格'); }, render: renderTable },
  { name: 'modal', get label() { return text('Modal', '模态对话框'); }, render: renderModal },
  { name: 'toast', get label() { return text('Toast', '通知提示'); }, render: renderToast },
  { name: 'tooltip', get label() { return text('Tooltip', '工具提示'); }, render: renderTooltip },
  { name: 'popover', get label() { return text('Popover menu', '弹出菜单'); }, render: renderPopover }
];

if (typeof document !== 'undefined') {
  for (const name of ['playground', ...registry.map(entry => entry.name)]) {
    if (document.querySelector(`link[data-component-style="${name}"]`)) continue;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(`../css/components/${name}.css`, import.meta.url).href;
    link.dataset.componentStyle = name;
    document.head.append(link);
  }
}
