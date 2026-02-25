/**
 * Strip markdown for TTS (bold/italic/code).
 */
export function stripMarkdownForTTS(text) {
  if (!text || typeof text !== 'string') return ''
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .trim()
}

/**
 * Fetch audio from /api/tts and play. Returns a promise that resolves when playback ends or rejects on error.
 * @param {string} text - Text to speak (markdown stripped internally)
 * @param {string} voiceId - ElevenLabs voice ID
 * @returns {Promise<void>}
 */
export async function playTTS(text, voiceId) {
  if (!text?.trim() || !voiceId || voiceId.startsWith('REPLACE_')) {
    throw new Error('TTS not configured')
  }
  const res = await fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: stripMarkdownForTTS(text), voiceId }),
  })
  if (!res.ok) throw new Error('TTS failed')
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  return new Promise((resolve, reject) => {
    const audio = new Audio(url)
    audio.onended = () => {
      URL.revokeObjectURL(url)
      resolve()
    }
    audio.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Playback failed'))
    }
    audio.play().catch(reject)
  })
}
