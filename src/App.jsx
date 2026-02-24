import { useState } from 'react'
import { useApp } from './context/AppContext'
import Header from './components/Header'
import VoiceCard from './components/VoiceCard'
import DebateCard from './components/DebateCard'
import InputArea from './components/InputArea'
import LandingPage from './components/LandingPage'
import SettingsDrawer from './components/SettingsDrawer'

function App() {
  const { state, getActiveFramework } = useApp()
  const framework = getActiveFramework()
  const [settingsOpen, setSettingsOpen] = useState(false)

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
      <div className="min-h-screen" data-mode="default">
        <LandingPage onEnter={handleEnter} />
      </div>
    )
  }

  return (
    <div className="min-h-screen appShell" data-mode={state.mode}>
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} />

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
