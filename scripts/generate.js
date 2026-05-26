/**
 * scripts/generate.js
 * ─────────────────────────────────────────────────────────
 * AUTO-DISCOVERY ENGINE
 *
 * This script runs BEFORE every build/dev start.
 * It scans /apps/, reads metadata.json from each app folder,
 * and generates three files into /generated/:
 *
 *   1. registry.js     — dynamic import map (React.lazy)
 *   2. routes.js       — React Router route definitions
 *   3. navigation.js   — nav items array for the sidebar/navbar
 *
 * Because all three are auto-generated, adding a new app is
 * as simple as creating a folder + metadata.json.
 * No manual editing of any config file required.
 * ─────────────────────────────────────────────────────────
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const APPS_DIR = path.join(ROOT, 'apps')
const GEN_DIR = path.join(ROOT, 'generated')

// Tag → color mapping for badge styling in the UI
const TAG_COLORS = {
  dashboard:  'cyan',
  monitoring: 'purple',
  portfolio:  'green',
  tool:       'amber',
  demo:       'rose',
  default:    'cyan',
}

// ─── STEP 1: Scan /apps/ directory ───────────────────────

function discoverApps() {
  if (!fs.existsSync(APPS_DIR)) {
    console.warn('[generate] ⚠  /apps/ directory not found. Creating it.')
    fs.mkdirSync(APPS_DIR, { recursive: true })
    return []
  }

  const entries = fs.readdirSync(APPS_DIR, { withFileTypes: true })
  const apps = []

  for (const entry of entries) {
    if (!entry.isDirectory()) continue

    const appDir = path.join(APPS_DIR, entry.name)
    const metaPath = path.join(appDir, 'metadata.json')
    const appJsxPath = path.join(appDir, 'App.jsx')

    // Validate required files exist
    if (!fs.existsSync(metaPath)) {
      console.warn(`[generate] ⚠  Skipping "${entry.name}" — missing metadata.json`)
      continue
    }
    if (!fs.existsSync(appJsxPath)) {
      console.warn(`[generate] ⚠  Skipping "${entry.name}" — missing App.jsx`)
      continue
    }

    // Parse and validate metadata
    let meta
    try {
      meta = JSON.parse(fs.readFileSync(metaPath, 'utf-8'))
    } catch (e) {
      console.warn(`[generate] ✗  Skipping "${entry.name}" — invalid metadata.json: ${e.message}`)
      continue
    }

    // Required fields
    if (!meta.name || !meta.slug) {
      console.warn(`[generate] ✗  Skipping "${entry.name}" — metadata must have "name" and "slug"`)
      continue
    }

    // Normalize and apply defaults
    apps.push({
      folderName:  entry.name,
      name:        meta.name,
      slug:        meta.slug,                     // URL path: /cloud-monitor
      description: meta.description || '',
      icon:        meta.icon || '📦',
      tags:        Array.isArray(meta.tags) ? meta.tags : [],
      color:       meta.color || TAG_COLORS[meta.tags?.[0]] || TAG_COLORS.default,
      order:       typeof meta.order === 'number' ? meta.order : 999,
      thumbnail:   meta.thumbnail || null,
      status:      meta.status || 'stable',       // stable | beta | wip
    })
  }

  // Sort by order field, then alphabetically
  apps.sort((a, b) => a.order - b.order || a.name.localeCompare(b.name))

  console.log(`[generate] ✓  Discovered ${apps.length} app(s):`, apps.map(a => a.slug).join(', '))
  return apps
}

// ─── STEP 2: Generate /generated/registry.js ─────────────
// Maps each slug → React.lazy(() => import('../apps/<folder>/App.jsx'))
// Vite sees these dynamic imports at build time and creates separate chunks.

function generateRegistry(apps) {
  const lines = [
    `// AUTO-GENERATED — do not edit manually`,
    `// Re-run: node scripts/generate.js`,
    `// Generated: ${new Date().toISOString()}`,
    ``,
    `import { lazy } from 'react'`,
    ``,
    `/**`,
    ` * appRegistry maps slug → lazy-loaded React component.`,
    ` * Each entry becomes its own JS chunk via Vite code-splitting.`,
    ` */`,
    `export const appRegistry = {`,
  ]

  for (const app of apps) {
    lines.push(
      `  '${app.slug}': lazy(() => import('../apps/${app.folderName}/App.jsx')),`
    )
  }

  lines.push(`}`)
  lines.push(``)
  lines.push(`export default appRegistry`)

  return lines.join('\n')
}

// ─── STEP 3: Generate /generated/routes.js ───────────────
// Exports a routeConfig array consumed by React Router.

function generateRoutes(apps) {
  const lines = [
    `// AUTO-GENERATED — do not edit manually`,
    `// Generated: ${new Date().toISOString()}`,
    ``,
    `import appRegistry from './registry.js'`,
    ``,
    `/**`,
    ` * routeConfig: array of { path, slug, name, component }`,
    ` * Consumed by src/router.jsx to build <Route> elements.`,
    ` */`,
    `export const routeConfig = [`,
  ]

  for (const app of apps) {
    lines.push(`  {`)
    lines.push(`    path: '/${app.slug}',`)
    lines.push(`    slug: '${app.slug}',`)
    lines.push(`    name: '${app.name.replace(/'/g, "\\'")}',`)
    lines.push(`    component: appRegistry['${app.slug}'],`)
    lines.push(`  },`)
  }

  lines.push(`]`)
  lines.push(``)
  lines.push(`export default routeConfig`)

  return lines.join('\n')
}

// ─── STEP 4: Generate /generated/navigation.js ───────────
// Full metadata array used by the sidebar and homepage cards.

function generateNavigation(apps) {
  const serialized = JSON.stringify(apps, null, 2)
    .replace(/"([^"]+)":/g, '$1:')   // unquote keys for cleaner output

  return [
    `// AUTO-GENERATED — do not edit manually`,
    `// Generated: ${new Date().toISOString()}`,
    ``,
    `/**`,
    ` * appManifest: full metadata for all discovered apps.`,
    ` * Used by the homepage dashboard and navigation sidebar.`,
    ` */`,
    `export const appManifest = ${serialized}`,
    ``,
    `export default appManifest`,
  ].join('\n')
}

// ─── STEP 5: Write files to /generated/ ──────────────────

function writeGenerated(apps) {
  fs.mkdirSync(GEN_DIR, { recursive: true })

  const files = {
    'registry.js':   generateRegistry(apps),
    'routes.js':     generateRoutes(apps),
    'navigation.js': generateNavigation(apps),
  }

  // Write a manifest JSON too (useful for external tooling / CI dashboards)
  files['manifest.json'] = JSON.stringify({ generatedAt: new Date().toISOString(), apps }, null, 2)

  for (const [filename, content] of Object.entries(files)) {
    const outPath = path.join(GEN_DIR, filename)
    fs.writeFileSync(outPath, content, 'utf-8')
    console.log(`[generate] ✓  Written: generated/${filename}`)
  }
}

// ─── MAIN ─────────────────────────────────────────────────

function main() {
  console.log('[generate] 🔍 Scanning /apps/ for registered applications...')
  const apps = discoverApps()
  writeGenerated(apps)
  console.log('[generate] ✅ Generation complete.\n')
}

main()
