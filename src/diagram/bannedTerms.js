import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const STOP = new Set(['The', 'Art', 'War', 'And', 'For', 'From', 'With'])

let cached = null

function termsFromEngine(text) {
  const terms = new Set()
  for (const line of text.split('\n')) {
    const match = line.match(/^-\s+\*\*Engine:\*\*\s*(.*)$/)
    if (!match) continue
    const body = match[1].replace(/\*[^*]+\*/g, ' ').replace(/\([^)]*\)/g, ' ')
    for (const part of body.split(/,| and /i)) {
      const words = part
        .replace(/[^\p{L}\s'-]/gu, ' ')
        .trim()
        .split(/\s+/)
        .filter((word) => /^[\p{Lu}]/u.test(word) && word.length > 2 && !STOP.has(word))
      if (words.length >= 2) terms.add(words.join(' '))
      for (const word of words) {
        if (word.length >= 5) terms.add(word)
      }
    }
  }
  return terms
}

export function loadBannedTerms() {
  if (cached) return cached
  const terms = new Set()
  try {
    const root = join(dirname(fileURLToPath(import.meta.url)), '../../docs/brainstorm')
    for (const file of ['ethos-problem-solving-frameworks.md', 'ego-problem-solving-frameworks.md']) {
      const text = readFileSync(join(root, file), 'utf8')
      for (const term of termsFromEngine(text)) terms.add(term)
    }
  } catch {
    cached = terms
    return terms
  }
  cached = terms
  return terms
}

export function labelHasBannedTerm(label, terms = loadBannedTerms()) {
  return [...terms].some((term) => {
    const pattern = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
    return pattern.test(label)
  })
}
