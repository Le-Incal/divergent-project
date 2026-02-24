import { createPortal } from 'react-dom'
import { useApp, FRAMEWORKS, PROVIDERS, VOICES } from '../context/AppContext'

export default function SettingsDrawer({ open, onClose }) {
  const {
    state,
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

  if (!open) return null

  return createPortal(
    <>
      <button type="button" className="drawerBackdrop" onClick={onClose} aria-label="Close settings" />
      <aside className="drawerPanel" role="dialog" aria-label="Settings">
        <div className="drawerHeader">
          <div className="drawerTitle">Settings</div>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="drawerSection">
          <div className="drawerSectionLabel">Mode</div>
          <div className="drawerToggleRow" role="group" aria-label="Mode toggle">
            <button
              type="button"
              className={`drawerToggle ${state.mode === 'default' ? 'isActive' : ''}`}
              onClick={() => setMode('default')}
            >
              Default
            </button>
            <button
              type="button"
              className={`drawerToggle ${state.mode === 'sandpit' ? 'isActive' : ''}`}
              onClick={() => setMode('sandpit')}
            >
              Sandpit
            </button>
          </div>
        </div>

        <div className="drawerSection">
          <div className="drawerSectionLabel">Framework</div>
          <div className="drawerFrameworkGrid">
            {Object.values(FRAMEWORKS).map((fw) => (
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

        <div className="drawerSection">
          <div className="drawerSectionLabel">AI providers</div>
          <div className="drawerFormGrid">
            <div className="drawerField">
              <label className="drawerFieldLabel">{voiceALabel}</label>
              <select className="drawerSelect" value={state.voiceAProvider} onChange={(e) => setVoiceAProvider(e.target.value)}>
                {Object.values(PROVIDERS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="drawerField">
              <label className="drawerFieldLabel">{voiceBLabel}</label>
              <select className="drawerSelect" value={state.voiceBProvider} onChange={(e) => setVoiceBProvider(e.target.value)}>
                {Object.values(PROVIDERS).map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="drawerSection">
          <div className="drawerSectionLabel">Speakers (TTS)</div>
          <div className="drawerFormGrid">
            <div className="drawerField">
              <label className="drawerFieldLabel">{voiceALabel}</label>
              <select className="drawerSelect" value={state.voiceAVoiceId} onChange={(e) => setVoiceAVoice(e.target.value)}>
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="drawerField">
              <label className="drawerFieldLabel">{voiceBLabel}</label>
              <select className="drawerSelect" value={state.voiceBVoiceId} onChange={(e) => setVoiceBVoice(e.target.value)}>
                {VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="drawerSection">
          <div className="drawerSectionLabel">Debate overlap</div>
          <div className="drawerRangeRow">
            <span className="drawerRangeLabel">Turn-taking</span>
            <input
              className="drawerRange"
              type="range"
              min={0}
              max={100}
              value={state.debateOverlap}
              onChange={(e) => setDebateOverlap(Number(e.target.value))}
              aria-label="Debate overlap from turn-taking to both at once"
            />
            <span className="drawerRangeLabel">Both at once</span>
          </div>
        </div>
      </aside>
    </>,
    document.body,
  )
}

