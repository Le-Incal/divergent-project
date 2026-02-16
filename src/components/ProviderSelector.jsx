import { PROVIDERS } from '../context/AppContext'

export default function ProviderSelector({ voice, currentProvider, onChange }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium" style={{ color: 'var(--icy-aqua)', letterSpacing: '-0.01em' }}>
        {voice} Model
      </span>
      <div className="flex gap-1.5">
        {Object.values(PROVIDERS).map((provider) => (
          <button
            key={provider.id}
            onClick={() => onChange(provider.id)}
            className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition-all duration-200 ${
              currentProvider === provider.id ? 'text-white' : 'text-icy-aqua/70 hover:text-icy-aqua hover:bg-white/5'
            }`}
            style={{
              background: currentProvider === provider.id ? provider.color : 'transparent',
              border: `1px solid ${currentProvider === provider.id ? provider.color : 'rgba(178, 226, 223, 0.2)'}`,
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
