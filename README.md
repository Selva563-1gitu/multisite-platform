# DevPortal — Multi-Site CI/CD Hosting Platform

A production-grade monorepo platform that auto-discovers React apps, generates routes/navigation, and deploys to GitHub Pages via GitHub Actions. **Adding a new app = creating a folder + pushing.**

---

## Architecture Overview

```
repo/
├── apps/                     ← Drop new apps here
│   ├── network-dashboard/
│   │   ├── App.jsx           ← Required: root component
│   │   └── metadata.json     ← Required: name, slug, description
│   ├── cloud-monitor/
│   └── portfolio/
│
├── scripts/
│   ├── generate.js           ← AUTO-DISCOVERY ENGINE (run before every build)
│   └── scaffold.js           ← CLI scaffolder for new apps
│
├── src/
│   ├── App.jsx               ← Root with auto-generated routes
│   ├── main.jsx              ← React + HashRouter entry
│   ├── index.css             ← Global Tailwind + design tokens
│   ├── components/
│   │   ├── Sidebar.jsx       ← Auto-populated nav from generated/navigation.js
│   │   ├── AppShell.jsx      ← Breadcrumb wrapper + Error Boundary per app
│   │   └── LoadingScreen.jsx ← Shown during React.lazy() chunk load
│   └── pages/
│       ├── HomePage.jsx      ← Dashboard grid with search/filter
│       └── NotFound.jsx      ← 404 fallback
│
├── generated/                ← AUTO-GENERATED (don't edit manually)
│   ├── registry.js           ← slug → React.lazy(import) map
│   ├── routes.js             ← React Router route definitions
│   ├── navigation.js         ← Full app metadata for sidebar + home
│   └── manifest.json         ← Machine-readable manifest (CI/tooling)
│
├── public/
│   └── favicon.svg
│
├── .github/
│   └── workflows/
│       ├── deploy.yml        ← Push to main → build → deploy to gh-pages
│       └── ci.yml            ← PR validation: generate + build check
│
├── vite.config.js            ← Code-splitting, path aliases, base path
├── tailwind.config.js
└── package.json
```

---

## How Auto-Discovery Works

```
git push
    │
    ▼
GitHub Actions: deploy.yml
    │
    ├── npm ci
    │
    ├── node scripts/generate.js
    │       │
    │       ├── fs.readdirSync('apps/')
    │       │       ↓ finds: network-dashboard/, cloud-monitor/, portfolio/
    │       │
    │       ├── Reads each apps/<name>/metadata.json
    │       │
    │       └── Writes:
    │               generated/registry.js    → { slug: React.lazy(() => import()) }
    │               generated/routes.js      → [{ path, slug, name, component }]
    │               generated/navigation.js  → full metadata array
    │               generated/manifest.json  → JSON summary
    │
    ├── vite build
    │       │
    │       └── Each app → separate JS chunk (code-splitting)
    │               dist/assets/app-network-dashboard-[hash].js
    │               dist/assets/app-cloud-monitor-[hash].js
    │               dist/assets/app-portfolio-[hash].js
    │               dist/assets/vendor-[hash].js   (React + Router)
    │               dist/assets/index-[hash].js    (shell)
    │
    └── Deploy dist/ → gh-pages branch → GitHub Pages live
```

---

## Adding a New App

### Option A — Scaffold script (fastest)

```bash
node scripts/scaffold.js my-tool "My Tool" "Does something useful"
# Creates: apps/my-tool/App.jsx + apps/my-tool/metadata.json
```

### Option B — Manual

1. Create folder: `apps/my-tool/`

2. Add `apps/my-tool/metadata.json`:
```json
{
  "name": "My Tool",
  "slug": "my-tool",
  "description": "A brief description shown on the homepage.",
  "icon": "🛠️",
  "tags": ["tool"],
  "color": "amber",
  "order": 10,
  "status": "stable"
}
```

3. Add `apps/my-tool/App.jsx`:
```jsx
export default function MyTool() {
  return <div>Hello from My Tool!</div>
}
```

4. Push:
```bash
git add apps/my-tool/
git commit -m "feat: add my-tool app"
git push
```

GitHub Actions handles the rest. **No routing file touched. No import added. No config edited.**

---

## metadata.json Reference

| Field         | Type     | Required | Description                                     |
|---------------|----------|----------|-------------------------------------------------|
| `name`        | string   | ✅       | Display name shown in sidebar + cards           |
| `slug`        | string   | ✅       | URL path: `/my-tool`. Lowercase, hyphens only   |
| `description` | string   | —        | Shown on homepage card                          |
| `icon`        | string   | —        | Emoji shown in sidebar and card                 |
| `tags`        | string[] | —        | Used for filter pills on homepage               |
| `color`       | string   | —        | `cyan` \| `purple` \| `green` \| `amber` \| `rose` |
| `order`       | number   | —        | Sort order in sidebar (lower = first)           |
| `status`      | string   | —        | `stable` \| `beta` \| `wip`                    |

