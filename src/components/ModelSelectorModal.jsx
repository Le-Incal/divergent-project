import { createPortal } from 'react-dom'
import { useApp, PROVIDERS, VOICES } from '../context/AppContext'
import ProviderSelector from './ProviderSelector'

const PLAYBACK_MODES = [
  { id: 'turn-taking', label: 'Turn-taking' },
  { id: 'overlap', label: 'Overlap' },
  { id: 'both-at-once', label: 'Both at once' },
]

export default function ModelSelectorModal({ open, onClose }) {
  const {
    state,
    setVoiceAProvider,
    setVoiceBProvider,
    setVoiceAVoice,
    setVoiceBVoice,
    setVoicePlaybackMode,
    getActiveFramework,
  } = useApp()
  const framework = getActiveFramework()

  if (!open) return null

  const voiceALabel = framework?.voiceA?.name ?? 'Voice A'
  const voiceBLabel = framework?.voiceB?.name ?? 'Voice B'
  const currentA = PROVIDERS[state.voiceAProvider]?.name ?? '—'
  const currentB = PROVIDERS[state.voiceBProvider]?.name ?? '—'
  const currentVoiceA = VOICES.find((v) => v.id === state.voiceAVoiceId)?.name ?? '—'
  const currentVoiceB = VOICES.find((v) => v.id === state.voiceBVoiceId)?.name ?? '—'

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="model-selector-title"
        className="fixed left-1/2 top-1/2 z-[160] w-[min(380px,calc(100vw-32px))] max-h-[90vh] overflow-y-auto -translate-x-1/2 -translate-y-1/2 rounded-xl p-5 shadow-xl"
        style={{
          background: 'rgba(9, 37, 52, 0.92)',
          border: '1px solid rgba(178, 226, 223, 0.2)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            id="model-selector-title"
            className="text-xs font-semibold uppercase"
            style={{ letterSpacing: '0.08em', color: 'var(--pearl-aqua)' }}
          >
            AI Models & Voices
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/10 text-icy-aqua"
            aria-label="Close"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ProviderSelector
          mode={state.mode}
          voiceALabel={voiceALabel}
          voiceBLabel={voiceBLabel}
          voiceAProvider={state.voiceAProvider}
          voiceBProvider={state.voiceBProvider}
          onVoiceAChange={setVoiceAProvider}
          onVoiceBChange={setVoiceBProvider}
        />

        <div className="mt-4 pt-4 border-t border-white/10">
          <h3 className="text-xs font-semibold uppercase mb-2" style={{ letterSpacing: '0.06em', color: 'var(--pearl-aqua)' }}>
            Speakers (TTS)
          </h3>
          <p className="text-[10px] mb-2" style={{ color: 'var(--tropical-teal)' }}>Male / Female and more</p>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--icy-aqua)', letterSpacing: '-0.01em' }}>
                {voiceALabel} (Voice A)
              </span>
              <div className="model-select-wrap">
                <select
                  className="model-select"
                  value={state.voiceAVoiceId}
                  onChange={(e) => setVoiceAVoice(e.target.value)}
                >
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <span className="model-select-chevron" aria-hidden="true">▾</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs font-medium" style={{ color: 'var(--icy-aqua)', letterSpacing: '-0.01em' }}>
                {voiceBLabel} (Voice B)
              </span>
              <div className="model-select-wrap">
                <select
                  className="model-select"
                  value={state.voiceBVoiceId}
                  onChange={(e) => setVoiceBVoice(e.target.value)}
                >
                  {VOICES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
                <span className="model-select-chevron" aria-hidden="true">▾</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-white/10">
          <h3 className="text-xs font-semibold uppercase mb-2" style={{ letterSpacing: '0.06em', color: 'var(--pearl-aqua)' }}>
            Playback
          </h3>
          <p className="text-[10px] mb-2" style={{ color: 'var(--tropical-teal)' }}>How the two voices play when you play the debate</p>
          <div
            className="flex rounded-md overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(178, 226, 223, 0.15)',
            }}
          >
            {PLAYBACK_MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setVoicePlaybackMode(m.id)}
                className={`flex-1 px-2 py-2 text-[11px] font-medium transition-colors ${
                  state.voicePlaybackMode === m.id ? 'bg-white/15' : 'hover:bg-white/10'
                }`}
                style={{
                  color: state.voicePlaybackMode === m.id ? 'var(--soft-white)' : 'var(--icy-aqua)',
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: 'var(--tropical-teal)' }}>
          <span>{voiceALabel}: {currentA} / {currentVoiceA}</span>
          <span>{voiceBLabel}: {currentB} / {currentVoiceB}</span>
        </div>
      </div>
    </>,
    document.body
  )
}
