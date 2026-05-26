import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <div className="text-6xl font-bold font-mono mb-2" style={{ color: 'var(--surface-4)' }}>404</div>
        <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
          This route doesn't exist. Check <code className="font-mono text-cyan-400">/apps/</code> and re-run the generator.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-colors hover:bg-white/5"
          style={{ borderColor: 'var(--border)', color: 'var(--text-primary)' }}
        >
          ← Back to home
        </Link>
      </div>
    </div>
  )
}
