import { useCallback, useRef } from 'react'
import { useApp, makeId } from '../context/AppContext'
import { parseVoiceStream } from '../utils/parseVoiceStream'
import { asksForDiagram } from '../utils/conversationView.js'
import { ethosFrameworks, egoFrameworks } from '../brainstorm/kits.js'
import { grammarFor } from '../diagram/registry.js'
import { OFFER_COPY, evaluateDiagramTriggers } from '../diagram/triggers.js'

const DIAGRAM_FRAMEWORK = {
  ethos: '5 Whys',
  ego: 'Issue Trees / MECE',
}

const DIAGRAM_SHAPE = {
  ethos: 'Grammar core_radial. Each node kind is symptom, cause, or root_belief. Each node has a numeric layer and into set to another node id or null. At most one root_belief.',
  ego: 'Grammar campaign. Exactly one node of kind start and one of kind objective. Every other node is kind option with leverage from 0 to 1. Do not make a cycle.',
}

const streamSseToText = async ({ endpoint, body, onTextDelta, onDiagram }) => {
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
        if (parsed.diagram) onDiagram?.(parsed.diagram)
        if (parsed.text) {
          fullText += parsed.text
          onTextDelta?.(fullText)
        }
      } catch {}
    }
  }
  return fullText
}

const OFFER = [
  'If you used MODE:answer, close with one short paragraph that is yours alone.',
  'Offer the next step you would take, and how you specifically can help, from your own worldview.',
  'Invite them to continue with you.',
  'Your offer must be different from the other voice. Do not list a menu of options.',
].join('\n')

const SCAN = [
  'If MODE:answer, write the reply in Markdown, so it can be scanned like a resume and then read.',
  'Start with a Markdown list of two or three items. Begin each item with "- ". Bold only the claim, then a few plain words.',
  'The list supports one recommendation. It is not a menu of options, and it is not a sequence that also includes the other path.',
  'A reader who stops at the list should already know the single move you want, and should be able to tell it apart from the other voice\'s move.',
  'Then a blank line, then Markdown paragraphs that develop those points for someone who wants more.',
  'Do not write the key points as plain paragraphs. Do not use headings. Do not copy wording from these instructions.',
].join('\n')

const SHAPE = [
  'Your very first line must be exactly one of these two lines and nothing else:',
  'MODE:clarify',
  'MODE:answer',
  'Do not wrap that line in quotes, markdown, or punctuation.',
  'Use MODE:clarify only when one missing fact stops you from giving a useful answer. Ask that single question, then stop. Do not add key points.',
  'Use MODE:answer when you can respond. State your perspective directly.',
  SCAN,
  OFFER,
].join('\n')

const OPENING_LENGTH = [
  'This is the opening answer.',
  'After the key points, one short paragraph is enough before the closing offer.',
  'Stay under 150 words.',
].join('\n')

const BOTH_FEEDBACK = [
  'The user just spoke to both of you. This is succinct feedback on what they just said, not a new essay.',
  'Do not restate your earlier answer. React to their latest message.',
  'Stay under 80 words.',
  'Write it in Markdown. Start with a Markdown list of two items, each beginning with "- ", and bold the claim in each item.',
  'Then one short paragraph: your reaction from your own path, and one next step. That paragraph is not a menu.',
  'Do not add more paragraphs.',
  'Your very first line must be exactly one of these two lines and nothing else:',
  'MODE:clarify',
  'MODE:answer',
  'Do not wrap that line in quotes, markdown, or punctuation.',
  'Use MODE:clarify only when one missing fact stops you from responding. Ask that single question, then stop.',
  'Use MODE:answer when you can respond.',
].join('\n')

const ETHOS_LEAN = [
  'Commit to one path. You reason from who the user becomes, then what they should do, then what it costs them to live with it.',
  'If the question offers two choices, pick the one that forms the person. Do not recommend both, and do not say "do this first, then decide."',
  'Your move is the true word, said to the person it concerns, and the willingness to live with the cost. Trust, integrity, and who they become are the point.',
  'These moves are not available to you: building a file to use later, managing how they are seen, taking credit as a tactic, leaving because the timing favors it, reading people as leverage.',
  'Choose your path even when it is slower and even when it loses the room this week.',
  'If the other operating system would sign your opening claims, those claims are wrong. Rewrite them until a reader could not swap the columns.',
  'Do not mention the other voice.',
].join('\n')

