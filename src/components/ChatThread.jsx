import { useEffect, useRef, useState } from 'react'
import { QuestionTools } from './InputArea'
import { useApp } from '../context/AppContext'
import { canDebate, fullWidthMessageIds } from '../utils/conversationView'
import { parseVoiceStream } from '../utils/parseVoiceStream'
import BrainstormFlow from './BrainstormFlow'
import GrowingTextarea from './GrowingTextarea'
import DiagramCanvas from './diagram/DiagramCanvas'
import PortraitDiagram from './diagram/PortraitDiagram'
import { splitPortrait } from '../diagram/portrait.js'

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function formatInline(text) {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>')
}

const UNORDERED = /^[-*]\s+/
const ORDERED = /^\d+[.)]\s+/

function parseMarkdown(text) {
  const blocks = []
  let paragraph = []
  let list = null

  const flushParagraph = () => {
    const value = paragraph.join(' ').trim()
    if (value) blocks.push({ type: 'p', text: value })
    paragraph = []
  }
  const flushList = () => {
    if (list?.items.length) blocks.push(list)
    list = null
  }

  let sawBlank = false
  for (const raw of String(text || '').replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) {
      sawBlank = true
      continue
    }
    const unordered = UNORDERED.test(line)
    const ordered = ORDERED.test(line)
    if (unordered || ordered) {
      flushParagraph()
      const type = ordered ? 'ol' : 'ul'
      const item = line.replace(unordered ? UNORDERED : ORDERED, '')
      if (!list || list.type !== type) {
        flushList()
        list = { type, items: [] }
      }
      list.items.push(item)
      sawBlank = false
      continue
    }
    if (sawBlank) {
      flushParagraph()
      flushList()
    }
    paragraph.push(line)
    sawBlank = false
  }
  flushParagraph()
  flushList()
  return blocks
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

function UserMessage({ message, voiceAName, voiceBName }) {
  const audienceName = message.audience === 'ethos'
    ? voiceAName
    : message.audience === 'ego'
      ? voiceBName
      : null

  return (
    <div className="chatUserMsg">
      {audienceName && <p className="chatUserAudience">To {audienceName}</p>}
      {message.replyTo && (
        <p className="chatReplySnippet">
          {String(message.replyTo).slice(0, 90)}{String(message.replyTo).length > 90 ? '…' : ''}
        </p>
      )}
      <p className="chatUserText">{message.text}</p>
    </div>
  )
}

function VoiceReplyForm({ kind, voiceName, disabled, onSubmit, autoFocus = false }) {
  const [value, setValue] = useState('')
  const isClarify = kind === 'clarify'

  const submit = (event) => {
    event.preventDefault()
    const text = value.trim()
    if (!text || disabled) return
    setValue('')
    onSubmit(text)
  }

  return (
    <form
      className={`voiceReply ${isClarify ? 'voiceReply--clarify' : ''}`}
      onSubmit={submit}
    >
      <GrowingTextarea
        className="input voiceReplyField"
        rows={isClarify ? 2 : 1}
        value={value}
        placeholder={isClarify ? 'Reply' : 'Your response'}
        disabled={disabled}
        autoFocus={autoFocus}
        aria-label={isClarify ? `Reply to ${voiceName}` : `Respond to ${voiceName}`}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            e.currentTarget.form?.requestSubmit()
          }
        }}
      />
    </form>
  )
}

function blockPlainText(block) {
  if (block.type === 'p') return block.text
  return block.items.join('\n')
}

function RegenerateButton({ voiceName, disabled, onClick }) {
  return (
    <div className="chatRegenRow">
      <button
        type="button"
        className="chatRegen"
        aria-label={`Regenerate ${voiceName}`}
        title="Regenerate"
        disabled={disabled}
        onClick={(event) => {
          event.stopPropagation()
          onClick?.()
        }}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
      </button>
    </div>
  )
}

