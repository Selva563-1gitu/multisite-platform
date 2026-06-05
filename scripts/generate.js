/**
 * scripts/generate.js
 * ─────────────────────────────────────────────────────────
 * AUTO-DISCOVERY ENGINE — supports 3 app types:
 *
 *   type: "react"  → App.jsx loaded via React.lazy()
 *   type: "html"   → index.html served in an <iframe>
 *   type: "url"    → external URL embedded in an <iframe>
 *
 * Validation rules per type:
 *   react  → needs App.jsx
 *   html   → needs index.html
 *   url    → needs "url" field in metadata.json
 *
 * Generated files → /generated/
 *   registry.js    — React.lazy() map (react-type apps only)
 *   routes.js      — full route config for all types
 *   navigation.js  — sidebar + homepage metadata
 *   manifest.json  — machine-readable summary
 * ─────────────────────────────────────────────────────────
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT      = path.resolve(__dirname, '..')
const APPS_DIR  = path.join(ROOT, 'apps')
const GEN_DIR   = path.join(ROOT, 'generated')
// HTML apps are copied here so Vite serves them as static assets
const PUBLIC_APPS_DIR = path.join(ROOT, 'public', 'apps')

const TAG_COLORS = {
  dashboard:  'cyan',
  monitoring: 'purple',
  portfolio:  'green',
  tool:       'amber',
  demo:       'rose',
  default:    'cyan',
}

const VALID_TYPES = ['react', 'html', 'url']


// ─── Helper: get last modified timestamp of an app folder ──
function getLastModified(dir) {
  let latest = 0
  for (const f of fs.readdirSync(dir)) {
    try {
      const mtime = fs.statSync(path.join(dir, f)).mtimeMs
      if (mtime > latest) latest = mtime
    } catch {}
  }
  return latest
}

// ─── STEP 1: Scan /apps/ ─────────────────────────────────

function discoverApps() {
  if (!fs.existsSync(APPS_DIR)) {
    fs.mkdirSync(APPS_DIR, { recursive: true })
    return []
  }

  const entries = fs.readdirSync(APPS_DIR, { withFileTypes: true })
  const apps = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const appDir   = path.join(APPS_DIR, entry.name)
    const metaPath = path.join(appDir, 'metadata.json')

    if (!fs.existsSync(metaPath)) {
      console.warn(`[generate] ⚠  Skipping "${entry.name}" — missing metadata.json`)
      continue
    }

    let meta
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    } catch (e) {
      console.warn(`[generate] ✗  Skipping "${entry.name}" — invalid metadata.json: ${e.message}`)
      continue
    }

    if (!meta.name || !meta.slug) {
      console.warn(`[generate] ✗  Skipping "${entry.name}" — metadata must have "name" and "slug"`)
      continue
    }

    // Default type is "react" for backwards compatibility
    const type = meta.type || 'react'

    if (!VALID_TYPES.includes(type)) {
      console.warn(`[generate] ✗  Skipping "${entry.name}" — unknown type "${type}". Use: react | html | url`)
      continue
    }

    // ── Per-type validation ──────────────────────────────
    if (type === 'react') {
      const appJsx = path.join(appDir, 'App.jsx')
      if (!fs.existsSync(appJsx)) {
        console.warn(`[generate] ✗  Skipping "${entry.name}" — type "react" needs App.jsx`)
        continue
      }
    }

    if (type === 'html') {
      const htmlFile = path.join(appDir, 'index.html')
      if (!fs.existsSync(htmlFile)) {
        console.warn(`[generate] ✗  Skipping "${entry.name}" — type "html" needs index.html`)
        continue
      }
    }

    if (type === 'url') {
      if (!meta.url) {
        console.warn(`[generate] ✗  Skipping "${entry.name}" — type "url" needs a "url" field in metadata.json`)
        continue
      }
    }

    apps.push({
      folderName:  entry.name,
      type,
      name:        meta.name,
      slug:        meta.slug,
      description: meta.description || '',
      icon:        meta.icon || '📦',
      tags:        Array.isArray(meta.tags) ? meta.tags : [],
      color:       meta.color || TAG_COLORS[meta.tags?.[0]] || TAG_COLORS.default,
      order:       typeof meta.order === 'number' ? meta.order : 999,
      status:      meta.status || 'stable',
      // html type: path to iframe src (relative to site root)
      htmlPath:    type === 'html' ? `/multisite-platform/apps/${entry.name}/index.html` : null,
      // url type: external URL
      url:         type === 'url' ? meta.url : null,
      // whether to show toolbar controls in the iframe shell
      iframeOptions: meta.iframeOptions || {},
      lastModified: getLastModified(appDir),
    })
  }

  // Default sort: alphabetical A→Z (UI can override at runtime)
  apps.sort((a, b) => a.name.localeCompare(b.name))

  const byType = { react: 0, html: 0, url: 0 }
  apps.forEach(a => byType[a.type]++)
  console.log(`[generate] ✓  Discovered ${apps.length} app(s): ${apps.map(a => `${a.slug}(${a.type})`).join(', ')}`)
  console.log(`[generate]    react:${byType.react}  html:${byType.html}  url:${byType.url}`)

  return apps
}

// ─── STEP 2: Copy HTML apps into /public/apps/ ────────────
// Vite copies /public/ verbatim to /dist/, so HTML apps are
// served as static files and can be iframed via their path.

function copyHtmlApps(apps) {
  const htmlApps = apps.filter(a => a.type === 'html')
  if (htmlApps.length === 0) return

  fs.mkdirSync(PUBLIC_APPS_DIR, { recursive: true })

  for (const app of htmlApps) {
    const srcDir  = path.join(APPS_DIR, app.folderName)
    const destDir = path.join(PUBLIC_APPS_DIR, app.folderName)

    // Copy all files from apps/<name>/ → public/apps/<name>/
    // (except metadata.json — not needed at runtime)
    copyDirRecursive(srcDir, destDir, ['metadata.json'])
    console.log(`[generate] ✓  Copied HTML app: apps/${app.folderName}/ → public/apps/${app.folderName}/`)
  }
}

function copyDirRecursive(src, dest, exclude = []) {
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (exclude.includes(entry.name)) continue
    const srcPath  = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, exclude)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

// ─── STEP 3: Generate /generated/registry.js ─────────────
// Only react-type apps get lazy imports.
// html + url apps are handled at runtime by IframeShell.

function generateRegistry(apps) {
  const reactApps = apps.filter(a => a.type === 'react')

  const lines = [
    `// AUTO-GENERATED — do not edit manually`,
    `// Generated: ${new Date().toISOString()}`,
    ``,
    `import { lazy } from 'react'`,
    ``,
    `// Only "react" type apps are lazy-imported as JS chunks.`,
    `// "html" and "url" apps are rendered via IframeShell at runtime.`,
    `export const appRegistry = {`,
  ]

  for (const app of reactApps) {
    lines.push(`  '${app.slug}': lazy(() => import('../apps/${app.folderName}/App.jsx')),`)
  }

  lines.push(`}`)
  lines.push(`export default appRegistry`)

  return lines.join('\n')
}

// ─── STEP 4: Generate /generated/routes.js ───────────────
// routeConfig now includes type so the router knows how to render.

function generateRoutes(apps) {
  const lines = [
    `// AUTO-GENERATED — do not edit manually`,
    `// Generated: ${new Date().toISOString()}`,
    ``,
    `import appRegistry from './registry.js'`,
    ``,
    `/**`,
    ` * routeConfig — one entry per discovered app.`,
    ` * Fields:`,
    ` *   type        "react" | "html" | "url"`,
    ` *   component   set for react apps, null otherwise`,
    ` *   htmlPath    set for html apps (iframe src)`,
    ` *   url         set for url apps (iframe src)`,
    ` */`,
    `export const routeConfig = [`,
  ]

  for (const app of apps) {
    lines.push(`  {`)
    lines.push(`    path:      '/${app.slug}',`)
    lines.push(`    slug:      '${app.slug}',`)
    lines.push(`    name:      '${app.name.replace(/'/g, "\\'")}',`)
    lines.push(`    type:      '${app.type}',`)

    if (app.type === 'react') {
      lines.push(`    component: appRegistry['${app.slug}'],`)
      lines.push(`    htmlPath:  null,`)
      lines.push(`    url:       null,`)
    } else if (app.type === 'html') {
      lines.push(`    component: null,`)
      lines.push(`    htmlPath:  '${app.htmlPath}',`)
      lines.push(`    url:       null,`)
    } else if (app.type === 'url') {
      lines.push(`    component: null,`)
      lines.push(`    htmlPath:  null,`)
      lines.push(`    url:       '${app.url}',`)
    }

    lines.push(`    iframeOptions: ${JSON.stringify(app.iframeOptions || {})},`)
    lines.push(`  },`)
  }

  lines.push(`]`)
  lines.push(`export default routeConfig`)

  return lines.join('\n')
}

// ─── STEP 5: Generate /generated/navigation.js ───────────

function generateNavigation(apps) {
  return [
    `// AUTO-GENERATED — do not edit manually`,
    `// Generated: ${new Date().toISOString()}`,
    `export const appManifest = ${JSON.stringify(apps, null, 2)}`,
    `export default appManifest`,
  ].join('\n')
}

// ─── STEP 6: Write all files ──────────────────────────────

function writeGenerated(apps) {
  fs.mkdirSync(GEN_DIR, { recursive: true })

  const files = {
    'registry.js':   generateRegistry(apps),
    'routes.js':     generateRoutes(apps),
    'navigation.js': generateNavigation(apps),
    'manifest.json': JSON.stringify({ generatedAt: new Date().toISOString(), apps }, null, 2),
  }

  for (const [filename, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(GEN_DIR, filename), content, 'utf-8')
    console.log(`[generate] ✓  Written: generated/${filename}`)
  }
}

// ─── MAIN ─────────────────────────────────────────────────

function main() {
  console.log('[generate] 🔍 Scanning /apps/ for registered applications...\n')
  const apps = discoverApps()
  copyHtmlApps(apps)
  writeGenerated(apps)
  console.log('\n[generate] ✅ Generation complete.\n')
}

main()
