import { useState } from 'react'
import { useApp } from './context/AppContext'
import { useChat } from './hooks/useChat'
import Header from './components/Header'
import ChatThread from './components/ChatThread'
import { QuestionPrompt } from './components/InputArea'
import LandingPage from './components/LandingPage'
import SidePanel from './components/SidePanel'

function App() {
  const { state, dispatch, setMode } = useApp()
  const { sendMessage, startDebate, startElaborate, regenerateMessage, startBrainstorm, acceptDiagramOffer, declineDiagramOffer } = useChat()
  const [panelView, setPanelView] = useState(null)

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
    setPanelView(null)
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

  const hasThread = (state.messages || []).some((m) => m.type === 'user' || m.type === 'ethos' || m.type === 'ego')

  return (
    <div className="min-h-screen appShell" data-mode={state.mode}>
      <Header onRestart={restartToLanding} />
      <SidePanel
        open={panelView != null}
        view={panelView || 'settings'}
        onClose={() => setPanelView(null)}
        onNewChat={restartToLanding}
      />

      <main className="appMain">
        {hasThread ? (
          <div className="appSection">
            <ChatThread
              onReplyToVoice={(voice, text, replyTo) => sendMessage(text, { target: voice, replyTo })}
              onReplyToBoth={(text) => sendMessage(text, { target: 'both', endBrainstorm: true })}
              onDebate={startDebate}
              onElaborate={startElaborate}
              onRegenerate={regenerateMessage}
              onBrainstorm={startBrainstorm}
              onDiagramAccept={acceptDiagramOffer}
              onDiagramDecline={declineDiagramOffer}
              onOpenHistory={() => setPanelView('history')}
              onOpenSettings={() => setPanelView('settings')}
            />
          </div>
        ) : (
          <div className="questionStage">
            <QuestionPrompt
              disabled={state.isLoading}
              onSubmit={(text) => sendMessage(text, { target: 'both' })}
              onOpenHistory={() => setPanelView('history')}
              onOpenSettings={() => setPanelView('settings')}
            />
          </div>
        )}
      </main>
    </div>
  )
}

export default App
