import { button, element, field } from './components/playground.js';
import { createCombobox } from './components/combobox.js';
import { createTable } from './components/table.js';
import { createChart } from './components/chart.js';

const html = document.documentElement;
const status = document.getElementById('demo-status');
const announce = message => { status.textContent = message; };
const themeSwitch = button('Dark theme', () => {
  html.dataset.theme = html.dataset.theme === 'dark' ? 'light' : 'dark';
  try { localStorage.setItem(`forma.kit.${html.dataset.kit}.${html.dataset.palette}.theme`, html.dataset.theme); } catch { /* Theme changes still work without storage access. */ }
  updateThemeLabel();
}, 'secondary', { id: 'theme-switch', 'aria-pressed': 'false' });
function updateThemeLabel() {
  const dark = html.dataset.theme === 'dark';
  themeSwitch.textContent = dark ? 'Switch to light theme' : 'Switch to dark theme';
  themeSwitch.setAttribute('aria-pressed', String(dark));
}
updateThemeLabel();
document.getElementById('theme-control').append(themeSwitch);

function section(title, ...children) {
  return element('section', { className: 'kit-demo-card kit-demo-stack' }, element('h2', {}, title), ...children);
}

const name = element('input', { id: 'mock-name', className: 'ds-input', type: 'text', value: 'Alex Morgan', autocomplete: 'off' });
const input = field('Mock member name', name, 'Change the name, then use the shared action button.');
const action = button('Preview greeting', () => announce(`Mock greeting · Hello, ${name.value.trim() || 'guest'}! No data was saved.`), 'primary');
const region = createCombobox({
  label: 'Mock team region',
  options: [{ value: 'sg', label: 'Singapore' }, { value: 'au', label: 'Australia' }, { value: 'gb', label: 'United Kingdom' }],
  value: 'sg',
  hint: 'Type to search. Arrow keys navigate; Enter selects; Escape closes.',
  onChange: value => announce(value ? `Mock region selected: ${value}.` : 'Mock region cleared.')
});
const form = section('Button, Input and Combobox', element('div', { className: 'kit-demo-fields' }, input, region.element), element('div', {}, action));

const members = [
  { name: 'Alex Morgan', team: 'Design', region: 'Singapore' },
  { name: 'Riley Chen', team: 'Engineering', region: 'Australia' },
  { name: 'Jordan Lee', team: 'Operations', region: 'United Kingdom' }
];
const header = element('tr', {}, ...['Name', 'Team', 'Region'].map(label => element('th', { scope: 'col' }, label)));
const body = element('tbody', {}, ...members.map(member => element('tr', {}, ...[member.name, member.team, member.region].map(value => element('td', {}, value)))));
const table = createTable({
  caption: 'Mock team members · Activate a row to preview the member',
  header,
  body,
  onRowActivate: index => announce(`Mock member preview · ${members[index].name}, ${members[index].team}, ${members[index].region}.`)
});
const chart = createChart({
  headingLevel: 3,
  type: 'bar',
  title: 'Mock completed tasks',
  labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
  series: [{ name: 'Design', values: [12, 18, 16, 24] }, { name: 'Engineering', values: [18, 20, 27, 30] }]
});
document.getElementById('demo-components').append(form, section('Table', table), section('Chart · Mock data', chart));
