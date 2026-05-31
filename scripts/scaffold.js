/**
 * scripts/scaffold.js
 * ──────────────────────────────────────────────────────────
 * Scaffold a new app folder with the right boilerplate.
 *
 * Usage:
 *   node scripts/scaffold.js <slug> "<Name>" [type] ["description"]
 *
 * Types:
 *   react  (default) — creates App.jsx + metadata.json
 *   html              — creates index.html + metadata.json
 *   url               — creates metadata.json only (needs --url flag)
 *
 * Examples:
 *   node scripts/scaffold.js my-tool "My Tool" react "Does something cool"
 *   node scripts/scaffold.js my-page "My Page" html  "A plain HTML page"
 *   node scripts/scaffold.js ext-app "Ext App" url   "External app" --url https://example.com
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const args = process.argv.slice(2)
const urlFlagIdx = args.indexOf('--url')
const externalUrl = urlFlagIdx !== -1 ? args[urlFlagIdx + 1] : null
const cleanArgs = args.filter((_, i) => i !== urlFlagIdx && i !== urlFlagIdx + 1)

const [slug, name, type = 'react', description = ''] = cleanArgs

if (!slug || !name) {
  console.error('Usage: node scripts/scaffold.js <slug> "<Name>" [react|html|url] ["description"] [--url https://...]')
  process.exit(1)
}

if (!['react', 'html', 'url'].includes(type)) {
  console.error(`Unknown type "${type}". Use: react | html | url`)
  process.exit(1)
}

if (type === 'url' && !externalUrl) {
  console.error('Type "url" requires --url <https://...>')
  process.exit(1)
}

if (!/^[a-z0-9-]+$/.test(slug)) {
  console.error('Slug must be lowercase letters, numbers, and hyphens only.')
  process.exit(1)
}

const appDir = path.join(ROOT, 'apps', slug)
if (fs.existsSync(appDir)) {
  console.error(`App "${slug}" already exists.`)
  process.exit(1)
}

fs.mkdirSync(appDir, { recursive: true })

// ── metadata.json ────────────────────────────────────────
const metadata = {
  name,
  slug,
  description,
  icon: type === 'html' ? '📄' : type === 'url' ? '🌐' : '📦',
  tags: ['tool'],
  color: 'cyan',
  order: 99,
  status: 'wip',
  type,
  ...(type === 'url' && { url: externalUrl }),
}

fs.writeFileSync(path.join(appDir, 'metadata.json'), JSON.stringify(metadata, null, 2))

// ── Type-specific files ────────────────────────────────────
if (type === 'react') {
  const jsx = `// ${name} — React app
export default function ${name.replace(/\s+/g, '')}() {
  return (
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f0f0f5' }}>
      <h2 className="text-2xl font-bold mb-2">${name}</h2>
      <p style={{ color: '#8888a0' }}>${description || 'Your app content here.'}</p>
    </div>
  )
}
`
  fs.writeFileSync(path.join(appDir, 'App.jsx'), jsx)
}

if (type === 'html') {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${name}</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0a0a0f;
      color: #f0f0f5;
      font-family: 'Space Grotesk', sans-serif;
    }
    .card {
      background: #111118;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      padding: 40px;
      max-width: 480px;
      text-align: center;
    }
    h1 { font-size: 24px; margin: 0 0 12px; color: #00d4ff; }
    p  { color: #8888a0; line-height: 1.6; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${name}</h1>
    <p>${description || 'Your HTML app content here. No framework needed.'}</p>
  </div>
  <script>
    // Pure JS — no React, no build step
    console.log('${name} loaded')
  </script>
</body>
</html>
`
  fs.writeFileSync(path.join(appDir, 'index.html'), html)
}

// url type: only metadata.json needed

console.log(`\n✅ Scaffolded: apps/${slug}/ (type: ${type})`)
if (type === 'react') console.log(`   App.jsx + metadata.json`)
if (type === 'html')  console.log(`   index.html + metadata.json`)
if (type === 'url')   console.log(`   metadata.json  →  embeds: ${externalUrl}`)
console.log(`\nNext: npm run dev\n`)
