import React, { useState, useEffect, useRef } from 'react'

// ─── Fake data generators ──────────────────────────────────
const NODES = ['SW-Core', 'SW-Edge-1', 'SW-Edge-2', 'Host-A', 'Host-B', 'Host-C']
const DSCP_CLASSES = [
  { label: 'EF — Voice',      dscp: 46, color: '#00d4ff', priority: 'Highest' },
  { label: 'AF41 — Video',    dscp: 34, color: '#8b5cf6', priority: 'High'    },
  { label: 'AF21 — Data',     dscp: 18, color: '#10b981', priority: 'Medium'  },
  { label: 'BE — Best Effort',dscp:  0, color: '#f59e0b', priority: 'Low'     },
]

function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateFlows() {
  return DSCP_CLASSES.map(c => ({
    ...c,
    throughput: randomBetween(10, 950),
    latency: randomBetween(1, 120),
    drops: randomBetween(0, 30),
  }))
}

function generateTimeSeries(prev = []) {
  const point = { t: Date.now(), value: randomBetween(200, 900) }
  const next = [...prev, point]
  return next.length > 30 ? next.slice(-30) : next
}

// ─── Sparkline component ───────────────────────────────────
function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null
  const W = 120, H = 36
  const values = data.map(d => d.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * W
    const y = H - ((v - min) / range) * (H - 4)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={W} height={H} style={{ overflow: 'visible' }}>
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.8"
      />
      {/* Area fill */}
      <polyline
        points={`0,${H} ${pts} ${W},${H}`}
        fill={color}
        opacity="0.07"
        strokeWidth="0"
      />
    </svg>
  )
}

// ─── Mini bar chart ────────────────────────────────────────
function BarChart({ flows }) {
  const max = Math.max(...flows.map(f => f.throughput), 1)
  return (
    <div className="space-y-2">
      {flows.map(f => (
        <div key={f.dscp} className="flex items-center gap-3 text-xs">
          <span className="w-28 truncate font-mono" style={{ color: '#8888a0' }}>{f.label}</span>
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.05)' }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(f.throughput / max) * 100}%`, background: f.color }}
            />
          </div>
          <span className="w-14 text-right font-mono" style={{ color: f.color }}>{f.throughput} Mbps</span>
        </div>
      ))}
    </div>
  )
}

// ─── Topology node ─────────────────────────────────────────
function TopologyNode({ label, x, y, type }) {
  const isSwitch = type === 'switch'
  return (
    <g transform={`translate(${x},${y})`}>
      <circle
        r={isSwitch ? 20 : 14}
        fill={isSwitch ? 'rgba(0,212,255,0.15)' : 'rgba(139,92,246,0.15)'}
        stroke={isSwitch ? '#00d4ff' : '#8b5cf6'}
        strokeWidth="1.5"
      />
      <text
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={isSwitch ? 8 : 7}
        fill={isSwitch ? '#00d4ff' : '#8b5cf6'}
        fontFamily="JetBrains Mono, monospace"
      >
        {label}
      </text>
    </g>
  )
}