const EGO_LEAN = [
  'Commit to one path. You reason from the move available now, then who that makes the user, then what it means.',
  'If the question offers two choices, pick the one that changes the outcome. Do not recommend both, and do not say "do this first, then decide."',
  'Your move is the play that shifts credit, timing, or leverage this week. What they can author, and whether the opening is closing, are the point.',
  'These moves are not available to you: the honest conversation for its own sake, waiting until they can live with themselves, becoming a better person before they act, sitting with the question.',
  'Choose your path even when it costs the principled story and even when it feels early.',
  'If the other operating system would sign your opening claims, those claims are wrong. Rewrite them until a reader could not swap the columns.',
  'Do not mention the other voice.',
].join('\n')

function stanceFor(voiceType, framework) {
  if (framework?.id === 'ethos-ego') return voiceType === 'ethos' ? ETHOS_LEAN : EGO_LEAN
  const voice = voiceType === 'ethos' ? framework?.voiceA : framework?.voiceB
  const other = voiceType === 'ethos' ? framework?.voiceB : framework?.voiceA
  return [
    `You are ${voice?.name}. ${voice?.role}.`,
    `Recommend the path only ${voice?.name} would recommend.`,
    `Do not give ${other?.name}'s advice in your own words.`,
    `If ${other?.name} would sign your opening claims, those claims are wrong. Rewrite them until the paths actually diverge.`,
    `Do not describe both paths and hand the choice back. Argue for yours. Do not mention ${other?.name}.`,
  ].join('\n')
}

function debateInstruction(otherName, otherText) {
  return [
    `${otherName} just answered:`,
    '"""',
    otherText,
    '"""',
    `Respond to that answer. Reject the recommendation. Do not soften it, and do not meet in the middle.`,
    'Hold your own path. Your move must not be a milder version of theirs. Do not repeat your previous answer.',
    'This is a debate reply, not an essay. Write it in Markdown. Stay under 90 words.',
    'Start with a Markdown list of two items, each beginning with "- ", and bold the claim in each item.',
    'The first item is why their move fails on your terms. The second is the move you want instead.',
    'Then one short paragraph: the next step and how you can help, and invite them to continue. That paragraph is not a menu.',
    'Your very first line must be exactly:',
    'MODE:answer',
    'Do not ask a clarification question.',
  ].join('\n')
}

function elaborateInstruction(ownText) {
  return [
    'Your first response was:',
    '"""',
    ownText,
    '"""',
    'Expand on that first response. Go further into your own worldview and the path only you would recommend. Do not repeat it in the same words. Do not drift toward the other path. Do not answer the other voice.',
    'Your very first line must be exactly:',
    'MODE:answer',
    'Do not ask a clarification question.',
    'Open with a Markdown list of three items, each beginning with "- ", and bold the claim in each item.',
    'Then a blank line, then three or four paragraphs that develop those points. That is where the narrative lives.',
    OFFER,
  ].join('\n')
}

function firstAnswer(messages, type) {
  return (messages || []).find((m) => (
    m.type === type && !m.isStreaming && m.text?.trim() && m.responseKind !== 'clarify'
  ))
}

function priorFor(messages, message) {
  const index = messages.findIndex((m) => m.id === message.id)
  if (index < 0) return []
  if (message.turnId) {
    return messages.slice(0, index).filter((m) => m.turnId !== message.turnId)
  }
  let start = index
  while (start > 0) {
    const prev = messages[start - 1]
    const sameTurn = (prev.type === 'ethos' || prev.type === 'ego') && prev.phase === message.phase
    if (!sameTurn) break
    start -= 1
  }
  return messages.slice(0, start)
}

