import React from 'react'
import { Link } from 'react-router-dom'

const TYPE_BADGE = {
  react: { bg: 'rgba(0,212,255,0.1)',    color: '#00d4ff', border: 'rgba(0,212,255,0.2)',    label: 'react' },
  html:  { bg: 'rgba(16,185,129,0.1)',   color: '#10b981', border: 'rgba(16,185,129,0.2)',   label: 'html'  },
  url:   { bg: 'rgba(139,92,246,0.1)',   color: '#8b5cf6', border: 'rgba(139,92,246,0.2)',   label: 'url'   },
}

export default function AppShell({ name, slug, type = 'react', noPadding = false, children }) {
  const badge = TYPE_BADGE[type] || TYPE_BADGE.react

  return (
    <ErrorBoundary slug={slug}>
      <div className="min-h-screen flex flex-col" style={{ background: 'var(--surface-0)' }}>
        {/* Breadcrumb bar */}
        <div
          className="sticky top-0 z-50 flex items-center gap-3 px-6 py-3 border-b flex-shrink-0"
          style={{
            background: 'rgba(10,10,15,0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--border)',
          }}
        >
          <Link
            to="/"
            className="flex items-center gap-1.5 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--text-secondary)' }}
          >
            <HomeIcon />
            <span>Home</span>
          </Link>
          <span style={{ color: 'var(--surface-4)' }}>/</span>
          <span className="text-sm" style={{ color: 'var(--accent-cyan)' }}>{name}</span>

          <div className="ml-auto flex items-center gap-2">
            {/* Type badge */}
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ background: badge.bg, color: badge.color, border: `1px solid ${badge.border}` }}
            >
              {badge.label}
            </span>
            {/* Slug badge */}
            <span
              className="text-xs font-mono px-2 py-0.5 rounded hidden sm:inline"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >
              /{slug}
            </span>
          </div>
        </div>

        {/* App content */}
        <div className={`flex-1 ${noPadding ? '' : 'app-frame'}`}>
          {children}
        </div>
      </div>
    </ErrorBoundary>
  )
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error(`[AppShell] Error in "${this.props.slug}":`, error, info) }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-8">
          <div className="glass rounded-xl p-8 max-w-md w-full border border-rose-500/20">
            <div className="text-3xl mb-3">⚠️</div>
            <h2 className="text-lg font-semibold text-rose-400 mb-2">App crashed</h2>
            <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-3 py-1.5 rounded text-sm bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              >
                Retry
              </button>
              <Link
                to="/"
                className="px-3 py-1.5 rounded text-sm border hover:bg-white/5 transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
              >
                Go home
              </Link>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}
