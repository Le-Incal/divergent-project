/**
 * Server-side prompt loader for Divergent.
 * Reads markdown from prompts/ and returns raw text for API injection.
 * Ethos/Ego only (P-1–P-4, ST-1, ST-2). O-2 for resolution.
 */
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROMPTS_DIR = join(__dirname, 'prompts')

const VOICE_FILES = {
  default: { ethos: 'P-1-ethos-default.md', ego: 'P-2-ego-default.md' },
  sandpit: { ethos: 'P-3-ethos-sandpit.md', ego: 'P-4-ego-sandpit.md' },
}
const TRANSITION_FILES = { ethos: 'ST-1-ethos-chosen.md', ego: 'ST-2-ego-chosen.md' }

let voiceCache = {}
let transitionCache = {}
let resolutionCache = null

async function readPrompt(relativePath) {
  const fullPath = join(PROMPTS_DIR, relativePath)
  return readFile(fullPath, 'utf-8')
}

/**
 * Get full system prompt for a voice. Optionally append state transition (ST-1 or ST-2).
 * @param {'ethos'|'ego'} voice
 * @param {'default'|'sandpit'} mode
 * @param {null|'ethos'|'ego'} appendTransition - if set, append the chosen-voice transition for that voice
 * @returns {Promise<string>}
 */
export async function getVoicePrompt(voice, mode, appendTransition = null) {
  const file = VOICE_FILES[mode]?.[voice]
  if (!file) return ''
  const cacheKey = `${voice}-${mode}-${appendTransition || 'none'}`
  if (voiceCache[cacheKey]) return voiceCache[cacheKey]
  let text = await readPrompt(join('voices', file))
  if (appendTransition && appendTransition === voice) {
    const stFile = TRANSITION_FILES[voice]
    const stText = await getTransitionPrompt(voice)
    text = text + '\n\n' + stText
  }
  voiceCache[cacheKey] = text
  return text
}

/**
 * Get transition block only (ST-1 or ST-2). Used to append to base prompt.
 * @param {'ethos'|'ego'} voice
 * @returns {Promise<string>}
 */
export async function getTransitionPrompt(voice) {
  const file = TRANSITION_FILES[voice]
  if (!file) return ''
  if (transitionCache[voice]) return transitionCache[voice]
  const text = await readPrompt(join('transitions', file))
  transitionCache[voice] = text
  return text
}

/**
 * Get O-2 Resolution Synthesizer system prompt (for generating neutral summary).
 * @returns {Promise<string>}
 */
export async function getResolutionPrompt() {
  if (resolutionCache) return resolutionCache
  resolutionCache = await readPrompt(join('orchestration', 'O-2-resolution-synthesizer.md'))
  return resolutionCache
}

/**
 * Resolve system prompt for a chat request. Uses file-based prompts for Ethos/Ego when voice + mode provided; otherwise returns null (caller should use body.systemPrompt).
 * @param {{ voice?: 'ethos'|'ego', mode?: 'default'|'sandpit', appendTransition?: null|'ethos'|'ego' }} opts
 * @returns {Promise<string|null>}
 */
export async function resolveSystemPrompt(opts) {
  const { voice, mode, appendTransition } = opts || {}
  if (!voice || !mode) return null
  return getVoicePrompt(voice, mode, appendTransition || null)
}
