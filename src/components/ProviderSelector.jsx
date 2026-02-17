import { PROVIDERS, DEFAULT_MODE_PROVIDERS, SANDPIT_PROVIDERS } from '../context/AppContext'

export default function ProviderSelector({
  mode,
  voiceALabel,
  voiceBLabel,
  voiceAProvider,
  voiceBProvider,
  onVoiceAChange,
  onVoiceBChange,
  onSingleModelChange,
}) {
  const isSandpit = mode === 'sandpit'
  const defaultProviders = DEFAULT_MODE_PROVIDERS.map((id) => PROVIDERS[id]).filter(Boolean)
  const sandpitProviders = SANDPIT_PROVIDERS.map((id) => PROVIDERS[id]).filter(Boolean)

  if (isSandpit) {
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--icy-aqua)', letterSpacing: '-0.01em' }}>
            {voiceALabel} (Voice A)
          </span>
          <div className="model-select-wrap">
            <select className="model-select" value={voiceAProvider} onChange={(e) => onVoiceAChange(e.target.value)}>
              {sandpitProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="model-select-chevron" aria-hidden="true">
              ▾
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--icy-aqua)', letterSpacing: '-0.01em' }}>
            {voiceBLabel} (Voice B)
          </span>
          <div className="model-select-wrap">
            <select className="model-select" value={voiceBProvider} onChange={(e) => onVoiceBChange(e.target.value)}>
              {sandpitProviders.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <span className="model-select-chevron" aria-hidden="true">
              ▾
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: 'var(--icy-aqua)', letterSpacing: '-0.01em' }}>
        Model (both voices)
      </span>
      <div className="model-select-wrap">
        <select className="model-select" value={voiceAProvider} onChange={(e) => onSingleModelChange(e.target.value)}>
          {defaultProviders.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <span className="model-select-chevron" aria-hidden="true">
          ▾
        </span>
      </div>
    </div>
  )
}

export function ProviderBadge({ providerId }) {
  const provider = PROVIDERS[providerId]
  if (!provider) return null
  
  return (
    <span 
      className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
      style={{ background: `${provider.color}20`, color: provider.color, letterSpacing: '0.03em' }}
    >
      {provider.name}
    </span>
  )
}
