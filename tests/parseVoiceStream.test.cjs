let parseVoiceStream

beforeAll(async () => {
  ;({ parseVoiceStream } = await import('../src/utils/parseVoiceStream.js'))
})

const leaked = '` emit_structure_hints({ "center": "?", "visible_layer": "Start a business", "pattern_layer": "Recurring pull toward building something", "belief_layer": "?" }) `'

test('a tool call written into the reply is removed', () => {
  const raw = `MODE:answer\nStart with one person who will pay.\n\n${leaked}`
  const parsed = parseVoiceStream(raw, { complete: true })
  expect(parsed.responseKind).toBe('answer')
  expect(parsed.text).toBe('Start with one person who will pay.')
  expect(parsed.text).not.toMatch(/emit_/)
})

test('an unfinished tool call does not flash while the reply is still streaming', () => {
  const raw = 'MODE:answer\nStart with one person.\nemit_structure_hints({ "center": "?"'
  const parsed = parseVoiceStream(raw, { complete: false })
  expect(parsed.text).toBe('Start with one person.')
})

test('a bracket-and-arrow chain is removed from the reply', () => {
  const chain = '[Idea / "start a business"] ↓ [Pattern: wanting to build something] ↓ [Mental model: ?] ↓ [Belief: ?] ↓ [Root: ?]'
  const raw = `MODE:answer\nThe pull is toward building.\n\n${chain}\n\nName one person who would pay.`
  const parsed = parseVoiceStream(raw, { complete: true })
  expect(parsed.text).toBe('The pull is toward building.\n\nName one person who would pay.')
  expect(parsed.text).not.toMatch(/↓|\[Root/)
})

test('a pipe drawing of the builder portrait is not shown as text', () => {
  const art = [
    '┌─────────────────────────────────────────────────────┐',
    '│ PURPOSE ──────────────────────► PEOPLE │',
    '│ What problem Who is this │',
    '│ ▼ ▼ │',
    '│ PRINCIPLE ◄────────────────── TEN-YEAR TEST │',
    '│ ▼ (all four walls standing) │',
    '│ THE BUILDERS PORTRAIT │',
    '│ (the foundation everything else is built on) │',
    '└─────────────────────────────────────────────────────┘',
  ].join('\n')
  const raw = `MODE:answer\nHere is the map.\n\n${art}\n\n**How they connect:** Purpose tells you what to solve.`
  const parsed = parseVoiceStream(raw, { complete: true })
  expect(parsed.text).toBe('Here is the map.\n\n**How they connect:** Purpose tells you what to solve.')
  expect(parsed.text).not.toMatch(/[│─┌└►▼]/)
})

test('ordinary replies stay intact', () => {
  const raw = 'MODE:answer\nThe center of this is still unknown.'
  expect(parseVoiceStream(raw, { complete: true }).text).toBe('The center of this is still unknown.')
})

test('a markdown table is kept', () => {
  const table = '| Voice | Direction |\n|---|---|\n| Ethos | Converges |'
  const raw = `MODE:answer\n${table}`
  expect(parseVoiceStream(raw, { complete: true }).text).toBe(table)
})

test('a sentence with an arrow is kept', () => {
  const raw = 'MODE:answer\nWe go from purpose → people, then stop.'
  expect(parseVoiceStream(raw, { complete: true }).text).toBe('We go from purpose → people, then stop.')
})

test('a box drawing inside a plain fence is not shown', () => {
  const fenced = 'MODE:answer\nIntro\n```\n┌──┐\n│A │──▶ B\n└──┘\n```\nOutro'
  const parsed = parseVoiceStream(fenced, { complete: true })
  expect(parsed.text).toBe('Intro\nOutro')
  expect(parsed.text).not.toMatch(/[┌│▶]/)
})
