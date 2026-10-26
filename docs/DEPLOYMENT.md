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

## Local preview
```bash
npm run build
node scripts/serve.mjs 8080
```
Open http://localhost:8080/ .

## Rollback
Revert the offending commit on `main` and push; the workflow redeploys the previous state.
