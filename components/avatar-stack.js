import { element, text, playground, textControl, choiceControl, statePreview } from './playground.js';
import { createAvatar } from './avatar.js';

export function createAvatarStack({ users = [], max = 4, size = 'small', label = text('Team members', '团队成员') } = {}) {
  const limit = Math.max(1, Math.floor(Number(max) || 1));
  const list = element('ul', { className: 'ds-avatar-stack', 'aria-label': label });
  users.slice(0, limit).forEach(user => list.append(element('li', {}, createAvatar({ ...user, size }))));
  if (users.length > limit) {
    const remaining = users.slice(limit).map(user => user.name).join(', ');
    list.append(element('li', {}, element('span', { className: `ds-avatar ds-avatar-${size} ds-avatar-overflow`, role: 'img', 'aria-label': text(`${users.length - limit} more: ${remaining}`, `另外 ${users.length - limit} 位：${remaining}`), title: remaining }, `+${users.length - limit}`)));
  }
  if (!users.length) list.append(element('li', { className: 'ds-avatar-stack-empty' }, text('No members', '暂无成员')));
  return list;
}

export function render(container) {
  const page = playground(container, { title: text('AvatarStack', '头像组'), description: text('Overlapping named avatars with an explicit overflow count. All people in this preview are mock data.', '重叠显示带名称的头像，并明确展示其余人数。此示例中的用户均为模拟数据。') });
  const users = ['Olivia Rhye', 'Phoenix Baker', 'Lana Steiner', 'Demi Wilkinson', 'Drew Cano', 'Natali Craig'].map(name => ({ name }));
  const props = { max: 4, size: 'small' };
  function update() { const stack = createAvatarStack({ users, ...props }); page.preview.replaceChildren(stack); page.setSnippet(stack.outerHTML); }
  page.controls.append(textControl(text('Visible members', '显示人数'), props.max, value => { props.max = Number(value); update(); }, { type: 'number', min: '1', max: '6' }), choiceControl(text('Avatar size', '头像大小'), props.size, ['small', 'medium', 'large'].map(value => ({ value, label: value })), value => { props.size = value; update(); }));
  page.states.append(statePreview(text('One member', '单个成员'), createAvatarStack({ users: users.slice(0, 1) })), statePreview(text('Overflow', '超出人数'), createAvatarStack({ users, max: 2 })), statePreview(text('Empty', '空'), createAvatarStack()));
  update();
}
