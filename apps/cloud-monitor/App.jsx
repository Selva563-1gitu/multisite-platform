import React, { useState, useEffect } from 'react'

const SERVICES = [
  { name: 'API Gateway',   region: 'us-east-1', type: 'gateway'  },
  { name: 'Auth Service',  region: 'us-east-1', type: 'service'  },
  { name: 'DB Primary',    region: 'us-east-1', type: 'database' },
  { name: 'DB Replica',    region: 'eu-west-1', type: 'database' },
  { name: 'Cache Layer',   region: 'us-east-1', type: 'cache'    },
  { name: 'CDN Edge',      region: 'global',    type: 'cdn'      },
  { name: 'Worker Queue',  region: 'us-west-2', type: 'queue'    },
  { name: 'ML Inference',  region: 'us-west-2', type: 'service'  },
]

function rand(min, max) { return Math.random() * (max - min) + min }
function randInt(min, max) { return Math.floor(rand(min, max)) }

function generateNodes() {
  return SERVICES.map((s, i) => ({
    ...s,
    id: i,
    cpu:    Math.round(rand(10, 92)),
    mem:    Math.round(rand(30, 88)),
    disk:   Math.round(rand(20, 75)),
    uptime: rand(99.0, 99.999).toFixed(3),
    latency: randInt(2, 180),
    status: Math.random() > 0.12 ? 'healthy' : Math.random() > 0.5 ? 'warning' : 'critical',
    requests: randInt(100, 9999),
  }))
}

function GaugeRing({ value, color, size = 60, strokeWidth = 5 }) {
  const r = (size - strokeWidth) / 2
  const circ = 2 * Math.PI * r
  const dash = (value / 100) * circ

  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
      <circle
        cx={size/2} cy={size/2} r={r}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${dash} ${circ}`}
        strokeLinecap="round"
        style={{ transition: 'stroke-dasharray 0.6s ease' }}
      />
    </svg>
  )
}

function StatusBadge({ status }) {
  const cfg = {
    healthy:  { bg: 'rgba(16,185,129,0.12)', text: '#10b981', dot: '#10b981', label: 'Healthy'  },
    warning:  { bg: 'rgba(245,158,11,0.12)', text: '#f59e0b', dot: '#f59e0b', label: 'Warning'  },
    critical: { bg: 'rgba(244,63,94,0.12)',  text: '#f43f5e', dot: '#f43f5e', label: 'Critical' },
  }[status] || {}

  return (
    <span className="flex items-center gap-1.5 text-xs font-mono px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.text }}>
      <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: cfg.dot }} />
      {cfg.label}
    </span>
  )
}

function NodeCard({ node }) {
  const cpuColor  = node.cpu  > 80 ? '#f43f5e' : node.cpu  > 60 ? '#f59e0b' : '#10b981'
  const memColor  = node.mem  > 80 ? '#f43f5e' : node.mem  > 60 ? '#f59e0b' : '#8b5cf6'
  const diskColor = node.disk > 80 ? '#f43f5e' : '#00d4ff'

  return (
    <div className="glass rounded-xl p-4 border transition-all duration-200 hover:border-purple-500/30"
      style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="font-semibold text-sm">{node.name}</div>
          <div className="text-xs font-mono mt-0.5" style={{ color: '#8888a0' }}>{node.region}</div>
        </div>
        <StatusBadge status={node.status} />
      </div>

      {/* Gauges */}
      <div className="flex items-center justify-between mb-4">
        {[
          { label: 'CPU',  value: node.cpu,  color: cpuColor  },
          { label: 'MEM',  value: node.mem,  color: memColor  },
          { label: 'DISK', value: node.disk, color: diskColor },
        ].map(g => (
          <div key={g.label} className="flex flex-col items-center gap-1">
            <div className="relative">
              <GaugeRing value={g.value} color={g.color} />
              <div className="absolute inset-0 flex items-center justify-center text-xs font-mono font-bold"
                style={{ color: g.color }}>
                {g.value}%
              </div>
            </div>
            <div className="text-xs font-mono" style={{ color: '#8888a0' }}>{g.label}</div>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {[
          { label: 'Uptime',   value: `${node.uptime}%`, color: '#10b981' },
          { label: 'Latency',  value: `${node.latency}ms`, color: node.latency > 100 ? '#f59e0b' : '#8888a0' },
          { label: 'Req/min', value: node.requests.toLocaleString(), color: '#8888a0' },
        ].map(s => (
          <div key={s.label} className="text-center p-1.5 rounded" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="font-mono font-medium" style={{ color: s.color }}>{s.value}</div>
            <div style={{ color: '#555566' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CloudMonitor() {
  const [nodes, setNodes] = useState(generateNodes)
  const [live, setLive] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => setNodes(generateNodes()), 2500)
    return () => clearInterval(id)
  }, [live])

  const healthy  = nodes.filter(n => n.status === 'healthy').length
  const warnings = nodes.filter(n => n.status === 'warning').length
  const critical = nodes.filter(n => n.status === 'critical').length

  const filtered = filter === 'all' ? nodes : nodes.filter(n => n.status === filter)

  return (
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f0f0f5' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono mb-1" style={{ color: '#8b5cf6' }}>Infrastructure</div>
          <h2 className="text-2xl font-bold">Cloud Monitor</h2>
          <p className="text-sm mt-1" style={{ color: '#8888a0' }}>
            {nodes.length} nodes · multi-region · auto-refresh
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <div className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-400' : 'bg-gray-500'}`} />
            <span style={{ color: '#8888a0' }}>{live ? 'LIVE' : 'PAUSED'}</span>
          </div>
          <button onClick={() => setLive(l => !l)}
            className="px-3 py-1.5 rounded text-xs font-mono border"
            style={{ border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#ccc' }}>
            {live ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Healthy',  value: healthy,  color: '#10b981', filter: 'healthy'  },
          { label: 'Warning',  value: warnings, color: '#f59e0b', filter: 'warning'  },
          { label: 'Critical', value: critical, color: '#f43f5e', filter: 'critical' },
        ].map(s => (
          <button
            key={s.label}
            onClick={() => setFilter(f => f === s.filter ? 'all' : s.filter)}
            className="glass rounded-xl p-4 text-left border transition-all"
            style={{
              border: `1px solid ${filter === s.filter ? s.color + '44' : 'rgba(255,255,255,0.06)'}`,
              boxShadow: filter === s.filter ? `0 0 16px ${s.color}22` : 'none',
            }}
          >
            <div className="text-2xl font-bold font-mono" style={{ color: s.color }}>{s.value}</div>
            <div className="text-xs mt-0.5" style={{ color: '#8888a0' }}>{s.label}</div>
          </button>
        ))}
      </div>

      {/* Node grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map(node => <NodeCard key={node.id} node={node} />)}
      </div>
    </div>
  )
}
