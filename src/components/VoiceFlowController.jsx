import { useEffect, useRef, useCallback } from 'react'
import { useApp, makeId } from '../context/AppContext'
import { useChat } from '../hooks/useChat'
import { playTTS } from '../utils/tts'
import { createSilenceDetector } from '../utils/silenceDetector'

const WELCOME_TEXT = "Welcome to Divergent. What's on your mind?"
const ACK_TEXT = "Got it. Is that everything, or would you like to add anything else?"
const RETRY_TEXT = "I didn't catch that. Could you try again?"

const CONFIRM_WORDS =
  /\b(yes|yeah|yep|yup|go\s*ahead|start|begin|that'?s?\s*(it|all|everything)|done|i'?m\s*done|nothing\s*(else|more)|no\s*more|ready|proceed|let'?s?\s*go|correct|exactly|confirmed|absolutely|sure)\b/i

/**
 * Strip ElevenLabs Scribe noise annotations: [background noise], [clicking], etc.
 * Returns cleaned text or '' if nothing meaningful remains.
 */
function stripNoise(text) {
  if (!text) return ''
  return text
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim()
}

export default function VoiceFlowController({ active }) {
  const { state, dispatch, getVoiceASpeakerVoiceId } = useApp()
  const { sendMessage } = useChat()
  const runningRef = useRef(false)
  const abortRef = useRef(false)
  const cleanupFnsRef = useRef([])
  const userMsgIdRef = useRef(null)

  const hostVoiceId = getVoiceASpeakerVoiceId()

  const setStage = useCallback(
    (stage) => dispatch({ type: 'SET_VOICE_FLOW_STAGE', payload: stage }),
    [dispatch],
  )

  const addHostMessage = useCallback(
    (text) => {
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: makeId(),
          type: 'host',
          text,
          phase: 'voice-flow',
          round: 0,
          isStreaming: false,
          timestamp: Date.now(),
        },
      })
    },
    [dispatch],
  )

  // Speak via ElevenLabs TTS (no browser fallback)
  const speakHost = useCallback(
    async (text) => {
      addHostMessage(text)
      if (!hostVoiceId) {
        console.warn('No ElevenLabs voice configured — skipping TTS')
        return
      }
      await playTTS(text, hostVoiceId)
    },
    [addHostMessage, hostVoiceId],
  )

  // Record audio until silence, then transcribe via /api/stt.
  // Returns cleaned text (noise annotations stripped) or ''.
  const recordUntilSilence = useCallback(() => {
    return new Promise((resolve) => {
      let stream, mr, detector
      const chunks = []

      const cleanup = () => {
        detector?.stop()
        detector = null
        if (stream) {
          stream.getTracks().forEach((t) => t.stop())
          stream = null
        }
      }

      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((s) => {
          stream = s
          if (abortRef.current) {
            cleanup()
            resolve('')
            return
          }

          cleanupFnsRef.current.push(cleanup)
          mr = new MediaRecorder(stream)
          mr.ondataavailable = (e) => {
            if (e.data.size > 0) chunks.push(e.data)
          }

          mr.onstop = async () => {
            cleanup()
            const blob = new Blob(chunks, { type: 'audio/webm' })
            if (blob.size < 500) {
              resolve('')
              return
            }
            setStage('transcribing')
            try {
              const res = await fetch('/api/stt', { method: 'POST', body: blob })
              if (!res.ok) {
                resolve('')
                return
              }
              const data = await res.json()
              resolve(stripNoise(data.text || ''))
            } catch {
              resolve('')
            }
          }

          mr.start(200)
          setStage('listening')

          detector = createSilenceDetector(
            stream,
            () => {
              if (mr && mr.state !== 'inactive') mr.stop()
            },
            { threshold: 0.035, silenceDuration: 2000, minSpeechDuration: 500 },
          )
        })
        .catch(() => {
          resolve('')
        })
    })
  }, [setStage])

  const runFlow = useCallback(async () => {
    if (runningRef.current) return
    runningRef.current = true
    abortRef.current = false
    userMsgIdRef.current = null

    try {
      // Step 1: Welcome greeting
      setStage('greeting')
      await speakHost(WELCOME_TEXT)
      if (abortRef.current) return

      // Step 2: Listen → confirm loop
      let question = ''
      let emptyAttempts = 0
      const MAX_EMPTY = 3

      while (!abortRef.current) {
        const spoken = await recordUntilSilence()
        if (abortRef.current) return

        if (!spoken) {
          emptyAttempts++
          if (emptyAttempts >= MAX_EMPTY) {
            setStage('idle')
            return
          }
          await speakHost(RETRY_TEXT)
          continue
        }

        emptyAttempts = 0
        question = question ? `${question} ${spoken}` : spoken

        // Show / update the user's transcribed question in the thread
        if (userMsgIdRef.current) {
          dispatch({
            type: 'UPDATE_MESSAGE_TEXT',
            payload: { id: userMsgIdRef.current, text: question },
          })
        } else {
          const id = makeId()
          userMsgIdRef.current = id
          dispatch({
            type: 'ADD_MESSAGE',
            payload: {
              id,
              type: 'user',
              text: question,
              phase: 'voice-flow',
              round: 0,
              isStreaming: false,
              timestamp: Date.now(),
            },
          })
        }

        // Step 3: Acknowledge
        setStage('confirming')
        await speakHost(ACK_TEXT)
        if (abortRef.current) return

        // Step 4: Listen for confirmation or additions
        const response = await recordUntilSilence()
        if (abortRef.current) return

        if (!response) continue

        // Check if the response contains confirmation words
        if (CONFIRM_WORDS.test(response)) {
          break // Confirmed — proceed to Ethos/Ego
        }

        // Not a confirmation — append to the question
        question = `${question} ${response}`
        dispatch({
          type: 'UPDATE_MESSAGE_TEXT',
          payload: { id: userMsgIdRef.current, text: question },
        })
      }

      // Step 5: Submit to Ethos/Ego
      if (question && !abortRef.current) {
        // Remove the preview user message; sendMessage will create the real one
        if (userMsgIdRef.current) {
          dispatch({ type: 'REMOVE_MESSAGE', payload: userMsgIdRef.current })
        }
        setStage('processing')
        await sendMessage(question)
        setStage('idle')
      }
    } finally {
      runningRef.current = false
    }
  }, [setStage, speakHost, recordUntilSilence, dispatch, sendMessage])

  useEffect(() => {
    if (active && !runningRef.current) {
      runFlow()
    }
    return () => {
      abortRef.current = true
      cleanupFnsRef.current.forEach((fn) => {
        try { fn() } catch {}
      })
      cleanupFnsRef.current = []
    }
  }, [active]) // eslint-disable-line react-hooks/exhaustive-deps

  return null
}