function adviceReplay(voiceType, framework, user, prior) {
  const voiceAName = framework.voiceA.name
  const voiceBName = framework.voiceB.name
  const addressed = voiceType === 'ethos' ? voiceAName : voiceBName
  const replyTo = user.replyTo ? String(user.replyTo).trim() : ''
  const userIndex = prior.findIndex((m) => m.id === user.id)
  const voicesBeforeUser = prior.slice(0, Math.max(userIndex, 0)).some((m) => m.type === 'ethos' || m.type === 'ego')
  const target = user.audience === 'ethos' || user.audience === 'ego' ? user.audience : 'both'
  const isOpening = !voicesBeforeUser && !replyTo
  const isBothFeedback = !isOpening && target === 'both' && !replyTo
  const lead = replyTo
    ? `The user is replying to this specific passage:\n"""${replyTo.slice(0, 500)}"""\nRespond to that passage.`
    : isOpening
      ? 'The user just asked a question. Answer it now if you can. Ask a clarification only if you truly cannot.'
      : target === 'both'
        ? 'The user is speaking to both of you. Give succinct feedback on what they just said. Do not write another full answer.'
        : `The user is speaking only to ${addressed}. Respond to what they just said.`
  const shape = isOpening ? `${OPENING_LENGTH}\n\n${SHAPE}` : isBothFeedback ? BOTH_FEEDBACK : SHAPE
  return {
    instruction: `${lead}\n\n${shape}\n\n${stanceFor(voiceType, framework)}`,
    maxTokens: isOpening ? 480 : isBothFeedback ? 200 : null,
  }
}

function replayFor(message, messages, framework) {
  if (message.replay?.instruction) {
    return { instruction: message.replay.instruction, maxTokens: message.replay.maxTokens || null }
  }
  const prior = priorFor(messages, message)
  const phase = message.phase || 'advice'
  if (phase === 'debate') {
    const ethos = [...prior].reverse().find((m) => m.type === 'ethos' && m.text?.trim() && m.responseKind !== 'clarify')
    const ego = [...prior].reverse().find((m) => m.type === 'ego' && m.text?.trim() && m.responseKind !== 'clarify')
    if (!ethos || !ego) return null
    const base = message.type === 'ethos'
      ? debateInstruction(framework.voiceB.name, ego.text)
      : debateInstruction(framework.voiceA.name, ethos.text)
    return { instruction: `${base}\n\n${stanceFor(message.type, framework)}`, maxTokens: 180 }
  }
  if (phase === 'elaborate') {
    const own = firstAnswer(prior, message.type)
    if (!own) return null
    return {
      instruction: `${elaborateInstruction(own.text)}\n\n${stanceFor(message.type, framework)}`,
      maxTokens: null,
    }
  }
  const user = [...prior].reverse().find((m) => m.type === 'user')
  if (!user) return null
  return adviceReplay(message.type, framework, user, prior)
}

