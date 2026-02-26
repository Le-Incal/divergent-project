import { useState } from 'react'
import { useApp } from './context/AppContext'
import Header from './components/Header'
import ChatThread from './components/ChatThread'
import InputArea from './components/InputArea'
import LandingPage from './components/LandingPage'
import SidePanel from './components/SidePanel'
import VoiceFlowController from './components/VoiceFlowController'

function App() {
  const { state, dispatch, setMode } = useApp()
  const [panelOpen, setPanelOpen] = useState(false)
  const [replyContext, setReplyContext] = useState(null)

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
    setReplyContext(null)
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

      <VoiceFlowController active={hasEntered && state.chatPhase === 'idle'} />

      <main className="appMain">
        <div className="appSection">
          <ChatThread
            onReply={(blockText) => setReplyContext(blockText)}
          />
        </div>

        <InputArea
          replyContext={replyContext}
          onClearReply={() => setReplyContext(null)}
        />
      </main>
    </div>
  )
}

export default App
