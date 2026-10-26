const BUILD = '20261026144338793';
const PRECACHE = ["./components/alert.js","./components/audit-timeline.js","./components/avatar-stack.js","./components/avatar.js","./components/badge.js","./components/breadcrumbs.js","./components/bulk-action-toolbar.js","./components/button-group.js","./components/button.js","./components/calendar.js","./components/card.js","./components/chart.js","./components/checkbox.js","./components/column-visibility-menu.js","./components/combobox.js","./components/command-palette.js","./components/confirm-dialog.js","./components/currency-input.js","./components/dashboard-layout.js","./components/data-grid.js","./components/date-picker.js","./components/date-range-picker.js","./components/description-list.js","./components/detail-layout.js","./components/detail-panel.js","./components/drag-drop-zone.js","./components/drawer.js","./components/dropdown-button.js","./components/empty-state.js","./components/error-state.js","./components/export-dialog.js","./components/file-upload.js","./components/filter-builder.js","./components/filter-chip.js","./components/form-field.js","./components/form-layout.js","./components/form-section.js","./components/icon-button.js","./components/import-wizard.js","./components/input.js","./components/kanban.js","./components/kpi-card.js","./components/listing-layout.js","./components/masonry.js","./components/master-detail-layout.js","./components/metadata.js","./components/modal.js","./components/number-input.js","./components/pagination.js","./components/permission-gate.js","./components/permission-state.js","./components/pill.js","./components/playground.js","./components/popover.js","./components/progress-bar.js","./components/radio-group.js","./components/registry.js","./components/saved-view-selector.js","./components/select.js","./components/skeleton.js","./components/spinner.js","./components/split-button.js","./components/stepper.js","./components/switch.js","./components/table.js","./components/tabs.js","./components/tag.js","./components/textarea.js","./components/timeline.js","./components/toast.js","./components/tooltip.js","./components/tree-view.js","./components/unsaved-changes-guard.js","./components/workspace-layout.js","./css/app.css","./css/appearance.css","./css/components/alert.css","./css/components/audit-timeline.css","./css/components/avatar-stack.css","./css/components/avatar.css","./css/components/badge.css","./css/components/breadcrumbs.css","./css/components/bulk-action-toolbar.css","./css/components/button-group.css","./css/components/button.css","./css/components/calendar.css","./css/components/card.css","./css/components/chart.css","./css/components/checkbox.css","./css/components/column-visibility-menu.css","./css/components/combobox.css","./css/components/command-palette.css","./css/components/confirm-dialog.css","./css/components/currency-input.css","./css/components/dashboard-layout.css","./css/components/data-grid.css","./css/components/date-picker.css","./css/components/date-range-picker.css","./css/components/description-list.css","./css/components/detail-layout.css","./css/components/detail-panel.css","./css/components/drag-drop-zone.css","./css/components/drawer.css","./css/components/dropdown-button.css","./css/components/empty-state.css","./css/components/error-state.css","./css/components/export-dialog.css","./css/components/file-upload.css","./css/components/filter-builder.css","./css/components/filter-chip.css","./css/components/form-field.css","./css/components/form-layout.css","./css/components/form-section.css","./css/components/icon-button.css","./css/components/import-wizard.css","./css/components/input.css","./css/components/kanban.css","./css/components/kpi-card.css","./css/components/listing-layout.css","./css/components/masonry.css","./css/components/master-detail-layout.css","./css/components/modal.css","./css/components/number-input.css","./css/components/pagination.css","./css/components/permission-gate.css","./css/components/permission-state.css","./css/components/pill.css","./css/components/playground.css","./css/components/popover.css","./css/components/progress-bar.css","./css/components/radio-group.css","./css/components/saved-view-selector.css","./css/components/select.css","./css/components/skeleton.css","./css/components/spinner.css","./css/components/split-button.css","./css/components/stepper.css","./css/components/switch.css","./css/components/table.css","./css/components/tabs.css","./css/components/tag.css","./css/components/textarea.css","./css/components/timeline.css","./css/components/toast.css","./css/components/tooltip.css","./css/components/tree-view.css","./css/components/unsaved-changes-guard.css","./css/components/workspace-layout.css","./css/examples/crm.css","./css/examples/erp.css","./css/examples/school.css","./css/kits/enterprise.css","./css/kits/liquid.css","./css/kits/ops.css","./css/learn.css","./css/shell.css","./css/showcase.css","./css/tokens.css","./icons/icon-192.png","./icons/icon-512.png","./icons/icon-maskable-512.png","./index.html","./js/app.js","./js/build-info.js","./js/example-routes.js","./js/examples/crm/index.js","./js/examples/erp/index.js","./js/examples/index.js","./js/examples/school/index.js","./js/i18n.js","./js/icons.js","./js/kits-showcase.js","./js/learn.js","./js/logic/calendar.js","./js/logic/command.js","./js/logic/crm.js","./js/logic/csv.js","./js/logic/currency.js","./js/logic/data-grid.js","./js/logic/date.js","./js/logic/erp.js","./js/logic/filter.js","./js/logic/kanban.js","./js/logic/layout.js","./js/logic/number.js","./js/logic/school.js","./js/logic/tree.js","./js/pane-resizer.js","./js/patterns.js","./js/pwa.js","./js/router.js","./manifest.webmanifest","./tokens/palettes.json","./tokens/primitives.json","./tokens/semantics.json","./tokens/tokens.json","./version.json"];
const CACHE_PREFIX = `ds-admin-${new URL(self.registration.scope).pathname}-`;
const CACHE = `${CACHE_PREFIX}${BUILD}`;
const shellURL = new URL('./index.html', self.registration.scope).href;
const assetURLs = new Set(PRECACHE.map(path => new URL(path, self.registration.scope).href));

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(PRECACHE)));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE).map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting());
  if (event.data?.type === 'GET_BUILD') event.ports[0]?.postMessage({ build: BUILD });
});

self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (request.mode === 'navigate' || url.pathname.endsWith('.html')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      } catch {
        return (await cache.match(request)) || (await cache.match(shellURL)) || Response.error();
      }
    })());
    return;
  }
  const assetURL = new URL(url);
  assetURL.search = '';
  if (!assetURLs.has(assetURL.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(request) || await cache.match(assetURL.href);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  })());
});
