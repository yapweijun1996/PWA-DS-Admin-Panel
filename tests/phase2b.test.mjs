import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMetadata } from '../components/metadata.js';
import { registry } from '../components/registry.js';
import { resolveRoute } from '../js/router.js';

test('Guide rejects incomplete documentation and missing live demos', () => {
  const valid = registry[0];
  assert.deepEqual(validateMetadata([valid]), []);
  for (const key of ['purpose', 'props', 'variants', 'states', 'keyboard', 'accessibility', 'example', 'do', 'dont']) {
    const guide = { ...valid.guide }; delete guide[key];
    assert.ok(validateMetadata([{ ...valid, guide }]).some(error => error.includes(key)), key);
  }
  assert.ok(validateMetadata([{ ...valid, demo: undefined }]).some(error => error.includes('live demo')));
  assert.ok(validateMetadata([{ ...valid, category: 'Unknown' }]).some(error => error.includes('category')));
});
test('Guide route resolves independently of component playgrounds', () => {
  assert.equal(resolveRoute('#/learn').module, 'learn');
  assert.equal(resolveRoute('#/components/combobox').params.name, 'combobox');
});
