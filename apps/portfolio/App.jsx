import React, { useState, useEffect, useRef } from 'react'

const PROJECTS = [
  {
    name: 'SDN QoS Platform',
    desc: 'Dueling Double DQN agent with LSTM traffic prediction for dynamic OpenFlow queue scheduling.',
    tags: ['Python', 'Ryu', 'Mininet', 'PyTorch'],
    stars: 48, color: '#00d4ff',
  },
  {
    name: 'Multi-Site DevPortal',
    desc: 'Auto-discovering monorepo platform: drop a folder in /apps/, push, deploy. Zero config.',
    tags: ['React', 'Vite', 'GitHub Actions'],
    stars: 31, color: '#8b5cf6',
  },
  {
    name: 'Clinical Reasoning Engine',
    desc: 'Python DSL-based medical reasoning with 51 KDIGO-2024 rules, drug interaction checking.',
    tags: ['Python', 'NLP', 'Healthcare'],
    stars: 19, color: '#10b981',
  },
  {
    name: 'AI Research Worker',
    desc: 'ReAct agentic system with APScheduler, FastAPI REST layer, and Docker/Fly.io deployment.',
    tags: ['Python', 'Groq', 'Docker', 'FastAPI'],
    stars: 27, color: '#f59e0b',
  },
]

const SKILLS = [
  { group: 'Frontend',   items: ['React', 'Next.js', 'Vite', 'Tailwind CSS'] },
  { group: 'Backend',    items: ['Python', 'FastAPI', 'Node.js', 'MongoDB'] },
  { group: 'AI / ML',   items: ['PyTorch', 'Hugging Face', 'Ollama', 'ChromaDB'] },
  { group: 'DevOps',     items: ['GitHub Actions', 'Docker', 'Fly.io', 'Nginx'] },
  { group: 'Networking', items: ['Mininet', 'Ryu', 'OpenFlow', 'OVS'] },
]

// Terminal typewriter
function Terminal({ lines }) {
  const [shown, setShown] = useState([])
  const [cursor, setCursor] = useState(true)

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      if (i < lines.length) { setShown(p => [...p, lines[i]]); i++ }
      else clearInterval(interval)
    }, 500)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const id = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d14', border: '1px solid rgba(255,255,255,0.08)' }}>
      {/* Traffic lights */}
      <div className="flex items-center gap-2 px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {['#f43f5e','#f59e0b','#10b981'].map(c => (
          <div key={c} className="w-3 h-3 rounded-full" style={{ background: c, opacity: 0.7 }} />
        ))}
        <span className="ml-2 text-xs font-mono" style={{ color: '#555566' }}>selva@devportal ~</span>
      </div>
      <div className="p-5 font-mono text-sm space-y-1 min-h-[160px]">
        {shown.map((line, i) => (
          <div key={i} style={{ color: line.startsWith('$') ? '#00d4ff' : line.startsWith('#') ? '#555566' : '#10b981' }}>
            {line}
          </div>
        ))}
        <div style={{ color: '#00d4ff' }}>
          ${' '}<span style={{ borderRight: cursor ? '2px solid #00d4ff' : '2px solid transparent' }}>&nbsp;</span>
        </div>
      </div>
    </div>
  )
}

export default function Portfolio() {
  const TERMINAL_LINES = [
    '# Selva · Information Technology · PTU',
    '$ whoami',
    'BTech student · AI & Web Developer · Researcher',
    '$ ls projects/',
    'network-dashboard/  clinical-engine/  ai-worker/  devportal/',
    '$ cat interests.txt',
    'Reinforcement Learning, NLP, SDN, Full-Stack, DevOps',
    '$ git log --oneline -3',
    'a4f19d2 feat: KDIGO-2024 lupus nephritis rules (51 total)',
    '8b3c1f0 fix: OVS cookie-based flow deletion in DQN agent',
    '2e9a77f feat: multi-site platform auto-discovery engine',
  ]

  return (
    <div style={{ fontFamily: 'Space Grotesk, sans-serif', color: '#f0f0f5', maxWidth: '900px' }}>
      {/* Header */}
      <div className="flex items-center gap-6 mb-10 flex-wrap">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(0,212,255,0.2))', border: '1px solid rgba(16,185,129,0.3)' }}>
          🧑‍💻
        </div>
        <div>
          <div className="text-xs font-mono mb-1" style={{ color: '#10b981' }}>Available for internships & research</div>
          <h2 className="text-3xl font-bold">Selva</h2>
          <p className="text-sm mt-1" style={{ color: '#8888a0' }}>
            BTech IT · Puducherry Technological University · Class of 2026
          </p>
          <div className="flex gap-3 mt-3 text-xs font-mono">
            {['GitHub', 'LinkedIn', 'Email'].map(l => (
              <a key={l} href="#" className="px-2 py-1 rounded border hover:opacity-80 transition-opacity"
                style={{ border: '1px solid rgba(255,255,255,0.1)', color: '#8888a0' }}>
                {l} ↗
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Terminal */}
      <div className="mb-8">
        <Terminal lines={TERMINAL_LINES} />
      </div>

      {/* Projects */}
      <section className="mb-8">
        <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#8888a0' }}>
          Featured Projects
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PROJECTS.map(p => (
            <div key={p.name} className="glass rounded-xl p-5 border transition-all hover:scale-[1.01]"
              style={{ border: `1px solid ${p.color}22` }}>
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm" style={{ color: p.color }}>{p.name}</h3>
                <span className="text-xs font-mono" style={{ color: '#8888a0' }}>★ {p.stars}</span>
              </div>
              <p className="text-xs leading-relaxed mb-3" style={{ color: '#8888a0' }}>{p.desc}</p>
              <div className="flex flex-wrap gap-1">
                {p.tags.map(t => (
                  <span key={t} className="text-xs font-mono px-1.5 py-0.5 rounded"
                    style={{ background: `${p.color}15`, color: p.color, border: `1px solid ${p.color}25` }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section>
        <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#8888a0' }}>
          Skills
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SKILLS.map(s => (
            <div key={s.group} className="glass rounded-lg p-4" style={{ border: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="text-xs font-mono mb-2" style={{ color: '#10b981' }}>{s.group}</div>
              <div className="flex flex-wrap gap-1.5">
                {s.items.map(item => (
                  <span key={item} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(255,255,255,0.05)', color: '#ccc' }}>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
