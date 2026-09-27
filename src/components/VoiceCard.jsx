import { useApp } from '../context/AppContext'

export default function VoiceCard({ voice, type, response, isLoading }) {
  const { getVoiceAProvider, getVoiceBProvider } = useApp()
  const isLeftCard = type === 'challenger'
  const provider = isLeftCard ? getVoiceAProvider() : getVoiceBProvider()

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
    <section className="card voiceCard">
      <header className="voiceCardHeader">
        <div className="voiceCardTitle">
          <div className="voiceCardName">{voice.name}</div>
          <div className="voiceCardRole">{voice.role}</div>
        </div>

        <div className="voiceCardMeta">
          <span className="voiceCardProvider">{provider?.name ?? ''}</span>
        </div>
      </header>
      
      <div className="voiceCardBody">
        {isLoading ? (
          <div className="voiceCardSkeleton">
            {[90, 75, 85].map((w, i) => (
              <div
                key={i}
                className="voiceCardSkeletonLine"
                style={{
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
    </section>
  )
}
