import { useState } from 'react'
import { useApp } from './context/AppContext'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import VoiceCard from './components/VoiceCard'
import DebateCard from './components/DebateCard'
import InputArea from './components/InputArea'
import LandingPage from './components/LandingPage'

function App() {
  const { state, getActiveFramework, toggleSidebar } = useApp()
  const framework = getActiveFramework()

  const [hasEntered, setHasEntered] = useState(() => {
    try {
      return sessionStorage.getItem('divergent-has-entered') === 'true'
    } catch {
      return false
    }
  })

  const handleEnter = () => {
    try {
      sessionStorage.setItem('divergent-has-entered', 'true')
    } catch {
      // ignore
    }
    setHasEntered(true)
  }

  if (!hasEntered) {
    return (
      <div className="min-h-screen app-theme-transition" data-mode="default">
        <LandingPage onEnter={handleEnter} />
      </div>
    )
  }

  return (
    <div className="min-h-screen app-theme-transition" data-mode={state.mode}>
      <div
        className="background-image"
        style={{ backgroundImage: `url('${state.mode === 'sandpit' ? '/sand-bg.png' : '/stars-bg.png'}')` }}
      />
      <div className="background-gradient" />
      
      <Sidebar />
      
      {!state.sidebarOpen && (
        <button
          onClick={toggleSidebar}
          className="fixed left-4 top-4 w-10 h-10 rounded-lg z-[99] flex items-center justify-center transition-all duration-200"
          style={{
            background: 'rgba(var(--jet-black-rgb), 0.62)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(var(--icy-aqua-rgb), 0.18)',
            color: 'var(--icy-aqua)',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M3 12h18M3 6h18M3 18h18"/>
          </svg>
        </button>
      )}
      
      <main
        className={`relative z-10 min-h-screen p-6 flex flex-col transition-all duration-300 ${
          state.sidebarOpen ? 'ml-[280px]' : 'ml-0 pl-16'
        }`}
      >
        <Header />
        
        <div className="flex-1 flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-6 max-w-[1300px] mx-auto w-full mt-10">
            <VoiceCard
              voice={framework.voiceA}
              type={framework.id === 'ethos-ego' ? 'champion' : 'challenger'}
              response={state.voiceAResponse}
              isLoading={state.isLoading}
            />
            <VoiceCard
              voice={framework.voiceB}
              type={framework.id === 'ethos-ego' ? 'challenger' : 'champion'}
              response={state.voiceBResponse}
              isLoading={state.isLoading}
            />
          </div>
          {(state.voiceAResponse || state.voiceBResponse || state.debateMessages.length > 0) && <DebateCard />}
        </div>
        
        <InputArea />
      </main>
    </div>
  )
}

export default App
