import { useApp } from '../context/AppContext'

export default function Header() {
  const { state, setViewMode, setMode, getActiveFramework } = useApp()
  const framework = getActiveFramework()
  const isDefault = state.mode === 'default'

  return (
    <header className="flex items-center justify-between gap-4 mb-6">
      <div
        className="flex rounded-md overflow-hidden"
        style={{
          background: 'var(--header-bg, rgba(255, 255, 255, 0.08))',
          border: '1px solid var(--header-border, rgba(255, 255, 255, 0.1))',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          boxShadow: '0 10px 24px rgba(var(--jet-black-rgb), 0.12)',
        }}
      >
        <button
          onClick={() => setMode('default')}
          className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
            isDefault ? 'bg-white/15' : 'hover:bg-white/8'
          }`}
          style={{
            color: isDefault ? 'var(--header-active, var(--soft-white))' : 'var(--header-inactive, var(--icy-aqua))',
          }}
        >
          Default
        </button>
        <button
          onClick={() => setMode('sandpit')}
          className={`px-4 py-2 text-xs font-medium transition-all duration-200 ${
            !isDefault ? 'bg-white/15' : 'hover:bg-white/8'
          }`}
          style={{
            color: !isDefault ? 'var(--header-active, var(--parchment))' : 'var(--header-inactive, var(--icy-aqua))',
          }}
        >
          Sandpit
        </button>
      </div>

      <div className="flex items-center gap-4">
        <div
          className="flex rounded-md overflow-hidden"
          style={{
            background: 'var(--header-bg, rgba(255, 255, 255, 0.08))',
            border: '1px solid var(--header-border, rgba(255, 255, 255, 0.1))',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: '0 10px 24px rgba(var(--jet-black-rgb), 0.12)',
          }}
        >
          <button
            onClick={() => setViewMode('cards')}
            className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-all duration-200 ${
              state.viewMode === 'cards' ? 'bg-white/15 text-soft-white' : 'text-icy-aqua hover:bg-white/8'
            }`}
            style={{
              color: state.viewMode === 'cards' ? 'var(--header-active, var(--soft-white))' : 'var(--header-inactive, var(--icy-aqua))',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="9" rx="1"/><rect x="3" y="14" width="18" height="7" rx="1"/>
            </svg>
            Cards
          </button>
          <button
            onClick={() => setViewMode('conversation')}
            className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-all duration-200 ${
              state.viewMode === 'conversation' ? 'bg-white/15 text-soft-white' : 'text-icy-aqua hover:bg-white/8'
            }`}
            style={{
              color: state.viewMode === 'conversation' ? 'var(--header-active, var(--soft-white))' : 'var(--header-inactive, var(--icy-aqua))',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Thread
          </button>
        </div>

        <span
          className="px-4 py-2 rounded-md text-sm font-medium"
          style={{
            background: 'var(--header-bg, rgba(255, 255, 255, 0.08))',
            border: '1px solid var(--header-border, rgba(255, 255, 255, 0.1))',
            color: 'var(--header-label, var(--icy-aqua))',
          }}
        >
          {framework?.name}
        </span>
      </div>
    </header>
  )
}
