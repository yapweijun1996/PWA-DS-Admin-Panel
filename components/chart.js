import { t, localizeText } from '../js/i18n.js';
import { element, text, playground, choiceControl, textControl, toggleControl, statePreview, button, uniqueId, onDetach, loadingIndicator } from './playground.js';
import { createTable } from './table.js';

export const chartTypes = ['line', 'bar', 'stacked', 'area', 'donut', 'sparkline'];
const dashes = ['', '8 4', '3 4', '10 3 2 3', '12 5', '2 3', '8 3 2 3 2 3', '4 3 4 6'];
const markers = ['circle', 'square', 'triangle', 'diamond', 'cross', 'plus', 'hexagon', 'star'];
const defaultFormat = value => new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(value);
const finite = value => typeof value === 'number' && Number.isFinite(value);

function svgNode(tag, attributes = {}, ...children) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [key, value] of Object.entries(attributes)) if (value !== undefined) node.setAttribute(key, String(value));
  for (const child of children.flat()) node.append(child instanceof Node ? child : String(child));
  return node;
}

// Including zero keeps areas and bars honest; the zero-only domain gets a useful unit range.
export function niceTicks(minimum, maximum, count = 5) {
  let low = Math.min(0, minimum);
  let high = Math.max(0, maximum);
  if (low === high) high = 1;
  const rough = (high - low) / Math.max(2, count);
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / magnitude;
  const step = (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 2.5 ? 2.5 : fraction <= 5 ? 5 : 10) * magnitude;
  low = Math.floor(low / step) * step;
  high = Math.ceil(high / step) * step;
  const intervals = Math.round((high - low) / step);
  return Array.from({ length: intervals + 1 }, (_, index) => Number((low + index * step).toPrecision(12)));
}

// Spoken summary of a chart. Sentence structure goes through t() (templates in js/i18n/zh/charts.js); titles and series names are data labels.
export function chartSummary({ type = 'line', title = 'Chart', labels = [], series = [], formatValue = defaultFormat, loading = false }) {
  const heading = localizeText(title);
  const kind = t(`${type} chart`);
  if (loading) return t('{title}. {kind}. Loading data.', { title: heading, kind });
  const parts = series.map((item, index) => {
    const name = item.name ? localizeText(item.name) : t('Series {n}', { n: index + 1 });
    const values = labels.map((_, position) => item.values?.[position]).filter(finite);
    if (!values.length) return t('{name}: no data', { name });
    const first = values[0];
    const last = values.at(-1);
    const trend = last > first ? 'increasing' : last < first ? 'decreasing' : 'unchanged';
    return t(`{name}: minimum {min}, maximum {max}, ${trend} from {first} to {last}`, { name, min: formatValue(Math.min(...values)), max: formatValue(Math.max(...values)), first: formatValue(first), last: formatValue(last) });
  });
  return t('{title}. {kind}. {count} categories. {summary}.', { title: heading, kind, count: labels.length, summary: parts.length ? parts.join(t('; ')) : t('No data') });
}

function markerShape(index, x, y, radius = 4) {
  const shape = markers[index % markers.length];
  if (shape === 'circle') return svgNode('circle', { cx: x, cy: y, r: radius });
  if (shape === 'square') return svgNode('rect', { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2 });
  if (shape === 'triangle') return svgNode('polygon', { points: `${x},${y - radius * 1.3} ${x + radius * 1.2},${y + radius} ${x - radius * 1.2},${y + radius}` });
  if (shape === 'diamond') return svgNode('polygon', { points: `${x},${y - radius * 1.4} ${x + radius * 1.2},${y} ${x},${y + radius * 1.4} ${x - radius * 1.2},${y}` });
  if (shape === 'cross' || shape === 'plus') {
    const path = shape === 'cross' ? `M ${x - radius} ${y - radius} L ${x + radius} ${y + radius} M ${x + radius} ${y - radius} L ${x - radius} ${y + radius}` : `M ${x - radius * 1.3} ${y} H ${x + radius * 1.3} M ${x} ${y - radius * 1.3} V ${y + radius * 1.3}`;
    return svgNode('path', { d: path, fill: 'none', 'stroke-width': 2.5 });
  }
  const vertices = shape === 'hexagon' ? 6 : 10;
  const points = Array.from({ length: vertices }, (_, vertex) => {
    const angle = vertex * Math.PI * 2 / vertices - Math.PI / 2;
    const size = shape === 'star' && vertex % 2 ? radius * 0.5 : radius * 1.3;
    return `${x + Math.cos(angle) * size},${y + Math.sin(angle) * size}`;
  });
  return svgNode('polygon', { points: points.join(' ') });
}

