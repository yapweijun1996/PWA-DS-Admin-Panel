import { element, text, playground, textControl, choiceControl, statePreview } from './playground.js';

export function createAvatar({ name = text('Unknown person', '未知用户'), src, size = 'medium', shape = 'circle' } = {}) {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map(word => Array.from(word)[0]).join('').toLocaleUpperCase() || '?';
  const accessibleName = String(name).trim() || text('Unknown person', '未知用户');
  const avatar = element('span', { className: `ds-avatar ds-avatar-${['small', 'medium', 'large'].includes(size) ? size : 'medium'}${shape === 'square' ? ' ds-avatar-square' : ''}`, role: 'img', 'aria-label': accessibleName, title: accessibleName }, element('span', { className: 'ds-avatar-initials', 'aria-hidden': 'true' }, initials));
  if (src) {
    const image = element('img', { src, alt: '', loading: 'lazy', decoding: 'async', onerror: () => { image.remove(); } });
    avatar.append(image);
  }
  return avatar;
}

export function render(container) {
  const page = playground(container, { title: text('Avatar', '头像'), description: text('A person or organisation image with an accessible name and a local initials fallback. No remote portrait is required.', '展示用户或机构图像，包含无障碍名称及首字母备用图像。无需远程头像。') });
  const props = { name: 'Olivia Rhye', size: 'medium', shape: 'circle' };
  function update() { const avatar = createAvatar(props); page.preview.replaceChildren(avatar); page.setSnippet(avatar.outerHTML); }
  page.controls.append(textControl(text('Name', '名称'), props.name, value => { props.name = value; update(); }), choiceControl(text('Size', '大小'), props.size, ['small', 'medium', 'large'].map(value => ({ value, label: value })), value => { props.size = value; update(); }), choiceControl(text('Shape', '形状'), props.shape, ['circle', 'square'].map(value => ({ value, label: value })), value => { props.shape = value; update(); }));
  page.states.append(statePreview(text('Initials fallback', '首字母备用'), createAvatar({ name: 'Phoenix Baker' })), statePreview(text('Organisation', '机构'), createAvatar({ name: 'Forma Studio', shape: 'square' })), statePreview(text('Missing name', '缺少名称'), createAvatar({ name: '' })), statePreview(text('Long name', '较长名称'), createAvatar({ name: 'Amelia Charlotte Davis', size: 'large' })));
  update();
}
