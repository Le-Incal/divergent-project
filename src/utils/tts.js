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

// Module-level cache: "text|voiceId" → Promise<Blob>
const _prefetchCache = new Map()

function cacheKey(text, voiceId) {
  return `${stripMarkdownForTTS(text)}|${voiceId}`
}

/**
 * Pre-fetch TTS audio so it's ready to play instantly later.
 * Safe to call multiple times — deduplicates by text+voiceId.
 */
export function prefetchTTS(text, voiceId) {
  if (!text?.trim() || !voiceId || voiceId.startsWith('REPLACE_')) return
  const key = cacheKey(text, voiceId)
  if (_prefetchCache.has(key)) return
  const promise = fetch('/api/tts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: stripMarkdownForTTS(text), voiceId }),
  }).then((res) => {
    if (!res.ok) throw new Error('TTS prefetch failed')
    return res.blob()
  }).catch((err) => {
    _prefetchCache.delete(key) // allow retry on failure
    throw err
  })
  _prefetchCache.set(key, promise)
}

/**
 * Fetch audio from /api/tts and play. Uses prefetch cache when available.
 * @param {string} text - Text to speak (markdown stripped internally)
 * @param {string} voiceId - ElevenLabs voice ID
 * @returns {Promise<void>}
 */
export async function playTTS(text, voiceId) {
  if (!text?.trim() || !voiceId || voiceId.startsWith('REPLACE_')) {
    throw new Error('TTS not configured')
  }
  const key = cacheKey(text, voiceId)
  let blob
  if (_prefetchCache.has(key)) {
    blob = await _prefetchCache.get(key)
    _prefetchCache.delete(key) // one-shot: free memory after use
  } else {
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
