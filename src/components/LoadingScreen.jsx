export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-transparent"
            style={{ borderTopColor: 'var(--accent-cyan)', animation: 'spin 0.8s linear infinite' }} />
          <div className="absolute inset-2 rounded-full border-2 border-transparent"
            style={{ borderTopColor: 'var(--accent-purple)', animation: 'spin 1.2s linear infinite reverse' }} />
        </div>
        <span className="text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
          Loading app...
        </span>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
