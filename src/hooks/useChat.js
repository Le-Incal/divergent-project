import { useState, useCallback } from 'react'
import { useApp, PROVIDERS } from '../context/AppContext'

export function useChat() {
  const { state, dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider, setResolution } = useApp()
  const [isStreaming, setIsStreaming] = useState({ voiceA: false, voiceB: false })
  const [isResolving, setIsResolving] = useState(false)

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
        } catch (e) {}
      }
    }

    return fullText
  }

  const streamVoiceResponse = useCallback(async ({ framework, message, voiceKey, setterAction, provider }) => {
    const isEthosEgo = framework.id === 'ethos-ego'
    const voice = voiceKey === 'voiceA' ? framework.voiceA : framework.voiceB

    try {
      const body = isEthosEgo
        ? {
            message,
            voice: voiceKey === 'voiceA' ? 'ethos' : 'ego',
            mode: state.mode,
            appendTransition: state.selectedBranch === (voiceKey === 'voiceA' ? 'ethos' : 'ego') ? (voiceKey === 'voiceA' ? 'ethos' : 'ego') : null,
            voiceName: voice.name,
          }
        : { message, systemPrompt: voice.systemPrompt, voiceName: voice.name }
      return await streamSseToText({
        endpoint: provider.endpoint,
        body,
        onTextDelta: (fullText) => dispatch({ type: setterAction, payload: fullText }),
      })
    } catch (error) {
      console.error(`Error streaming ${voice.name}:`, error)
      dispatch({ type: setterAction, payload: `*Error: Could not get response. ${error?.message || ''}*` })
      return ''
    } finally {
      setIsStreaming((prev) => ({ ...prev, [voiceKey]: false }))
    }
  }, [dispatch, state.mode, state.selectedBranch])

  const askClarifyingQuestion = useCallback(async (message) => {
    const framework = getActiveFramework()
    const providerA = getVoiceAProvider() || PROVIDERS.claude
    const isEthosEgo = framework.id === 'ethos-ego'

    dispatch({
      type: 'START_NEW_CHAT',
      payload: { title: message, userInput: message, awaitingClarification: true, clarificationPrompt: '', clarificationReply: '' },
    })
    dispatch({ type: 'START_LOADING' })
    dispatch({ type: 'SET_AWAITING_CLARIFICATION', payload: true })
    dispatch({ type: 'SET_CLARIFICATION_PROMPT', payload: '' })
    dispatch({ type: 'SET_CLARIFICATION_REPLY', payload: '' })
    dispatch({ type: 'SET_VOICE_A_RESPONSE', payload: '' })
    dispatch({ type: 'SET_VOICE_B_RESPONSE', payload: '' })
    dispatch({ type: 'CLEAR_DEBATE_MESSAGES' })
    dispatch({ type: 'SET_DEBATING', payload: false })

    setIsStreaming({ voiceA: true, voiceB: false })
    try {
      const question = await streamSseToText({
        endpoint: providerA.endpoint,
        body: isEthosEgo
          ? {
              message: `User question:\n${message}\n\nBefore giving any advice or debate, ask exactly one concise clarifying question. Output only that question.`,
              voice: 'ethos',
              mode: state.mode,
              appendTransition: state.selectedBranch === 'ethos' ? 'ethos' : null,
              voiceName: framework.voiceA.name,
            }
          : {
              message: `User question:\n${message}\n\nBefore giving any advice or debate, ask exactly one concise clarifying question. Output only that question.`,
              systemPrompt: framework.voiceA.systemPrompt,
              voiceName: framework.voiceA.name,
            },
        onTextDelta: (fullText) => dispatch({ type: 'SET_CLARIFICATION_PROMPT', payload: fullText }),
      })
      if (!question?.trim()) {
        dispatch({ type: 'SET_CLARIFICATION_PROMPT', payload: 'Before we proceed, what specific outcome do you want from this decision?' })
      }
    } catch (error) {
      console.error('Error generating clarifying question:', error)
      dispatch({ type: 'SET_CLARIFICATION_PROMPT', payload: `*Error: Could not generate clarifying question. ${error?.message || ''}*` })
      dispatch({ type: 'SET_AWAITING_CLARIFICATION', payload: false })
      dispatch({
        type: 'SET_VOICE_A_RESPONSE',
        payload: '*Error: Could not respond right now. Please retry once the API connection is available.*',
      })
      dispatch({
        type: 'SET_VOICE_B_RESPONSE',
        payload: '*Error: Could not respond right now. Please retry once the API connection is available.*',
      })
    } finally {
      setIsStreaming({ voiceA: false, voiceB: false })
      dispatch({ type: 'STOP_LOADING' })
    }
  }, [dispatch, getActiveFramework, getVoiceAProvider, state.mode, state.selectedBranch])

  const generateInitialResponses = useCallback(async (clarificationReply) => {
    const framework = getActiveFramework()
    const providerA = getVoiceAProvider()
    const providerB = getVoiceBProvider()
    const originalQuestion = state.userInput || ''
    const responsePrompt = `Original user question:\n${originalQuestion}\n\nClarification from user:\n${clarificationReply}\n\nNow provide your direct response to the user. Do not debate the other voice yet.`

    dispatch({ type: 'START_LOADING' })
    dispatch({ type: 'SET_AWAITING_CLARIFICATION', payload: false })
    dispatch({ type: 'SET_CLARIFICATION_REPLY', payload: clarificationReply })
    dispatch({ type: 'SET_VOICE_A_RESPONSE', payload: '' })
    dispatch({ type: 'SET_VOICE_B_RESPONSE', payload: '' })
    dispatch({ type: 'CLEAR_DEBATE_MESSAGES' })
    dispatch({ type: 'SET_DEBATING', payload: false })

    setIsStreaming({ voiceA: true, voiceB: true })
    await Promise.all([
      streamVoiceResponse({
        framework,
        message: responsePrompt,
        voiceKey: 'voiceA',
        setterAction: 'SET_VOICE_A_RESPONSE',
        provider: providerA,
      }),
      streamVoiceResponse({
        framework,
        message: responsePrompt,
        voiceKey: 'voiceB',
        setterAction: 'SET_VOICE_B_RESPONSE',
        provider: providerB,
      }),
    ])
    dispatch({ type: 'STOP_LOADING' })
  }, [dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider, state.userInput, streamVoiceResponse])

  const sendMessage = useCallback(async (message) => {
    const trimmed = String(message || '').trim()
    if (!trimmed) return

    if (state.awaitingClarification && state.userInput) {
      await generateInitialResponses(trimmed)
      return
    }

    await askClarifyingQuestion(trimmed)
  }, [askClarifyingQuestion, generateInitialResponses, state.awaitingClarification, state.userInput])

  const continueDebate = useCallback(async () => {
    const framework = getActiveFramework()
    const providerA = getVoiceAProvider()
    const providerB = getVoiceBProvider()
    
    dispatch({ type: 'SET_DEBATING', payload: true })
    
    const context = `
Previous exchange:
${framework.voiceA.name}: ${state.voiceAResponse}
${framework.voiceB.name}: ${state.voiceBResponse}

${state.debateMessages.map(m => `${m.name}: ${m.text}`).join('\n')}
`

    const isVoiceATurn = state.debateMessages.length % 2 === 0
    const nextSpeaker = isVoiceATurn
      ? { voice: framework.voiceA, key: 'A', provider: providerA }
      : { voice: framework.voiceB, key: 'B', provider: providerB }

    const isEthosEgo = framework.id === 'ethos-ego'
    const debateBody = isEthosEgo
      ? {
          message: `Continue the debate. Respond to the other voice's points. Be direct and challenge their argument. Context:\n${context}`,
          voice: nextSpeaker.key === 'A' ? 'ethos' : 'ego',
          mode: state.mode,
          appendTransition: state.selectedBranch === (nextSpeaker.key === 'A' ? 'ethos' : 'ego') ? (nextSpeaker.key === 'A' ? 'ethos' : 'ego') : null,
          voiceName: nextSpeaker.voice.name,
        }
      : {
          message: `Continue the debate. Respond to the other voice's points. Be direct and challenge their argument. Context:\n${context}`,
          systemPrompt: nextSpeaker.voice.systemPrompt + '\n\nKeep your response concise - 2-3 sentences max. Be punchy and provocative.',
          voiceName: nextSpeaker.voice.name,
        }
    try {
      const nextIndex = state.debateMessages.length
      dispatch({
        type: 'ADD_DEBATE_MESSAGE',
        payload: { speaker: nextSpeaker.key, name: nextSpeaker.voice.name, text: '' },
      })
      await streamSseToText({
        endpoint: nextSpeaker.provider.endpoint,
        body: debateBody,
        onTextDelta: (fullText) => dispatch({ type: 'UPDATE_DEBATE_MESSAGE_TEXT', payload: { index: nextIndex, text: fullText } }),
      })
    } catch (error) {
      console.error('Error continuing debate:', error)
    } finally {
      dispatch({ type: 'SET_DEBATING', payload: false })
    }
  }, [dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider, state.voiceAResponse, state.voiceBResponse, state.debateMessages, state.mode, state.selectedBranch])

  const fetchResolution = useCallback(async (triggerReason = 'user request') => {
    const framework = getActiveFramework()
    const conversationHistory = [
      ...(state.voiceAResponse ? [{ name: framework?.voiceA?.name, text: state.voiceAResponse }] : []),
      ...(state.voiceBResponse ? [{ name: framework?.voiceB?.name, text: state.voiceBResponse }] : []),
      ...state.debateMessages.map((m) => ({ name: m.name, text: m.text })),
    ]
    if (conversationHistory.length === 0) return
    setIsResolving(true)
    try {
      const res = await fetch('/api/resolution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: state.mode,
          userQuestion: state.userInput || 'User question',
          personaPair: framework?.id === 'ethos-ego' ? 'Ethos/Ego' : framework?.name,
          rounds: 1 + Math.floor(state.debateMessages.length / 2),
          conversationHistory,
          triggerReason,
        }),
      })
      if (!res.ok) throw new Error('Resolution failed')
      const data = await res.json()
      setResolution(data.resolution || '')
    } catch (e) {
      console.error('Resolution error:', e)
      setResolution('*Could not generate resolution summary.*')
    } finally {
      setIsResolving(false)
    }
  }, [state.voiceAResponse, state.voiceBResponse, state.debateMessages, state.userInput, state.mode, getActiveFramework, setResolution])

  return { sendMessage, continueDebate, fetchResolution, isStreaming, isResolving }
}
