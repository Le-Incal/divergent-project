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

    if (!response.ok) throw new Error('API request failed')
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let fullText = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')

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

  const sendMessage = useCallback(async (message) => {
    const framework = getActiveFramework()
    const providerA = getVoiceAProvider()
    const providerB = getVoiceBProvider()
    
    dispatch({ type: 'START_NEW_CHAT', payload: { title: message, userInput: message } })
    dispatch({ type: 'START_LOADING' })
    dispatch({ type: 'SET_VOICE_A_RESPONSE', payload: '' })
    dispatch({ type: 'SET_VOICE_B_RESPONSE', payload: '' })
    dispatch({ type: 'CLEAR_DEBATE_MESSAGES' })
    
    setIsStreaming({ voiceA: true, voiceB: true })

    const isEthosEgo = framework.id === 'ethos-ego'
    const streamVoice = async (voice, voiceKey, setterAction, provider) => {
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
        dispatch({ type: setterAction, payload: `*Error: Could not get response. Please try again.*` })
        return ''
      } finally {
        setIsStreaming(prev => ({ ...prev, [voiceKey]: false }))
      }
    }

    const [voiceAThesis, voiceBThesis] = await Promise.all([
      streamVoice(framework.voiceA, 'voiceA', 'SET_VOICE_A_RESPONSE', providerA),
      streamVoice(framework.voiceB, 'voiceB', 'SET_VOICE_B_RESPONSE', providerB),
    ])

    // Immediately follow theses with antithesis: a short streamed debate exchange.
    // Turn order: A responds to B, then B responds to A.
    const debateSoFar = []
    const streamDebateTurn = async (nextSpeakerKey) => {
      const provider = nextSpeakerKey === 'A' ? providerA : providerB
      const voice = nextSpeakerKey === 'A' ? framework.voiceA : framework.voiceB

      const context = `
Initial theses:
${framework.voiceA.name}: ${voiceAThesis}
${framework.voiceB.name}: ${voiceBThesis}

Debate so far:
${debateSoFar.map((m) => `${m.name}: ${m.text}`).join('\n')}
`

      const debateBody = isEthosEgo
        ? {
            message: `Debate now. Directly respond to the other voice's thesis. Be punchy and adversarial. Context:\n${context}`,
            voice: nextSpeakerKey === 'A' ? 'ethos' : 'ego',
            mode: state.mode,
            appendTransition: state.selectedBranch === (nextSpeakerKey === 'A' ? 'ethos' : 'ego') ? (nextSpeakerKey === 'A' ? 'ethos' : 'ego') : null,
            voiceName: voice.name,
          }
        : {
            message: `Debate now. Directly respond to the other voice's thesis. Be punchy and adversarial. Context:\n${context}`,
            systemPrompt: voice.systemPrompt + '\n\nKeep your response concise - 2-3 sentences max. Be punchy and provocative.',
            voiceName: voice.name,
          }

      const nextIndex = debateSoFar.length
      debateSoFar.push({ speaker: nextSpeakerKey, name: voice.name, text: '' })
      dispatch({
        type: 'ADD_DEBATE_MESSAGE',
        payload: { speaker: nextSpeakerKey, name: voice.name, text: '' },
      })

      try {
        await streamSseToText({
          endpoint: provider.endpoint,
          body: debateBody,
          onTextDelta: (fullText) => {
            debateSoFar[nextIndex].text = fullText
            dispatch({ type: 'UPDATE_DEBATE_MESSAGE_TEXT', payload: { index: nextIndex, text: fullText } })
          },
        })
      } catch (e) {
        console.error('Debate stream error:', e)
        dispatch({
          type: 'UPDATE_DEBATE_MESSAGE_TEXT',
          payload: { index: nextIndex, text: '*Error: Could not continue debate. Please try again.*' },
        })
      }
    }

    try {
      dispatch({ type: 'SET_DEBATING', payload: true })
      await streamDebateTurn('A')
      await streamDebateTurn('B')
    } catch {
      // ignore: errors handled per turn
    } finally {
      dispatch({ type: 'SET_DEBATING', payload: false })
    }

    dispatch({ type: 'STOP_LOADING' })
  }, [dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider, state.mode, state.selectedBranch])

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
