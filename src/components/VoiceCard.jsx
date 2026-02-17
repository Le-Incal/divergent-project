import { useApp } from '../context/AppContext'

export default function VoiceCard({ voice, type, response, isLoading }) {
  const { state, getVoiceAProvider, getVoiceBProvider } = useApp()
  const isChallenger = type === 'challenger'
  const providerId = isChallenger ? state.voiceAProvider : state.voiceBProvider
  const provider = isChallenger ? getVoiceAProvider() : getVoiceBProvider()
  
  const demoContent = isChallenger ? (
    <>
      <p>Let me <strong>push back</strong> on this. Before you decide, consider: <em>What's the worst realistic outcome here?</em></p>
      <p>Have you <strong>stress-tested your assumptions?</strong> What would need to be true for this to fail spectacularly?</p>
      <p>I want to make sure you're seeing the <strong>full picture</strong>, not just the optimistic version.</p>
    </>
  ) : (
    <>
      <p>This could be <strong>exactly the opportunity</strong> you've been waiting for. You have the capability, the timing feels right, and the upside is <em>significant.</em></p>
      <p>Yes, there's risk—but <strong>playing it safe has its own costs.</strong> Inaction compounds.</p>
      <p>What would the <strong>boldest version of yourself</strong> do here? <em>That person is also you.</em></p>
    </>
  )
  
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
          <span className="text-xs font-normal" style={{ color: isChallenger ? 'rgba(178, 226, 223, 0.6)' : 'rgba(9, 37, 52, 0.5)' }}>
            {voice.role}
          </span>
        </div>
      </div>
      
      <div className="card-content">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[90, 75, 85].map((w, i) => (
              <div key={i} className="h-4 rounded animate-pulse" style={{ background: isChallenger ? 'rgba(178, 226, 223, 0.2)' : 'rgba(9, 37, 52, 0.15)', width: `${w}%` }} />
            ))}
          </div>
        ) : response ? (
          <div dangerouslySetInnerHTML={{ __html: formatText(response) }} />
        ) : (
          demoContent
        )}
      </div>
    </div>
  )
}
