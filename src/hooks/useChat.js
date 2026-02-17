import { useState, useCallback } from 'react'
import { useApp, PROVIDERS } from '../context/AppContext'

export function useChat() {
  const { state, dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider } = useApp()
  const [isStreaming, setIsStreaming] = useState({ voiceA: false, voiceB: false })

  const sendMessage = useCallback(async (message) => {
    const framework = getActiveFramework()
    const providerA = getVoiceAProvider()
    const providerB = getVoiceBProvider()
    
    dispatch({ type: 'START_LOADING' })
    dispatch({ type: 'SET_VOICE_A_RESPONSE', payload: '' })
    dispatch({ type: 'SET_VOICE_B_RESPONSE', payload: '' })
    dispatch({ type: 'CLEAR_DEBATE_MESSAGES' })
    
    setIsStreaming({ voiceA: true, voiceB: true })

    const streamVoice = async (voice, voiceKey, setterAction, provider) => {
      try {
        const response = await fetch(provider.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message,
            systemPrompt: voice.systemPrompt,
            voiceName: voice.name,
          }),
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
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue

              try {
                const parsed = JSON.parse(data)
                if (parsed.text) {
                  fullText += parsed.text
                  dispatch({ type: setterAction, payload: fullText })
                }
              } catch (e) {}
            }
          }
        }
      } catch (error) {
        console.error(`Error streaming ${voice.name}:`, error)
        dispatch({ type: setterAction, payload: `*Error: Could not get response. Please try again.*` })
      } finally {
        setIsStreaming(prev => ({ ...prev, [voiceKey]: false }))
      }
    }

    await Promise.all([
      streamVoice(framework.voiceA, 'voiceA', 'SET_VOICE_A_RESPONSE', providerA),
      streamVoice(framework.voiceB, 'voiceB', 'SET_VOICE_B_RESPONSE', providerB),
    ])

    dispatch({ type: 'STOP_LOADING' })
  }, [dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider])

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

    try {
      const response = await fetch(nextSpeaker.provider.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Continue the debate. Respond to the other voice's points. Be direct and challenge their argument. Context:\n${context}`,
          systemPrompt: nextSpeaker.voice.systemPrompt + '\n\nKeep your response concise - 2-3 sentences max. Be punchy and provocative.',
          voiceName: nextSpeaker.voice.name,
        }),
      })

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let fullText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.text) fullText += parsed.text
            } catch (e) {}
          }
        }
      }

      dispatch({
        type: 'ADD_DEBATE_MESSAGE',
        payload: { speaker: nextSpeaker.key, name: nextSpeaker.voice.name, text: fullText },
      })
    } catch (error) {
      console.error('Error continuing debate:', error)
    } finally {
      dispatch({ type: 'SET_DEBATING', payload: false })
    }
  }, [dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider, state.voiceAResponse, state.voiceBResponse, state.debateMessages])

  return { sendMessage, continueDebate, isStreaming }
}
