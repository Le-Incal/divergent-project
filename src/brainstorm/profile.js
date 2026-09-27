import { itemsFor } from './items.js'
import { scoreProfile } from './score.js'

const KEY = 'divergent-brainstorm-profile-v1'
const FRESH_MS = 90 * 24 * 60 * 60 * 1000

export function loadProfile() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || 'null')
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function saveProfile(profile) {
  const next = { ...profile, updatedAt: Date.now() }
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function notMeCount(profile) {
  return Object.values(profile?.corrections || {}).filter((value) => value === 'not_me').length
}

export function profileReady(profile) {
  if (!profile?.scores) return false
  if (profile.version !== 'short' && profile.version !== 'deep') return false
  const answers = profile.answers || {}
  return itemsFor(profile.version)
    .filter((item) => !item.optional)
    .every((item) => {
      const value = answers[item.id]
      return value != null && value !== ''
    })
}

export function isFreshProfile(profile, now = Date.now()) {
  if (!profile?.updatedAt || !profile.scores) return false
  if (now - profile.updatedAt > FRESH_MS) return false
  return notMeCount(profile) < 3
}

export function scoreAnswers(answers, knownTypes = {}) {
  return scoreProfile(answers, knownTypes)
}

export const PROFILE_LABELS = {
  short: 'Short profile · 2 min',
  deep: 'Deep profile · 10 min',
}

export function guessProblemType(text) {
  const value = String(text || '').toLowerCase()
  if (/\b(manager|coworker|boss|partner|team|colleague|relationship)\b/.test(value)) return 'person'
  if (/\b(idea|invent|product|concept)\b/.test(value)) return 'idea'
  if (/\b(should i|choose|offer|decide|or)\b/.test(value)) return 'decision'
  if (/\b(experiment|prototype|try)\b/.test(value)) return 'experiment'
  if (/\b(strategy|market|company|future)\b/.test(value)) return 'big_picture'
  if (/\b(process|workflow|habit|routine)\b/.test(value)) return 'process'
  if (/\b(who i am|myself)\b/.test(value)) return 'ourselves'
  return 'problem'
}

export function affinityNudge(label) {
  if (label === 'ego_leaning') return 'Ego is a natural fit. Ethos would start with what we have been avoiding.'
  if (label === 'ethos_leaning') return 'Ethos is a natural fit. Ego would start with the one move that changes everything.'
  return 'Either voice can take this. Pick the one you want in the room.'
}
