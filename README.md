# DevPortal — Multi-Site CI/CD Hosting Platform

A production-grade monorepo platform that auto-discovers React apps, plain HTML files, and external URLs — generates routes/navigation, and deploys to GitHub Pages via GitHub Actions.

**Live:** https://selva563-1gitu.github.io/multisite-platform/#/

---

## Architecture Overview

```
repo/
├── apps/                         ← Drop new apps here
│   ├── network-dashboard/        ← type: react
│   │   ├── App.jsx               ← Required for react type
│   │   └── metadata.json
│   ├── cloud-monitor/            ← type: react (beta)
│   │   ├── App.jsx
│   │   └── metadata.json
│   ├── portfolio/                ← type: react
│   │   ├── App.jsx
│   │   └── metadata.json
│   ├── html-calculator/          ← type: html
│   │   ├── index.html            ← Required for html type (plain HTML/CSS/JS)
│   │   └── metadata.json
│   └── wikipedia/                ← type: url
│       └── metadata.json         ← Only needs { "url": "https://..." }
│
├── scripts/
│   ├── generate.js               ← AUTO-DISCOVERY ENGINE (runs before every build)
│   └── scaffold.js               ← CLI to scaffold new apps quickly
│
├── src/
│   ├── App.jsx                   ← Root router — dispatches by app type
│   ├── main.jsx                  ← React + HashRouter entry point
│   ├── index.css                 ← Global Tailwind + CSS design tokens
│   ├── components/
│   │   ├── Sidebar.jsx           ← Auto-populated nav with sort control
│   │   ├── AppShell.jsx          ← Breadcrumb + type badge + Error Boundary
│   │   ├── IframeShell.jsx       ← Iframe renderer for html/url types
│   │   ├── SortControl.jsx       ← Reusable sort dropdown (used in sidebar + homepage)
│   │   └── LoadingScreen.jsx     ← Shown during React.lazy() chunk load
│   ├── hooks/
│   │   └── useSortedApps.js      ← Sort logic + localStorage persistence
│   └── pages/
│       ├── HomePage.jsx          ← Dashboard grid with search, filter, sort
│       └── NotFound.jsx          ← 404 fallback
│
├── generated/                    ← AUTO-GENERATED — never edit manually
│   ├── registry.js               ← slug → React.lazy() map (react apps only)
│   ├── routes.js                 ← Full route config for all types
│   ├── navigation.js             ← Sidebar + homepage metadata
│   └── manifest.json             ← Machine-readable build summary
│
├── public/
│   └── apps/                     ← HTML apps auto-copied here by generate.js
│       └── html-calculator/
│           └── index.html
│
├── .github/
│   └── workflows/
│       ├── deploy.yml            ← Push to main → build → deploy to gh-pages
│       └── ci.yml                ← PR validation: generate + build check
│
├── vite.config.js                ← base: '/multisite-platform/' (hardcoded)
├── tailwind.config.js
└── package.json
```

---

## App Types

The platform supports 3 app types declared in `metadata.json`:

| type    | Needs            | How it renders                          |
|---------|------------------|-----------------------------------------|
| `react` | `App.jsx`        | `React.lazy()` → own JS chunk           |
| `html`  | `index.html`     | Static file served via `<iframe>`       |
| `url`   | `"url"` in meta  | External URL embedded in `<iframe>`     |

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
    │       ├── Scans /apps/ — reads metadata.json from each folder
    │       ├── Validates per type (react→App.jsx, html→index.html, url→url field)
    │       ├── Copies HTML apps → /public/apps/<name>/ (Vite serves these as static)
    │       └── Writes:
    │               generated/registry.js    → React.lazy() map
    │               generated/routes.js      → route config with type info
    │               generated/navigation.js  → full metadata + lastModified
    │               generated/manifest.json  → JSON summary
    │
    ├── vite build
    │       └── Per-app JS chunks (react apps only):
    │               dist/assets/app-network-dashboard-[hash].js
    │               dist/assets/app-cloud-monitor-[hash].js
    │               dist/assets/app-portfolio-[hash].js
    │               dist/assets/vendor-[hash].js
    │               dist/assets/index-[hash].js
    │               dist/apps/html-calculator/index.html  ← static copy
    │
    └── Deploy dist/ → gh-pages branch → live
```

---

## Adding a New App

### Scaffold (fastest)

```bash
# React app
node scripts/scaffold.js my-tool "My Tool" react "Description"

# Plain HTML app
node scripts/scaffold.js my-page "My Page" html "Description"

