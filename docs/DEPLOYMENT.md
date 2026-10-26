# Deployment (GitHub Pages)

Live demo: https://yapweijun1996.github.io/PWA-DS-Admin-Panel/

## How it deploys
- GitHub Pages source is set to **GitHub Actions** (Settings > Pages).
- Workflow `.github/workflows/pages.yml` runs on every push to `main` and on manual dispatch:
  1. checkout, set up Node 20
  2. `npm run verify` (tokens build, ratchet check, tests)
  3. copy shipped files to `dist/`
  4. upload the Pages artifact and deploy

## Subpath rule
The site is served under `/PWA-DS-Admin-Panel/`. All asset URLs, router links, the manifest `start_url` / `scope` and the Service Worker
registration must be relative. Absolute `/path` URLs break the demo.

## Service Worker updates
A new release changes the build id, so the browser installs a new worker that waits. The app shows "New version available";
the user clicks Update now, a loader appears, the worker activates and the page reloads once.

### CDN consistency and install integrity
GitHub Pages can serve a mixture of old and new files for roughly ten minutes after a deployment. A new worker alone is not proof that every CDN asset has caught up.

- Every precache request includes `?v=<BUILD>` and `cache: 'reload'` to avoid reusing a stale HTTP-cache response.
- Before writing the candidate cache, installation reads the fetched `js/build-info.js` and requires its exported `BUILD` to equal the worker's own build. Missing, malformed or mismatched build information, non-success HTTP responses and network failures reject installation.
- Failed installation deletes only that candidate build's cache. The active worker and its cache remain usable; a later update check retries installation. Obsolete caches are removed only when a successful worker activates.
- Assets are stored under canonical, query-free URLs and cache lookups ignore the query, so old links and cache-busting URLs work offline.
- This is a build-identity check, not a per-file content-hash guarantee. Cache-busting protects the remaining assets; there is no cryptographic manifest in this release.

The app checks for updates on startup and when a tab becomes visible, with automatic checks throttled to once per ten minutes. An unknown route forces a check: a waiting or installing update offers **A newer version is available - Update now**, routed through the same explicit activation, dirty-edit guard, loader and single-reload flow. With no update it retains search and the Home link. No update auto-activates.

## Local preview
```bash
npm run build
node scripts/serve.mjs 8080
```
Open http://localhost:8080/ .

## Rollback
Revert the offending commit on `main` and push; the workflow redeploys the previous state.
