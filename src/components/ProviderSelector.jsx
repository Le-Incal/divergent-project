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
          <div className="flex flex-wrap gap-1.5">
            {sandpitProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => onVoiceAChange(provider.id)}
                className={`px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                  voiceAProvider === provider.id ? 'text-white' : 'text-icy-aqua/70 hover:text-icy-aqua hover:bg-white/5'
                }`}
                style={{
                  background: voiceAProvider === provider.id ? provider.color : 'transparent',
                  border: `1px solid ${voiceAProvider === provider.id ? provider.color : 'rgba(178, 226, 223, 0.2)'}`,
                }}
              >
                {provider.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium" style={{ color: 'var(--icy-aqua)', letterSpacing: '-0.01em' }}>
            {voiceBLabel} (Voice B)
          </span>
          <div className="flex flex-wrap gap-1.5">
            {sandpitProviders.map((provider) => (
              <button
                key={provider.id}
                onClick={() => onVoiceBChange(provider.id)}
                className={`px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
                  voiceBProvider === provider.id ? 'text-white' : 'text-icy-aqua/70 hover:text-icy-aqua hover:bg-white/5'
                }`}
                style={{
                  background: voiceBProvider === provider.id ? provider.color : 'transparent',
                  border: `1px solid ${voiceBProvider === provider.id ? provider.color : 'rgba(178, 226, 223, 0.2)'}`,
                }}
              >
                {provider.name}
              </button>
            ))}
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
      <div className="flex flex-wrap gap-1.5">
        {defaultProviders.map((provider) => (
          <button
            key={provider.id}
            onClick={() => onSingleModelChange(provider.id)}
            className={`px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
              voiceAProvider === provider.id ? 'text-white' : 'text-icy-aqua/70 hover:text-icy-aqua hover:bg-white/5'
            }`}
            style={{
              background: voiceAProvider === provider.id ? provider.color : 'transparent',
              border: `1px solid ${voiceAProvider === provider.id ? provider.color : 'rgba(178, 226, 223, 0.2)'}`,
            }}
          >
            {provider.name}
          </button>
        ))}
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
