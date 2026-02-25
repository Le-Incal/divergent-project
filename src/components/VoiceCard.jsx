import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { playTTS } from '../utils/tts'

export default function VoiceCard({ voice, type, response, isLoading }) {
  const { getVoiceAProvider, getVoiceBProvider, getVoiceASpeakerVoiceId, getVoiceBSpeakerVoiceId } = useApp()
  const [isPlaying, setIsPlaying] = useState(false)
  const isLeftCard = type === 'challenger'
  const provider = isLeftCard ? getVoiceAProvider() : getVoiceBProvider()
  const speakerVoiceId = isLeftCard ? getVoiceASpeakerVoiceId() : getVoiceBSpeakerVoiceId()

  const handlePlay = async () => {
    if (!response || !speakerVoiceId || isPlaying) return
    setIsPlaying(true)
    try {
      await playTTS(response, speakerVoiceId)
    } catch (e) {
      console.error('TTS play error:', e)
    } finally {
      setIsPlaying(false)
    }
  }

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
          {response && speakerVoiceId && (
            <button
              type="button"
              onClick={handlePlay}
              disabled={isPlaying}
              className="voiceCardPlay"
              aria-label={isPlaying ? 'Playing…' : 'Play'}
            >
              {isPlaying ? (
                <span className="voiceCardPlayText">…</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}
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