export function useChat() {
  const { state, dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider, setResolution } = useApp()
  const busyRef = useRef(false)
  const fetchDiagramRef = useRef(null)
  const diagramSessionRef = useRef({ declinedFramework: null, turn: 0, n1Complete: true })

  const runVoices = useCallback(async ({ voices, instructionFor, phase, priorMessages, userMessage, maxTokens, replaceIds, diagram, c2, onDiagram }) => {
    const framework = getActiveFramework()
    const providerA = getVoiceAProvider()
    const providerB = getVoiceBProvider()
    const isEthosEgo = framework.id === 'ethos-ego'
    const voiceAName = framework.voiceA.name
    const voiceBName = framework.voiceB.name

    const ids = {}
    const turnId = makeId()
    for (const voiceType of voices) {
      const existingId = replaceIds?.[voiceType]
      const msgId = existingId || makeId()
      ids[voiceType] = msgId
      if (existingId) {
        dispatch({
          type: 'UPDATE_MESSAGE_TEXT',
          payload: { id: msgId, text: '', responseKind: null, phase },
        })
        dispatch({ type: 'SET_MESSAGE_STREAMING', payload: { id: msgId, isStreaming: true } })
      } else {
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            id: msgId,
            type: voiceType,
            text: '',
            responseKind: null,
            phase,
            turnId,
            round: state.clarificationRound,
            isStreaming: true,
            timestamp: Date.now(),
          },
        })
      }
    }

    const buildPrompt = (instruction) => {
      const history = userMessage ? [...priorMessages, userMessage] : [...priorMessages]
      const lines = history
        .filter((m) => m.type !== 'host')
        .map((m) => {
          if (m.type === 'user') {
            const about = m.replyTo ? ` about this passage: "${String(m.replyTo).slice(0, 280)}"` : ''
            if (m.audience === 'ethos') return `User (replying only to ${voiceAName}${about}): ${m.text}`
            if (m.audience === 'ego') return `User (replying only to ${voiceBName}${about}): ${m.text}`
            return `User${about ? ` (replying${about})` : ''}: ${m.text}`
          }
          const name = m.type === 'ethos' ? voiceAName : voiceBName
          return `${name}: ${parseVoiceStream(m.text, { complete: true }).text}`
        })
      return `${lines.join('\n\n')}\n\n${instruction}`
    }

    const publish = (msgId, raw, complete, fallbackPhase) => {
      const parsed = parseVoiceStream(raw, { complete })
      const responseKind = complete ? (parsed.responseKind || 'answer') : parsed.responseKind
      dispatch({
        type: 'UPDATE_MESSAGE_TEXT',
        payload: {
          id: msgId,
          text: parsed.text,
          responseKind,
          phase: responseKind === 'clarify' ? 'clarification' : fallbackPhase,
        },
      })
    }

    await Promise.all(voices.map(async (voiceType) => {
      const msgId = ids[voiceType]
      const provider = voiceType === 'ethos' ? providerA : providerB
      const voice = voiceType === 'ethos' ? framework.voiceA : framework.voiceB
      const instruction = instructionFor(voiceType)
      dispatch({
        type: 'SET_MESSAGE_REPLAY',
        payload: {
          id: msgId,
          replay: { instruction, maxTokens: maxTokens || null },
        },
      })
      const prompt = buildPrompt(instruction)

      try {
        const fullRaw = await streamSseToText({
          endpoint: provider.endpoint,
          body: isEthosEgo
            ? {
                message: prompt,
                voice: voiceType,
                mode: state.mode,
                voiceName: voice.name,
                ...(state.selectedBranch ? { appendTransition: state.selectedBranch } : {}),
                ...(maxTokens ? { maxTokens } : {}),
                ...(diagram ? { diagram: true, c2 } : {}),
              }
            : {
                message: prompt,
                systemPrompt: voice.systemPrompt,
                voiceName: voice.name,
                ...(maxTokens ? { maxTokens } : {}),
                ...(diagram ? { diagram: true, c2 } : {}),
              },
          onTextDelta: (fullText) => publish(msgId, fullText, false, phase),
          onDiagram,
        })
        publish(msgId, fullRaw, true, phase)
      } catch (err) {
        dispatch({
          type: 'UPDATE_MESSAGE_TEXT',
          payload: {
            id: msgId,
            text: `*Could not respond: ${err?.message || 'unknown error'}*`,
            responseKind: 'answer',
            phase,
          },
        })
      } finally {
        dispatch({ type: 'SET_MESSAGE_STREAMING', payload: { id: msgId, isStreaming: false } })
      }
    }))
    return ids
  }, [dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider, state.clarificationRound, state.mode, state.selectedBranch])

  const sendMessage = useCallback(async (userText, options = {}) => {
    const trimmed = String(userText || '').trim()
    const target = options.target === 'ethos' || options.target === 'ego' ? options.target : 'both'
    if (!trimmed || busyRef.current) return

    busyRef.current = true
    const framework = getActiveFramework()
    const isNew = state.chatPhase === 'idle'
    const priorMessages = isNew ? [] : state.messages

    dispatch({ type: 'START_LOADING' })

    if (isNew) {
      dispatch({ type: 'START_NEW_CHAT', payload: { title: trimmed, userInput: trimmed } })
      dispatch({ type: 'SET_CHAT_PHASE', payload: 'advising' })
      dispatch({ type: 'SET_CLARIFICATION_ROUND', payload: 0 })
    }

    const replyTo = options.replyTo ? String(options.replyTo).trim() : ''
    const wantsDiagram = asksForDiagram(trimmed)
    const userMessage = {
      id: makeId(),
      type: 'user',
      text: trimmed,
      audience: wantsDiagram ? 'both' : target,
      replyTo: replyTo || null,
      phase: 'advising',
      round: state.clarificationRound,
      isStreaming: false,
      timestamp: Date.now(),
    }
    dispatch({ type: 'ADD_MESSAGE', payload: userMessage })

    const voices = wantsDiagram || target === 'both' ? ['ethos', 'ego'] : [target]
    const addressed = target === 'ethos' ? framework.voiceA.name : framework.voiceB.name
    const lead = wantsDiagram
      ? 'The user asked for a diagram. Answer in ordinary sentences. Do not draw with characters, brackets, or arrows. The app draws the diagram after you reply.'
      : replyTo
      ? `The user is replying to this specific passage:\n"""${replyTo.slice(0, 500)}"""\nRespond to that passage.`
      : isNew
        ? 'The user just asked a question. Answer it now if you can. Ask a clarification only if you truly cannot.'
        : target === 'both'
          ? 'The user is speaking to both of you. Give succinct feedback on what they just said. Do not write another full answer.'
          : `The user is speaking only to ${addressed}. Respond to what they just said.`
    const isOpening = isNew && !replyTo
    const isBothFeedback = !isOpening && target === 'both' && !replyTo
    const shape = isOpening ? `${OPENING_LENGTH}\n\n${SHAPE}` : isBothFeedback ? BOTH_FEEDBACK : SHAPE

    try {
      const ids = await runVoices({
        voices,
        phase: 'advice',
        priorMessages,
        userMessage,
        maxTokens: wantsDiagram || isOpening ? 480 : isBothFeedback ? 200 : undefined,
        instructionFor: (voiceType) => `${lead}\n\n${shape}\n\n${stanceFor(voiceType, framework)}`,
      })
      if (wantsDiagram && ids) {
        await Promise.all(['ethos', 'ego'].map((voice) => fetchDiagramRef.current(ids[voice], {
          voice,
          framework: DIAGRAM_FRAMEWORK[voice],
          summary: trimmed,
        })))
      }
    } catch (err) {
      console.error('sendMessage error:', err)
    } finally {
      busyRef.current = false
      dispatch({ type: 'STOP_LOADING' })
    }
  }, [dispatch, getActiveFramework, runVoices, state.chatPhase, state.clarificationRound, state.messages])

  const startDebate = useCallback(async () => {
    if (busyRef.current) return
    const framework = getActiveFramework()
    const latest = (type) => [...state.messages].reverse().find((m) => m.type === type && !m.isStreaming && m.text?.trim())
    const ethos = latest('ethos')
    const ego = latest('ego')
    if (!ethos || !ego) return
    if (ethos.responseKind === 'clarify' || ego.responseKind === 'clarify') return

    busyRef.current = true
    dispatch({ type: 'START_LOADING' })

    try {
      await runVoices({
        voices: ['ethos', 'ego'],
        phase: 'debate',
        priorMessages: state.messages,
        userMessage: null,
        maxTokens: 180,
        instructionFor: (voiceType) => {
          const base = voiceType === 'ethos'
            ? debateInstruction(framework.voiceB.name, ego.text)
            : debateInstruction(framework.voiceA.name, ethos.text)
          return `${base}\n\n${stanceFor(voiceType, framework)}`
        },
      })
    } catch (err) {
      console.error('startDebate error:', err)
    } finally {
      busyRef.current = false
      dispatch({ type: 'STOP_LOADING' })
    }
  }, [dispatch, getActiveFramework, runVoices, state.messages])

  const startElaborate = useCallback(async () => {
    if (busyRef.current) return
    const framework = getActiveFramework()
    const ethos = firstAnswer(state.messages, 'ethos')
    const ego = firstAnswer(state.messages, 'ego')
    if (!ethos || !ego) return

    busyRef.current = true
    dispatch({ type: 'START_LOADING' })

    try {
      await runVoices({
        voices: ['ethos', 'ego'],
        phase: 'elaborate',
        priorMessages: state.messages,
        userMessage: null,
        instructionFor: (voiceType) => `${elaborateInstruction(voiceType === 'ethos' ? ethos.text : ego.text)}\n\n${stanceFor(voiceType, framework)}`,
      })
    } catch (err) {
      console.error('startElaborate error:', err)
    } finally {
      busyRef.current = false
      dispatch({ type: 'STOP_LOADING' })
    }
  }, [dispatch, getActiveFramework, runVoices, state.messages])

  const regenerateMessage = useCallback(async (messageId) => {
    if (busyRef.current) return
    const framework = getActiveFramework()
    const message = state.messages.find((m) => m.id === messageId)
    if (!message || (message.type !== 'ethos' && message.type !== 'ego')) return
    const replay = replayFor(message, state.messages, framework)
    if (!replay?.instruction) return

    busyRef.current = true
    dispatch({ type: 'START_LOADING' })
    try {
      await runVoices({
        voices: [message.type],
        phase: message.phase || 'advice',
        priorMessages: priorFor(state.messages, message),
        userMessage: null,
        maxTokens: replay.maxTokens || undefined,
        replaceIds: { [message.type]: message.id },
        instructionFor: () => replay.instruction,
      })
    } catch (err) {
      console.error('regenerateMessage error:', err)
    } finally {
      busyRef.current = false
      dispatch({ type: 'STOP_LOADING' })
    }
  }, [dispatch, getActiveFramework, runVoices, state.messages])

  const fetchDiagram = useCallback(async (msgId, offer) => {
    const framework = getActiveFramework()
    const voiceType = offer.voice === 'ego' ? 'ego' : 'ethos'
    const provider = voiceType === 'ego' ? getVoiceBProvider() : getVoiceAProvider()
    const voice = voiceType === 'ego' ? framework.voiceB : framework.voiceA
    const grammar = offer.grammar || grammarFor(voiceType, offer.framework)
    await streamSseToText({
      endpoint: provider.endpoint,
      body: {
        message: [
          'The user wants the map.',
          `Voice: ${voiceType}. Framework: ${offer.framework}. Grammar: ${grammar}.`,
          DIAGRAM_SHAPE[voiceType],
          offer.summary ? `Draw this: ${offer.summary}` : '',
          'Invoke the emit_diagram tool once. Labels are plain text, six words or fewer. No coordinates. No thinker names. specVersion is 1. revision is 1. origin is voice. status is active.',
        ].filter(Boolean).join('\n'),
        voice: voiceType,
        mode: state.mode,
        voiceName: voice.name,
        diagram: true,
        diagramOnly: true,
        maxTokens: 1600,
        c2: offer.c2,
      },
      onDiagram: (event) => {
        if (event.type === 'spec') {
          dispatch({ type: 'SET_MESSAGE_DIAGRAM', payload: { id: msgId, spec: event.spec, offer: null } })
        } else if (event.type === 'fallback') {
          dispatch({ type: 'SET_MESSAGE_DIAGRAM', payload: { id: msgId, outline: event.outline, offer: null } })
        }
      },
    })
  }, [dispatch, getActiveFramework, getVoiceAProvider, getVoiceBProvider, state.mode])
  fetchDiagramRef.current = fetchDiagram

  const startBrainstorm = useCallback(async ({ voice, route, summary, session }) => {
    if (busyRef.current) return
    const voiceType = voice === 'ego' ? 'ego' : 'ethos'
    const catalog = voiceType === 'ego' ? egoFrameworks : ethosFrameworks
    const tool = catalog.find((item) => item.name === route.framework)
    const instruction = session?.collect
      ? [
        'The user is brainstorming this conversation. Use the full history above.',
        `You will use ${route.framework} once you know enough. Do not run it yet.`,
        'Begin by collecting information. Ask one question that opens the work.',
        'Two short sentences. Ordinary language. No list. No diagram. No tool call in the reply.',
        'Your very first line must be exactly:',
        'MODE:answer',
      ].join('\n')
      : [
      'The user is brainstorming this conversation. Use the full history above.',
      `Run this framework: ${route.framework}.`,
      tool?.use ? `Use it this way: ${tool.use}` : '',
      tool?.asks ? `Put this question to them: ${tool.asks}` : '',
      route.thenFramework ? `Then one sentence on ${route.thenFramework}.` : '',
      route.addOnFramework ? `Add one line using ${route.addOnFramework}.` : '',
      route.acknowledgment ? 'Open with one line of acknowledgment, then the challenge. Do not skip the challenge.' : 'Go straight into the framework.',
      'The profile is for tone only. Do not quote scores. Do not press on a fear.',
      summary || '',
      'Write Markdown. Two items starting with "- ", bold only the claim, then one short paragraph. Stay under 160 words.',
      'The reply is ordinary sentences. Never draw a diagram with characters: no pipes, arrows, brackets, or box art. The app draws diagrams.',
      voiceType === 'ego'
        ? 'Inside a diagram tool only: expand, then cut, and rate leverage from 0 to 1. Do not describe that structure in the reply.'
        : 'Inside a diagram tool only: converge, never prune, and leave the center as "?" until a root is confirmed. Do not describe that structure in the reply.',
      'After the reply, invoke the emit_structure_hints tool once. That call stays off the page. Never write a tool name, a function call, or JSON in the reply. Do not use emit_diagram.',
      'Your very first line must be exactly:',
      'MODE:answer',
    ].filter(Boolean).join('\n')

    diagramSessionRef.current.turn += 1
    const brainstormUserTurn = diagramSessionRef.current.turn
    const events = []
    busyRef.current = true
    dispatch({ type: 'START_LOADING' })
    try {
      const ids = await runVoices({
        voices: [voiceType],
        phase: 'brainstorm',
        priorMessages: state.messages,
        userMessage: null,
        maxTokens: 1400,
        diagram: true,
        c2: session?.c2,
        onDiagram: (event) => events.push(event),
        instructionFor: () => instruction,
      })
      const msgId = ids?.[voiceType]
      const hints = events.find((event) => event.type === 'hints')?.hints
      const specEvent = events.find((event) => event.type === 'spec')
      const fallbackEvent = events.find((event) => event.type === 'fallback')
      const n1ThisTurn = route.framework === 'Name It to Tame It'
      const decision = hints ? evaluateDiagramTriggers({
        voice: voiceType,
        framework: route.framework,
        hints,
        flooded: !!session?.flooded,
        n1Complete: n1ThisTurn ? false : diagramSessionRef.current.n1Complete,
        urgent: !!session?.urgent,
        crisis: false,
        c2: session?.c2 || 'Key points',
        profile: session?.profile || {},
        brainstormUserTurn,
        mapExists: false,
        offerDeclinedForFramework: diagramSessionRef.current.declinedFramework,
      }) : { action: 'none' }
      if (n1ThisTurn) diagramSessionRef.current.n1Complete = true
      if (!msgId) return
      if (decision.action === 'offer' && OFFER_COPY[decision.copyKey]) {
        dispatch({
          type: 'SET_MESSAGE_DIAGRAM',
          payload: {
            id: msgId,
            offer: {
              line: OFFER_COPY[decision.copyKey],
              grammar: decision.grammar,
              framework: route.framework,
              voice: voiceType,
              summary,
              c2: session?.c2 || null,
            },
          },
        })
      } else if (decision.action === 'draw' || (decision.action === 'queue' && n1ThisTurn)) {
        if (specEvent) {
          dispatch({ type: 'SET_MESSAGE_DIAGRAM', payload: { id: msgId, spec: specEvent.spec, offer: null } })
        } else if (fallbackEvent) {
          dispatch({ type: 'SET_MESSAGE_DIAGRAM', payload: { id: msgId, outline: fallbackEvent.outline, offer: null } })
        } else {
          await fetchDiagram(msgId, {
            voice: voiceType,
            framework: route.framework,
            grammar: decision.grammar,
            summary,
            c2: session?.c2 || null,
          })
        }
      }
    } catch (err) {
      console.error('startBrainstorm error:', err)
    } finally {
      busyRef.current = false
      dispatch({ type: 'STOP_LOADING' })
    }
  }, [dispatch, fetchDiagram, runVoices, state.messages])

  const acceptDiagramOffer = useCallback(async (message) => {
    if (busyRef.current || !message?.diagramOffer) return
    busyRef.current = true
    dispatch({ type: 'START_LOADING' })
    try {
      await fetchDiagram(message.id, message.diagramOffer)
    } catch (err) {
      console.error('acceptDiagramOffer error:', err)
    } finally {
      busyRef.current = false
      dispatch({ type: 'STOP_LOADING' })
    }
  }, [dispatch, fetchDiagram])

  const declineDiagramOffer = useCallback((message) => {
    if (message?.diagramOffer?.framework) {
      diagramSessionRef.current.declinedFramework = message.diagramOffer.framework
    }
    dispatch({ type: 'SET_MESSAGE_DIAGRAM', payload: { id: message.id, offer: null } })
  }, [dispatch])

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

  return { sendMessage, startDebate, startElaborate, regenerateMessage, startBrainstorm, acceptDiagramOffer, declineDiagramOffer, fetchResolution }
}