function VoiceMessage({ message, voiceName, openBlock, onToggleBlock, onReplyToBlock, onReplyCursor, onRegenerate, regenDisabled, onDiagramAccept, onDiagramDecline }) {
  const portrait = !message.isStreaming ? splitPortrait(message.text) : null
  const beforeSource = portrait ? portrait.before : message.text
  const blocks = parseMarkdown(parseVoiceStream(beforeSource, { complete: !message.isStreaming }).text)
  const afterBlocks = portrait
    ? parseMarkdown(parseVoiceStream(portrait.after, { complete: true }).text)
    : []
  const isClarification = message.responseKind === 'clarify'
  const canOpenBlocks = !message.isStreaming && (blocks.length > 0 || afterBlocks.length > 0)
  const [hoveredBlock, setHoveredBlock] = useState(null)

  useEffect(() => {
    if (message.isStreaming) setHoveredBlock(null)
  }, [message.isStreaming])

  const renderBlocks = (list, keyPrefix, showCursor) => list.map((block, i) => {
    const blockKey = `${message.id}:${keyPrefix}${i}`
    const isOpen = openBlock === blockKey
    const isHovered = canOpenBlocks && hoveredBlock === blockKey
    const plain = blockPlainText(block)
    return (
      <div key={blockKey} className="chatBlockGroup" data-reply-open={isOpen ? 'true' : undefined}>
        <div
          className={`chatBlock chatBlock--md ${canOpenBlocks ? 'chatBlock--action' : ''} ${isHovered ? 'isHovered' : ''} ${isOpen ? 'isOpen' : ''}`}
          role={canOpenBlocks ? 'button' : undefined}
          tabIndex={canOpenBlocks ? 0 : undefined}
          onClick={canOpenBlocks ? () => onToggleBlock?.(blockKey) : undefined}
          onMouseMove={canOpenBlocks ? (event) => {
            setHoveredBlock(blockKey)
            if (!isOpen) onReplyCursor?.({ x: event.clientX, y: event.clientY })
          } : undefined}
          onMouseLeave={canOpenBlocks ? () => {
            setHoveredBlock(null)
            onReplyCursor?.(null)
          } : undefined}
          onKeyDown={canOpenBlocks ? (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              onToggleBlock?.(blockKey)
            }
          } : undefined}
        >
          {block.type === 'p' ? (
            <p className="chatMdText" dangerouslySetInnerHTML={{ __html: formatInline(block.text) }} />
          ) : (
            <block.type className="chatMdList">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} dangerouslySetInnerHTML={{ __html: formatInline(item) }} />
              ))}
            </block.type>
          )}
          {showCursor && i === list.length - 1 && (
            <span className="chatStreamCursor" aria-hidden="true" />
          )}
        </div>
        {isOpen && (
          <VoiceReplyForm
            kind="answer"
            voiceName={voiceName}
            autoFocus
            onSubmit={(text) => onReplyToBlock?.(text, plain)}
          />
        )}
      </div>
    )
  })

  return (
    <div className={`chatVoiceMsg chatVoiceMsg--${message.type}`}>
      <div className="chatVoiceHeader">
        <span className="chatVoiceName">{voiceName}</span>
        {isClarification && <span className="chatVoiceTag">Clarifying</span>}
      </div>

      {message.isStreaming && blocks.length === 0 ? (
        <TypingIndicator />
      ) : (
        <div className="chatMarkdown">
          {renderBlocks(blocks, '', message.isStreaming)}
        </div>
      )}
      {portrait && <PortraitDiagram />}
      {afterBlocks.length > 0 && (
        <div className="chatMarkdown">
          {renderBlocks(afterBlocks, 'after:', false)}
        </div>
      )}
      {message.diagramOffer && (
        <div className="diagramOffer">
          <p>{message.diagramOffer.line}</p>
          <div className="brainstormChoices">
            <button type="button" className="brainstormChoice" onClick={() => onDiagramAccept?.(message)}>Yes</button>
            <button type="button" className="brainstormChoice" onClick={() => onDiagramDecline?.(message)}>Not now</button>
          </div>
        </div>
      )}
      {message.diagramSpec && <DiagramCanvas spec={message.diagramSpec} />}
      {message.diagramOutline && !message.diagramSpec && <pre className="diagramOutline">{message.diagramOutline}</pre>}
      {!message.isStreaming && (
        <RegenerateButton
          voiceName={voiceName}
          disabled={regenDisabled}
          onClick={() => onRegenerate?.(message.id)}
        />
      )}
    </div>
  )
}

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

function RespondBothForm({ onSubmit }) {
  const [value, setValue] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const text = value.trim()
    if (!text) return
    setValue('')
    onSubmit(text)
  }

  return (
    <form className="respondBothInline" onSubmit={submit}>
      <label className="srOnly" htmlFor="respond-both">Respond to both</label>
      <GrowingTextarea
        id="respond-both"
        className="input respondBothField"
        rows={3}
        value={value}
        placeholder="Respond to both"
        autoFocus
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            event.currentTarget.form?.requestSubmit()
          }
        }}
      />
    </form>
  )
}

