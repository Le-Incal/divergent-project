export function latestVoice(messages, type) {
  const list = messages || []
  for (let i = list.length - 1; i >= 0; i -= 1) {
    if (list[i].type === type) return list[i]
  }
  return null
}

export function voiceKind(message) {
  if (!message || message.isStreaming || !String(message.text || '').trim()) return null
  return message.responseKind === 'clarify' ? 'clarify' : 'answer'
}

export function shouldShowRespondBoth(messages) {
  return (
    voiceKind(latestVoice(messages, 'ethos')) === 'answer' ||
    voiceKind(latestVoice(messages, 'ego')) === 'answer'
  )
}

export function asksForDiagram(text) {
  const value = String(text || '')
  if (/\b(diagrams?|flowcharts?|flow charts?)\b/i.test(value)) return true
  if (/\b(draw|sketch|show)\b[^.]{0,48}\b(map|picture|chart|diagram)\b/i.test(value)) return true
  if (/\bmap (it|this|that)\b/i.test(value)) return true
  return false
}

export function fullWidthMessageIds(messages) {
  const ids = new Set()
  let voice = null
  for (const message of messages || []) {
    if (voice && message.type === 'user' && message.audience === 'both') {
      voice = null
      continue
    }
    if (message.phase === 'brainstorm' && (message.type === 'ethos' || message.type === 'ego')) {
      voice = message.type
      ids.add(message.id)
      continue
    }
    if (!voice || (message.type !== 'ethos' && message.type !== 'ego')) continue
    if (message.type !== voice) {
      voice = null
      continue
    }
    const sharedTurn = (messages || []).some((other) => (
      other.turnId
      && other.turnId === message.turnId
      && other.id !== message.id
      && (other.type === 'ethos' || other.type === 'ego')
    ))
    if (sharedTurn) voice = null
    else ids.add(message.id)
  }
  return ids
}

export function canDebate(messages) {
  return (
    voiceKind(latestVoice(messages, 'ethos')) === 'answer' &&
    voiceKind(latestVoice(messages, 'ego')) === 'answer'
  )
}
