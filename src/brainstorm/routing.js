import { ethosFrameworks, egoFrameworks, ethosSignature, egoSignature } from './kits.js'

const PROBLEM_TYPES = ['problem', 'idea', 'decision', 'person', 'ourselves', 'experiment', 'big_picture', 'process']

const SPECIFIC = new Set(['N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11', 'N14', 'N15', 'N16', 'N17'])
const GENERAL = new Set(['N12', 'N13'])

function high(profile, trait) {
  return profile.bands?.[trait] === 'high'
}
function low(profile, trait) {
  return profile.bands?.[trait] === 'low'
}
function conflictIs(profile, mode) {
  const value = profile.conflictDefault
  return Array.isArray(value) ? value.includes(mode) : value === mode
}

function frameworkFor(id, profile, problemType) {
  const table = {
    N1: ['Name It to Tame It', 'Name It to Tame It'],
    N2: ['One-Way vs. Two-Way Doors', 'OODA Loop'],
    N3: ['CBT ABC Model', 'CBT ABC Model'],
    N4: ['Radical Candor', 'Interests vs. Positions'],
    N5: ['Ladder of Inference', 'Active Listening / Looping'],
    N6: ['Nonviolent Communication', 'Thomas-Kilmann Conflict Modes'],
    N7: ['Interests vs. Positions', 'Active Listening / Looping'],
    N8: ['10/10/10', 'One-Way vs. Two-Way Doors'],
    N9: ['Pre-Mortem', 'Inversion'],
    N10: ['Analogical Transfer / Biomimicry', 'TRIZ'],
    N11: ['How Might We', 'SCAMPER'],
    N12: ['Eisenhower Matrix', 'GROW Model'],
    N13: ['Riskiest Assumption Test', 'Build-Measure-Learn'],
    N14: [
      problemType === 'decision' ? 'Weighted Criteria Scoring' : 'Kepner-Tregoe Problem Analysis',
      problemType === 'decision' ? 'Issue Trees / MECE' : 'Theory of Constraints',
    ],
    N15: [
      problemType === 'decision' ? 'Regret Minimization' : 'Pre-Mortem',
      problemType === 'decision' ? 'Regret Minimization' : 'Crazy 8s',
    ],
    N16: ['Assumption Mapping', 'Riskiest Assumption Test'],
    N17: ['Pre-Mortem', 'Inversion'],
  }
  const pair = table[id]
  if (!pair) return null
  return profile.voice === 'ego' ? pair[1] : pair[0]
}

function signals(profile, problemType) {
  const flags = profile.flags || {}
  const rows = [
    { id: 'N4', types: ['person'], on: high(profile, 'A') },
    { id: 'N5', types: ['person'], on: low(profile, 'A') },
    { id: 'N6', types: ['person'], on: conflictIs(profile, 'avoiding') },
    { id: 'N7', types: ['person'], on: conflictIs(profile, 'competing') },
    { id: 'N8', types: ['decision'], on: profile.maximizer != null && profile.maximizer >= 5 },
    { id: 'N9', types: ['decision'], on: profile.maximizer != null && profile.maximizer <= 3 },
    { id: 'N10', types: ['idea'], on: high(profile, 'O') },
    { id: 'N11', types: ['idea'], on: low(profile, 'O') },
    { id: 'N14', types: ['problem', 'decision'], on: profile.intuitiveAnalytical != null && profile.intuitiveAnalytical <= -2 },
    { id: 'N15', types: ['problem', 'decision', 'idea'], on: profile.intuitiveAnalytical != null && profile.intuitiveAnalytical >= 2 },
    { id: 'N16', types: ['decision', 'experiment'], on: profile.riskTolerance != null && profile.riskTolerance <= 3 },
    { id: 'N17', types: ['decision', 'experiment'], on: profile.riskTolerance != null && profile.riskTolerance >= 5 },
    { id: 'N12', types: null, on: low(profile, 'C') },
    { id: 'N13', types: null, on: high(profile, 'C') },
    { id: 'N3', types: null, on: high(profile, 'N'), addOn: true },
  ]
  return rows.filter((row) => row.on && (!row.types || row.types.includes(problemType)))
}

function signatureFallback(voice, problemType) {
  const catalog = voice === 'ego' ? egoFrameworks : ethosFrameworks
  const names = voice === 'ego' ? egoSignature : ethosSignature
  const matches = names.filter((name) => catalog.find((item) => item.name === name && item.category === problemType))
  if (problemType === 'idea' && voice === 'ego') return matches.includes('TRIZ') ? 'TRIZ' : matches[0]
  return matches[0] || names[0]
}

function routeBrainstorm({ profile, problemType, voice, requestedMode = 'default', suppressedSignals = [] }) {
  const flooded = !!profile.flags?.flooded
  const urgent = !!profile.flags?.urgent
  const effectiveMode = flooded ? 'default' : requestedMode
  const suppressed = new Set(suppressedSignals)
  const active = signals(profile, problemType).filter((row) => !suppressed.has(row.id))
  const specific = active.filter((row) => SPECIFIC.has(row.id))
  const general = active.filter((row) => GENERAL.has(row.id))
  const addOn = active.find((row) => row.addOn)

  const pack = (id, extra = {}) => ({
    primaryNeed: id,
    framework: frameworkFor(id, { voice }, problemType),
    addOnNeed: extra.addOnNeed || null,
    addOnFramework: extra.addOnFramework || null,
    thenNeed: extra.thenNeed || null,
    thenFramework: extra.thenFramework || null,
    compressed: !!extra.compressed,
    effectiveMode,
    voice,
    acknowledgment: profile.calibration?.supportedFirst || profile.calibration?.gentle || false,
  })

  if (flooded && urgent && !suppressed.has('N1')) {
    return pack('N1', {
      compressed: true,
      thenNeed: 'N2',
      thenFramework: frameworkFor('N2', { voice }, problemType),
    })
  }
  if (flooded && !suppressed.has('N1')) return pack('N1')
  if (urgent && !suppressed.has('N2')) return pack('N2')

  const primary = specific[0] || general[0]
  if (!primary) {
    return {
      primaryNeed: null,
      framework: signatureFallback(voice, problemType),
      addOnNeed: addOn ? 'N3' : null,
      addOnFramework: addOn ? frameworkFor('N3', { voice }, problemType) : null,
      thenNeed: null,
      thenFramework: null,
      compressed: false,
      effectiveMode,
      voice,
      acknowledgment: profile.calibration?.supportedFirst || profile.calibration?.gentle || false,
      fallback: true,
    }
  }
  return pack(primary.id, addOn && primary.id !== 'N3'
    ? { addOnNeed: 'N3', addOnFramework: frameworkFor('N3', { voice }, problemType) }
    : {})
}

function dissentAllowed(used) {
  return used < 2
}

export {
  PROBLEM_TYPES,
  routeBrainstorm,
  signatureFallback,
  dissentAllowed,
  ethosFrameworks,
  egoFrameworks,
}
