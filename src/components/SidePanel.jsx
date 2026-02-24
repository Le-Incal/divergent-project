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
    loadChat,
    setMode,
    setFramework,
    setVoiceAProvider,
    setVoiceBProvider,
    setVoiceAVoice,
    setVoiceBVoice,
    setDebateOverlap,
    getActiveFramework,
  } = useApp()

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
      <aside className="panel" role="dialog" aria-label="Panel">
        <div className="panelHeader">
          <div className="panelTitle">Panel</div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="panelTabs" role="tablist" aria-label="Panel tabs">
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
                    <button
                      key={h.id}
                      type="button"
                      role="listitem"
                      className={`historyItem ${state.activeChatId === h.id ? 'isActive' : ''}`}
                      onClick={() => loadChat(h.id)}
                    >
                      <div className="historyTitle">{h.title || 'Untitled'}</div>
                      <div className="historyMeta">
                        {(h.frameworkId && FRAMEWORKS[h.frameworkId]?.name) || h.frameworkId || '—'} · {new Date(h.createdAt || Date.now()).toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <div className="panelActionsRow">
                <button type="button" className="btn btn-primary btn-arrow" onClick={onNewChat}>
                  New chat
                </button>
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
                <div className="panelFormGrid">
                  <div className="panelField">
                    <label className="panelFieldLabel">{voiceALabel}</label>
                    <select className="panelSelect" value={state.voiceAVoiceId} onChange={(e) => setVoiceAVoice(e.target.value)}>
                      {VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="panelField">
                    <label className="panelFieldLabel">{voiceBLabel}</label>
                    <select className="panelSelect" value={state.voiceBVoiceId} onChange={(e) => setVoiceBVoice(e.target.value)}>
                      {VOICES.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
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