export default function ChatThread({ onReplyToVoice, onReplyToBoth, onDebate, onElaborate, onRegenerate, onBrainstorm, onDiagramAccept, onDiagramDecline, onOpenHistory, onOpenSettings }) {
  const { state, getActiveFramework } = useApp()
  const bottomRef = useRef(null)
  const isAtBottomRef = useRef(true)
  const [openBlock, setOpenBlock] = useState(null)
  const [respondBothOpen, setRespondBothOpen] = useState(false)
  const [brainstormOpen, setBrainstormOpen] = useState(false)
  const [replyCursor, setReplyCursor] = useState(null)
  const messages = state.messages || []
  const wideMessages = fullWidthMessageIds(messages)

  useEffect(() => {
    if (state.isLoading) {
      setOpenBlock(null)
      setRespondBothOpen(false)
      setBrainstormOpen(false)
      setReplyCursor(null)
    }
  }, [state.isLoading])

  useEffect(() => {
    if (!openBlock) return undefined
    const onPointerDown = (event) => {
      const open = document.querySelector('[data-reply-open="true"]')
      if (open?.contains(event.target)) return
      setOpenBlock(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [openBlock])

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { isAtBottomRef.current = entry.isIntersecting },
      { threshold: 0.1 }
    )
    const el = bottomRef.current
    if (el) observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isAtBottomRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, messages.at?.(-1)?.text?.length])

  if (!messages.length) return null

  const framework = getActiveFramework()
  const voiceAName = framework?.voiceA?.name ?? 'Ethos'
  const voiceBName = framework?.voiceB?.name ?? 'Ego'
  const groups = groupMessages(messages)
  const interactive = !state.isLoading

  const renderVoice = (message, voiceName) => (
    <VoiceMessage
      key={message.id}
      message={message}
      voiceName={voiceName}
      openBlock={openBlock}
      onToggleBlock={(blockKey) => setOpenBlock((current) => (current === blockKey ? null : blockKey))}
      onReplyToBlock={(text, blockText) => onReplyToVoice?.(message.type, text, blockText)}
      onReplyCursor={setReplyCursor}
      onRegenerate={onRegenerate}
      regenDisabled={!interactive}
      onDiagramAccept={onDiagramAccept}
      onDiagramDecline={onDiagramDecline}
    />
  )

  return (
    <div className="chatThread" role="log" aria-live="polite" aria-label="Conversation">
      {groups.map((group) => {
        if (group.type === 'pair') {
          return (
            <div key={`pair-${group.ethos.id}`} className="chatVoicePair">
              {renderVoice(group.ethos, voiceAName)}
              {renderVoice(group.ego, voiceBName)}
            </div>
          )
        }

        const msg = group.message
        if (msg.type === 'host') return <HostMessage key={msg.id} message={msg} />
        if (msg.type === 'user') {
          return (
            <UserMessage
              key={msg.id}
              message={msg}
              voiceAName={voiceAName}
              voiceBName={voiceBName}
            />
          )
        }

        if (msg.type === 'ethos' || msg.type === 'ego') {
          const voiceName = msg.type === 'ethos' ? voiceAName : voiceBName
          const full = wideMessages.has(msg.id)
          return (
            <div key={msg.id} className={`chatVoicePair${full ? ' chatVoicePair--full' : ''}`}>
              {full
                ? renderVoice(msg, voiceName)
                : (
                  <>
                    {msg.type === 'ethos' ? renderVoice(msg, voiceName) : <div className="chatVoiceSlot" />}
                    {msg.type === 'ego' ? renderVoice(msg, voiceName) : <div className="chatVoiceSlot" />}
                  </>
                )}
            </div>
          )
        }

        return null
      })}

      {interactive && canDebate(messages) && (
        <div className="chatActionBlock">
          <div className="chatDebateRow">
            <button type="button" className="chatDebateBtn" onClick={onDebate}>
              Debate
            </button>
            <button type="button" className="chatDebateBtn" onClick={onElaborate}>
              Elaborate
            </button>
            <button
              type="button"
              className={`chatDebateBtn ${respondBothOpen ? 'isActive' : ''}`}
              aria-expanded={respondBothOpen}
              onClick={() => setRespondBothOpen((current) => !current)}
            >
              Respond to both
            </button>
            <button
              type="button"
              className={`chatDebateBtn ${brainstormOpen ? 'isActive' : ''}`}
              aria-expanded={brainstormOpen}
              onClick={() => setBrainstormOpen((current) => !current)}
            >
              Brainstorm
            </button>
          </div>
          {respondBothOpen && (
            <RespondBothForm onSubmit={(text) => onReplyToBoth?.(text)} />
          )}
          {brainstormOpen && (
            <BrainstormFlow
              history={messages
                .filter((message) => message.text?.trim() && !message.isStreaming && message.type !== 'host')
                .map((message) => (message.type === 'user' ? message.text : parseVoiceStream(message.text, { complete: true }).text))
                .join('\n')}
              disabled={!interactive}
              onStart={(payload) => {
                setBrainstormOpen(false)
                onBrainstorm?.(payload)
              }}
            />
          )}
        </div>
      )}
      <div className="chatComposerTools">
        <QuestionTools onHistory={onOpenHistory} onSettings={onOpenSettings} />
      </div>
      {replyCursor && (
        <span className="replyCursor" style={{ left: replyCursor.x + 14, top: replyCursor.y + 16 }}>
          reply
        </span>
      )}
      <div ref={bottomRef} aria-hidden="true" />
    </div>
  )
}
