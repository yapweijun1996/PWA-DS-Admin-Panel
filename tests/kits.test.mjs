import test from 'node:test';
import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import vm from 'node:vm';
import { loadTokenSources, resolveTokens, themes } from '../scripts/build-tokens.mjs';
const root = new URL('../', import.meta.url);
async function walk(path) { const result = []; for (const entry of await readdir(new URL(path, root), { withFileTypes: true })) { const name = `${path}${entry.name}`; result.push(...(entry.isDirectory() ? await walk(`${name}/`) : [name])); } return result; }
test('kits are data and CSS only; component behavior is kit-independent', async () => {
  for (const path of [...await walk('kits/'), ...await walk('css/kits/')]) assert.ok(!/\.[cm]?js$/i.test(path), path);
  for (const path of (await walk('components/')).filter(path => path.endsWith('.js'))) assert.doesNotMatch(await readFile(new URL(path, root), 'utf8'), /\b(?:enterprise|liquid|ops)\b/, path);
});
test('appearance boot tolerates unavailable storage and resolves system theme before paint', async () => {
  const html = await readFile(new URL('index.html', root), 'utf8');
  const script = html.match(/<script id="appearance-boot">([\s\S]*?)<\/script>/)[1];
  const run = localStorage => { const document = { documentElement: { dataset: {} } }; vm.runInNewContext(script, {document,localStorage,matchMedia:()=>({matches:true})}); return document.documentElement.dataset; };
  assert.equal(run({getItem(){throw new Error('blocked');}}).theme, 'light');
  const stored = run({getItem:()=>JSON.stringify({theme:'system',palette:'rose',kit:'ops',density:'compact'})});
  assert.equal(stored.theme, 'dark');
  for (const kit of ['enterprise', 'liquid', 'ops']) {
    for (const panel of ['expanded', 'collapsed']) {
      const axes = run({getItem:()=>JSON.stringify({kit, panel})});
      assert.equal(axes.panel, panel, `${kit} preserves explicit ${panel} preference before paint`);
    }
  }
});

test('liquid low-alpha backgrounds require prefixed and standard glass filters', async () => {
  const sources = await loadTokenSources();
  const css = (await readFile(new URL('css/kits/liquid.css', root), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
  for (const theme of themes) {
    const tokens = resolveTokens(sources, theme, 'blue', 'liquid');
    const expand = (value, depth = 0) => {
      assert.ok(depth < 20, 'background token expansion must terminate');
      return value.replace(/var\(--([\w-]+)\)/g, (_, name) => expand(tokens[name] ?? '', depth + 1));
    };
    for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!selector.includes('[data-kit="liquid"]')) continue;
      const background = body.match(/(?:^|;)\s*background(?:-color)?\s*:\s*([^;]+)/)?.[1];
      if (!background) continue;
      const value = expand(background);
      let alpha = 1;
      if (value.includes('transparent')) {
        const tokenAlpha = /calc\(\s*([\d.]+)\s*\*\s*100%\)/.exec(value);
        const percent = /([\d.]+)%\s*,\s*transparent/.exec(value);
        alpha = tokenAlpha ? Number(tokenAlpha[1]) : percent ? Number(percent[1]) / 100 : 0;
      }
      const explicitAlpha = /(?:\/|rgba\([^)]*,)\s*([\d.]+)(%)?\s*\)/.exec(value);
      if (explicitAlpha) alpha = Number(explicitAlpha[1]) / (explicitAlpha[2] ? 100 : 1);
      if (alpha >= .9) continue;
      for (const property of ['backdrop-filter', '-webkit-backdrop-filter']) {
        assert.match(body, new RegExp(`(?:^|;)\\s*${property}:\\s*blur\\([^;]+saturate\\(`), `${theme}: ${selector.trim()} has alpha ${alpha} without ${property}`);
      }
    }
  }
});
