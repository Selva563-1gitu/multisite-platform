/**
 * scripts/scaffold.js
 * ──────────────────────────────────────────────────────────
 * Quickly scaffold a new app folder with boilerplate files.
 *
 * Usage:
 *   node scripts/scaffold.js my-new-app "My New App" "A short description"
 *
 * Creates:
 *   apps/my-new-app/
 *     ├── metadata.json
 *     └── App.jsx
 * ──────────────────────────────────────────────────────────
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const [,, slug, name, description = 'A new app.'] = process.argv

if (!slug || !name) {
  console.error('Usage: node scripts/scaffold.js <slug> "<Name>" "<description>"')
  console.error('Example: node scripts/scaffold.js my-tool "My Tool" "Does something cool"')
  process.exit(1)
}

// Validate slug format
if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error('Slug must be lowercase letters, numbers, and hyphens only.')
  process.exit(1)
}

const appDir = path.join(ROOT, 'apps', slug)

if (fs.existsSync(appDir)) {
  console.error(`App "${slug}" already exists at apps/${slug}/`)
  process.exit(1)
}

// ── Create directory ─────────────────────────────────────
fs.mkdirSync(appDir, { recursive: true })

// ── metadata.json ────────────────────────────────────────
const metadata = {
  name,
  slug,
  description,
  icon: '📦',
  tags: ['tool'],
  color: 'cyan',
  order: 99,
  status: 'wip',
}

fs.writeFileSync(
  path.join(appDir, 'metadata.json'),
  JSON.stringify(metadata, null, 2),
  'utf-8'
)

// ── App.jsx boilerplate ───────────────────────────────────
const appBoilerplate = `// ${name}
// Auto-scaffolded by scripts/scaffold.js
// Edit this file to build your app.

export default function ${name.replace(/\s+/g, '')}() {
  return (
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f0f0f5' }}>
      <div className="text-xs font-mono mb-2" style={{ color: 'var(--accent-cyan)' }}>
        ${slug}
      </div>
      <h2 className="text-2xl font-bold mb-2">${name}</h2>
      <p style={{ color: '#8888a0' }}>${description}</p>
      <div className="mt-8 glass rounded-xl p-6" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <p className="text-sm" style={{ color: '#8888a0' }}>
          👋 Your app content goes here. Edit{' '}
          <code className="font-mono text-cyan-400">apps/${slug}/App.jsx</code>
        </p>
      </div>
    </div>
  )
}
`

fs.writeFileSync(path.join(appDir, 'App.jsx'), appBoilerplate, 'utf-8')

console.log(`\n✅ Scaffolded new app: apps/${slug}/`)
console.log(`   ├── metadata.json`)
console.log(`   └── App.jsx`)
console.log(`\nNext steps:`)
console.log(`  1. Edit apps/${slug}/App.jsx`)
console.log(`  2. Update apps/${slug}/metadata.json (icon, tags, status)`)
console.log(`  3. Run: npm run dev`)
console.log(`  4. Push to main → auto-deploys\n`)
