import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { playTTS } from '../utils/tts'

function formatText(text) {
  if (!text) return ''
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

function TypingIndicator() {
  return (
    <div className="chatTyping" aria-label="Thinking…">
      <span /><span /><span />
    </div>
  )
}

function HostMessage({ message }) {
  return (
    <div className="chatHostMsg">
      <p className="chatHostText">{message.text}</p>
    </div>
  )
}

function UserMessage({ message }) {
  return (
    <div className="chatUserMsg">
      {message.replyTo && (
        <div className="chatReplyRef" title={message.replyTo}>
          <span className="chatReplyArrow">↩</span>
          <span className="chatReplySnippet">
            {String(message.replyTo).slice(0, 90)}{String(message.replyTo).length > 90 ? '…' : ''}
          </span>
        </div>
      )}
      <p className="chatUserText">{message.text}</p>
    </div>
  )
}

function VoiceMessage({ message, voiceName, onReply, speakerVoiceId, isAutoPlaying }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const playing = isAutoPlaying ?? isPlaying
  const blocks = message.text
    ? message.text.split(/\n\n+/).filter((b) => b.trim())
    : []
  const isClarification = message.phase === 'clarification'
  const canPlay = message.text?.trim() && speakerVoiceId && !message.isStreaming

  const handlePlay = async () => {
    if (!canPlay || playing) return
    setIsPlaying(true)
    try {
      await playTTS(message.text, speakerVoiceId)
    } catch (e) {
      console.error('TTS play error:', e)
    } finally {
      setIsPlaying(false)
    }
  }

  return (
    <div className={`chatVoiceMsg chatVoiceMsg--${message.type}`}>
      <div className="chatVoiceHeader">
        <span className="chatVoiceName">{voiceName}</span>
        {isClarification && <span className="chatVoiceTag">Clarifying</span>}
        {canPlay && (
          <button
            type="button"
            className="chatVoicePlay"
            onClick={handlePlay}
            disabled={playing}
            aria-label={playing ? 'Playing…' : 'Play with ElevenLabs voice'}
            title={playing ? 'Playing…' : 'Play'}
          >
            {playing ? (
              <span className="chatVoicePlayPulse" aria-hidden="true" />
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        )}
      </div>

      {message.isStreaming && blocks.length === 0 ? (
        <TypingIndicator />
      ) : (
        <div className="chatVoiceBlocks">
          {blocks.map((blockText, i) => (
            <div key={i} className="chatBlock">
              <div
                className="chatBlockText"
                dangerouslySetInnerHTML={{ __html: formatText(blockText) }}
              />
              {message.isStreaming && i === blocks.length - 1 ? (
                <span className="chatStreamCursor" aria-hidden="true" />
              ) : (
                <button
                  type="button"
                  className="chatBlockReplyBtn"
                  onClick={() => onReply?.(blockText)}
                  aria-label="Reply to this thought"
                  title="Reply to this"
                >
                  ↩
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Group consecutive ethos+ego messages into side-by-side pairs
function groupMessages(messages) {
  const groups = []
  let i = 0
  while (i < messages.length) {
    const cur = messages[i]
    const next = messages[i + 1]

    const isPair =
      cur.type === 'ethos' &&
      next?.type === 'ego' &&
      cur.round === next?.round

    if (isPair) {
      groups.push({ type: 'pair', ethos: cur, ego: next })
      i += 2
    } else {
      groups.push({ type: 'single', message: cur })
      i += 1
    }
  }
  return groups
}

export default function ChatThread({ onReply }) {
  const { state, getActiveFramework, getVoiceASpeakerVoiceId, getVoiceBSpeakerVoiceId } = useApp()
  const framework = getActiveFramework()
  const bottomRef = useRef(null)
  const isAtBottomRef = useRef(true)
  const messages = state.messages || []
  const playedIdsRef = useRef(new Set())
  const queueRef = useRef([])
  const isPlayingRef = useRef(false)
  const messagesRef = useRef(messages)
  const [currentPlayingId, setCurrentPlayingId] = useState(null)

  messagesRef.current = messages

  // Auto-play voice messages in order: Ethos first, then Ego (only when TTS is configured)
  useEffect(() => {
    const voiceMessages = messages.filter(
      (m) => (m.type === 'ethos' || m.type === 'ego') && !m.isStreaming && m.text?.trim()
    )
    const toPlay = voiceMessages.filter((m) => !playedIdsRef.current.has(m.id))
    if (toPlay.length === 0) return

    toPlay.forEach((m) => playedIdsRef.current.add(m.id))
    queueRef.current.push(...toPlay.map((m) => m.id))

    const processQueue = async () => {
      if (queueRef.current.length === 0) {
        isPlayingRef.current = false
        setCurrentPlayingId(null)
        return
      }
      const id = queueRef.current.shift()
      const msg = messagesRef.current.find((m) => m.id === id)
      const voiceId = msg?.type === 'ethos' ? getVoiceASpeakerVoiceId() : getVoiceBSpeakerVoiceId()
      if (!msg?.text?.trim() || !voiceId || voiceId.startsWith('REPLACE_')) {
        processQueue()
        return
      }
      isPlayingRef.current = true
      setCurrentPlayingId(id)
      try {
        await playTTS(msg.text, voiceId)
      } catch (e) {
        console.error('TTS auto-play error:', e)
      } finally {
        setCurrentPlayingId(null)
        processQueue()
      }
    }

    if (!isPlayingRef.current) processQueue()
  }, [messages, getVoiceASpeakerVoiceId, getVoiceBSpeakerVoiceId])

  // Track whether the user is scrolled to the bottom
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { isAtBottomRef.current = entry.isIntersecting },
      { threshold: 0.1 }
    )
    const el = bottomRef.current
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Only auto-scroll when user is already at the bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, messages.at?.(-1)?.text?.length])

  if (!messages.length) return null

  const voiceAName = framework?.voiceA?.name ?? 'Ethos'
  const voiceBName = framework?.voiceB?.name ?? 'Ego'
  const groups = groupMessages(messages)

  return (
    <div className="chatThread" role="log" aria-live="polite" aria-label="Conversation">
      {groups.map((group, gi) => {
        if (group.type === 'pair') {
          return (
            <div key={`pair-${gi}`} className="chatVoicePair">
              <VoiceMessage
                message={group.ethos}
                voiceName={voiceAName}
                onReply={onReply}
                speakerVoiceId={getVoiceASpeakerVoiceId()}
                isAutoPlaying={currentPlayingId === group.ethos.id}
              />
              <VoiceMessage
                message={group.ego}
                voiceName={voiceBName}
                onReply={onReply}
                speakerVoiceId={getVoiceBSpeakerVoiceId()}
                isAutoPlaying={currentPlayingId === group.ego.id}
              />
            </div>
          )
        }

        const msg = group.message
        if (msg.type === 'host') {
          return <HostMessage key={msg.id} message={msg} />
        }
        if (msg.type === 'user') {
          return <UserMessage key={msg.id} message={msg} />
        }

        const voiceName = msg.type === 'ethos' ? voiceAName : voiceBName
        const speakerVoiceId = msg.type === 'ethos' ? getVoiceASpeakerVoiceId() : getVoiceBSpeakerVoiceId()
        return (
          <VoiceMessage
            key={msg.id}
            message={msg}
            voiceName={voiceName}
            onReply={onReply}
            speakerVoiceId={speakerVoiceId}
            isAutoPlaying={currentPlayingId === msg.id}
          />
        )
      })}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
