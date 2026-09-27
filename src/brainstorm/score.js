const TRAITS = {
  E: { positive: ['B1', 'B11', 'B12'], reversed: ['B6', 'B13', 'B14'] },
  A: { positive: ['B7', 'B15', 'B16'], reversed: ['B2', 'B17', 'B18'] },
  C: { positive: ['B3', 'B19', 'B20'], reversed: ['B8', 'B21', 'B22'] },
  N: { positive: ['B4', 'B23', 'B24'], reversed: ['B9', 'B25', 'B26'] },
  O: { positive: ['B5', 'B27', 'B28'], reversed: ['B10', 'B29', 'B30'] },
}

const ENNEAGRAM_ITEMS = {
  1: ['E1', 'E10'],
  2: ['E2', 'E11'],
  3: ['E3', 'E12'],
  4: ['E4', 'E13'],
  5: ['E5', 'E14'],
  6: ['E6', 'E15'],
  7: ['E7', 'E16'],
  8: ['E8', 'E17'],
  9: ['E9', 'E18'],
}

const NEIGHBORS = {
  1: [9, 2],
  2: [1, 3],
  3: [2, 4],
  4: [3, 5],
  5: [4, 6],
  6: [5, 7],
  7: [6, 8],
  8: [7, 9],
  9: [8, 1],
}

const ENNEAGRAM_LEAN = { 1: -1, 2: -1, 3: 1, 4: 0, 5: 0, 6: -1, 7: 1, 8: 1, 9: -1 }

const CONFLICT_MODES = [
  ['K1', 'competing'],
  ['K2', 'collaborating'],
  ['K3', 'compromising'],
  ['K4', 'avoiding'],
  ['K5', 'accommodating'],
]

const EGO_VALUES = ['Achievement', 'Independence', 'Influence', 'Novelty and adventure']
const ETHOS_VALUES = ['Caring for my people', 'Fairness and the wider world', 'Duty and rules', 'Tradition', 'Security']

const VALUES = [
  'Achievement',
  'Caring for my people',
  'Fairness and the wider world',
  'Independence',
  'Novelty and adventure',
  'Enjoyment',
  'Influence',
  'Security',
  'Duty and rules',
  'Tradition',
]

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function band(score) {
  if (score <= 34) return 'low'
  if (score >= 66) return 'high'
  return 'middle'
}

function answered(answers, ids) {
  return ids.filter((id) => answers[id] != null && answers[id] !== '')
}

function traitScore(answers, trait) {
  const spec = TRAITS[trait]
  const ids = answered(answers, [...spec.positive, ...spec.reversed])
  if (!ids.length) return null
  const values = ids.map((id) => (spec.reversed.includes(id) ? 8 - Number(answers[id]) : Number(answers[id])))
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length
  return round2(((mean - 1) / 6) * 100)
}

function scoreBigFive(answers) {
  const bigFive = {}
  const bands = {}
  for (const trait of Object.keys(TRAITS)) {
    const score = traitScore(answers, trait)
    if (score == null) continue
    bigFive[trait] = score
    bands[trait] = band(score)
  }
  return { bigFive, bands }
}

function pairLetter(score, high, low) {
  if (Math.abs(score - 50) <= 8) return `(${high}/${low})`
  return score >= 50 ? high : low
}

function mbtiStyle(bigFive) {
  if (bigFive.E == null || bigFive.O == null || bigFive.A == null || bigFive.C == null) return null
  return [
    pairLetter(bigFive.E, 'E', 'I'),
    pairLetter(bigFive.O, 'N', 'S'),
    pairLetter(bigFive.A, 'F', 'T'),
    pairLetter(bigFive.C, 'J', 'P'),
  ].join('')
}

function mbtiMismatches(style, known) {
  if (!style || !known) return []
  const pairs = [['E', 'I'], ['N', 'S'], ['F', 'T'], ['J', 'P']]
  const flags = []
  let cursor = 0
  pairs.forEach(([high, low], index) => {
    const knownLetter = known[index]
    if (style[cursor] === '(') {
      cursor += 5
      return
    }
    if (knownLetter && knownLetter !== style[cursor]) flags.push(`${high}/${low}`)
    cursor += 1
  })
  return flags
}

function scoreEnneagram(answers, knownType) {
  const scores = {}
  for (const [type, [drive, fear]] of Object.entries(ENNEAGRAM_ITEMS)) {
    if (answers[drive] == null || answers[fear] == null) continue
    scores[type] = Number(answers[drive]) + Number(answers[fear])
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1] || Number(a[0]) - Number(b[0]))
  if (!ranked.length && !knownType) return null
  const core = ranked.length ? Number(ranked[0][0]) : Number(knownType)
  const top = ranked[0]?.[1]
  const candidates = ranked.filter((entry) => top - entry[1] <= 1).map((entry) => Number(entry[0]))
  const neighbors = NEIGHBORS[core] || []
  const neighborScores = neighbors.map((type) => [type, scores[type] ?? -1])
  const bestNeighbor = Math.max(...neighborScores.map((entry) => entry[1]))
  const wings = neighborScores.filter((entry) => entry[1] === bestNeighbor).map((entry) => entry[0])
  const wingLabel = wings.length === 2 ? `${wings[0]}/${wings[1]}` : String(wings[0] ?? '')
  return {
    scores,
    core,
    candidates,
    wing: wings.length === 1 ? wings[0] : wings,
    display: wingLabel ? `${core}w${wingLabel}` : String(core),
    knownType: knownType || null,
  }
}

