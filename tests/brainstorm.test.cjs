let scoreBigFive
let mbtiStyle
let mbtiMismatches
let scoreEnneagram
let intuitiveAnalytical
let maximizerScore
let conflictStyle
let riskTolerance
let valueWeights
let stateFlags
let affinity
let SHORT_ITEMS
let LONG_ITEMS
let routeBrainstorm
let dissentAllowed
let ethosFrameworks
let egoFrameworks

beforeAll(async () => {
  const score = await import('../src/brainstorm/score.js')
  const items = await import('../src/brainstorm/items.js')
  const routing = await import('../src/brainstorm/routing.js')
  scoreBigFive = score.scoreBigFive
  mbtiStyle = score.mbtiStyle
  mbtiMismatches = score.mbtiMismatches
  scoreEnneagram = score.scoreEnneagram
  intuitiveAnalytical = score.intuitiveAnalytical
  maximizerScore = score.maximizerScore
  conflictStyle = score.conflictStyle
  riskTolerance = score.riskTolerance
  valueWeights = score.valueWeights
  stateFlags = score.stateFlags
  affinity = score.affinity
  SHORT_ITEMS = items.SHORT_ITEMS
  LONG_ITEMS = items.LONG_ITEMS
  routeBrainstorm = routing.routeBrainstorm
  dissentAllowed = routing.dissentAllowed
  ethosFrameworks = routing.ethosFrameworks
  egoFrameworks = routing.egoFrameworks
})

const BF1 = { B1: 7, B6: 1, B2: 4, B7: 4, B3: 6, B8: 3, B4: 2, B9: 6, B5: 5, B10: 5 }

describe('brainstorm item bank', () => {
  test('short profile has 17 items and deep profile has 78, with every short item inside the deep one', () => {
    expect(SHORT_ITEMS).toHaveLength(17)
    expect(LONG_ITEMS).toHaveLength(78)
    expect(LONG_ITEMS.length - SHORT_ITEMS.length).toBe(61)
    const longIds = new Set(LONG_ITEMS.map((item) => item.id))
    SHORT_ITEMS.forEach((item) => expect(longIds.has(item.id)).toBe(true))
  })

  test('each short Big Five trait has one positive and one reversed item', () => {
    const pairs = {
      E: ['B1', 'B6'],
      A: ['B7', 'B2'],
      C: ['B3', 'B8'],
      N: ['B4', 'B9'],
      O: ['B5', 'B10'],
    }
    Object.entries(pairs).forEach(([trait, [positive, reversed]]) => {
      const pos = SHORT_ITEMS.find((item) => item.id === positive)
      const rev = SHORT_ITEMS.find((item) => item.id === reversed)
      expect(pos.trait).toBe(trait)
      expect(pos.direction).toBe(1)
      expect(rev.trait).toBe(trait)
      expect(rev.direction).toBe(-1)
    })
  })
})

describe('brainstorm scoring', () => {
  test('BF-1 short Big Five and style', () => {
    const { bigFive, bands } = scoreBigFive(BF1)
    expect(bigFive).toEqual({ E: 100, A: 50, C: 75, N: 16.67, O: 50 })
    expect(bands).toEqual({ E: 'high', A: 'middle', C: 'high', N: 'low', O: 'middle' })
    expect(mbtiStyle(bigFive)).toBe('E(N/S)(F/T)J')
  })

  test('BF-2 known type keeps the user letter and flags only a real mismatch', () => {
    const { bigFive } = scoreBigFive(BF1)
    const style = mbtiStyle(bigFive)
    expect(mbtiMismatches(style, 'INTJ')).toEqual(['E/I'])
  })

  test('BF-3 high agreeableness', () => {
    const { bigFive } = scoreBigFive({ B2: 2, B7: 6 })
    expect(bigFive.A).toBe(83.33)
  })

  test('EN-1 enneagram core, candidates, and wing', () => {
    const result = scoreEnneagram({
      E1: 3, E10: 2, E2: 2, E11: 2, E3: 4, E12: 5, E4: 3, E13: 3,
      E5: 4, E14: 3, E6: 2, E15: 3, E7: 4, E16: 4, E8: 5, E17: 5, E9: 1, E18: 2,
    })
    expect(result.scores).toEqual({ 1: 5, 2: 4, 3: 9, 4: 6, 5: 7, 6: 5, 7: 8, 8: 10, 9: 3 })
    expect(result.core).toBe(8)
    expect(result.candidates).toEqual([8, 3])
    expect(result.wing).toBe(7)
    expect(result.display).toBe('8w7')
  })

  test('thinking, conflict, risk, values, and state', () => {
    expect(intuitiveAnalytical({ R1: 6, R2: 3 })).toBe(3)
    expect(maximizerScore({ R5: 6, R6: 5, R7: 2 })).toBe(5.67)
    expect(conflictStyle({ K1: 6, K2: 4, K3: 3, K4: 2, K5: 5 })).toMatchObject({
      conflictDefault: 'competing',
      conflictBackup: 'accommodating',
    })
    expect(conflictStyle({ K1: 6, K2: 6, K3: 1, K4: 1, K5: 1 }).conflictDefault).toEqual(['competing', 'collaborating'])
    expect(riskTolerance({ K6: 6, K7: 6 })).toBe(6)
    expect(valueWeights(['Achievement', 'Independence', 'Influence', 'Caring for my people', 'Security'])).toMatchObject({
      Achievement: 5,
      Independence: 4,
      Influence: 3,
      'Caring for my people': 2,
      Security: 1,
      Enjoyment: 0,
    })
    expect(stateFlags({ S1: 5, S2: 1 }).flooded).toBe(true)
    expect(stateFlags({ S1: 4, S2: 4 }).flooded).toBe(true)
    expect(stateFlags({ S1: 2, S2: 2 })).toMatchObject({ calm: true, flooded: false })
    expect(stateFlags({ S1: 3, S2: 2 })).toMatchObject({ flooded: false, calm: false })
    expect(stateFlags({ S1: 1, S2: 1, S3: 'Today' }).urgent).toBe(true)
  })

  test('affinity vectors', () => {
    const values = valueWeights(['Achievement', 'Independence', 'Influence', 'Caring for my people', 'Security'])
    expect(affinity({
      enneagram: { core: 8, candidates: [8] },
      bigFive: { A: 25 },
      riskTolerance: 6,
      conflictDefault: 'competing',
      values,
    })).toEqual({ score: 75, label: 'ego_leaning' })
    expect(affinity({ bigFive: { A: 50 } })).toEqual({ score: null, label: null })
    expect(affinity({
      knownTypes: { enneagram: 2 },
      bigFive: { A: 83.33 },
    })).toEqual({ score: -83, label: 'ethos_leaning' })
    expect(affinity({
      enneagram: { candidates: [8, 2] },
      bigFive: { A: 50 },
    })).toEqual({ score: 0, label: 'balanced' })
  })
})

