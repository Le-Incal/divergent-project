import { useApp, PROVIDERS } from '../context/AppContext'
import ProviderSelector from './ProviderSelector'

export default function ModelSelectorModal({ open, onClose }) {
  const { state, setVoiceAProvider, setVoiceBProvider, getActiveFramework } = useApp()
  const framework = getActiveFramework()

  if (!open) return null

  const voiceALabel = framework?.voiceA?.name ?? 'Voice A'
  const voiceBLabel = framework?.voiceB?.name ?? 'Voice B'
  const currentA = PROVIDERS[state.voiceAProvider]?.name ?? '—'
  const currentB = PROVIDERS[state.voiceBProvider]?.name ?? '—'

  return (
    <>
      <div
        className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-labelledby="model-selector-title"
        className="fixed left-1/2 top-1/2 z-[160] w-[min(340px,calc(100vw-32px))] -translate-x-1/2 -translate-y-1/2 rounded-xl p-5 shadow-xl"
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
            AI Models
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

        <div className="mt-4 pt-3 border-t border-white/10 flex justify-between text-xs" style={{ color: 'var(--tropical-teal)' }}>
          <span>{voiceALabel}: {currentA}</span>
          <span>{voiceBLabel}: {currentB}</span>
        </div>
      </div>
    </>
  )
}
