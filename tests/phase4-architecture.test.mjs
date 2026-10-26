import test from 'node:test';
import assert from 'node:assert/strict';
import { exampleImportViolations } from '../scripts/check.mjs';
import { resolveRoute } from '../js/router.js';
import { exampleRoutes } from '../js/example-routes.js';

const statement = (path, dynamic = false) => dynamic ? `import(${JSON.stringify(path)})` : `import { render } from ${JSON.stringify(path)};`;
test('L7 boundary rejects static, dynamic, re-export and CSS imports from lower layers', () => {
  const target = '../js/' + 'examples/erp/index.js';
  assert.equal(exampleImportViolations(statement(target), 'components/card.js').length, 1);
  assert.equal(exampleImportViolations(statement('./examples/crm/index.js', true), 'js/learn.js').length, 1);
  assert.equal(exampleImportViolations(`export { render } from '${target}'`, 'components/table.js').length, 1);
  assert.equal(exampleImportViolations('@import "./examples/erp.css";', 'css/app.css').length, 1);
  assert.deepEqual(exampleImportViolations(statement('../components/card.js'), 'js/learn.js'), []);
  assert.deepEqual(exampleImportViolations(statement('./examples/erp/index.js', true), 'js/example-routes.js'), []);
  assert.deepEqual(exampleImportViolations(statement('../../../components/card.js'), 'js/examples/erp/index.js'), []);
});

test('every registered example route resolves to its actual product and screen', () => {
  for (const entry of exampleRoutes) {
    const route = resolveRoute(`#${entry.path}`);
    assert.equal(route.valid, true);
    assert.equal(route.module, 'examples');
    const [, , domain, screen, id] = entry.path.split('/');
    assert.equal(route.params.domain, domain);
    assert.equal(route.params.screen, screen);
    assert.equal(route.params.id, id);
  }
  assert.equal(resolveRoute('#/examples/unknown').valid, false);
  assert.equal(resolveRoute('#/examples/erp/unknown').valid, false);
});
