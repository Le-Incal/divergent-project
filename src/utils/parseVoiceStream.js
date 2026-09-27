import { sanitizeAsciiDiagrams } from '../diagram/asciiGuard.js'

const TOOL_NAMES = ['emit_structure_hints', 'emit_diagram']

function compact(value) {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, '')
}

function stripToolCalls(source, { complete = false } = {}) {
  let text = String(source || '')
  const call = /emit_(?:structure_hints|diagram)\s*\(/gi
  let out = ''
  let cursor = 0
  let match = call.exec(text)
  while (match) {
    out += text.slice(cursor, match.index)
    let depth = 1
    let i = match.index + match[0].length
    let closed = false
    while (i < text.length) {
      const ch = text[i]
      if (ch === '(' || ch === '{' || ch === '[') depth += 1
      else if (ch === ')' || ch === '}' || ch === ']') {
        depth -= 1
        if (depth === 0) {
          closed = true
          i += 1
          break
        }
      }
      i += 1
    }
    if (!closed && !complete) return tidy(out.replace(/\s+$/, ''), false)
    cursor = closed ? i : text.length
    call.lastIndex = cursor
    match = call.exec(text)
  }
  out += text.slice(cursor)
  if (!complete) {
    const tail = out.toLowerCase()
    const hold = TOOL_NAMES.reduce((cut, name) => {
      for (let size = Math.min(name.length, tail.length); size >= 4; size -= 1) {
        if (tail.endsWith(name.slice(0, size))) return out.length - size
      }
      return cut
    }, out.length)
    out = out.slice(0, hold)
  }
  return tidy(out, complete)
}

const LAYER_CHAIN = /\[(?:[^\]\n]){0,160}\](?:\s*(?:↓|->|→|=>)\s*\[(?:[^\]\n]){0,160}\])+/g

function stripDiagramNotation(source, { complete = false } = {}) {
  let text = String(source || '').replace(LAYER_CHAIN, '')
  if (!complete) {
    const partial = text.match(/\n?\s*\[[^\]\n]{0,160}(?:\]\s*(?:↓|->|→|=>)\s*(?:\[[^\]\n]{0,160})?)?$/)
    if (partial && /↓|->|→|=>/.test(partial[0])) {
      text = text.slice(0, partial.index)
    }
  }
  return text.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n')
}

function tidy(text, complete) {
  const cleaned = text
    .replace(/```[a-z]*\s*```/gi, '')
    .replace(/^[ \t]*`+[ \t]*$/gm, '')
    .replace(/`+\s*`+/g, '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
  return complete ? cleaned.trim() : cleaned.replace(/[ \t]+$/g, '')
}

function kindFromMarker(head) {
  if (head === 'mode:clarify') return 'clarify'
  if (head === 'mode:answer') return 'answer'
  return null
}

/**
 * Strip a leading MODE:clarify / MODE:answer line from a streamed voice reply.
 * Until that first line is unambiguous, visible text stays empty so the marker never flashes.
 */
export function parseVoiceStream(raw, { complete = false } = {}) {
  const source = String(raw || '')
  const newlineAt = source.indexOf('\n')

  if (newlineAt === -1) {
    const head = compact(source)
    const kind = kindFromMarker(head)
    const pendingMarker =
      head === '' ||
      (!kind && ('mode:clarify'.startsWith(head) || 'mode:answer'.startsWith(head)))

    if (!complete && pendingMarker) {
      return { responseKind: null, text: '' }
    }
    if (kind) return { responseKind: kind, text: '' }
    return { responseKind: source.trim() ? 'answer' : null, text: visibleText(source, { complete }) }
  }

  const first = compact(source.slice(0, newlineAt).replace(/^`+|`+$/g, ''))
  const rest = source.slice(newlineAt + 1).replace(/^\n/, '')
  const kind = kindFromMarker(first)
  if (kind) return { responseKind: kind, text: visibleText(rest, { complete }) }
  return { responseKind: 'answer', text: visibleText(source, { complete }) }
}

function visibleText(source, options) {
  const stripped = stripDiagramNotation(stripToolCalls(sanitizeAsciiDiagrams(source, '').text, options), options)
  return options.complete ? stripped.trim() : stripped.replace(/[ \t]+$/g, '')
}
