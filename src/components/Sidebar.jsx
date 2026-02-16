import { useApp, FRAMEWORKS } from '../context/AppContext'
import ProviderSelector from './ProviderSelector'

export default function Sidebar() {
  const { state, toggleSidebar, setFramework, setVoiceAProvider, setVoiceBProvider, getActiveFramework } = useApp()
  const framework = getActiveFramework()
  
  const chatHistory = [
    { id: 1, title: 'Should I leave my job?', date: 'Today' },
    { id: 2, title: 'Investment strategy for 2026', date: 'Yesterday' },
    { id: 3, title: 'Moving to a new city', date: 'Dec 28' },
    { id: 4, title: 'Starting a side project', date: 'Dec 25' },
  ]
  
  return (
    <aside className={`sidebar ${state.sidebarOpen ? '' : 'collapsed'}`}>
      <div className="relative z-10 flex items-center justify-between p-5 border-b border-white/10">
        <span className="font-display text-lg font-bold text-soft-white uppercase" style={{ letterSpacing: '0.15em' }}>
          DIVERGENT
        </span>
        <button onClick={toggleSidebar} className="w-8 h-8 flex items-center justify-center rounded-md transition-colors hover:bg-white/10 text-icy-aqua">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M11 19l-7-7 7-7M18 19l-7-7 7-7"/>
          </svg>
        </button>
      </div>
      
      <div className="relative z-10 p-5">
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ letterSpacing: '0.08em', color: 'var(--pearl-aqua)' }}>
          Voice Framework
        </h3>
        <div className="flex flex-col gap-2">
          {Object.values(FRAMEWORKS).map((fw) => (
            <button
              key={fw.id}
              onClick={() => setFramework(fw.id)}
              className={`text-left px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                state.activeFramework === fw.id ? 'bg-white/15 text-soft-white' : 'text-icy-aqua hover:bg-white/8'
              }`}
            >
              {fw.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="relative z-10 px-5 pb-5 border-b border-white/10">
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ letterSpacing: '0.08em', color: 'var(--pearl-aqua)' }}>
          AI Models
        </h3>
        <div className="flex flex-col gap-3">
          <ProviderSelector voice={framework.voiceA.name} currentProvider={state.voiceAProvider} onChange={setVoiceAProvider} />
          <ProviderSelector voice={framework.voiceB.name} currentProvider={state.voiceBProvider} onChange={setVoiceBProvider} />
        </div>
      </div>
      
      <div className="relative z-10 px-5 pt-5">
        <button
          className="w-full py-3 rounded-md text-sm font-medium flex items-center justify-center gap-2 transition-all duration-200"
          style={{ background: 'rgba(131, 208, 203, 0.12)', border: '1px solid rgba(131, 208, 203, 0.25)', color: 'var(--pearl-aqua)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M12 5v14M5 12h14"/>
          </svg>
          New Exploration
        </button>
      </div>
      
      <div className="relative z-10 flex-1 overflow-y-auto p-5">
        <h3 className="text-xs font-semibold uppercase mb-3" style={{ letterSpacing: '0.08em', color: 'var(--pearl-aqua)' }}>
          Recent
        </h3>
        <div className="flex flex-col gap-1">
          {chatHistory.map((chat) => (
            <button key={chat.id} className="text-left px-3 py-2.5 rounded-md transition-colors hover:bg-white/10 text-icy-aqua">
              <div className="text-sm font-medium truncate" style={{ letterSpacing: '-0.01em' }}>{chat.title}</div>
              <div className="text-xs mt-1" style={{ color: 'var(--tropical-teal)' }}>{chat.date}</div>
            </button>
          ))}
        </div>
      </div>
    </aside>
  )
}
