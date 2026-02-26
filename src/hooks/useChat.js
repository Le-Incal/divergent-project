import { useCallback } from 'react'
import { useApp, makeId } from '../context/AppContext'

const streamSseToText = async ({ endpoint, body, onTextDelta }) => {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const raw = await response.text()
    let detail = ''
    try {
      const parsed = JSON.parse(raw)
      detail = parsed?.error ? `: ${parsed.error}` : ''
    } catch {
      detail = raw ? `: ${raw}` : ''
    }
    throw new Error(`API request failed (${response.status})${detail}`)
  }

  if (!response.body) throw new Error('Streaming response body was empty')
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullText = ''
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() ?? ''
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue
      const data = line.slice(6)
      if (data === '[DONE]') continue
      try {
        const parsed = JSON.parse(data)
        if (parsed.text) {
          fullText += parsed.text
          onTextDelta?.(fullText)
        }
      } catch {}
    }
  }
  return fullText
}

export function useChat() {
  const { state, dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider, setResolution } = useApp()

  const sendMessage = useCallback(async (userText, replyContext = null) => {
    const trimmed = String(userText || '').trim()
    if (!trimmed || state.isLoading) return

    const framework = getActiveFramework()
    const providerA = getVoiceAProvider()
    const providerB = getVoiceBProvider()
    const isEthosEgo = framework.id === 'ethos-ego'

    dispatch({ type: 'START_LOADING' })

    // For a brand-new chat, create the history entry first so START_NEW_CHAT
    // doesn't wipe the messages array after we add the user message.
    if (state.chatPhase === 'idle') {
      dispatch({ type: 'START_NEW_CHAT', payload: { title: trimmed, userInput: trimmed } })
      dispatch({ type: 'SET_CHAT_PHASE', payload: 'advising' })
      dispatch({ type: 'SET_CLARIFICATION_ROUND', payload: 0 })
    }

    // Add user message to stream (after START_NEW_CHAT so it isn't overwritten)
    dispatch({
      type: 'ADD_MESSAGE',
      payload: {
        id: makeId(),
        type: 'user',
        text: trimmed,
        replyTo: replyContext || null,
        phase: state.chatPhase,
        round: state.clarificationRound,
        isStreaming: false,
        timestamp: Date.now(),
      },
    })

    // Build full conversation history as a single prompt string
    const buildPrompt = (instruction) => {
      const voiceAName = framework.voiceA.name
      const voiceBName = framework.voiceB.name
      const history = [
        ...state.messages,
        { type: 'user', text: trimmed, replyTo: replyContext },
      ]
        .filter((m) => m.type !== 'host') // exclude host/system messages from AI prompt
        .map((m) => {
          if (m.type === 'user') {
            const prefix = m.replyTo ? `[Responding to: "${String(m.replyTo).slice(0, 80)}"]\n` : ''
            return `User: ${prefix}${m.text}`
          }
          const name = m.type === 'ethos' ? voiceAName : voiceBName
          return `${name}: ${m.text}`
        })
      return `${history.join('\n\n')}\n\n${instruction}`
    }

    // Stream one voice into messages array
    const streamVoice = async (voiceType, instruction, phase) => {
      const msgId = makeId()
      dispatch({
        type: 'ADD_MESSAGE',
        payload: {
          id: msgId,
          type: voiceType,
          text: '',
          phase,
          round: state.clarificationRound,
          isStreaming: true,
          timestamp: Date.now(),
        },
      })

      const provider = voiceType === 'ethos' ? providerA : providerB
      const voice = voiceType === 'ethos' ? framework.voiceA : framework.voiceB
      const prompt = buildPrompt(instruction)

      try {
        await streamSseToText({
          endpoint: provider.endpoint,
          body: isEthosEgo
            ? { message: prompt, voice: voiceType, mode: state.mode, voiceName: voice.name,
                ...(state.selectedBranch ? { appendTransition: state.selectedBranch } : {}) }
            : { message: prompt, systemPrompt: voice.systemPrompt, voiceName: voice.name },
          onTextDelta: (fullText) =>
            dispatch({ type: 'UPDATE_MESSAGE_TEXT', payload: { id: msgId, text: fullText } }),
        })
      } catch (err) {
        dispatch({
          type: 'UPDATE_MESSAGE_TEXT',
          payload: { id: msgId, text: `*Could not respond: ${err?.message || 'unknown error'}*` },
        })
      } finally {
        dispatch({ type: 'SET_MESSAGE_STREAMING', payload: { id: msgId, isStreaming: false } })
      }
    }

    const adviceInstruction =
      `Based on the full conversation so far, give your perspective and advice as a trusted mentor. ` +
      `Write in distinct paragraphs — separate each paragraph with a blank line. Each paragraph should be one complete thought. ` +
      `End with 2–3 specific follow-up questions or concrete options for the user to consider.`

    try {
      if (state.chatPhase === 'idle') {
        // New conversation: go straight to advice (no clarifying questions unless we add optional logic later)
        await streamVoice('ethos', adviceInstruction, 'advice')
        await streamVoice('ego', adviceInstruction, 'advice')
      } else {
        // Ongoing conversation
        const instruction = replyContext
          ? `The user is responding to this specific point:\n"${String(replyContext).slice(0, 200)}"\n\n` +
            `Respond directly to that point as a mentor. Use distinct paragraphs separated by blank lines. End with a focused follow-up question.`
          : `Continue the mentoring conversation. Respond to the user's latest message thoughtfully. ` +
            `Use distinct paragraphs separated by blank lines. End with a follow-up question or offer 2–3 concrete options.`
        await streamVoice('ethos', instruction, 'advice')
        await streamVoice('ego', instruction, 'advice')
      }
    } catch (err) {
      console.error('sendMessage error:', err)
    } finally {
      dispatch({ type: 'STOP_LOADING' })
    }
  }, [dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider, state.chatPhase, state.clarificationRound, state.messages, state.mode, state.isLoading, state.selectedBranch])

  // Legacy: kept for side panel resolution feature
  const fetchResolution = useCallback(async (triggerReason = 'user request') => {
    const framework = getActiveFramework()
    const conversationHistory = state.messages
      .filter((m) => m.type !== 'user')
      .map((m) => ({
        name: m.type === 'ethos' ? framework?.voiceA?.name : framework?.voiceB?.name,
        text: m.text,
      }))
    if (!conversationHistory.length) return
    try {
      const res = await fetch('/api/resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: state.mode,
          userQuestion: state.userInput || state.messages.find((m) => m.type === 'user')?.text || '',
          personaPair: framework?.id === 'ethos-ego' ? 'Ethos/Ego' : framework?.name,
          rounds: Math.ceil(state.messages.filter((m) => m.type !== 'user').length / 2),
          conversationHistory,
          triggerReason,
        }),
      })
      if (!res.ok) throw new Error('Resolution failed')
      const data = await res.json()
      setResolution(data.resolution || '')
    } catch (e) {
      console.error('Resolution error:', e)
    }
  }, [state.messages, state.mode, state.userInput, getActiveFramework, setResolution])

  return { sendMessage, fetchResolution }
}
