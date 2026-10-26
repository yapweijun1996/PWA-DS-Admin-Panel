import { element, text, playground, textControl, choiceControl, statePreview, statusMessage } from './playground.js';
import { createCard } from './card.js';
import { createBadge } from './badge.js';
import { createMenu } from './popover.js';
import { icon } from '../js/icons.js';

export function createKpiCard({ label, value, trend, trendTone = 'success', menuItems = [], content } = {}) {
  let menu;
  if (menuItems.length) {
    menu = createMenu({ label: text(`Actions for ${label}`, `${label}的操作`), items: menuItems });
    menu.trigger.className = 'ds-button ds-button-ghost ds-kpi-menu';
    menu.trigger.setAttribute('aria-label', text(`Actions for ${label}`, `${label}的操作`));
    menu.trigger.innerHTML = icon('more');
  }
  const body = element('div', { className: 'ds-kpi-value-row' }, element('strong', { className: 'ds-kpi-value' }, value), trend ? createBadge({ label: trend, tone: trendTone, pill: true }) : null);
  const card = createCard({ title: label, actions: menu?.element, content: [body, content ? element('div', { className: 'ds-kpi-extra' }, content) : null] });
  card.classList.add('ds-kpi-card');
  return card;
}

export function render(container) {
  const page = playground(container, { title: text('KpiCard', '指标卡片'), description: text('A labelled metric, trend pill, and optional working action menu. All values here are explicitly mock data, not live analytics.', '包含指标名称、趋势标签及可选操作菜单。此处数值均为模拟数据，并非实时分析。') });
  const props = { label: text('Total customers (mock)', '客户总数（模拟）'), value: '2,420', trend: '↑ 20%', trendTone: 'success' };
  const feedback = statusMessage();
  function update() {
    const card = createKpiCard({ ...props, menuItems: [{ label: text('Reset mock metric', '重置模拟指标'), action: () => { props.value = '2,420'; feedback.textContent = text('Mock metric reset.', '模拟指标已重置。'); update(); } }, { label: text('Toggle trend', '切换趋势'), action: () => { props.trend = props.trend ? '' : '↑ 20%'; feedback.textContent = text('Trend visibility changed.', '已切换趋势显示。'); update(); } }] });
    page.preview.replaceChildren(card, feedback); page.setSnippet(card.outerHTML);
  }
  page.controls.append(textControl(text('Label', '名称'), props.label, value => { props.label = value; update(); }), textControl(text('Value', '数值'), props.value, value => { props.value = value; update(); }), textControl(text('Trend', '趋势'), props.trend, value => { props.trend = value; update(); }), choiceControl(text('Trend tone', '趋势色调'), props.trendTone, ['success', 'warning', 'danger', 'neutral'].map(value => ({ value, label: value })), value => { props.trendTone = value; update(); }));
  page.states.append(statePreview(text('Positive', '增长'), createKpiCard({ label: text('Mock members', '模拟成员'), value: '1,210', trend: '↑ 15%' })), statePreview(text('Decrease', '下降'), createKpiCard({ label: text('Mock retention', '模拟留存率'), value: '86%', trend: '↓ 4%', trendTone: 'danger' })), statePreview(text('No trend', '无趋势'), createKpiCard({ label: text('Mock active now', '模拟当前在线'), value: '316' })));
  update();
}
