let asksForDiagram
let fullWidthMessageIds
let brainstormVoice
let voicesForReply
let profileReady
let itemsFor

beforeAll(async () => {
  ;({ asksForDiagram, fullWidthMessageIds, brainstormVoice, voicesForReply } = await import('../src/utils/conversationView.js'))
  ;({ profileReady } = await import('../src/brainstorm/profile.js'))
  ;({ itemsFor } = await import('../src/brainstorm/items.js'))
})

test('a request for a diagram is recognized', () => {
  expect(asksForDiagram('Can you draw a diagram of the steps?')).toBe(true)
  expect(asksForDiagram('Please map this.')).toBe(true)
  expect(asksForDiagram('I want to start a business.')).toBe(false)
})

test('a finished profile skips the test and a partial one does not', () => {
  const answers = {}
  itemsFor('short').filter((item) => !item.optional).forEach((item) => {
    answers[item.id] = item.kind === 'scale' ? 3 : 'Today'
  })
  expect(profileReady({ version: 'short', scores: { flags: {} }, answers })).toBe(true)
  expect(profileReady({ version: 'short', scores: { flags: {} }, answers: { S1: 2, S2: 2, S3: 'Today' } })).toBe(false)
  expect(profileReady(null)).toBe(false)
})

test('a brainstorm voice fills the page until the user responds to both', () => {
  const messages = [
    { id: 'u1', type: 'user', audience: 'both', text: 'Start' },
    { id: 'b1', type: 'ethos', phase: 'brainstorm', text: 'What should we collect?' },
    { id: 'u2', type: 'user', audience: 'ethos', text: 'More detail' },
    { id: 'b2', type: 'ethos', phase: 'advice', turnId: 't2', text: 'One more question' },
    { id: 'u3', type: 'user', audience: 'both', text: 'Both of you' },
    { id: 'e3', type: 'ethos', phase: 'advice', turnId: 't3', text: 'Ethos' },
    { id: 'g3', type: 'ego', phase: 'advice', turnId: 't3', text: 'Ego' },
  ]
  const wide = fullWidthMessageIds(messages)
  expect(wide.has('b1')).toBe(true)
  expect(wide.has('b2')).toBe(true)
  expect(wide.has('e3')).toBe(false)
  expect(wide.has('g3')).toBe(false)
})

test('a brainstorm stays with the chosen voice until the user responds to both', () => {
  const during = [
    { id: 'u1', type: 'user', audience: 'both', text: 'Start' },
    { id: 'b1', type: 'ego', phase: 'brainstorm', text: 'What should we collect?' },
  ]
  expect(brainstormVoice(during)).toBe('ego')
  expect(voicesForReply(during, { target: 'ego' })).toEqual(['ego'])
  expect(voicesForReply(during, { target: 'both' })).toEqual(['ego'])
  expect(voicesForReply(during, { target: 'ethos' })).toEqual(['ego'])
  expect(voicesForReply(during, { target: 'both', endBrainstorm: true })).toEqual(['ethos', 'ego'])
  expect(voicesForReply([], { target: 'both' })).toEqual(['ethos', 'ego'])
  expect(voicesForReply([], { target: 'ethos' })).toEqual(['ethos'])
})
