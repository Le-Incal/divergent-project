import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp, PROVIDERS } from '../context/AppContext'

export default function SidePanel({ open, onClose, onNewChat, view = 'settings' }) {
  const {
    state,
    loadChat,
    deleteChat,
    deleteAllChats,
    setMode,
    setVoiceAProvider,
    setVoiceBProvider,
    getActiveFramework,
  } = useApp()

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

  const framework = getActiveFramework()
  const voiceALabel = framework?.voiceA?.name ?? 'Voice A'
  const voiceBLabel = framework?.voiceB?.name ?? 'Voice B'

  const providers = useMemo(() => Object.values(PROVIDERS), [])

  if (!open) return null

  const histories = state.chatHistories || []

  return createPortal(
    <>
      <button type="button" className="panelBackdrop" onClick={onClose} aria-label="Close panel" />
      <aside className="panel" role="dialog" aria-label={view === 'history' ? 'History' : 'AI modalities'} data-mode={state.mode}>
        <div className="panelHeader">
          <div className="panelTitle">{view === 'history' ? 'History' : 'AI modalities'}</div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="panelBody">
          {view === 'history' && (
            <div className="panelSection">
              <div className="panelSectionLabel">Chat histories</div>
              {histories.length === 0 ? (
                <p className="panelMuted">No chats yet.</p>
              ) : (
                <div className="historyList" role="list">
                  {histories.map((h) => (
                    <div
                      key={h.id}
                      className={`historyItem ${state.activeChatId === h.id ? 'isActive' : ''}`}
                      role="listitem"
                    >
                      <button
                        type="button"
                        className="historyItemMain"
                        onClick={() => { loadChat(h.id); onClose() }}
                      >
                        <span className="historyTitle">{h.title || 'Untitled'}</span>
                        <span className="historyMeta">
                          {new Date(h.createdAt || Date.now()).toLocaleDateString()}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="historyDeleteBtn"
                        onClick={() => deleteChat(h.id)}
                        aria-label={`Delete "${h.title || 'Untitled'}"`}
                        title="Delete chat"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="panelActionsRow">
                <button type="button" className="btn btn-primary btn-arrow" onClick={onNewChat}>
                  New chat
                </button>
                {histories.length > 0 && (
                  confirmDeleteAll ? (
                    <div className="historyDeleteAllConfirm">
                      <span className="historyDeleteAllMsg">Delete all chats?</span>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => { deleteAllChats(); setConfirmDeleteAll(false) }}
                      >
                        Yes, delete all
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setConfirmDeleteAll(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost-danger"
                      onClick={() => setConfirmDeleteAll(true)}
                    >
                      Delete all
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          {view === 'settings' && (
            <>
              <div className="panelSection">
                <div className="panelSectionLabel">Mode</div>
                <div className="panelToggleRow" role="group" aria-label="Mode toggle">
                  <button
                    type="button"
                    className={`panelToggle ${state.mode === 'default' ? 'isActive' : ''}`}
                    onClick={() => setMode('default')}
                  >
                    Default
                  </button>
                  <button
                    type="button"
                    className={`panelToggle ${state.mode === 'sandpit' ? 'isActive' : ''}`}
                    onClick={() => setMode('sandpit')}
                  >
                    Sandpit
                  </button>
                </div>
              </div>

              <div className="panelSection">
                <div className="panelSectionLabel">AI providers</div>
                <div className="panelFormGrid">
                  <div className="panelField">
                    <label className="panelFieldLabel">{voiceALabel}</label>
                    <select className="panelSelect" value={state.voiceAProvider} onChange={(e) => setVoiceAProvider(e.target.value)}>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="panelField">
                    <label className="panelFieldLabel">{voiceBLabel}</label>
                    <select className="panelSelect" value={state.voiceBProvider} onChange={(e) => setVoiceBProvider(e.target.value)}>
                      {providers.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

            </>
          )}
        </div>
      </aside>
    </>,
    document.body,
  )
}