function seriesStyle(index) { return `--chart-series: var(--series-${index % 8 + 1})`; }

/** A DOM element with update(nextOptions) and idempotent destroy() lifecycle methods. */
export function createChart(options = {}) {
  let props = { type: 'line', labels: [], series: [], formatValue: defaultFormat, loading: false, title: text('Chart', '图表'), headingLevel: 3, ...options };
  let hidden = new Set();
  let width = 600;
  let destroyed = false;
  let tooltipTarget;
  const id = uniqueId('chart');
  let heading = element(`h${props.headingLevel}`, { className: 'ds-chart-title', id: `${id}-title` });
  const plot = element('div', { className: 'ds-chart-plot' });
  const legend = element('div', { className: 'ds-chart-legend', role: 'group', 'aria-label': text('Chart legend; toggle visibility', '图例；切换可见性') });
  const tooltip = element('div', { className: 'ds-chart-tooltip', role: 'tooltip', id: `${id}-tooltip`, hidden: true });
  const announcement = element('span', { className: 'ds-chart-sr', role: 'status', 'aria-live': 'polite' });
  const tableRegion = element('div', { id: `${id}-table`, hidden: true });
  const tableToggle = button(text('View as table', '查看数据表格'), () => {
    tableRegion.hidden = !tableRegion.hidden;
    tableToggle.setAttribute('aria-expanded', String(!tableRegion.hidden));
    tableToggle.textContent = tableRegion.hidden ? text('View as table', '查看数据表格') : text('Hide data table', '隐藏数据表格');
  }, 'ghost', { 'aria-controls': tableRegion.id, 'aria-expanded': 'false' });
  const root = element('section', { className: 'ds-chart', 'aria-labelledby': heading.id }, heading, plot, tooltip, legend, element('div', { className: 'ds-chart-actions' }, tableToggle), tableRegion, announcement);

  function hideTooltip() {
    if (tooltipTarget) tooltipTarget.removeAttribute('aria-describedby');
    tooltipTarget = undefined;
    tooltip.hidden = true;
  }
  function showTooltip(target) {
    if (!target?.dataset.tooltip) return;
    hideTooltip();
    tooltipTarget = target;
    tooltip.textContent = target.dataset.tooltip;
    target.setAttribute('aria-describedby', tooltip.id);
    tooltip.hidden = false;
    const bounds = root.getBoundingClientRect();
    const point = target.getBoundingClientRect();
    const left = Math.max(8, Math.min(bounds.width - tooltip.offsetWidth - 8, point.left - bounds.left + point.width / 2 - tooltip.offsetWidth / 2));
    const top = point.top - bounds.top - tooltip.offsetHeight - 8;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${Math.max(0, top)}px`;
  }
  function targetFrom(event) { return event.target.closest?.('[data-chart-point]'); }
  root.addEventListener('pointerover', event => showTooltip(targetFrom(event)));
  root.addEventListener('pointerout', event => {
    if (targetFrom(event) && !targetFrom(event)?.contains(event.relatedTarget)) {
      const focused = root.querySelector('[data-chart-point]:focus');
      if (focused) showTooltip(focused); else hideTooltip();
    }
  });
  root.addEventListener('focusin', event => showTooltip(targetFrom(event)));
  root.addEventListener('focusout', event => { if (targetFrom(event)) hideTooltip(); });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !tooltip.hidden) { event.preventDefault(); event.stopPropagation(); hideTooltip(); return; }
    const target = targetFrom(event);
    if (!target || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const points = [...plot.querySelectorAll('[data-chart-point]')];
    const index = points.indexOf(target);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? points.length - 1 : (index + (['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : -1) + points.length) % points.length;
    points[next]?.focus();
  });

  function data() {
    const labels = Array.isArray(props.labels) ? props.labels.map(String) : [];
    const series = (Array.isArray(props.series) ? props.series : []).map((item, index) => ({ name: String(item.name || `Series ${index + 1}`), values: labels.map((_, position) => finite(item.values?.[position]) ? item.values[position] : null), index }));
    return { labels, series };
  }
  function format(value) { return (typeof props.formatValue === 'function' ? props.formatValue : defaultFormat)(value); }
  function point(group, x, y, label, key) {
    group.setAttribute('tabindex', '0');
    group.setAttribute('role', 'graphics-symbol');
    group.setAttribute('aria-label', label);
    group.setAttribute('data-chart-point', key);
    group.dataset.tooltip = label;
    group.append(svgNode('circle', { cx: x, cy: y, r: 12, class: 'ds-chart-hit', 'aria-hidden': 'true' }));
    return group;
  }
  function updateTable(labels, series) {
    const header = element('tr', {}, element('th', { scope: 'col' }, text('Category', '类别')), ...series.map(item => element('th', { scope: 'col' }, item.name)));
    const body = element('tbody', {}, ...labels.map((label, position) => element('tr', {}, element('th', { scope: 'row' }, label), ...series.map(item => element('td', {}, item.values[position] === null ? text('No data', '无数据') : format(item.values[position]))))));
    tableRegion.replaceChildren(createTable({ caption: `${localizeText(props.title)} — ${text('complete source data (including hidden series)', '完整源数据（包含隐藏系列）')}`, header, body }));
  }
  function updateLegend(labels, series) {
    legend.replaceChildren();
    const entries = props.type === 'donut' ? labels.map((name, index) => ({ name, index })) : series;
    entries.forEach(item => {
      const lineSwatch = props.type === 'line' || props.type === 'sparkline';
      const swatch = lineSwatch
        ? svgNode('svg', { viewBox: '0 0 32 20', width: 32, height: 20, class: 'ds-chart-swatch ds-chart-swatch-line', 'aria-hidden': 'true' }, svgNode('line', { x1: 1, y1: 10, x2: 31, y2: 10, 'stroke-dasharray': dashes[item.index % 8] }), markerShape(item.index, 16, 10, 3))
        : svgNode('svg', { viewBox: '0 0 20 20', width: 20, height: 20, class: 'ds-chart-swatch ds-chart-swatch-filled', 'aria-hidden': 'true' }, svgNode('rect', { x: 3, y: 3, width: 14, height: 14, rx: 3 }));
      const value = props.type === 'donut' ? series[0]?.values[item.index] : undefined;
      const label = props.type === 'donut' ? `${item.index + 1}. ${item.name}: ${value == null ? text('No data', '无数据') : format(value)}` : item.name;
      const control = button(label, () => {
        if (hidden.has(item.index)) hidden.delete(item.index); else hidden.add(item.index);
        control.setAttribute('aria-pressed', String(!hidden.has(item.index)));
        announcement.textContent = `${item.name} ${hidden.has(item.index) ? text('hidden', '已隐藏') : text('shown', '已显示')}.`;
        draw();
      }, 'ghost', { className: 'ds-chart-legend-button', 'aria-pressed': String(!hidden.has(item.index)), style: seriesStyle(item.index) });
      control.prepend(swatch);
      legend.append(control);
    });
  }
  function draw() {
    if (destroyed) return;
    const activeKey = plot.contains(document.activeElement) ? document.activeElement.getAttribute('data-chart-point') : null;
    hideTooltip();
    const { labels, series } = data();
    const compact = props.type === 'sparkline';
    const height = compact ? 100 : 260;
    const svg = svgNode('svg', { class: 'ds-chart-svg', viewBox: `0 0 ${width} ${height}`, width, height, role: 'img', 'aria-label': chartSummary({ ...props, labels, series, formatValue: format }) });
    plot.replaceChildren(svg);
    root.dataset.type = props.type;
    root.setAttribute('aria-busy', String(Boolean(props.loading)));
    if (props.loading) {
      plot.append(element('div', { className: 'ds-chart-state' }, loadingIndicator(text('Loading chart data…', '正在加载图表数据…'))));
      return;
    }
    const visible = series.filter(item => !hidden.has(item.index));
    const hasData = labels.length && series.some(item => item.values.some(finite));
    const donut = props.type === 'donut';
    const invalidDonut = donut && (series[0]?.values.some(value => value !== null && value < 0));
    if (!hasData || invalidDonut || (donut ? !labels.some((_, index) => !hidden.has(index) && series[0]?.values[index] > 0) : !visible.some(item => item.values.some(finite)))) {
      const message = invalidDonut ? text('Donut charts require non-negative values. Use a bar chart for signed data.', '环形图需要非负数值。含负数的数据请使用柱状图。') : !hasData ? text('No chart data', '暂无图表数据') : donut && series[0]?.values.every(value => value === null || value === 0) ? text('No positive values to display', '没有可显示的正数值') : text('No visible data. Enable a legend item to show data.', '暂无可见数据。请启用一个图例项目。');
      svg.setAttribute('aria-label', `${svg.getAttribute('aria-label')} ${message}`);
      plot.append(element('p', { className: 'ds-chart-state' }, message));
      return;
    }
    if (donut) drawDonut(svg, labels, series[0], height);
    else drawCartesian(svg, labels, visible, height, compact);
    if (activeKey !== null) [...svg.querySelectorAll('[data-chart-point]')].find(node => node.getAttribute('data-chart-point') === activeKey)?.focus();
  }
  function drawCartesian(svg, labels, visible, height, compact) {
    const allValues = visible.flatMap(item => item.values.filter(finite));
    let low = Math.min(0, ...allValues);
    let high = Math.max(0, ...allValues);
    if (props.type === 'stacked') {
      low = Math.min(0, ...labels.map((_, index) => visible.reduce((total, item) => total + Math.min(0, item.values[index] ?? 0), 0)));
      high = Math.max(0, ...labels.map((_, index) => visible.reduce((total, item) => total + Math.max(0, item.values[index] ?? 0), 0)));
    }
    const ticks = niceTicks(low, high, compact ? 3 : 4);
    const tickLabels = ticks.map(format);
    const left = compact ? 14 : Math.min(width * 0.32, Math.max(42, ...tickLabels.map(label => String(label).length * 7 + 12)));
    const right = 18;
    const top = compact ? 14 : 20;
    const bottom = compact ? 14 : 38;
    const plotWidth = Math.max(1, width - left - right);
    const plotHeight = height - top - bottom;
    const y = value => top + (ticks.at(-1) - value) / (ticks.at(-1) - ticks[0]) * plotHeight;
    const isBar = props.type === 'bar' || props.type === 'stacked';
    const x = index => left + (isBar ? (index + 0.5) / labels.length : labels.length === 1 ? 0.5 : index / (labels.length - 1)) * plotWidth;
    ticks.forEach((tick, index) => {
      svg.append(svgNode('line', { x1: left, y1: y(tick), x2: width - right, y2: y(tick), class: tick === 0 ? 'ds-chart-grid ds-chart-zero' : 'ds-chart-grid' }));
      if (!compact) svg.append(svgNode('text', { x: left - 8, y: y(tick) + 4, 'text-anchor': 'end', class: 'ds-chart-axis' }, tickLabels[index]));
    });
    if (!compact) {
      const labelSlots = Math.max(2, Math.floor(plotWidth / 68));
      const stride = Math.max(1, Math.ceil(labels.length / labelSlots));
      labels.forEach((label, index) => {
        if (index % stride && index !== labels.length - 1) return;
        const limit = Math.max(3, Math.floor(plotWidth / Math.min(labels.length, labelSlots) / 7));
        const short = label.length > limit ? `${label.slice(0, Math.max(1, limit - 1))}…` : label;
        svg.append(svgNode('text', { x: x(index), y: height - 12, 'text-anchor': index === 0 && !isBar ? 'start' : index === labels.length - 1 && !isBar ? 'end' : 'middle', class: 'ds-chart-axis' }, svgNode('title', {}, label), short));
      });
    }
    const positive = labels.map(() => 0);
    const negative = labels.map(() => 0);
    visible.forEach((item, seriesPosition) => {
      const group = svgNode('g', { class: 'ds-chart-series', style: seriesStyle(item.index) });
      if (isBar) {
        const slot = plotWidth / labels.length;
        const groupWidth = slot * 0.76;
        const barWidth = groupWidth / (props.type === 'stacked' ? 1 : visible.length);
        item.values.forEach((value, position) => {
          if (value === null) return;
          let base = 0;
          if (props.type === 'stacked') {
            base = value < 0 ? negative[position] : positive[position];
            if (value < 0) negative[position] += value; else positive[position] += value;
          }
          const barX = x(position) - groupWidth / 2 + (props.type === 'stacked' ? 0 : seriesPosition * barWidth);
          const barY = Math.min(y(base), y(base + value));
          const bar = svgNode('g', { class: 'ds-chart-point ds-chart-bar' }, svgNode('rect', { x: barX + 1, y: barY, width: Math.max(1, barWidth - 2), height: Math.max(2, Math.abs(y(base + value) - y(base))), rx: 2 }));
          group.append(point(bar, barX + barWidth / 2, (y(base) + y(base + value)) / 2, `${labels[position]} · ${item.name}: ${format(value)}`, `${item.index}-${position}`));
        });
      } else {
        const segments = [];
        let segment = [];
        item.values.forEach((value, position) => {
          if (value === null) { if (segment.length) segments.push(segment); segment = []; }
          else segment.push({ x: x(position), y: y(value), value, position });
        });
        if (segment.length) segments.push(segment);
        segments.forEach(points => {
          const path = points.map((entry, index) => `${index ? 'L' : 'M'} ${entry.x} ${entry.y}`).join(' ');
          if (props.type === 'area') group.append(svgNode('path', { d: `${path} L ${points.at(-1).x} ${y(0)} L ${points[0].x} ${y(0)} Z`, class: 'ds-chart-area' }));
          group.append(svgNode('path', { d: path, class: 'ds-chart-line', 'stroke-dasharray': dashes[item.index % 8] }));
          points.forEach(entry => {
            const mark = svgNode('g', { class: 'ds-chart-point' }, markerShape(item.index, entry.x, entry.y, compact ? 3 : 4));
            group.append(point(mark, entry.x, entry.y, `${labels[entry.position]} · ${item.name}: ${format(entry.value)}`, `${item.index}-${entry.position}`));
          });
        });
      }
      svg.append(group);
    });
  }
  function drawDonut(svg, labels, item, height) {
    const values = item.values.map((value, index) => hidden.has(index) || value === null ? 0 : value);
    const total = values.reduce((sum, value) => sum + value, 0);
    const cx = width / 2;
    const cy = height / 2;
    const radius = Math.min(height * 0.37, width * 0.35);
    const inner = radius * 0.62;
    let angle = -Math.PI / 2;
    const polar = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
    values.forEach((value, index) => {
      if (hidden.has(index) || item.values[index] === null) return;
      const sweep = value / total * Math.PI * 2;
      const end = angle + sweep;
      let shape;
      if (sweep >= Math.PI * 2 - 0.000001) shape = svgNode('circle', { cx, cy, r: (radius + inner) / 2, 'stroke-width': radius - inner, class: 'ds-chart-ring' });
      else if (value > 0) {
        const a = polar(radius, angle), b = polar(radius, end), c = polar(inner, end), d = polar(inner, angle);
        shape = svgNode('path', { d: `M ${a.join(' ')} A ${radius} ${radius} 0 ${sweep > Math.PI ? 1 : 0} 1 ${b.join(' ')} L ${c.join(' ')} A ${inner} ${inner} 0 ${sweep > Math.PI ? 1 : 0} 0 ${d.join(' ')} Z`, class: 'ds-chart-slice' });
      } else shape = svgNode('circle', { cx: polar((radius + inner) / 2, angle)[0], cy: polar((radius + inner) / 2, angle)[1], r: 3, class: 'ds-chart-zero-slice' });
      const middle = angle + sweep / 2;
      const [pointX, pointY] = polar((radius + inner) / 2, middle);
      const group = svgNode('g', { class: 'ds-chart-series ds-chart-point', style: seriesStyle(index) }, shape);
      const percentage = new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(value / total);
      svg.append(point(group, pointX, pointY, `${labels[index]} · ${item.name}: ${format(value)} (${percentage})`, `slice-${index}`));
      if (sweep > 0.23) svg.append(svgNode('text', { x: polar(radius + 14, middle)[0], y: polar(radius + 14, middle)[1] + 4, 'text-anchor': 'middle', class: 'ds-chart-axis' }, String(index + 1)));
      angle = end;
    });
    svg.append(svgNode('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', class: 'ds-chart-total' }, String(format(total))), svgNode('text', { x: cx, y: cy + 18, 'text-anchor': 'middle', class: 'ds-chart-axis' }, text('Visible total', '可见合计')));
  }
  function refresh() {
    if (destroyed) return;
    if (heading.tagName.toLowerCase() !== `h${props.headingLevel}`) {
      const nextHeading = element(`h${props.headingLevel}`, { className: 'ds-chart-title', id: heading.id });
      heading.replaceWith(nextHeading);
      heading = nextHeading;
    }
    heading.textContent = props.title;
    const { labels, series } = data();
    updateLegend(labels, series);
    updateTable(labels, series);
    draw();
  }
  root.update = next => {
    if (next.type && next.type !== props.type) hidden = new Set();
    props = { ...props, ...next };
    refresh();
  };
  const observer = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
    const nextWidth = Math.max(1, Math.round(entries[0].contentRect.width));
    if (nextWidth !== width) { width = nextWidth; draw(); }
  }) : null;
  root.destroy = () => { if (destroyed) return; destroyed = true; observer?.disconnect(); hideTooltip(); };
  observer?.observe(plot);
  onDetach(root, root.destroy);
  refresh();
  return root;
}

const mockLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
const mockSeries = [{ name: 'Subscriptions', values: [24, 38, 31, 48, 42, 61] }, { name: 'Services', values: [15, 20, 18, 27, 32, 35] }];

export function demo(containerOrOptions = {}, options = {}) {
  const container = containerOrOptions instanceof Node ? containerOrOptions : null;
  const settings = container ? options : containerOrOptions;
  const type = typeof settings === 'string' ? settings : settings.type || 'line';
  const chart = createChart({ title: text('Mock workspace activity', '模拟工作区活动'), labels: type === 'donut' ? ['Active', 'Trial', 'Archived'] : mockLabels, series: type === 'donut' ? [{ name: 'Customers', values: [68, 24, 8] }] : mockSeries, ...(typeof settings === 'object' ? settings : {}), type });
  container?.append(chart);
  return chart;
}

export function render(container) {
  const page = playground(container, { title: text('Charts', '图表'), description: text('Six dependency-free SVG charts with mock data, keyboard tooltips, interactive legends and an accessible data table.', '六种无依赖 SVG 图表，包含模拟数据、键盘提示、可交互图例与无障碍数据表格。') });
  const props = { type: 'line', title: text('Mock workspace activity', '模拟工作区活动'), loading: false, negative: false, empty: false, currency: false };
  const chart = demo();
  page.preview.append(chart);
  function update() {
    const labels = props.empty ? [] : props.type === 'donut' ? ['Active', 'Trial', 'Archived'] : mockLabels;
    const series = props.empty ? [] : props.type === 'donut' ? [{ name: 'Customers', values: props.negative ? [68, -24, 8] : [68, 24, 8] }] : mockSeries.map((item, index) => ({ ...item, values: props.negative ? item.values.map((value, position) => (position % 3 === index ? -value : value)) : item.values }));
    chart.update({ ...props, labels, series, formatValue: props.currency ? value => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value) : defaultFormat });
    page.setSnippet(`import { createChart } from './components/chart.js';\nconst chart = createChart(${JSON.stringify({ type: props.type, title: props.title, labels, series, loading: props.loading }, null, 2)});\ncontainer.append(chart);\n// chart.update({ series: nextSeries });\n// chart.destroy(); // also cleaned up automatically on DOM removal`);
  }
  page.controls.append(choiceControl(text('Chart type', '图表类型'), 'line', chartTypes.map(value => ({ value, label: value })), value => { props.type = value; update(); }), textControl(text('Title', '标题'), props.title, value => { props.title = value; update(); }), toggleControl(text('Loading', '加载中'), false, value => { props.loading = value; update(); }), toggleControl(text('Empty data', '空数据'), false, value => { props.empty = value; update(); }), toggleControl(text('Include negative values', '包含负数'), false, value => { props.negative = value; update(); }), toggleControl(text('Format as USD', '美元格式'), false, value => { props.currency = value; update(); }));
  page.states.classList.add('ds-chart-states');
  page.states.append(...chartTypes.map(type => statePreview(type, demo({ type }))), statePreview(text('Zero values', '零值'), createChart({ title: text('Mock zero values', '模拟零值'), labels: ['A', 'B', 'C'], series: [{ name: 'Zero', values: [0, 0, 0] }] })), statePreview(text('Loading', '加载中'), demo({ loading: true })), statePreview(text('Empty', '空状态'), demo({ labels: [], series: [] })));
  update();
}

