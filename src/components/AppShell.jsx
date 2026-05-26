import React from 'react'
import { Link } from 'react-router-dom'

/**
 * AppShell wraps every hosted app with:
 * - A breadcrumb header showing where you are
 * - A back-to-home button
 * - Error boundary for resilience
 * - The .app-frame CSS class for consistent baseline styling
 *
 * Each app's App.jsx renders inside <children />.
 * Apps have full layout freedom inside their frame.
 */
export default function AppShell({ name, slug, children }) {
  return (
    <ErrorBoundary slug={slug}>
      <div className="min-h-screen" style={{ background: 'var(--surface-0)' }}>
        {/* Top breadcrumb bar */}
        <div
          className="sticky top-0 z-50 flex items-center gap-3 px-6 py-3 border-b text-sm"
          style={{
            background: 'rgba(10,10,15,0.85)',
            backdropFilter: 'blur(12px)',
            borderColor: 'var(--border)',
          }}
        >
          <Link
            to="/"
            className="flex items-center gap-1.5 transition-colors hover:opacity-80"
            style={{ color: 'var(--text-secondary)' }}
          >
            <HomeIcon />
            <span>Home</span>
          </Link>
          <span style={{ color: 'var(--surface-4)' }}>/</span>
          <span style={{ color: 'var(--accent-cyan)' }}>{name}</span>

          <div className="ml-auto">
            <span
              className="text-xs font-mono px-2 py-0.5 rounded"
              style={{ background: 'var(--surface-2)', color: 'var(--text-secondary)' }}
            >
              /{slug}
            </span>
          </div>
        </div>

        {/* App content */}
        <div className="app-frame">
          {children}
        </div>
      </div>
    </ErrorBoundary>
  )
}

// ── Error Boundary ──────────────────────────────────────────
// Catches runtime errors in any app so the shell stays alive.

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error(`[AppShell] Error in app "${this.props.slug}":`, error, info)
  }

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
