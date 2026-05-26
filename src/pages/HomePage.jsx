import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { appManifest } from '../../generated/navigation.js'

const TAG_BORDER = {
  cyan:   'border-cyan-500/30 hover:border-cyan-500/60',
  purple: 'border-purple-500/30 hover:border-purple-500/60',
  green:  'border-emerald-500/30 hover:border-emerald-500/60',
  amber:  'border-amber-500/30 hover:border-amber-500/60',
  rose:   'border-rose-500/30 hover:border-rose-500/60',
}
const TAG_GLOW = {
  cyan:   'hover:shadow-[0_0_24px_rgba(0,212,255,0.12)]',
  purple: 'hover:shadow-[0_0_24px_rgba(139,92,246,0.12)]',
  green:  'hover:shadow-[0_0_24px_rgba(16,185,129,0.12)]',
  amber:  'hover:shadow-[0_0_24px_rgba(245,158,11,0.12)]',
  rose:   'hover:shadow-[0_0_24px_rgba(244,63,94,0.12)]',
}
const TAG_TEXT = {
  cyan:   'text-cyan-400',
  purple: 'text-purple-400',
  green:  'text-emerald-400',
  amber:  'text-amber-400',
  rose:   'text-rose-400',
}

const STATUS_CONFIG = {
  stable: { dot: 'bg-emerald-400', label: 'stable', text: 'text-emerald-400' },
  beta:   { dot: 'bg-amber-400',   label: 'beta',   text: 'text-amber-400'  },
  wip:    { dot: 'bg-rose-400',    label: 'wip',    text: 'text-rose-400'   },
}

export default function HomePage() {
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState(null)

  // Collect all unique tags from manifest
  const allTags = useMemo(() => {
    const tags = new Set()
    appManifest.forEach(app => app.tags?.forEach(t => tags.add(t)))
    return [...tags].sort()
  }, [])

  // Filter by search + tag
  const filtered = useMemo(() => {
    return appManifest.filter(app => {
      const matchSearch = !search ||
        app.name.toLowerCase().includes(search.toLowerCase()) ||
        app.description.toLowerCase().includes(search.toLowerCase()) ||
        app.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
      const matchTag = !activeTag || app.tags.includes(activeTag)
      return matchSearch && matchTag
    })
  }, [search, activeTag])

  return (
    <div className="min-h-screen p-8 animate-fade-in">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest mb-2" style={{ color: 'var(--accent-cyan)' }}>
              Multi-Site Hosting Platform
            </p>
            <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              DevPortal
            </h1>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {appManifest.length} app{appManifest.length !== 1 ? 's' : ''} registered · auto-discovered · lazily loaded
            </p>
          </div>

          {/* Stats */}
          <div className="flex gap-3">
            {[
              { label: 'Total',  value: appManifest.length,                                    color: 'text-cyan-400'   },
              { label: 'Stable', value: appManifest.filter(a => a.status === 'stable').length, color: 'text-emerald-400'},
              { label: 'Beta',   value: appManifest.filter(a => a.status === 'beta').length,   color: 'text-amber-400'  },
            ].map(({ label, value, color }) => (
              <div key={label} className="glass rounded-lg px-4 py-3 text-center min-w-[64px]">
                <div className={`text-xl font-bold font-mono ${color}`}>{value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Search + Filter */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
          <input
            type="text"
            placeholder="Search apps..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg text-sm outline-none transition-colors"
            style={{
              background: 'var(--surface-2)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--accent-cyan)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
        </div>

        {/* Tag pills */}
        <div className="flex flex-wrap gap-2">
          {allTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              className={`tag transition-all ${
                activeTag === tag ? 'tag-cyan ring-1 ring-cyan-500/40' : 'tag-cyan opacity-50 hover:opacity-100'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* App Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20" style={{ color: 'var(--text-secondary)' }}>
          <div className="text-4xl mb-3">🔍</div>
          <p>No apps match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((app, i) => (
            <AppCard key={app.slug} app={app} index={i} />
          ))}
        </div>
      )}

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t text-center text-xs font-mono" style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}>
        Auto-generated · <span style={{ color: 'var(--accent-cyan)' }}>node scripts/generate.js</span> · GitHub Pages
      </footer>
    </div>
  )
}

function AppCard({ app, index }) {
  const color = app.color || 'cyan'
  const status = STATUS_CONFIG[app.status] || STATUS_CONFIG.stable

  return (
    <Link
      to={`/${app.slug}`}
      className={`glass rounded-xl p-5 border transition-all duration-200 cursor-pointer block group
        ${TAG_BORDER[color] || TAG_BORDER.cyan}
        ${TAG_GLOW[color]   || TAG_GLOW.cyan}
      `}
      style={{ animationDelay: `${index * 50}ms`, animation: 'slideUp 0.4s ease forwards', opacity: 0 }}
    >
      {/* Icon + status */}
      <div className="flex items-start justify-between mb-3">
        <div className="text-2xl">{app.icon}</div>
        <div className="flex items-center gap-1">
          <span className={`status-dot ${status.dot}`} />
          <span className={`text-xs font-mono ${status.text}`}>{status.label}</span>
        </div>
      </div>

      {/* Name + description */}
      <h3 className={`font-semibold text-sm mb-1 transition-colors ${TAG_TEXT[color] || 'text-cyan-400'} group-hover:brightness-110`}>
        {app.name}
      </h3>
      <p className="text-xs leading-relaxed line-clamp-2 mb-3" style={{ color: 'var(--text-secondary)' }}>
        {app.description || 'No description provided.'}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1">
        {app.tags.map(tag => (
          <span key={tag} className={`tag tag-${color}`}>{tag}</span>
        ))}
      </div>

      {/* Hover arrow */}
      <div className="mt-3 flex items-center gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ color: 'var(--text-secondary)' }}>
        <span>Open app</span>
        <span>→</span>
      </div>
    </Link>
  )
}

function SearchIcon({ className, style }) {
  return (
    <svg className={className} style={style} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}
