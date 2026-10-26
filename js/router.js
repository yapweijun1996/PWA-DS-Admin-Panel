export const routes = [
  { path: '/overview', module: 'overview' },
  { path: '/tokens', module: 'tokens' },
  { path: '/components', module: 'components' },
  { path: '/components/:name', module: 'components' },
  { path: '/settings/general', module: 'settings', section: 'general' },
  { path: '/settings/appearance', module: 'settings', section: 'appearance' },
  { path: '/settings/about', module: 'settings', section: 'about' },
  { path: '/settings/pwa', module: 'settings', section: 'pwa' },
  { path: '/kits', module: 'kits' },
  { path: '/learn', module: 'learn' },
];

export function resolveRoute(hash = globalThis.location?.hash || '', landing = '/overview') {
  const path = String(hash).replace(/^#/, '').replace(/\/$/, '') || landing;
  const exact = routes.find(route => route.path === path);
  if (exact) return { ...exact, params: {}, valid: true };
  if (/^\/components\/[^/]+$/.test(path)) {
    let name;
    try { name = decodeURIComponent(path.split('/')[2]); } catch { return { path, module: 'notFound', params: {}, valid: false }; }
    return { path, module: 'components', params: { name }, valid: true };
  }
  if (path === '/settings') return { ...routes[4], params: {}, valid: true };
  return { path, module: 'notFound', params: {}, valid: false };
}

export const parseRoute = resolveRoute;

export function createRouter(onRoute, { landing = '/overview', beforeNavigate = async () => true } = {}) {
  let activeHash = globalThis.location.hash || `#${landing}`;
  let reverting = false;
  const route = async () => {
    if (reverting) { reverting = false; return; }
    const next = globalThis.location.hash || `#${landing}`;
    if (next !== activeHash && !(await beforeNavigate())) {
      reverting = true;
      globalThis.location.replace(activeHash);
      return;
    }
    activeHash = next;
    onRoute(resolveRoute(activeHash, landing));
  };
  globalThis.addEventListener('hashchange', route);
  if (!globalThis.location.hash) globalThis.history.replaceState(null, '', activeHash);
  onRoute(resolveRoute(activeHash, landing));
  return { refresh: () => onRoute(resolveRoute(activeHash, landing)), destroy: () => globalThis.removeEventListener('hashchange', route) };
}
