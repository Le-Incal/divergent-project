import { egoFrameworks, ethosFrameworks } from '../brainstorm/kits.js'

const ETHOS_MVP = {
  iceberg: ['Iceberg Model'],
  core_radial: ['5 Whys', 'CBT ABC Model', 'Ladder of Inference'],
}

const EGO_MVP = {
  bottleneck: ['Theory of Constraints'],
  campaign: [
    'Issue Trees / MECE',
    'SCAMPER',
    'Constraint Forcing',
    'Second-Order Thinking',
    'Inversion',
    'Jobs to Be Done',
  ],
}

const ETHOS_V2 = {
  ripple: ['Second-Order Thinking', 'Regret Minimization', 'Needs Behind Behavior (Self-Determination Theory)'],
  fishbone: ['Fishbone (Ishikawa)', 'Kepner-Tregoe Problem Analysis'],
  balance_wheel: ['Wheel of Life', 'Weighted Criteria Scoring'],
  balancing_loops: ['Feedback Loops / Causal Loop Diagrams'],
}

const EGO_V2 = {
  terrain: ['Wardley Mapping', 'Five Forces'],
  move_tree: ['Second-Order Thinking', 'Inversion'],
  ooda: ['OODA Loop'],
  leverage_web: ['Needs Behind Behavior (Self-Determination Theory)', 'RACI'],
}

const V2_GRAMMARS = new Set([
  ...Object.keys(ETHOS_V2),
  ...Object.keys(EGO_V2),
])

function matchGrammar(table, framework) {
  for (const [grammar, names] of Object.entries(table)) {
    if (names.includes(framework)) return grammar
  }
  return null
}

export function frameworkInKit(voice, framework) {
  const list = voice === 'ego' ? egoFrameworks : ethosFrameworks
  return list.some((item) => item.name === framework)
}

export function grammarFor(voice, framework, { v2 = false } = {}) {
  if (v2) {
    const specific = matchGrammar(voice === 'ego' ? EGO_V2 : ETHOS_V2, framework)
    if (specific) return specific
  }
  const mvp = matchGrammar(voice === 'ego' ? EGO_MVP : ETHOS_MVP, framework)
  if (mvp) return mvp
  return voice === 'ego' ? 'campaign' : 'core_radial'
}

export function grammarEnabled(grammar, { v2 = false } = {}) {
  if (V2_GRAMMARS.has(grammar)) return v2
  return ['core_radial', 'iceberg', 'campaign', 'bottleneck'].includes(grammar)
}

export { V2_GRAMMARS }
