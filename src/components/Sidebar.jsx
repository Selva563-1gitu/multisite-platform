import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { appManifest } from '../../generated/navigation.js'

const TAG_COLORS = {
  cyan:   'text-cyan-400',
  purple: 'text-purple-400',
  green:  'text-emerald-400',
  amber:  'text-amber-400',
  rose:   'text-rose-400',
}

export default function Sidebar({ isOpen, onToggle }) {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const toggle = () => {
    setCollapsed(p => !p)
    onToggle?.()
  }

  return (
    <aside
      className="relative flex-shrink-0 flex flex-col h-screen border-r transition-all duration-300"
      style={{
        width: collapsed ? '56px' : '220px',
        background: 'var(--surface-1)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-4 border-b" style={{ borderColor: 'var(--border)' }}>
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold"
              style={{ background: 'var(--accent-cyan)', color: '#000' }}>
              D
            </div>
            <span className="text-sm font-semibold tracking-tight whitespace-nowrap" style={{ color: 'var(--text-primary)' }}>
              DevPortal
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold mx-auto"
            style={{ background: 'var(--accent-cyan)', color: '#000' }}>
            D
          </div>
        )}
        {!collapsed && (
          <button onClick={toggle} className="p-1 rounded hover:bg-white/5 transition-colors ml-auto">
            <ChevronLeft />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={toggle}
          className="absolute -right-3 top-14 w-6 h-6 rounded-full border flex items-center justify-center z-10 hover:border-cyan-500 transition-colors"
          style={{ background: 'var(--surface-2)', borderColor: 'var(--border)' }}
        >
          <ChevronRight className="w-3 h-3" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {/* Home */}
        <NavItem to="/" icon="⌂" label="Home" collapsed={collapsed} exact />

        {/* Divider */}
        {!collapsed && (
          <div className="px-2 py-2">
            <span className="text-xs font-mono uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
              Apps
            </span>
          </div>
        )}
        {collapsed && <div className="my-2 border-t mx-1" style={{ borderColor: 'var(--border)' }} />}

        {/* Auto-generated app entries */}
        {appManifest.map(app => (
          <NavItem
            key={app.slug}
            to={`/${app.slug}`}
            icon={app.icon}
            label={app.name}
            color={TAG_COLORS[app.color] || 'text-cyan-400'}
            status={app.status}
            collapsed={collapsed}
          />
        ))}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-3 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {appManifest.length} app{appManifest.length !== 1 ? 's' : ''} registered
            </span>
          </div>
        </div>
      )}
    </aside>
  )
}

function NavItem({ to, icon, label, color = 'text-cyan-400', status, collapsed, exact }) {
  return (
    <NavLink
      to={to}
      end={exact}
      className={({ isActive }) =>
        `flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-all duration-150 group relative
        ${isActive
          ? 'bg-white/8 text-white'
          : 'text-gray-400 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      {({ isActive }) => (
        <>
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r"
              style={{ background: 'var(--accent-cyan)' }} />
          )}
          <span className={`text-base flex-shrink-0 ${isActive ? color : 'opacity-70 group-hover:opacity-100'}`}>
            {icon}
          </span>
          {!collapsed && (
            <span className="truncate flex-1">{label}</span>
          )}
          {!collapsed && status && status !== 'stable' && (
            <span className={`text-xs font-mono px-1 rounded ${
              status === 'beta' ? 'bg-amber-500/20 text-amber-400' : 'bg-rose-500/20 text-rose-400'
            }`}>
              {status}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

function ChevronRight({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}
