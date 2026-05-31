import React, { useState, useRef } from 'react'

/**
 * IframeShell
 * ─────────────────────────────────────────────────────────
 * Renders html-type and url-type apps inside a sandboxed iframe.
 *
 * Props:
 *   src           — iframe src (file path or external URL)
 *   name          — app display name
 *   type          — "html" | "url"
 *   options       — iframeOptions from metadata.json
 *     allowFullscreen  (default true)
 *     height           "full" | "fixed" (default "full")
 */
export default function IframeShell({ src, name, type, options = {} }) {
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)
  const [fullscreen, setFullscreen] = useState(false)
  const iframeRef = useRef(null)

  const isExternal = type === 'url'

  function handleLoad() {
    setLoading(false)
    setError(false)
  }

  function handleError() {
    setLoading(false)
    setError(true)
  }

  function reload() {
    setLoading(true)
    setError(false)
    if (iframeRef.current) {
      // Force reload by re-setting src
      const currentSrc = iframeRef.current.src
      iframeRef.current.src = ''
      setTimeout(() => { iframeRef.current.src = currentSrc }, 50)
    }
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: fullscreen ? '100vh' : 'calc(100vh - 49px)', // 49px = AppShell breadcrumb
        position: fullscreen ? 'fixed' : 'relative',
        inset: fullscreen ? 0 : 'auto',
        zIndex: fullscreen ? 100 : 'auto',
        background: 'var(--surface-0)',
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-2 flex-shrink-0 border-b"
        style={{ background: 'var(--surface-1)', borderColor: 'var(--border)' }}
      >
        {/* Type badge */}
        <span
          className="text-xs font-mono px-2 py-0.5 rounded flex-shrink-0"
          style={{
            background: isExternal ? 'rgba(139,92,246,0.15)' : 'rgba(0,212,255,0.1)',
            color: isExternal ? '#8b5cf6' : '#00d4ff',
            border: `1px solid ${isExternal ? 'rgba(139,92,246,0.3)' : 'rgba(0,212,255,0.2)'}`,
          }}
        >
          {isExternal ? '🌐 url' : '📄 html'}
        </span>

        {/* URL display */}
        <span
          className="flex-1 text-xs font-mono truncate hidden sm:block"
          style={{ color: 'var(--text-secondary)' }}
        >
          {src}
        </span>

        {/* Loading indicator */}
        {loading && (
          <div className="flex items-center gap-1.5 text-xs flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>
            <Spinner />
            <span className="hidden sm:inline">Loading...</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <ToolbarBtn onClick={reload} title="Reload">
            <ReloadIcon />
          </ToolbarBtn>

          {isExternal && (
            <ToolbarBtn
              onClick={() => window.open(src, '_blank')}
              title="Open in new tab"
            >
              <ExternalIcon />
            </ToolbarBtn>
          )}

          <ToolbarBtn
            onClick={() => setFullscreen(f => !f)}
            title={fullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {fullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </ToolbarBtn>
        </div>
      </div>

      {/* Iframe area */}
      <div className="relative flex-1 overflow-hidden">
        {/* Error state */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div
              className="glass rounded-xl p-8 max-w-sm w-full text-center border mx-4"
              style={{ borderColor: 'rgba(244,63,94,0.2)' }}
            >
              <div className="text-3xl mb-3">
                {isExternal ? '🚫' : '⚠️'}
              </div>
              <h3 className="font-semibold text-sm text-rose-400 mb-2">
                {isExternal ? 'Cannot embed this URL' : 'Failed to load'}
              </h3>
              <p className="text-xs mb-4" style={{ color: 'var(--text-secondary)' }}>
                {isExternal
                  ? 'This site blocks embedding via X-Frame-Options or CSP. Try opening it in a new tab.'
                  : 'The HTML file could not be loaded. Check that index.html exists and is valid.'
                }
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={reload}
                  className="px-3 py-1.5 rounded text-xs border transition-colors hover:bg-white/5"
                  style={{ borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
                >
                  Retry
                </button>
                {isExternal && (
                  <button
                    onClick={() => window.open(src, '_blank')}
                    className="px-3 py-1.5 rounded text-xs border border-purple-500/30 text-purple-400 hover:bg-purple-500/10 transition-colors"
                  >
                    Open in new tab ↗
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Loading overlay */}
        {loading && !error && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ background: 'var(--surface-0)' }}
          >
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-8 h-8">
                <div
                  className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: isExternal ? '#8b5cf6' : '#00d4ff', animation: 'spin 0.8s linear infinite' }}
                />
              </div>
              <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
                Loading {name}...
              </span>
            </div>
          </div>
        )}

        <iframe
          ref={iframeRef}
          src={src}
          title={name}
          onLoad={handleLoad}
          onError={handleError}
          className="w-full h-full border-0"
          style={{ display: error ? 'none' : 'block' }}
          // Sandbox for HTML apps: safe defaults
          // url apps get no sandbox so external sites work properly
          sandbox={isExternal ? undefined : 'allow-scripts allow-same-origin allow-forms allow-popups'}
          allow="fullscreen"
        />
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function ToolbarBtn({ onClick, title, children }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded flex items-center justify-center transition-colors hover:bg-white/8"
      style={{ color: 'var(--text-secondary)' }}
    >
      {children}
    </button>
  )
}

function Spinner() {
  return (
    <div
      className="w-3 h-3 rounded-full border border-transparent flex-shrink-0"
      style={{ borderTopColor: 'var(--accent-cyan)', animation: 'spin 0.8s linear infinite' }}
    />
  )
}

function ReloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="23 4 23 10 17 10" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
  )
}

function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  )
}

function FullscreenIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  )
}

function ExitFullscreenIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="10" y1="14" x2="3" y2="21" />
      <line x1="21" y1="3" x2="14" y2="10" />
    </svg>
  )
}
