import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useChat } from '../hooks/useChat'

export default function InputArea({ replyContext = null, onClearReply }) {
  const { state } = useApp()
  const { sendMessage } = useChat()
  const [localInput, setLocalInput] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [transcribing, setTranscribing] = useState(false)
  const [sttError, setSttError] = useState(false)
  const inputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!localInput.trim() || state.isLoading) return

    const message = localInput
    const context = replyContext
    setLocalInput('')
    onClearReply?.()
    await sendMessage(message, context)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (localInput.trim() && !state.isLoading) {
        handleSubmit(e)
      }
    }
  }

  // ElevenLabs STT: record audio, send to /api/stt, append transcript
  const stopRecordingAndTranscribe = async () => {
    const mr = mediaRecorderRef.current
    const stream = streamRef.current
    if (stream) {
      stream.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
    if (!mr || mr.state === 'inactive') {
      setIsListening(false)
      return
    }
    return new Promise((resolve) => {
      mr.onstop = async () => {
        mediaRecorderRef.current = null
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        chunksRef.current = []
        setIsListening(false)
        if (blob.size < 500) {
          resolve()
          return
        }
        setTranscribing(true)
        setSttError(false)
        try {
          const res = await fetch('/api/stt', {
            method: 'POST',
            headers: {},
            body: blob,
          })
          if (res.status === 503) {
            setSttError(true)
            resolve()
            return
          }
          if (!res.ok) throw new Error('Transcription failed')
          const data = await res.json()
          const text = (data.text || '').trim()
          if (text) {
            setLocalInput((prev) => (prev ? `${prev} ${text}` : text))
          }
        } catch (e) {
          console.error('STT error:', e)
          setSttError(true)
        } finally {
          setTranscribing(false)
          resolve()
        }
      }
      mr.stop()
    })
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.start(200)
      setIsListening(true)
      setSttError(false)
    } catch (e) {
      console.error('Microphone error:', e)
      setSttError(true)
    }
  }

  const toggleListening = async () => {
    if (state.isLoading) return
    if (isListening) {
      await stopRecordingAndTranscribe()
      return
    }
    await startRecording()
  }

  const minHeight = 96

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = `${minHeight}px`
    const newHeight = Math.min(el.scrollHeight, 320)
    el.style.height = `${newHeight}px`
    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
    const currentHeight = parseFloat(el.style.height) || minHeight
    const paddingTop = Math.max(10, (currentHeight - lineHeight) / 2)
    el.style.paddingTop = `${paddingTop}px`
    el.style.textAlign = 'center'
  }, [localInput])

  const voiceFlowActive = state.voiceFlowStage && state.voiceFlowStage !== 'idle'

  const placeholder = voiceFlowActive
    ? state.voiceFlowStage === 'listening'
      ? 'Listening…'
      : state.voiceFlowStage === 'transcribing'
      ? 'Transcribing…'
      : state.voiceFlowStage === 'confirming'
      ? 'Waiting for confirmation…'
      : 'Voice flow active…'
    : state.chatPhase === 'advising'
      ? 'Continue the conversation... press Enter when ready.'
      : 'Explore a new idea.... press Enter or say Go when ready.'

  const micLabel = transcribing
    ? 'Transcribing…'
    : isListening
    ? 'Stop (recording)'
    : 'Speak (voice input)'

  const showMic = !voiceFlowActive

  return (
    <div className="inputArea">
      {replyContext && (
        <div className="inputReplyBar">
          <span className="inputReplyArrow">↩</span>
          <span className="inputReplySnippet">
            {String(replyContext).slice(0, 100)}{String(replyContext).length > 100 ? '…' : ''}
          </span>
          <button
            type="button"
            className="inputReplyClear"
            onClick={onClearReply}
            aria-label="Cancel reply"
          >
            ×
          </button>
        </div>
      )}

      {sttError && !isListening && !transcribing && (
        <p className="inputSttHint">ElevenLabs transcription unavailable. Check ELEVENLABS_API_KEY is set.</p>
      )}

      <form onSubmit={handleSubmit} className="inputAreaForm">
        <div className="inputAreaRow">
          <label className="srOnly" htmlFor="divergent-input">
            {replyContext ? 'Reply to message' : 'Explore a new idea'}
          </label>
          <textarea
            ref={inputRef}
            id="divergent-input"
            className="input inputAreaField"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={transcribing ? 'Transcribing…' : isListening ? 'Recording…' : placeholder}
            disabled={state.isLoading}
            rows={1}
          />
          {showMic && (
            <button
              type="button"
              className={`inputMicBtn ${isListening || transcribing ? 'isListening' : ''}`}
              onClick={toggleListening}
              disabled={state.isLoading}
              aria-label={micLabel}
              title={micLabel}
            >
              {transcribing ? (
                <span className="inputMicPulse" aria-hidden="true" />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
                </svg>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
