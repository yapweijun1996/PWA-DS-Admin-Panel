import { element, text, playground, textControl, statePreview, button, statusMessage } from './playground.js';

export function createMasonry({ items = [], label = text('Masonry collection', '瀑布流集合') } = {}) {
  return element('div', { className: 'ds-masonry', role: 'list', 'aria-label': label }, ...items.map(item => element('div', { className: 'ds-masonry-item', role: 'listitem' }, item)));
}

const mockNotes = [
  ['Project brief', 'Mock planning note: keep the purpose of each page clear and make its primary action easy to find.'],
  ['Review checklist', 'Mock checklist: readable text, visible focus, keyboard navigation, labelled fields and responsive cards. Test the smallest supported screen before adding detail.'],
  ['Team update', 'Mock update: the design review is ready.'],
  ['Research notes', 'Mock research: people scan collections of different sizes. Masonry is useful for independent notes and visual references, but not for data that must be compared row by row.'],
  ['Next milestone', 'Mock milestone: review component examples in both themes.'],
  ['Saved reference', 'Mock reference: tokens are the source of truth for colour, spacing, type and surface treatment.']
];

function note(title, content) {
  return element('article', { className: 'ds-masonry-card' }, element('span', { className: 'ds-masonry-eyebrow' }, text('Mock note', '模拟笔记')), element('h4', {}, title), element('p', {}, content));
}

export function demo(container) {
  const layout = createMasonry({ label: text('Mock project notes', '模拟项目笔记'), items: mockNotes.slice(0, 3).map(([title, content]) => note(title, content)) });
  container?.append(layout);
  return layout;
}

export function render(container) {
  const page = playground(container, { title: text('Masonry layout', '瀑布流布局'), description: text('A CSS-column layout for independent, variable-height cards. Reading and keyboard order follow each column, then the next. All content below is mock.', '用于不同高度独立卡片的 CSS 多列布局。阅读与键盘顺序沿当前列向下，然后进入下一列。以下内容均为模拟数据。') });
  let count = mockNotes.length;
  let label = text('Mock project notes', '模拟项目笔记');
  const feedback = statusMessage();
  const add = button(text('Add mock note', '添加模拟笔记'), () => { count += 1; update(); feedback.textContent = text(`Mock note added. ${count} notes.`, `已添加模拟笔记。共 ${count} 条。`); });
  const remove = button(text('Remove last note', '移除最后一条笔记'), () => { count = Math.max(0, count - 1); update(); feedback.textContent = text(`Last mock note removed. ${count} notes.`, `已移除最后一条模拟笔记。共 ${count} 条。`); });
  function update() {
    const items = Array.from({ length: count }, (_, index) => {
      const [title, content] = mockNotes[index % mockNotes.length];
      return note(`${title}${index >= mockNotes.length ? ` ${index + 1}` : ''}`, content);
    });
    page.preview.replaceChildren(createMasonry({ label, items }));
    remove.disabled = count === 0;
    page.setSnippet('import { createMasonry } from "./components/masonry.js";\nconst layout = createMasonry({ label: "Mock project notes", items: noteElements });\ncontainer.append(layout);');
  }
  page.controls.append(textControl(text('Collection label', '集合标签'), label, value => { label = value; update(); }), add, remove, feedback);
  page.states.append(statePreview(text('Compact live example', '紧凑实时示例'), demo()), statePreview(text('Single item', '单项'), createMasonry({ label: text('Single mock note', '单条模拟笔记'), items: [note('One clear idea', 'Mock note: independent content adapts naturally to the available width.')] })), statePreview(text('Empty collection', '空集合'), createMasonry({ label: text('Empty mock notes', '空模拟笔记'), items: [] })));
  update();
}

export const guide = {
  purpose: 'Arrange independent, variable-height cards into responsive columns without changing their source or keyboard order.',
  props: ['createMasonry({items: DOMNode[], label}) returns a named list DOM element.', 'Pass real card or article elements as items; this layout owns spacing and columns, not card behaviour.'],
  variants: ['Responsive multi-column collection, single item, empty collection.'],
  tokens: ['--space-3, --space-4, --radius-lg, --surface, --text, --muted, --color-border-subtle.'],
  states: ['Populated, single-item, empty; the playground adds and removes mock notes.'],
  keyboard: ['The layout adds no focus stops. Interactive content keeps its native keyboard behaviour.', 'Reading and Tab order proceed down the first column and then down subsequent columns.'],
  accessibility: ['A named list contains list items. Cards remain in DOM order; no JavaScript rearrangement or absolute positioning is used.', 'Use independent content only; this is not a tabular comparison or a chronological row-based feed.'],
  responsive: ['CSS columns automatically fit available width, collapse to one column on phones and keep each item intact.'],
  example: 'const layout = createMasonry({ label: "Mock project notes", items: [firstCard, secondCard, thirdCard] });\ncontainer.append(layout);',
  do: ['Use for independent notes, reference cards or visual collections with varying content lengths.', 'Keep the DOM and visual column reading order consistent.'],
  dont: ['Do not use for records that must align across rows; use Table or a normal grid.', 'Do not reorder focusable cards with JavaScript to imitate horizontal reading order.']
};
