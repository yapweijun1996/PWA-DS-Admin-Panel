import { createTag, renderTag } from './tag.js';

export function createPill(options = {}) { return createTag({ ...options, pill: true }); }

export function render(container) { renderTag(container, true); }
