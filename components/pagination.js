import { element, text, playground, textControl, toggleControl, statePreview, customSelect, button, statusMessage } from './playground.js';

export function createPagination({ total = 0, page = 1, pageSize = 10, onPageChange, onPageSizeChange, pageSizes = [5, 10, 20, 50], disabled = false } = {}) {
  const state = { total, page, pageSize, disabled };
  const root = element('nav', { className: 'ds-pagination', 'aria-label': text('Pagination', '分页导航') });
  let sizeControl;
  function normalize() {
    state.total = Number.isFinite(Number(state.total)) ? Math.max(0, Math.floor(Number(state.total))) : 0;
    state.pageSize = Number.isFinite(Number(state.pageSize)) ? Math.max(1, Math.floor(Number(state.pageSize))) : 10;
    state.pages = Math.max(1, Math.ceil(state.total / state.pageSize));
    state.page = Math.max(1, Math.min(state.pages, Math.floor(Number(state.page) || 1)));
  }
  function choose(next) {
    state.page = next;
    update();
    const selected = root.querySelector(`[data-page="${state.page}"]`);
    const fallback = [...root.querySelectorAll('button')].find(control => !control.disabled && control.getAttribute('aria-label') === text('Previous page', '上一页')) || [...root.querySelectorAll('button')].find(control => !control.disabled && control.getAttribute('aria-label') === text('Next page', '下一页'));
    (selected?.getClientRects().length ? selected : fallback)?.focus();
    onPageChange?.(state.page);
  }
  function update() {
    normalize();
    sizeControl?.close();
    const focusLabel = root.contains(document.activeElement) ? document.activeElement.getAttribute('aria-label') : null;
    const start = state.total ? (state.page - 1) * state.pageSize + 1 : 0;
    const end = Math.min(state.page * state.pageSize, state.total);
    const summary = element('span', { className: 'ds-pagination-summary', role: 'status' }, text(`Showing ${start} to ${end} of ${state.total}`, `显示 ${start} 至 ${end}，共 ${state.total} 条`));
    const controls = element('div', { className: 'ds-pagination-controls' });
    if (onPageSizeChange) {
      const sizes = [...new Set([...pageSizes, state.pageSize])].filter(value => Number(value) > 0).sort((a, b) => a - b);
      sizeControl = customSelect({ label: text('Rows per page', '每页行数'), value: String(state.pageSize), disabled: state.disabled, options: sizes.map(value => ({ value: String(value), label: text(`${value} per page`, `每页 ${value} 行`) })), onChange(value) { state.pageSize = Number(value); state.page = 1; update(); root.querySelector('.ds-select-trigger')?.focus(); onPageSizeChange(state.pageSize); } });
      controls.append(sizeControl.element);
    }
    controls.append(button(text('Previous', '上一页'), () => choose(state.page - 1), 'secondary', { disabled: state.disabled || state.page <= 1, 'aria-label': text('Previous page', '上一页') }));
    const numbers = element('div', { className: 'ds-pagination-pages' });
    const shown = [...new Set([1, state.page - 1, state.page, state.page + 1, state.pages])].filter(value => value >= 1 && value <= state.pages).sort((a, b) => a - b);
    let last = 0;
    for (const number of shown) {
      if (last && number - last > 1) numbers.append(element('span', { className: 'ds-pagination-ellipsis', 'aria-hidden': 'true' }, '…'));
      numbers.append(button(String(number), () => choose(number), number === state.page ? 'primary' : 'ghost', { className: `ds-button ds-button-${number === state.page ? 'primary' : 'ghost'} ds-pagination-page`, disabled: state.disabled, 'aria-label': text(`Page ${number}`, `第 ${number} 页`), 'aria-current': number === state.page ? 'page' : undefined, 'data-page': number }));
      last = number;
    }
    controls.append(numbers, element('span', { className: 'ds-pagination-page-label' }, text(`Page ${state.page} of ${state.pages}`, `第 ${state.page} 页，共 ${state.pages} 页`)), button(text('Next', '下一页'), () => choose(state.page + 1), 'secondary', { disabled: state.disabled || state.page >= state.pages, 'aria-label': text('Next page', '下一页') }));
    root.replaceChildren(summary, controls);
    if (focusLabel) [...root.querySelectorAll('button')].find(control => control.getAttribute('aria-label') === focusLabel)?.focus();
  }
  update();
  return { element: root, setState(next) { Object.assign(state, next); update(); }, get state() { return { ...state }; } };
}

export function render(container) {
  const page = playground(container, { title: text('Pagination', '分页'), description: text('The same result navigation used by Table: bounded page buttons, result range, and a working custom rows-per-page control. All results here are mock.', '复用表格的分页导航：有界页码、结果范围及可操作的每页行数选择器。此处结果均为模拟数据。') });
  const props = { total: 248, page: 1, pageSize: 10, disabled: false };
  const feedback = statusMessage(text('Mock results. Change page or page size.', '模拟结果。可更改页码或每页行数。'));
  const pagination = createPagination({ ...props, onPageChange(value) { props.page = value; feedback.textContent = text(`Mock page ${value} selected.`, `已选择模拟第 ${value} 页。`); snippet(); }, onPageSizeChange(value) { props.pageSize = value; props.page = 1; feedback.textContent = text(`Showing ${value} mock rows per page.`, `每页显示 ${value} 条模拟记录。`); snippet(); } });
  function snippet() { page.setSnippet(pagination.element.outerHTML); }
  function update() { pagination.setState(props); snippet(); }
  page.preview.append(element('div', { className: 'component-demo-stack ds-pagination-demo' }, pagination.element, feedback));
  page.controls.append(textControl(text('Mock result count', '模拟结果数'), props.total, value => { props.total = Number(value); props.page = 1; update(); }, { type: 'number', min: '0' }), toggleControl(text('Disabled', '禁用'), false, value => { props.disabled = value; update(); }));
  page.states.append(statePreview(text('Empty results', '无结果'), createPagination({ total: 0 }).element), statePreview(text('Last page', '最后一页'), createPagination({ total: 28, page: 3 }).element), statePreview(text('Loading / disabled', '加载 / 禁用'), createPagination({ total: 100, disabled: true }).element));
  update();
}
