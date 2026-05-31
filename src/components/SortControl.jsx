import React, { useState, useRef, useEffect } from 'react'
import { SORT_OPTIONS } from '../hooks/useSortedApps.js'

/**
 * SortControl
 * A compact dropdown for picking sort mode.
 *
 * Props:
 *   sortMode   — current value
 *   setSort    — setter
 *   compact    — if true, shows icon only (for sidebar)
 */
export default function SortControl({ sortMode, setSort, compact = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = SORT_OPTIONS.find(o => o.value === sortMode) || SORT_OPTIONS[0]

  // Close on outside click
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        title={`Sort: ${current.label}`}
        className="flex items-center gap-1.5 px-2 py-1 rounded text-xs font-mono transition-colors hover:bg-white/8"
        style={{
          color: open ? 'var(--accent-cyan)' : 'var(--text-secondary)',
          border: '1px solid',
          borderColor: open ? 'rgba(0,212,255,0.3)' : 'var(--border)',
          background: open ? 'rgba(0,212,255,0.05)' : 'transparent',
        }}
      >
        <SortIcon />
        {!compact && <span>{current.label}</span>}
        {!compact && <ChevronIcon open={open} />}
      </button>

      {open && (
        <div
          className="absolute right-0 mt-1 rounded-lg py-1 z-50 min-w-[160px]"
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            // In sidebar, open upward so it doesn't get clipped
            ...(compact ? { bottom: '100%', mb: '4px', top: 'auto' } : { top: '100%' }),
          }}
        >
          <div className="px-3 py-1.5 text-xs font-mono uppercase tracking-widest"
            style={{ color: 'var(--text-secondary)', borderBottom: '1px solid var(--border)' }}>
            Sort by
          </div>
          {SORT_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => { setSort(opt.value); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors hover:bg-white/5"
              style={{ color: sortMode === opt.value ? 'var(--accent-cyan)' : 'var(--text-primary)' }}
            >
              <span className="w-4 text-center" style={{ opacity: 0.7 }}>{opt.icon}</span>
              <span>{opt.label}</span>
              {sortMode === opt.value && (
                <span className="ml-auto" style={{ color: 'var(--accent-cyan)' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SortIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="8"  y1="6"  x2="21" y2="6" />
      <line x1="8"  y1="12" x2="21" y2="12" />
      <line x1="8"  y1="18" x2="21" y2="18" />
      <polyline points="3 6 4 7 6 4" />
      <polyline points="3 12 4 13 6 10" />
      <polyline points="3 18 4 19 6 16" />
    </svg>
  )
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="10" height="10"
      viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      style={{ transform: open ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.15s' }}
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
