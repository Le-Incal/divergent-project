import { useEffect, useRef } from 'react'
import { useApp } from '../context/AppContext'

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

function VoiceMessage({ message, voiceName, onReply }) {
  const blocks = message.text
    ? message.text.split(/\n\n+/).filter((b) => b.trim())
    : []
  const isClarification = message.phase === 'clarification'

  return (
    <div className={`chatVoiceMsg chatVoiceMsg--${message.type}`}>
      <div className="chatVoiceHeader">
        <span className="chatVoiceName">{voiceName}</span>
        {isClarification && <span className="chatVoiceTag">Clarifying</span>}
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
  const { state, getActiveFramework } = useApp()
  const framework = getActiveFramework()
  const bottomRef = useRef(null)
  const isAtBottomRef = useRef(true)
  const messages = state.messages || []

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
              />
              <VoiceMessage
                message={group.ego}
                voiceName={voiceBName}
                onReply={onReply}
              />
            </div>
          )
        }

        const msg = group.message
        if (msg.type === 'user') {
          return <UserMessage key={msg.id} message={msg} />
        }

        const voiceName = msg.type === 'ethos' ? voiceAName : voiceBName
        return (
          <VoiceMessage
            key={msg.id}
            message={msg}
            voiceName={voiceName}
            onReply={onReply}
          />
        )
      })}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
