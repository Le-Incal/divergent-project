import { useApp } from '../context/AppContext'

export default function VoiceCard({ voice, type, response, isLoading }) {
  const { state, getVoiceAProvider, getVoiceBProvider } = useApp()
  const isChallenger = type === 'challenger'
  const provider = isChallenger ? getVoiceAProvider() : getVoiceBProvider()
  
  const formatText = (text) => {
    return text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .split('\n\n')
      .filter(p => p.trim())
      .map((p, i) => `<p key="${i}">${p}</p>`)
      .join('')
  }
  
  return (
    <div className={`voice-card ${type}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold" style={{ letterSpacing: '-0.01em', color: isChallenger ? 'var(--icy-aqua)' : 'var(--jet-black)' }}>
            {voice.name}
          </span>
        </div>
        <div className="flex flex-col items-end gap-0.5">
          <span className="text-[10px] font-normal opacity-60" style={{ color: 'inherit', letterSpacing: '0.02em' }}>
            {provider?.name}
          </span>
          <span
            className="text-xs font-normal"
            style={{ color: isChallenger ? 'rgba(var(--icy-aqua-rgb), 0.62)' : 'rgba(var(--jet-black-rgb), 0.55)' }}
          >
            {voice.role}
          </span>
        </div>
      </div>
      
      <div className="card-content">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[90, 75, 85].map((w, i) => (
              <div
                key={i}
                className="h-4 rounded animate-pulse"
                style={{
                  background: isChallenger ? 'rgba(var(--icy-aqua-rgb), 0.22)' : 'rgba(var(--jet-black-rgb), 0.14)',
                  width: `${w}%`,
                }}
              />
            ))}
          </div>
        ) : response != null ? (
          <div dangerouslySetInnerHTML={{ __html: formatText(response) }} />
        ) : (
          <div style={{ height: '100%' }} />
        )}
      </div>
    </div>
  )
}
