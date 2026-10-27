// Full i18n verification run (dev tool): route scan, interaction sweeps, shell sweep and a per-page text dump for review.
//   const { runAll } = await import('/scripts/i18n-full.mjs'); await runAll({ post: '/save' })   // posts /save/route, /save/s1.., /save/shell, /save/dump
// Set the language to Chinese first; every phase uses the same leftover-English rules (scripts/i18n-scan.mjs).
import { scanI18n, goto } from './i18n-scan.mjs';
import { sweepI18n } from './i18n-sweep.mjs';
import { sweepShell } from './i18n-shell-sweep.mjs';

export async function allPaths() {
  const { routes } = await import('../js/router.js');
  const { registry } = await import('../components/registry.js');
  return [...new Set([...routes.map(route => route.path).filter(path => !path.includes(':')), ...registry.map(item => `/components/${item.name}`), '/examples/erp/order/SO-1042', '/examples/crm/customer/CRM-001', '/examples/school/student/STU-001'])];
}

export async function dumpPages({ post, settle = 500 } = {}) {
  const dump = {};
  for (const path of await allPaths()) {
    await goto(path, settle);
    const main = document.querySelector('main');
    const attrs = [...new Set([...main.querySelectorAll('[aria-label],[placeholder],[title]')].flatMap(element => ['aria-label', 'placeholder', 'title'].filter(name => element.hasAttribute(name)).map(name => `${name}: ${element.getAttribute(name)}`)))];
    dump[path] = { title: document.title, text: main.innerText.replace(/\n{2,}/g, '\n'), attrs };
  }
  // The Guide has three tabs; the first is the default render above.
  await goto('/learn', settle);
  for (const tab of [...document.querySelectorAll('main [role=tab]')].slice(0, 3)) {
    tab.click();
    await new Promise(resolve => setTimeout(resolve, settle));
    const main = document.querySelector('main');
    const attrs = [...new Set([...main.querySelectorAll('[aria-label],[placeholder],[title]')].flatMap(element => ['aria-label', 'placeholder', 'title'].filter(name => element.hasAttribute(name)).map(name => `${name}: ${element.getAttribute(name)}`)))];
    dump[`/learn#${tab.textContent.trim()}`] = { title: document.title, text: main.innerText.replace(/\n{2,}/g, '\n'), attrs };
  }
  if (post) await fetch(post, { method: 'POST', body: JSON.stringify(dump) });
  return Object.keys(dump).length;
}

export async function runAll({ post = '/save' } = {}) {
  const summary = {};
  summary.route = (await scanI18n({ post: `${post}/route` })).remaining;
  const paths = await allPaths();
  summary.sweeps = [];
  for (let index = 0, batch = 1; index < paths.length; index += 14, batch += 1) summary.sweeps.push((await sweepI18n({ paths: paths.slice(index, index + 14), post: `${post}/s${batch}` })).remaining);
  summary.shell = (await sweepShell({ post: `${post}/shell` })).remaining;
  summary.dumped = await dumpPages({ post: `${post}/dump` });
  return summary;
}
