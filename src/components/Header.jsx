import { useApp } from '../context/AppContext'

export default function Header() {
  const { state, setViewMode, getActiveFramework } = useApp()
  const framework = getActiveFramework()
  
  return (
    <header className="flex items-center justify-end gap-4 mb-6">
      <div className="flex rounded-md overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <button
          onClick={() => setViewMode('cards')}
          className={`px-4 py-2 text-xs font-medium flex items-center gap-2 transition-all duration-200 ${
            state.viewMode === 'cards' ? 'bg-white/15 text-soft-white' : 'text-icy-aqua hover:bg-white/8'
          }`}
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
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          Thread
        </button>
      </div>
      
      <span className="px-4 py-2 rounded-md text-sm font-medium text-icy-aqua" style={{ background: 'rgba(255, 255, 255, 0.08)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
        {framework.name}
      </span>
    </header>
  )
}