# External URL embed
node scripts/scaffold.js ext-app "Ext App" url "Description" --url https://example.com
```

### Manual

1. Create `apps/<slug>/`
2. Add `metadata.json`:

```json
{
  "name": "My App",
  "slug": "my-app",
  "description": "What this app does.",
  "icon": "🛠️",
  "tags": ["tool"],
  "color": "cyan",
  "order": 10,
  "status": "stable",
  "type": "react"
}
```

3. Add the required file for the type (`App.jsx` / `index.html`)
4. Push — GitHub Actions handles everything else.

---

## metadata.json Reference

| Field           | Type     | Required | Description                                          |
|-----------------|----------|----------|------------------------------------------------------|
| `name`          | string   | ✅       | Display name in sidebar and cards                    |
| `slug`          | string   | ✅       | URL path: `/my-app`. Lowercase + hyphens only        |
| `type`          | string   | ✅       | `react` \| `html` \| `url`                          |
| `description`   | string   | —        | Shown on homepage card                               |
| `icon`          | string   | —        | Emoji for sidebar and card                           |
| `tags`          | string[] | —        | Used for filter pills on homepage                    |
| `color`         | string   | —        | `cyan` \| `purple` \| `green` \| `amber` \| `rose`  |
| `order`         | number   | —        | Used when sort mode is "Manual Order"                |
| `status`        | string   | —        | `stable` \| `beta` \| `wip`                         |
| `url`           | string   | url only | External URL to embed                                |

---

## Sorting

Apps can be sorted 4 ways — controlled via dropdown in **both the sidebar and homepage**. Choice persists in `localStorage` across refreshes.

| Mode           | Behaviour                                          |
|----------------|----------------------------------------------------|
| A → Z          | Alphabetical ascending (default)                   |
| Z → A          | Alphabetical descending                            |
| Last Modified  | Most recently changed file in the app folder first |
| Manual Order   | `order` field in metadata.json                     |

---

## GitHub Pages Setup

### 1. Create and push repo

```bash
git init
git remote add origin https://github.com/selva563-1gitu/multisite-platform.git
git add .
git commit -m "init"
git push -u origin main
```

### 2. Enable GitHub Pages

Go to **Settings → Pages**:
- Source: **Deploy from a branch**
- Branch: **gh-pages**
- Folder: **/ (root)**

### 3. Push to main

GitHub Actions deploys automatically. Live at:
```
https://selva563-1gitu.github.io/multisite-platform/#/
```

> ⚠️ If you fork or rename the repo, update `base` in `vite.config.js`:
> ```js
> const base = '/your-new-repo-name/'
> ```

---

## Base Path — The Most Common Deployment Issue

**Symptom:** Blank page, `NS_ERROR_CORRUPTED_CONTENT`, assets 404ing, MIME type errors.

**Cause:** Vite's `base` doesn't match your GitHub Pages URL path.

**Fix:** In `vite.config.js`, `base` must exactly match your repo name with leading and trailing slashes:

```js
// ✅ Correct — repo is github.com/selva563-1gitu/multisite-platform
const base = '/multisite-platform/'

// ❌ Wrong — missing slashes, wrong name, or using env var that isn't set
const base = 'multisite-platform'
const base = '/wrong-name/'
const base = process.env.VITE_BASE_PATH || '/'  // fails if secret not set
```

---

## HashRouter vs BrowserRouter

This project uses **HashRouter** — correct for GitHub Pages.

| | HashRouter | BrowserRouter |
|---|---|---|
| URL format | `/#/cloud-monitor` | `/cloud-monitor` |
| Hard refresh | ✅ Always works | ❌ 404 unless server configured |
| GitHub Pages | ✅ Zero config | ⚠️ Needs 404.html hack |

---

## Local Development

```bash
npm install
npm run dev
# Open: http://localhost:5173/multisite-platform/
```

> Note: With `base: '/multisite-platform/'`, local dev URL has the sub-path too.
> Everything works normally — Vite handles it.

---

## Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Blank page / assets 404 | Wrong `base` in vite.config.js | Set `base` to `/your-repo-name/` |
| `NS_ERROR_CORRUPTED_CONTENT` | Asset paths wrong, GitHub serves 404 HTML as JS | Same — fix `base` |
| MIME type error on JS | GitHub Pages returning HTML (404) instead of JS | Same — fix `base` |
| App cards not showing | CSS animation conflict (fixed) | Already patched |
| Portfolio crashes after ~5s | Terminal interval setState bug (fixed) | Already patched |
| New app not appearing | Missing `App.jsx` or `metadata.json` | Check generator warnings |
| HTML app not loading | Not copied to `public/apps/` | Re-run `node scripts/generate.js` |
| URL app shows error | Site blocks iframes (`X-Frame-Options`) | Use "Open in new tab" button |
