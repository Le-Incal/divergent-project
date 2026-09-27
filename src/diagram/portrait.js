import { asciiLineRanges, sanitizeAsciiDiagrams } from './asciiGuard.js'

function isPortraitBlock(text) {
  const raw = String(text || '')
  return /builders?\s+portrait/i.test(raw)
    && /ten-year/i.test(raw)
    && /purpose/i.test(raw)
    && /people/i.test(raw)
    && /principle/i.test(raw)
}

export function isPortraitDiagram(text) {
  const raw = String(text || '')
  const lines = raw.split('\n')
  return asciiLineRanges(raw).some((range) => isPortraitBlock(lines.slice(range.start, range.end + 1).join('\n')))
}

export function withoutPortraitArt(text) {
  return sanitizeAsciiDiagrams(text, '').text
}

export function splitPortrait(text) {
  const raw = String(text || '')
  const lines = raw.split('\n')
  const block = asciiLineRanges(raw).find((range) => isPortraitBlock(lines.slice(range.start, range.end + 1).join('\n')))
  if (!block) return null
  return {
    before: lines.slice(0, block.start).join('\n'),
    after: lines.slice(block.end + 1).join('\n'),
  }
}