export const guide = {
  purpose: 'Visualize trends, comparisons and shares with dependency-free SVG charts and a complete accessible table alternative.',
  props: ['createChart({type, labels, series:[{name,values}], formatValue, loading, title, headingLevel=3}) returns a DOM element with update(nextOptions) and destroy(). Set headingLevel (1–6) to follow the containing section.', 'Values are finite numbers; missing values are gaps. Donut uses the first series with labels as slices, requires non-negative values, and its legend toggles slices and displays formatted slice values.', 'formatValue(number) formats ticks, tooltips, summaries, donut legend values and table cells. destroy() is automatic on DOM removal; call it explicitly when disposing an unmounted chart.'],
  variants: ['line: trends with multiple series and line-and-marker legend swatches.', 'bar: grouped category comparisons with filled rounded-square legend swatches.', 'stacked: positive and negative totals are stacked separately; filled rounded-square legend swatches.', 'area: volume over time from a zero baseline with filled rounded-square legend swatches.', 'donut: share of a whole; numbered slices match the ordered legend, filled rounded-square swatches and formatted values.', 'sparkline: compact trend without axis labels; retains line-and-marker legend and table access.'],
  tokens: ['--series-1 through --series-8, --color-border-subtle, --surface, --text, --muted, --focus-ring.'],
  states: ['Default, hovered or focused point, hidden series/slice, empty, zero-only, loading, expanded data table.'],
  keyboard: ['Tab reaches points, legend buttons and View as table. Arrow keys move between points; Home/End jump. Escape dismisses the tooltip.', 'Enter/Space toggles legend visibility or the data-table alternative.'],
  accessibility: ['Every SVG has role=img and a generated type, series, min/max and trend summary.', 'Every chart has a captioned source-data table with row and column headers, including hidden values.', 'Tooltips appear on hover and focus. Eight distinct markers and dash sequences supplement token colours; legends expose aria-pressed. No animations are required.'],
  responsive: ['ResizeObserver redraws into available width without horizontal page overflow and disconnects on removal.', 'Long axis labels are shortened visually, with complete values retained in tooltips and tables. Phone legend and table controls meet 44px touch targets.'],
  example: 'const chart = createChart({ type: "line", title: "Mock revenue", labels: ["Jan", "Feb"], series: [{ name: "Revenue", values: [24, 38] }] });\ncontainer.append(chart);\nchart.update({ loading: false });',
  do: ['Label demonstration data as mock and choose a chart matching the question.', 'Use fewer than eight series when possible, meaningful titles and an appropriate formatValue.'],
  dont: ['Do not use colour alone, hide table access, or present mock figures as live business data.', 'Do not use donut charts for negative values or many slices; choose bars instead.']
};
