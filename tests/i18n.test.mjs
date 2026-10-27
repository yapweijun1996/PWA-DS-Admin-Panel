import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { translations, t, setLanguage } from '../js/i18n.js';
import { zhSources, zhMessages, zhKeepEnglish } from '../js/i18n/zh/index.js';

const placeholders = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort().join(',');
const hasCJK = text => /[\u3400-\u9fff]/.test(text);

test('zh message files do not define the same English key twice', () => {
  const owner = new Map();
  for (const [area, messages] of Object.entries(zhSources)) {
    for (const key of Object.keys(messages)) {
      assert.ok(!owner.has(key), `"${key}" is defined in both ${owner.get(key)} and ${area}`);
      owner.set(key, area);
    }
  }
});

test('zh messages are translated and only use placeholders from their key', () => {
  for (const [key, value] of Object.entries(zhMessages)) {
    assert.equal(typeof value, 'string', key);
    assert.ok(value.trim(), `empty translation for "${key}"`);
    const known = new Set(placeholders(key).split(',').filter(Boolean));
    for (const name of placeholders(value).split(',').filter(Boolean)) assert.ok(known.has(name), `placeholder {${name}} is not in the key "${key}"`);
    assert.ok(hasCJK(value) || !/[A-Za-z]/.test(value) || value === key && !/[a-z]{3,}/.test(key), `"${key}" is not translated`);
  }
});

test('a message key never repeats a placeholder name (the last capture would overwrite the others)', () => {
  for (const key of Object.keys(zhMessages)) {
    const names = [...key.matchAll(/\{(\w+)\}/g)].map(match => match[1]);
    assert.equal(new Set(names).size, names.length, `repeated placeholder in "${key}"`);
  }
});

test('t() interpolates placeholders and falls back to the English source text', () => {
  setLanguage('zh');
  assert.equal(t('overview'), '概览');
  assert.equal(t('Not translated {n}', { n: 3 }), 'Not translated 3');
  setLanguage('en');
  assert.equal(t('overview'), 'Overview');
  assert.equal(t('{a} of {b}', { a: 1, b: 2 }), '1 of 2');
});

test('every literal t() key used in source has a Chinese translation', async () => {
  const files = [];
  const walk = async directory => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) { if (!path.startsWith('js/i18n')) await walk(path); } else if (entry.name.endsWith('.js') && path !== 'js/i18n.js') files.push(path);
    }
  };
  for (const directory of ['js', 'components']) await walk(directory);
  const missing = [];
  for (const file of files) {
    const source = await readFile(file, 'utf8');
    for (const match of source.matchAll(/(?<![\w.$])t\(\s*(['"])((?:\\.|(?!\1)[^\\\n])*)\1/g)) {
      const key = match[2].replace(/\\(['"\\])/g, '$1');
      if (!(key in translations.zh) && !(key in zhMessages)) missing.push(`${file}: ${key}`);
    }
  }
  assert.deepEqual(missing, []);
});

test('keep-English entries are not also translated', () => {
  for (const key of zhKeepEnglish) assert.ok(!(key in zhMessages), `"${key}" is both translated and kept in English`);
});

test('matcher translates exact text, keeps whitespace and fills templates with localized captures', async () => {
  const { createMatcher } = await import('../js/i18n/match.js');
  const { translate } = createMatcher({ 'Save': '保存', '{n} of {total}': '{n} / {total}', '{month} · Customers: {n}': '{month}客户:{n}', 'Jan': '1月', 'Total {amount}': '合计 {amount}', 'Total': '总计' });
  assert.equal(translate('  Save\n '), '  保存\n ');
  assert.equal(translate('3 of 12'), '3 / 12');
  assert.equal(translate('Jan · Customers: 18'), '1月客户:18');
  assert.equal(translate('Total $4,200'), '合计 $4,200');
  assert.equal(translate('Total'), '总计');
  assert.equal(translate('Unknown text'), 'Unknown text');
  assert.equal(translate('   '), '   ');
  const dates = createMatcher({ 'Oct': '10月', '{day} {month} {year}': '{year}年{month}{day}日', 'Field label': '字段标签' }).translate;
  assert.equal(dates('26 Oct 2026'), '2026年10月26日');
  assert.equal(dates('Another field label'), 'Another field label');
  assert.equal(dates('Field label'), '字段标签');
  const loose = createMatcher({ 'No {name}': '没有{name}' }).translate;
  assert.equal(loose('No orders'), 'No orders');
  assert.equal(createMatcher({ 'No {name}': '没有{name}', orders: '订单' }).translate('No orders'), '没有订单');
  assert.equal(createMatcher({ '{name}. Press Space': '{name}。按空格' }, { keep: ['Mock Acme renewal'] }).translate('Mock Acme renewal. Press Space'), 'Mock Acme renewal。按空格');
  assert.equal(createMatcher({ 'Token / {code}': '令牌 / {code}' }).translate('Token / series-1'), '令牌 / series-1');
  assert.equal(loose('No conditions. All records are included.'), 'No conditions. All records are included.');
  const ranged = createMatcher({ 'Oct': '10月', '{day} {month} {year} – {day2} {month2} {year2}': '{year}年{month}{day}日 至 {year2}年{month2}{day2}日' }).translate;
  assert.equal(ranged('26 Oct 2026 – 30 Oct 2026'), '2026年10月26日 至 2026年10月30日');
});

// Guard against a global replacement run that once turned many unrelated words into "课程" (course).
test('"课程" (course/lesson) only appears in school and timetable messages', () => {
  const stray = Object.entries(zhMessages).filter(([key, value]) => value.includes('课程') && !/lesson|course|class|schedule|timetable|milestone/i.test(key));
  assert.deepEqual(stray.map(([key]) => key), []);
});
