/**
 * Strip markdown for TTS (bold/italic).
 */
function stripForTTS(text) {
  if (!text || typeof text !== 'string') return ''
  return text.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\*(.+?)\*/g, '$1').trim()
}

/**
 * Fetch TTS audio from /api/tts.
 */
async function fetchTTS(text, voiceId) {
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: stripForTTS(text), voiceId }),
  })
  if (!res.ok) throw new Error('TTS failed')
  return res.blob()
}

/**
 * Play debate: both Voice A and Voice B with the given mode.
 * @param {string} voiceAText
 * @param {string} voiceBText
 * @param {string} voiceAId - ElevenLabs voice ID for A
 * @param {string} voiceBId - ElevenLabs voice ID for B
 * @param {'turn-taking'|'overlap'|'both-at-once'} mode
 */
export async function playDebateAudio(voiceAText, voiceBText, voiceAId, voiceBId, mode) {
  const hasA = voiceAText && voiceAId
  const hasB = voiceBText && voiceBId

  if (!hasA && !hasB) return
  if (hasA && !hasB) {
    const blob = await fetchTTS(voiceAText, voiceAId)
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    await audio.play()
    return
  }
  if (!hasA && hasB) {
    const blob = await fetchTTS(voiceBText, voiceBId)
    const url = URL.createObjectURL(blob)
    const audio = new Audio(url)
    audio.onended = () => URL.revokeObjectURL(url)
    await audio.play()
    return
  }

  const [blobA, blobB] = await Promise.all([
    fetchTTS(voiceAText, voiceAId),
    fetchTTS(voiceBText, voiceBId),
  ])
  const urlA = URL.createObjectURL(blobA)
  const urlB = URL.createObjectURL(blobB)
  const audioA = new Audio(urlA)
  const audioB = new Audio(urlB)

  const cleanup = () => {
    URL.revokeObjectURL(urlA)
    URL.revokeObjectURL(urlB)
  }

  if (mode === 'turn-taking') {
    audioA.onended = () => {
      audioB.onended = cleanup
      audioB.play().catch(cleanup)
    }
    audioA.onerror = cleanup
    audioB.onerror = cleanup
    await audioA.play()
    return
  }

  if (mode === 'both-at-once') {
    audioA.onended = () => URL.revokeObjectURL(urlA)
    audioB.onended = () => URL.revokeObjectURL(urlB)
    audioA.onerror = cleanup
    audioB.onerror = cleanup
    await Promise.all([audioA.play(), audioB.play()])
    return
  }

  if (mode === 'overlap') {
    audioA.onended = cleanup
    audioB.onended = cleanup
    audioA.onerror = cleanup
    audioB.onerror = cleanup
    await audioA.play()
    const overlapMs = 2500
    setTimeout(() => {
      audioB.play().catch(cleanup)
    }, overlapMs)
    return
  }

  cleanup()
}