function intuitiveAnalytical(answers) {
  if (answers.R1 == null || answers.R2 == null) return null
  return Number(answers.R1) - Number(answers.R2)
}

function maximizerScore(answers) {
  if (answers.R5 == null || answers.R6 == null || answers.R7 == null) return null
  return round2((Number(answers.R5) + Number(answers.R6) + (8 - Number(answers.R7))) / 3)
}

function conflictStyle(answers) {
  const scored = CONFLICT_MODES
    .filter(([id]) => answers[id] != null)
    .map(([id, mode]) => ({ mode, value: Number(answers[id]) }))
  if (!scored.length) return null
  const top = Math.max(...scored.map((entry) => entry.value))
  const leaders = scored.filter((entry) => entry.value === top).map((entry) => entry.mode)
  const rest = scored.filter((entry) => entry.value < top).sort((a, b) => b.value - a.value)
  return {
    conflictDefault: leaders.length > 1 ? leaders : leaders[0],
    conflictBackup: rest[0]?.mode || null,
    tied: leaders.length > 1,
  }
}

function riskTolerance(answers) {
  if (answers.K6 == null || answers.K7 == null) return null
  return round2((Number(answers.K6) + Number(answers.K7)) / 2)
}

function valueWeights(ranked) {
  const weights = Object.fromEntries(VALUES.map((value) => [value, 0]))
  ;(ranked || []).slice(0, 5).forEach((value, index) => {
    weights[value] = 5 - index
  })
  return weights
}

function stateFlags(answers) {
  const s1 = Number(answers.S1)
  const s2 = Number(answers.S2)
  const sum = s1 + s2
  return {
    flooded: s1 === 5 || sum >= 8,
    urgent: answers.S3 === 'Today',
    calm: sum <= 4,
  }
}

function affinity(profile) {
  const components = []
  const enneagram = profile.enneagram
  if (enneagram?.candidates?.length) {
    const leans = enneagram.candidates.map((type) => ENNEAGRAM_LEAN[type] ?? 0)
    components.push(leans.reduce((sum, value) => sum + value, 0) / leans.length)
  } else if (enneagram?.core) {
    components.push(ENNEAGRAM_LEAN[enneagram.core] ?? 0)
  } else if (profile.knownTypes?.enneagram) {
    components.push(ENNEAGRAM_LEAN[profile.knownTypes.enneagram] ?? 0)
  }
  if (profile.bigFive?.A != null) components.push((50 - profile.bigFive.A) / 50)
  if (profile.riskTolerance != null) components.push((profile.riskTolerance - 4) / 3)
  const conflict = Array.isArray(profile.conflictDefault) ? profile.conflictDefault[0] : profile.conflictDefault
  if (conflict === 'competing') components.push(1)
  else if (conflict === 'collaborating' || conflict === 'accommodating') components.push(-1)
  else if (conflict === 'compromising' || conflict === 'avoiding') components.push(0)
  if (profile.values) {
    const ego = EGO_VALUES.reduce((sum, value) => sum + (profile.values[value] || 0), 0)
    const ethos = ETHOS_VALUES.reduce((sum, value) => sum + (profile.values[value] || 0), 0)
    components.push((ego - ethos) / 15)
  }
  if (components.length < 2) return { score: null, label: null }
  const score = Math.round(100 * (components.reduce((sum, value) => sum + value, 0) / components.length))
  const label = score >= 20 ? 'ego_leaning' : score <= -20 ? 'ethos_leaning' : 'balanced'
  return { score, label }
}

function scoreProfile(answers, knownTypes = {}) {
  const { bigFive, bands } = scoreBigFive(answers)
  const style = mbtiStyle(bigFive)
  const enneagram = scoreEnneagram(answers, knownTypes.enneagram)
  const conflict = conflictStyle(answers)
  const flags = stateFlags(answers)
  const profile = {
    bigFive,
    bands,
    mbtiStyle: style,
    mbtiMismatches: mbtiMismatches(style, knownTypes.mbti),
    knownTypes,
    enneagram,
    intuitiveAnalytical: intuitiveAnalytical(answers),
    maximizer: maximizerScore(answers),
    decisionSpeed: answers.R8 == null ? null : Number(answers.R8),
    conflictDefault: conflict?.conflictDefault || null,
    conflictBackup: conflict?.conflictBackup || null,
    conflictTied: !!conflict?.tied,
    riskTolerance: riskTolerance(answers),
    lossAversion: answers.K8 == null ? null : Number(answers.K8),
    values: Array.isArray(answers.V1) ? valueWeights(answers.V1) : null,
    flags,
  }
  profile.affinity = affinity(profile)
  return profile
}

export {
  TRAITS,
  VALUES,
  round2,
  band,
  scoreBigFive,
  mbtiStyle,
  mbtiMismatches,
  scoreEnneagram,
  intuitiveAnalytical,
  maximizerScore,
  conflictStyle,
  riskTolerance,
  valueWeights,
  stateFlags,
  affinity,
  scoreProfile,
}