// ─── Main component ────────────────────────────────────────
export default function NetworkDashboard() {
  const [flows, setFlows] = useState(generateFlows)
  const [series, setSeries] = useState(() => generateTimeSeries())
  const [tick, setTick] = useState(0)
  const [live, setLive] = useState(true)

  useEffect(() => {
    if (!live) return
    const id = setInterval(() => {
      setFlows(generateFlows())
      setSeries(p => generateTimeSeries(p))
      setTick(t => t + 1)
    }, 1800)
    return () => clearInterval(id)
  }, [live])

  const totalThroughput = flows.reduce((s, f) => s + f.throughput, 0)
  const avgLatency = Math.round(flows.reduce((s, f) => s + f.latency, 0) / flows.length)
  const totalDrops = flows.reduce((s, f) => s + f.drops, 0)

  return (
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f0f0f5' }}>
      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-xs font-mono mb-1" style={{ color: '#00d4ff' }}>SDN QoS Monitor</div>
          <h2 className="text-2xl font-bold">Network Dashboard</h2>
          <p className="text-sm mt-1" style={{ color: '#8888a0' }}>
            OpenFlow 1.3 · Ryu Controller · HTB Queue Scheduling
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <div className={`w-2 h-2 rounded-full ${live ? 'bg-emerald-400' : 'bg-gray-500'}`}
              style={live ? { animation: 'pulseSoft 1.5s ease-in-out infinite' } : {}} />
            <span style={{ color: '#8888a0' }}>{live ? 'LIVE' : 'PAUSED'}</span>
          </div>
          <button
            onClick={() => setLive(l => !l)}
            className="px-3 py-1.5 rounded text-xs font-mono border transition-colors"
            style={{
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
              color: live ? '#f43f5e' : '#10b981',
            }}
          >
            {live ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Throughput', value: `${totalThroughput}`, unit: 'Mbps', color: '#00d4ff' },
          { label: 'Avg Latency',      value: `${avgLatency}`,      unit: 'ms',   color: '#8b5cf6' },
          { label: 'Packet Drops',     value: `${totalDrops}`,      unit: 'pkts', color: totalDrops > 50 ? '#f43f5e' : '#10b981' },
        ].map(k => (
          <div key={k.label} className="glass rounded-xl p-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="text-xs mb-1" style={{ color: '#8888a0' }}>{k.label}</div>
            <div className="text-2xl font-bold font-mono" style={{ color: k.color }}>
              {k.value}
              <span className="text-sm font-normal ml-1" style={{ color: '#8888a0' }}>{k.unit}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Throughput by DSCP */}
        <div className="glass rounded-xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-xs font-mono mb-4" style={{ color: '#8888a0' }}>THROUGHPUT BY DSCP CLASS</div>
          <BarChart flows={flows} />
        </div>

        {/* Total throughput sparkline */}
        <div className="glass rounded-xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="text-xs font-mono mb-1" style={{ color: '#8888a0' }}>AGGREGATE THROUGHPUT (30s)</div>
          <div className="text-lg font-bold font-mono mb-3" style={{ color: '#00d4ff' }}>
            {series[series.length - 1]?.value || 0} Mbps
          </div>
          <Sparkline data={series} color="#00d4ff" />
        </div>
      </div>

      {/* DSCP flow cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {flows.map(f => (
          <div key={f.dscp} className="glass rounded-lg p-4" style={{ border: `1px solid ${f.color}22` }}>
            <div className="text-xs font-mono mb-2 truncate" style={{ color: f.color }}>{f.label}</div>
            <div className="text-lg font-bold font-mono" style={{ color: f.color }}>{f.throughput}<span className="text-xs font-normal ml-1" style={{ color: '#8888a0' }}>Mbps</span></div>
            <div className="text-xs mt-1" style={{ color: '#8888a0' }}>{f.latency}ms · {f.drops} drops</div>
            <div className="mt-2 text-xs px-1.5 py-0.5 rounded inline-block font-mono"
              style={{ background: `${f.color}18`, color: f.color }}>
              DSCP {f.dscp}
            </div>
          </div>
        ))}
      </div>

      {/* Topology SVG */}
      <div className="glass rounded-xl p-5" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="text-xs font-mono mb-4" style={{ color: '#8888a0' }}>NETWORK TOPOLOGY</div>
        <div className="overflow-x-auto">
          <svg width="520" height="160" style={{ maxWidth: '100%' }}>
            {/* Links */}
            {[[260,40,120,120],[260,40,260,120],[260,40,400,120],[120,120,60,150],[120,120,180,150],[400,120,340,150],[400,120,460,150]].map(([x1,y1,x2,y2],i) => (
              <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
            ))}
            <TopologyNode label="Core" x={260} y={40}  type="switch" />
            <TopologyNode label="Edge-1" x={120} y={120} type="switch" />
            <TopologyNode label="Edge-2" x={400} y={120} type="switch" />
            <TopologyNode label="H-A" x={60}  y={150} type="host" />
            <TopologyNode label="H-B" x={180} y={150} type="host" />
            <TopologyNode label="H-C" x={340} y={150} type="host" />
            <TopologyNode label="H-D" x={460} y={150} type="host" />
          </svg>
        </div>
      </div>

      <style>{`
        @keyframes pulseSoft { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </div>
  )
}
