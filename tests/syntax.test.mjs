import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const run = promisify(execFile);

async function sources(directory, found = []) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = `${directory}/${entry.name}`;
    if (entry.isDirectory()) await sources(path, found); else if (/\.m?js$/.test(entry.name)) found.push(path);
  }
  return found;
}

// Browser-only modules are not imported by unit tests, so a duplicate identifier or typo there would otherwise ship unnoticed.
test('every shipped and tooling module parses', async () => {
  const files = [...await sources('js'), ...await sources('components'), ...await sources('scripts'), 'sw.js'];
  const failures = [];
  await Promise.all(files.map(async file => {
    try { await run(process.execPath, ['--check', file]); } catch (error) { failures.push(`${file}: ${String(error.stderr).split('\n').find(line => /Error/.test(line)) || error.message}`); }
  }));
  assert.deepEqual(failures, []);
});