---

## GitHub Pages Setup

### 1. Create repository on GitHub

```bash
git init
git remote add origin https://github.com/<you>/<repo-name>.git
git push -u origin main
```

### 2. Add base path secret

Go to **Settings → Secrets and variables → Actions → New repository secret**:
- Name: `VITE_BASE_PATH`
- Value: `/<repo-name>/`  (e.g. `/devportal/`)

### 3. Enable GitHub Pages

Go to **Settings → Pages**:
- Source: **Deploy from a branch**
- Branch: **gh-pages**
- Folder: **/ (root)**

### 4. Push to main

GitHub Actions runs automatically. Your site will be live at:
```
https://<username>.github.io/<repo-name>/#/
```

---

## HashRouter vs BrowserRouter for GitHub Pages

| | HashRouter | BrowserRouter |
|---|---|---|
| URL format | `/#/cloud-monitor` | `/cloud-monitor` |
| Refresh works? | ✅ Always | ❌ 404 unless server configured |
| GitHub Pages compatible | ✅ Zero config | ⚠️ Needs 404.html hack |
| SEO | ❌ Hash not crawled | ✅ Clean URLs |
| Best for | Static hosts | Custom servers / Netlify / Vercel |

**This project uses HashRouter** — correct choice for GitHub Pages. BrowserRouter would require a [404.html redirect trick](https://github.com/rafgraph/spa-github-pages) and is fragile.

---

## Local Development

```bash
# Install deps
npm install

# Generate routes (also runs automatically in dev/build)
npm run generate

# Start dev server with HMR
npm run dev

# Production build
npm run build

# Preview production build locally
npm run preview
```

---

## Code-Splitting Explained

Each app becomes a **separate JS chunk** in the Vite build output:

```
dist/assets/vendor-[hash].js              ← React, ReactDOM, React Router (shared)
dist/assets/index-[hash].js              ← Shell: sidebar, homepage, routing
dist/assets/app-network-dashboard.js    ← Loaded only when user visits /network-dashboard
dist/assets/app-cloud-monitor.js        ← Loaded only when user visits /cloud-monitor
dist/assets/app-portfolio.js            ← Loaded only when user visits /portfolio
```

The mechanism:
```js
// generated/registry.js (auto-generated)
export const appRegistry = {
  'network-dashboard': lazy(() => import('../apps/network-dashboard/App.jsx')),
}
```

`React.lazy()` + `import()` = dynamic import. Vite sees this at build time and creates a separate chunk. At runtime, the browser only downloads an app's JS when the user navigates to it.

---

## Scalability Notes

- **100+ apps**: The generator script handles any number. Build time scales linearly; runtime cost per navigation stays constant (lazy loading).
- **Per-app dependencies**: Apps can use their own npm packages — they're just isolated React components. Import from `node_modules` freely; Vite deduplicates shared deps into the vendor chunk.
- **Independent deployments**: For fully independent CI per app, the architecture evolves toward a workspace monorepo (Turborepo/Nx) with per-app deploy workflows. This repo is stage 1.
- **Shared component library**: Create `src/lib/` with shared UI components. Any app can import them: `import { Button } from '../../src/lib/Button'`.

---

## Common Issues & Fixes

### "Cannot find module '../generated/routes.js'"
**Fix:** Run `node scripts/generate.js` before `vite`. The `npm run dev` and `npm run build` scripts do this automatically.

### App shows blank on GitHub Pages
**Check:** Is `VITE_BASE_PATH` set as a repo secret? Verify it matches your repo name exactly, including leading/trailing slashes: `/my-repo/`.

### Routes return 404 on hard refresh
**This is normal with BrowserRouter + GitHub Pages.** This project uses HashRouter, which doesn't have this issue.

### New app not appearing after push
**Check:** Does the app folder have both `App.jsx` and `metadata.json`? Does `metadata.json` have both `name` and `slug`? The generator logs warnings for skipped apps.

### Vite build fails with "lazy is not a function"
**Fix:** Ensure `generated/registry.js` uses `import { lazy } from 'react'` (it does by default). If you see this in CI, the generator ran before React was installed — ensure `npm ci` runs first.

---

## Future Enhancements

- **MDX support**: Add `remark` + `rehype` pipeline so apps can render Markdown content.
- **Per-app build status badge**: Read `generated/manifest.json` in the UI and show last deploy timestamp.
- **App thumbnails**: Add `thumbnail` field to metadata.json pointing to a PNG in `apps/<name>/preview.png`.
- **Plugin hooks**: Let apps export a `config.js` alongside App.jsx that extends Vite config (custom plugins, env vars).
- **Turborepo**: Migrate to `pnpm workspaces` + Turborepo for per-app caching and parallelized CI.
- **Storybook integration**: Each app registers its own stories, discoverable from the shell.
