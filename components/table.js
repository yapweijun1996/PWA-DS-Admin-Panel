import { element, text, playground, toggleControl, customSelect, statePreview, button, openModal, loadingIndicator } from './playground.js';
import { localizeText } from '../js/i18n.js';
import { createPagination } from './pagination.js';

export function createTable({ caption, label = caption, header, body, striped = false, className = '', onRowActivate }) {
  if (onRowActivate) {
    [...body.rows].forEach((row, index) => {
      row.tabIndex = 0;
      row.addEventListener('click', event => {
        if (event.target.closest('a, button, input, textarea, label, [role="button"], [role="checkbox"], [role="switch"]')) return;
        onRowActivate(index, row);
      });
      row.addEventListener('keydown', event => {
        if (event.target !== row || !['Enter', ' '].includes(event.key)) return;
        event.preventDefault();
        onRowActivate(index, row);
      });
    });
  }
  const table = element('table', { className: `ds-table${striped ? ' ds-table-striped' : ''}${className ? ` ${className}` : ''}` },
    element('caption', { className: 'ds-table-caption' }, caption), element('thead', {}, header), body);
  return element('div', { className: 'ds-table-scroll', role: 'region', 'aria-label': label, tabindex: '0' }, table);
}

const mockNames = ['Olivia Rhye', 'Phoenix Baker', 'Lana Steiner', 'Demi Wilkinson', 'Drew Cano', 'Natali Craig', 'Orlando Diggs', 'Andi Lane', 'Kate Morrison', 'Sienna Hewitt', 'Noah Williams', 'Ava Thompson', 'Liam Chen', 'Mia Patel', 'Ethan Brooks', 'Sophia Kim', 'Lucas Martin', 'Amelia Davis', 'Mason Lee', 'Harper Wilson', 'Elijah Garcia', 'Evelyn Wong', 'James Taylor', 'Isabella Clark', 'Benjamin Hall', 'Charlotte Young', 'Henry Scott', 'Grace Lewis', 'Alexander Lim', 'Aria Walker', 'Daniel King', 'Chloe Adams'];

function defaultPageSize() {
  try { const value = Number(JSON.parse(localStorage.getItem('forma.preferences') || '{}').pageSize); return [5, 10, 20, 25, 50].includes(value) ? value : 10; } catch { return 10; }
}

