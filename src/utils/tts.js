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

// Prefetch cache: Map<cacheKey, Promise<Blob>>
const ttsCache = new Map()

function getCacheKey(text, voiceId) {
  return `${voiceId}::${stripMarkdownForTTS(text)}`
}

/**
 * Prefetch TTS audio and store in cache. Call this before playTTS for instant playback.
 * @param {string} text - Text to prefetch
 * @param {string} voiceId - ElevenLabs voice ID
 * @returns {Promise<void>}
 */
export async function prefetchTTS(text, voiceId) {
  if (!text?.trim() || !voiceId || voiceId.startsWith('REPLACE_')) {
    return
  }
  const key = getCacheKey(text, voiceId)
  if (ttsCache.has(key)) return

  const fetchPromise = fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: stripMarkdownForTTS(text), voiceId }),
  }).then((res) => {
    if (!res.ok) throw new Error('TTS prefetch failed')
    return res.blob()
  })

  ttsCache.set(key, fetchPromise)

  try {
    await fetchPromise
  } catch {
    ttsCache.delete(key)
  }
}

/**
 * Fetch audio from /api/tts and play. Uses prefetch cache if available.
 * @param {string} text - Text to speak (markdown stripped internally)
 * @param {string} voiceId - ElevenLabs voice ID
 * @returns {Promise<void>}
 */
export async function playTTS(text, voiceId) {
  if (!text?.trim() || !voiceId || voiceId.startsWith('REPLACE_')) {
    throw new Error('TTS not configured')
  }

  const key = getCacheKey(text, voiceId)
  let blob

  if (ttsCache.has(key)) {
    try {
      blob = await ttsCache.get(key)
    } catch {
      ttsCache.delete(key)
    }
  }

  if (!blob) {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: stripMarkdownForTTS(text), voiceId }),
    })
    if (!res.ok) throw new Error('TTS failed')
    blob = await res.blob()
  }

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
