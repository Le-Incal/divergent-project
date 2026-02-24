import { useState } from 'react'
import { useApp } from './context/AppContext'
import Header from './components/Header'
import VoiceCard from './components/VoiceCard'
import DebateCard from './components/DebateCard'
import InputArea from './components/InputArea'
import LandingPage from './components/LandingPage'
import SidePanel from './components/SidePanel'

function App() {
  const { state, dispatch, setMode, getActiveFramework } = useApp()
  const framework = getActiveFramework()
  const [panelOpen, setPanelOpen] = useState(false)

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

  const restartToLanding = () => {
    dispatch({ type: 'CLEAR_RESPONSES' })
    setPanelOpen(false)
    setMode('default')
    try {
      sessionStorage.removeItem('divergent-has-entered')
    } catch {
      // ignore
    }
    setHasEntered(false)
  }

  if (!hasEntered) {
    return (
      <div className="min-h-screen" data-mode="default">
        <LandingPage onEnter={handleEnter} />
      </div>
    )
  }

  return (
    <div className="min-h-screen appShell" data-mode={state.mode}>
      <Header onOpenPanel={() => setPanelOpen(true)} onRestart={restartToLanding} />
      <SidePanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        onNewChat={restartToLanding}
      />

      <main className="appMain">
        <div className="appSection">
          <div className="appGrid">
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
