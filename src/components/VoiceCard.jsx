import { useState, useRef } from 'react'
import { useApp } from '../context/AppContext'

function stripMarkdownForTTS(text) {
  if (!text || typeof text !== 'string') return ''
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim()
}

export default function VoiceCard({ voice, type, response, isLoading }) {
  const { getVoiceAProvider, getVoiceBProvider, getVoiceASpeakerVoiceId, getVoiceBSpeakerVoiceId } = useApp()
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)
  const isChallenger = type === 'challenger'
  const provider = isChallenger ? getVoiceAProvider() : getVoiceBProvider()
  const speakerVoiceId = isChallenger ? getVoiceASpeakerVoiceId() : getVoiceBSpeakerVoiceId()

  const handlePlay = async () => {
    if (!response || !speakerVoiceId || isPlaying) return
    setIsPlaying(true)
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: stripMarkdownForTTS(response), voiceId: speakerVoiceId }),
      })
      if (!res.ok) throw new Error('TTS failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
      const audio = new Audio(url)
      audioRef.current = audio
      audio.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
      }
      audio.onerror = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(url)
      }
      await audio.play()
    } catch (e) {
      console.error('TTS play error:', e)
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
    <div className={`voice-card ${type}`}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold" style={{ letterSpacing: '-0.01em', color: isChallenger ? 'var(--icy-aqua)' : 'var(--jet-black)' }}>
            {voice.name}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {response && speakerVoiceId && (
            <button
              type="button"
              onClick={handlePlay}
              disabled={isPlaying}
              className="w-8 h-8 rounded-md flex items-center justify-center transition-colors hover:bg-white/10 disabled:opacity-60"
              style={{ color: isChallenger ? 'var(--icy-aqua)' : 'var(--jet-black)' }}
              aria-label={isPlaying ? 'Playing…' : 'Play'}
            >
              {isPlaying ? (
                <span className="text-xs font-medium">…</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}
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
