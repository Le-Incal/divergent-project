const BOX_CHAR_RE = /[─-▟▲▶►▼◀◄]/g
const FENCE_RE = /^\s*```\s*([\w-]*)\s*$/
const TABLE_SEPARATOR_RE = /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)*\|?\s*$/

export function countBoxChars(line) {
  return (String(line || '').match(BOX_CHAR_RE) || []).length
}

function countPipes(line) {
  return (line.match(/\|/g) || []).length
}

function isDiagramLine(line) {
  const box = countBoxChars(line)
  if (box >= 2) return true
  if (box >= 1 && countPipes(line) >= 2) return true
  return false
}

function tableLineMask(lines) {
  const mask = new Array(lines.length).fill(false)
  for (let i = 0; i < lines.length - 1; i++) {
    const header = lines[i].trim()
    if (header.startsWith('|') && TABLE_SEPARATOR_RE.test(lines[i + 1])) {
      let j = i
      while (j < lines.length && lines[j].trim().startsWith('|')) mask[j++] = true
      i = j - 1
    }
  }
  return mask
}

function findBlocks(lines) {
  const table = tableLineMask(lines)
  const flagged = lines.map((line, index) => !table[index] && isDiagramLine(line))
  const blocks = []
  let i = 0
  while (i < lines.length) {
    if (!flagged[i]) {
      i += 1
      continue
    }
    let end = i
    let j = i + 1
    while (j < lines.length) {
      if (flagged[j]) {
        end = j
        j += 1
      } else if (lines[j].trim() === '' && j + 1 < lines.length && flagged[j + 1]) {
        j += 1
      } else break
    }
    const lineCount = end - i + 1
    if (lineCount >= 2 || countBoxChars(lines[i]) >= 6) blocks.push({ start: i, end })
    i = end + 1
  }
  return blocks
}

function segment(text) {
  const lines = text.split('\n')
  const segs = []
  let buf = []
  let i = 0
  while (i < lines.length) {
    const open = lines[i].match(FENCE_RE)
    if (open) {
      const close = lines.findIndex((line, index) => index > i && /^\s*```\s*$/.test(line))
      if (close !== -1) {
        if (buf.length) segs.push({ kind: 'text', lines: buf })
        buf = []
        segs.push({ kind: 'fence', lang: open[1] || '', lines: lines.slice(i, close + 1) })
        i = close + 1
        continue
      }
    }
    buf.push(lines[i])
    i += 1
  }
  if (buf.length) segs.push({ kind: 'text', lines: buf })
  return segs
}

export function asciiLineRanges(text) {
  const ranges = []
  let line = 0
  for (const seg of segment(String(text || ''))) {
    if (seg.kind === 'fence') {
      const isMermaid = seg.lang.toLowerCase() === 'mermaid'
      if (!isMermaid && findBlocks(seg.lines.slice(1, -1)).length) {
        ranges.push({ start: line, end: line + seg.lines.length - 1 })
      }
      line += seg.lines.length
      continue
    }
    for (const block of findBlocks(seg.lines)) {
      ranges.push({ start: line + block.start, end: line + block.end })
    }
    line += seg.lines.length
  }
  return ranges
}

export function sanitizeAsciiDiagrams(text, replacement = '') {
  const raw = String(text || '')
  let removed = 0
  const out = []
  for (const seg of segment(raw)) {
    if (seg.kind === 'fence') {
      const isMermaid = seg.lang.toLowerCase() === 'mermaid'
      if (!isMermaid && findBlocks(seg.lines.slice(1, -1)).length) {
        removed += 1
        if (replacement) out.push(replacement)
      } else out.push(...seg.lines)
      continue
    }
    const blocks = findBlocks(seg.lines)
    let cursor = 0
    for (const block of blocks) {
      out.push(...seg.lines.slice(cursor, block.start))
      removed += 1
      if (replacement) out.push(replacement)
      cursor = block.end + 1
    }
    out.push(...seg.lines.slice(cursor))
  }
  const cleaned = out.join('\n').replace(/\n{3,}/g, '\n\n')
  return { text: removed ? cleaned : raw, removed }
}
