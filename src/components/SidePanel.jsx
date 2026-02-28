import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useApp, FRAMEWORKS, PROVIDERS, VOICES } from '../context/AppContext'

const TABS = [
  { id: 'history', label: 'History' },
  { id: 'voices', label: 'Voices' },
  { id: 'settings', label: 'Settings' },
]

export default function SidePanel({ open, onClose, onNewChat }) {
  const {
    state,
    dispatch,
    loadChat,
    deleteChat,
    deleteAllChats,
    setMode,
    setFramework,
    setVoiceAProvider,
    setVoiceBProvider,
    setVoiceAVoice,
    setVoiceBVoice,
    setDebateOverlap,
    getActiveFramework,
  } = useApp()

  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false)

  const framework = getActiveFramework()
  const voiceALabel = framework?.voiceA?.name ?? 'Voice A'
  const voiceBLabel = framework?.voiceB?.name ?? 'Voice B'

  const [activeTab, setActiveTab] = useState('history')

  const frameworks = useMemo(() => Object.values(FRAMEWORKS), [])
  const providers = useMemo(() => Object.values(PROVIDERS), [])

  if (!open) return null

  const histories = state.chatHistories || []

  return createPortal(
    <>
      <button type="button" className="panelBackdrop" onClick={onClose} aria-label="Close panel" />
      <aside className="panel" role="dialog" aria-label="Settings" data-mode={state.mode}>
        <div className="panelHeader">
          <div className="panelTitle">Settings</div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="panelTabs" role="tablist" aria-label="Settings tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={activeTab === t.id}
              className={`panelTab ${activeTab === t.id ? 'isActive' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="panelBody">
          {activeTab === 'history' && (
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

          {activeTab === 'voices' && (
            <div className="panelSection">
              <div className="panelSectionLabel">Unique voice selection</div>
              <div className="panelTagGrid">
                {frameworks.map((fw) => (
                  <button
                    key={fw.id}
                    type="button"
                    className="tag"
                    data-active={state.activeFramework === fw.id ? 'true' : 'false'}
                    onClick={() => setFramework(fw.id)}
                  >
                    {fw.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
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

              <div className="panelSection">
                <div className="panelSectionLabel">Speakers (TTS)</div>
                {(() => {
                  const voiceOptions = state.availableVoices?.length
                    ? state.availableVoices.map((v) => ({ key: v.voiceId, value: v.voiceId, label: v.name }))
                    : VOICES.map((v) => ({ key: v.id, value: v.id, label: v.name }))
                  const ttsConfigured =
                    (state.availableVoices?.length ?? 0) > 0 &&
                    !String(state.voiceAVoiceId ?? '').startsWith('REPLACE_') &&
                    !String(state.voiceBVoiceId ?? '').startsWith('REPLACE_')
                  return (
                    <>
                      <div className="panelFormGrid">
                        <div className="panelField">
                          <label className="panelFieldLabel">{voiceALabel}</label>
                          <select className="panelSelect" value={state.voiceAVoiceId} onChange={(e) => setVoiceAVoice(e.target.value)}>
                            {voiceOptions.map((v) => (
                              <option key={v.key} value={v.value}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="panelField">
                          <label className="panelFieldLabel">{voiceBLabel}</label>
                          <select className="panelSelect" value={state.voiceBVoiceId} onChange={(e) => setVoiceBVoice(e.target.value)}>
                            {voiceOptions.map((v) => (
                              <option key={v.key} value={v.value}>
                                {v.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <p className="panelTtsStatus" role="status" aria-live="polite">
                        {ttsConfigured
                          ? 'TTS: ready'
                          : 'TTS: not configured. Set ELEVENLABS_API_KEY and add voice IDs in Settings to enable.'}
                      </p>
                      {!ttsConfigured && (
                        <p className="panelTtsHelp" title="Speech uses ElevenLabs. Set ELEVENLABS_API_KEY and add voice IDs from elevenlabs.io to enable.">
                          Speech uses ElevenLabs. Set ELEVENLABS_API_KEY and add voice IDs from elevenlabs.io to enable.
                        </p>
                      )}
                      {state.ttsError && (
                        <p className="panelTtsError" role="alert">
                          {state.ttsError}
                          <button
                            type="button"
                            className="panelTtsErrorDismiss"
                            onClick={() => dispatch({ type: 'CLEAR_TTS_ERROR' })}
                            aria-label="Dismiss"
                          >
                            ×
                          </button>
                        </p>
                      )}
                    </>
                  )
                })()}
              </div>

              <div className="panelSection">
                <div className="panelSectionLabel">Debate overlap</div>
                <div className="panelRangeRow">
                  <span className="panelRangeLabel">Turn-taking</span>
                  <input
                    className="panelRange"
                    type="range"
                    min={0}
                    max={100}
                    value={state.debateOverlap}
                    onChange={(e) => setDebateOverlap(Number(e.target.value))}
                    aria-label="Debate overlap from turn-taking to both at once"
                  />
                  <span className="panelRangeLabel">Both at once</span>
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

