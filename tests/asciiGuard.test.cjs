let countBoxChars
let sanitizeAsciiDiagrams
let isPortraitDiagram

beforeAll(async () => {
  ;({ countBoxChars, sanitizeAsciiDiagrams } = await import('../src/diagram/asciiGuard.js'))
  ;({ isPortraitDiagram } = await import('../src/diagram/portrait.js'))
})

const broken = `Here's how the four walls fit together.

┌──────────────────────────────────────────┐
│  PURPOSE ──────────────▶ PEOPLE          │
│  What problem is        Who is this      │
│  yours to solve?        for, specifically?│
│      ▼                       ▼           │
│  PRINCIPLE ◀─────────── TEN-YEAR TEST     │
│                 ▼                        │
│        THE BUILDERS PORTRAIT             │
└──────────────────────────────────────────┘

Start with purpose.`

test('a box drawing is removed and the sentences around it stay', () => {
  const { text, removed } = sanitizeAsciiDiagrams(broken, '')
  expect(removed).toBe(1)
  expect(text).toContain("Here's how the four walls fit together.")
  expect(text).toContain('Start with purpose.')
  expect(text).not.toMatch(/[┌│─▶]/)
  expect(isPortraitDiagram(broken)).toBe(true)
})

test('a diagram collapsed onto one line is detected', () => {
  const line = '| | | PURPOSE ────────────▶ PEOPLE | | PRINCIPLE ◀──────── TEN-YEAR TEST | THE BUILDERS PORTRAIT |'
  const { removed } = sanitizeAsciiDiagrams(line, '')
  expect(removed).toBe(1)
  expect(countBoxChars('A → B')).toBe(0)
  expect(countBoxChars('──▶')).toBe(3)
})

test('markdown tables and mermaid fences stay', () => {
  const table = '| Voice | Direction |\n|---|---|\n| Ethos | Converges |'
  expect(sanitizeAsciiDiagrams(table, '').text).toBe(table)
  const mermaid = '```mermaid\nflowchart TD\n  A --> B\n```'
  expect(sanitizeAsciiDiagrams(mermaid, '').text).toBe(mermaid)
  expect(sanitizeAsciiDiagrams('We go from A → B and then ▶ next.', '').removed).toBe(0)
})