export function render(container) {
  const page = playground(container, { title: text('Table', '数据表格'), description: text('Searchable, sortable mock members with custom status filters, pagination, and whole-row details. All data is mock and stays in this playground.', '支持搜索、排序、自定义状态筛选、分页及整行点击查看详情。所有数据均为模拟数据，仅用于此组件示例。') });
  const rows = mockNames.map((name, index) => ({ id: `MOCK-${String(index + 1).padStart(3, '0')}`, name, email: `${name.toLowerCase().replaceAll(' ', '.')}@example.com`, role: ['admin', 'editor', 'viewer'][index % 3], status: index % 5 === 0 ? 'invited' : index % 7 === 0 ? 'inactive' : 'active', joined: `2026-${String(1 + index % 9).padStart(2, '0')}-${String(1 + index % 25).padStart(2, '0')}` }));
  const props = { query: '', status: 'all', role: 'all', page: 1, pageSize: defaultPageSize(), sort: 'name', direction: 'asc', mode: 'normal', striped: false, showEmail: true };
  const statusLabels = { all: text('All statuses', '全部状态'), active: text('Active', '启用'), invited: text('Invited', '已邀请'), inactive: text('Inactive', '停用') };
  const roleLabels = { all: text('All roles', '全部角色'), admin: text('Admin', '管理员'), editor: text('Editor', '编辑者'), viewer: text('Viewer', '查看者') };
  const wrapper = element('div', { className: 'ds-table-demo' });
  const heading = element('div', { className: 'ds-table-heading' }, element('div', {}, element('h3', {}, text('Team members', '团队成员')), element('p', {}, text('32 mock members · Click any row for details', '32 位模拟成员 · 点击任意行查看详情'))), element('span', { className: 'ds-tag ds-tag-neutral' }, text('Mock data', '模拟数据')));
  const search = element('input', { type: 'search', className: 'ds-input', placeholder: text('Search name, email, or role…', '搜索姓名、邮箱或角色…'), 'aria-label': text('Search mock members', '搜索模拟成员'), oninput: event => { props.query = event.target.value; props.page = 1; updateTable(); } });
  const clear = button(text('Clear', '清除'), () => { props.query = ''; search.value = ''; props.page = 1; updateTable(); search.focus(); });
  const statusFilter = customSelect({ label: text('Filter by status', '按状态筛选'), value: 'all', options: Object.entries(statusLabels).map(([value, label]) => ({ value, label })), onChange(value) { props.status = value; props.page = 1; updateTable(); } });
  const roleFilter = customSelect({ label: text('Filter by role', '按角色筛选'), value: 'all', options: Object.entries(roleLabels).map(([value, label]) => ({ value, label })), onChange(value) { props.role = value; props.page = 1; updateTable(); } });
  const toolbar = element('div', { className: 'ds-table-toolbar' }, element('div', { className: 'ds-table-search' }, search, clear), statusFilter.element, roleFilter.element);
  const results = element('div', { className: 'ds-table-results' });
  const pagination = createPagination({ total: rows.length, page: props.page, pageSize: props.pageSize, pageSizes: [5, 10, 20, 25, 50], onPageChange(value) { props.page = value; updateTable(); }, onPageSizeChange(value) { props.pageSize = value; props.page = 1; updateTable(); } });
  wrapper.append(heading, toolbar, results, pagination.element);
  page.preview.append(wrapper);
  const modeOptions = [{ value: 'normal', label: text('Normal', '正常') }, { value: 'loading', label: text('Loading mock data', '模拟加载') }, { value: 'empty', label: text('Empty mock data', '模拟空数据') }, { value: 'error', label: text('Mock error', '模拟错误') }];
  const modeChoice = customSelect({ label: text('Mock state', '模拟状态'), value: 'normal', options: modeOptions, onChange: setMode });
  page.controls.append(element('div', { className: 'component-field' }, element('label', { for: modeChoice.id }, text('Mock state', '模拟状态')), modeChoice.element), toggleControl(text('Striped rows', '条纹行'), false, value => { props.striped = value; updateTable(); }), toggleControl(text('Show email', '显示邮箱'), true, value => { props.showEmail = value; updateTable(); }));

  function setMode(value) { props.mode = value; modeChoice.setValue(value); props.page = 1; updateTable(); }
  function filteredRows() {
    const query = props.query.trim().toLocaleLowerCase();
    return rows.filter(row => (props.status === 'all' || row.status === props.status) && (props.role === 'all' || row.role === props.role) && (!query || `${row.name} ${row.email} ${roleLabels[row.role]} ${row.role} ${statusLabels[row.status]}`.toLocaleLowerCase().includes(query))).sort((a, b) => {
      const left = props.sort === 'role' ? roleLabels[a.role] : props.sort === 'status' ? statusLabels[a.status] : a[props.sort];
      const right = props.sort === 'role' ? roleLabels[b.role] : props.sort === 'status' ? statusLabels[b.status] : b[props.sort];
      return left.localeCompare(right) * (props.direction === 'asc' ? 1 : -1);
    });
  }
  function openRow(row) {
    const content = element('div', { className: 'component-demo-stack' }, element('span', { className: 'ds-tag ds-tag-neutral' }, text('Mock member · No server writes', '模拟成员 · 不会写入服务器')), element('dl', { className: 'ds-table-detail' }, ...[[text('Member ID', '成员编号'), row.id], [text('Name', '姓名'), row.name], [text('Email', '邮箱'), row.email], [text('Role', '角色'), roleLabels[row.role]], [text('Status', '状态'), statusLabels[row.status]], [text('Joined', '加入日期'), row.joined]].flatMap(([label, value]) => [element('dt', {}, label), element('dd', {}, value)])));
    openModal({ title: row.name, content, actions: [{ label: text('Close details', '关闭详情'), onClick: close => close() }] });
  }
  function updateTable() {
    clear.disabled = props.query.length === 0;
    const matching = props.mode === 'empty' ? [] : filteredRows();
    const pages = Math.max(1, Math.ceil(matching.length / props.pageSize));
    props.page = Math.max(1, Math.min(props.page, pages));
    const visible = matching.slice((props.page - 1) * props.pageSize, props.page * props.pageSize);
    pagination.setState({ total: matching.length, page: props.page, pageSize: props.pageSize, disabled: props.mode !== 'normal' });
    if (props.mode === 'loading') {
      results.replaceChildren(element('div', { className: 'ds-table-state' }, loadingIndicator(text('Loading mock members…', '正在加载模拟成员…')), element('p', {}, text('A deliberate playground state, not a network request.', '这是手动模拟状态，并非真实网络请求。')), button(text('Finish mock loading', '完成模拟加载'), () => setMode('normal'))));
    } else if (props.mode === 'error') {
      results.replaceChildren(element('div', { className: 'ds-table-state', role: 'alert' }, element('strong', {}, text('Mock members could not be loaded', '无法加载模拟成员')), element('p', {}, text('This is a simulated error. Retry restores the mock dataset.', '这是模拟错误。重试将恢复模拟数据。')), button(text('Retry mock request', '重试模拟请求'), () => setMode('normal'))));
    } else if (!matching.length) {
      results.replaceChildren(element('div', { className: 'ds-table-state' }, element('strong', {}, text('No members found', '未找到成员')), element('p', {}, props.mode === 'empty' ? text('This is the empty mock dataset state.', '当前为模拟空数据状态。') : text('Try a different search or clear your filters.', '尝试其他搜索内容，或清除筛选条件。')), button(text('Reset mock table', '重置模拟表格'), () => { props.query = ''; props.status = 'all'; props.role = 'all'; search.value = ''; statusFilter.setValue('all'); roleFilter.setValue('all'); setMode('normal'); })));
    } else {
      const columns = [{ key: 'name', label: text('Member', '成员') }, { key: 'role', label: text('Role', '角色') }, { key: 'status', label: text('Status', '状态') }, { key: 'joined', label: text('Joined', '加入日期') }];
      const header = element('tr');
      for (const column of columns) {
        const active = props.sort === column.key;
        header.append(element('th', { scope: 'col', 'aria-sort': active ? props.direction === 'asc' ? 'ascending' : 'descending' : 'none' }, element('button', { type: 'button', className: 'ds-table-sort', 'aria-label': text(`Sort by ${localizeText(column.label)}`, `按${localizeText(column.label)}排序`), onclick: event => {
          props.direction = props.sort === column.key && props.direction === 'asc' ? 'desc' : 'asc'; props.sort = column.key; props.page = 1; updateTable(); results.querySelector(`[data-sort="${column.key}"]`)?.focus();
        }, 'data-sort': column.key }, column.label, element('span', { 'aria-hidden': 'true' }, active ? props.direction === 'asc' ? ' ↑' : ' ↓' : ' ↕'))));
      }
      const body = element('tbody');
      for (const row of visible) {
        const tone = row.status === 'active' ? 'accent' : 'neutral';
        const tr = element('tr', {},
          element('td', {}, element('div', { className: 'ds-table-member' }, element('span', { className: 'ds-table-avatar', 'aria-hidden': 'true' }, row.name.split(' ').map(part => part[0]).join('')), element('div', {}, element('strong', {}, row.name), props.showEmail ? element('small', {}, row.email) : null))),
          element('td', {}, roleLabels[row.role]),
          element('td', {}, element('span', { className: `ds-tag ds-pill ds-tag-${tone}` }, element('span', { className: 'ds-tag-dot', 'aria-hidden': 'true' }), statusLabels[row.status])),
          element('td', {}, element('time', { datetime: row.joined }, row.joined)));
        body.append(tr);
      }
      results.replaceChildren(createTable({
        caption: text('Mock team members. Rows open member details.', '模拟团队成员。点击行查看成员详情。'),
        label: text('Mock members table', '模拟成员表格'), header, body, striped: props.striped,
        onRowActivate: index => openRow(visible[index]),
      }));
    }
    search.setAttribute('value', props.query);
    page.setSnippet(wrapper.outerHTML.replaceAll('><', '>\n<'));
  }
  for (const option of modeOptions) page.states.append(statePreview(option.label, button(text('Preview state', '预览状态'), () => { setMode(option.value); wrapper.scrollIntoView({ block: 'nearest', behavior: 'auto' }); })));
  updateTable();
}