describe('brainstorm routing', () => {
  test('RT-1 flooded locks default mode and starts with Name It to Tame It', () => {
    const route = routeBrainstorm({
      profile: { flags: { flooded: true }, bands: {} },
      problemType: 'decision',
      voice: 'ego',
      requestedMode: 'sandpit',
    })
    expect(route.primaryNeed).toBe('N1')
    expect(route.framework).toBe('Name It to Tame It')
    expect(route.effectiveMode).toBe('default')
  })

  test('RT-2 and RT-3 urgent picks the voice-specific fast tool', () => {
    expect(routeBrainstorm({ profile: { flags: { urgent: true } }, problemType: 'decision', voice: 'ethos' }).framework)
      .toBe('One-Way vs. Two-Way Doors')
    expect(routeBrainstorm({ profile: { flags: { urgent: true } }, problemType: 'decision', voice: 'ego' }).framework)
      .toBe('OODA Loop')
  })

  test('RT-4 and RT-5 maximizer on a decision', () => {
    const profile = { flags: {}, maximizer: 5.67, bands: {} }
    expect(routeBrainstorm({ profile, problemType: 'decision', voice: 'ethos' }).framework).toBe('10/10/10')
    expect(routeBrainstorm({ profile, problemType: 'decision', voice: 'ego' }).framework).toBe('One-Way vs. Two-Way Doors')
  })

  test('RT-6 high agreeableness on a person problem keeps the reactivity add-on', () => {
    const route = routeBrainstorm({
      profile: { flags: {}, bands: { A: 'high', N: 'high' } },
      problemType: 'person',
      voice: 'ethos',
    })
    expect(route.primaryNeed).toBe('N4')
    expect(route.framework).toBe('Radical Candor')
    expect(route.addOnNeed).toBe('N3')
    expect(route.addOnFramework).toBe('CBT ABC Model')
  })

  test('RT-7 a Not me correction suppresses that signal', () => {
    const route = routeBrainstorm({
      profile: { flags: {}, bands: { A: 'high' } },
      problemType: 'person',
      voice: 'ethos',
      suppressedSignals: ['N4'],
    })
    expect(route.framework).not.toBe('Radical Candor')
  })

  test('RT-8 flooded and urgent runs the short regulate step, then the fast tool', () => {
    const route = routeBrainstorm({
      profile: { flags: { flooded: true, urgent: true } },
      problemType: 'decision',
      voice: 'ego',
    })
    expect(route.primaryNeed).toBe('N1')
    expect(route.compressed).toBe(true)
    expect(route.thenNeed).toBe('N2')
    expect(route.thenFramework).toBe('OODA Loop')
  })

  test('RT-9 idea with no signals falls back to TRIZ for Ego', () => {
    const route = routeBrainstorm({
      profile: { flags: {}, bands: {} },
      problemType: 'idea',
      voice: 'ego',
    })
    expect(route.framework).toBe('TRIZ')
  })

  test('routed names exist in that voice kit', () => {
    const ethosNames = new Set(ethosFrameworks.map((item) => item.name))
    const egoNames = new Set(egoFrameworks.map((item) => item.name))
    expect(ethosNames.has('Radical Candor')).toBe(true)
    expect(egoNames.has('OODA Loop')).toBe(true)
    expect(ethosFrameworks).toHaveLength(44)
    expect(egoFrameworks).toHaveLength(38)
  })

  test('gentle calibration keeps the challenge framework', () => {
    const route = routeBrainstorm({
      profile: { flags: {}, bands: { C: 'low' }, calibration: { gentle: true, supportedFirst: true } },
      problemType: 'decision',
      voice: 'ethos',
    })
    expect(route.framework).toBe('Eisenhower Matrix')
    expect(route.acknowledgment).toBe(true)
  })

  test('a session allows at most two dissent lines', () => {
    expect(dissentAllowed(0)).toBe(true)
    expect(dissentAllowed(1)).toBe(true)
    expect(dissentAllowed(2)).toBe(false)
  })
})
