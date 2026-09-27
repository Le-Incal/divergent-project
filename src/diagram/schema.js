import { labelHasBannedTerm } from './bannedTerms.js'
import { nodeCap } from './caps.js'
import { frameworkInKit, grammarFor } from './registry.js'

export { structureHintsSchema } from './hints.js'

const PROFILE_PHRASES = [
  'extraversion',
  'agreeableness',
  'conscientiousness',
  'emotional reactivity',
  'openness',
]

function words(value) {
  return String(value || '').trim().split(/\s+/).filter(Boolean)
}

function hasCycle(nodes, edges) {
  const next = new Map(nodes.map((node) => [node.id, []]))
  edges.forEach((item) => {
    if (next.has(item.source)) next.get(item.source).push(item.target)
  })
  const color = new Map()
  const visit = (id) => {
    if (color.get(id) === 1) return true
    if (color.get(id) === 2) return false
    color.set(id, 1)
    for (const target of next.get(id) || []) {
      if (visit(target)) return true
    }
    color.set(id, 2)
    return false
  }
  return nodes.some((node) => visit(node.id))
}

function issueList(spec, ctx) {
  const issues = []
  if (!spec || spec.specVersion !== 1) issues.push('specVersion')
  if (!spec?.diagramId || !Number.isInteger(spec.revision)) issues.push('identity')
  if (words(spec?.title).length > 8) issues.push('title')
  if (!Array.isArray(spec?.nodes) || !Array.isArray(spec?.edges)) {
    issues.push('shape')
    return issues
  }
  if (spec.nodes.length > nodeCap(ctx.c2)) issues.push('cap')
  if (!frameworkInKit(spec.voice, spec.framework)) issues.push('framework')
  else if (spec.grammar !== grammarFor(spec.voice, spec.framework, { v2: !!ctx.v2 })) issues.push('grammar')

  const ids = new Set(spec.nodes.map((node) => node.id))
  if (ids.size !== spec.nodes.length) issues.push('duplicate-id')
  for (const item of spec.edges) {
    if (!ids.has(item.source) || !ids.has(item.target)) issues.push('edge')
  }

  for (const node of spec.nodes) {
    const label = node.label || ''
    if (words(label).length > 6 || label.length > 48) issues.push('label')
    if (labelHasBannedTerm(label)) issues.push('banned')
    if (PROFILE_PHRASES.some((phrase) => label.toLowerCase().includes(phrase))) issues.push('profile')
    if (node.note && node.note.length > 200) issues.push('note')
  }

  if (spec.voice === 'ethos' && spec.nodes.some((node) => node.status === 'pruned')) issues.push('ethos-prune')

  if (spec.grammar === 'core_radial') {
    const roots = spec.nodes.filter((node) => node.kind === 'root_belief')
    if (roots.length > 1) issues.push('roots')
    const byId = new Map(spec.nodes.map((node) => [node.id, node]))
    for (const node of spec.nodes) {
      if (!['symptom', 'cause', 'root_belief'].includes(node.kind)) issues.push('kind')
      if (typeof node.layer !== 'number') issues.push('layer')
      if (!(node.into === null || typeof node.into === 'string')) issues.push('into')
      if (typeof node.into === 'string') {
        const target = byId.get(node.into)
        if (!target) issues.push('into')
        else if (target.kind !== 'root_belief' && !(target.layer > node.layer)) issues.push('into-layer')
        const seen = new Set([node.id])
        let cursor = target
        while (cursor?.into) {
          if (seen.has(cursor.id)) {
            issues.push('cycle')
            break
          }
          seen.add(cursor.id)
          cursor = byId.get(cursor.into)
        }
      }
    }
  }

  if (spec.grammar === 'iceberg') {
    for (const node of spec.nodes) {
      if (!['event', 'pattern', 'structure', 'belief'].includes(node.kind)) issues.push('kind')
    }
  }

  if (spec.grammar === 'campaign') {
    const starts = spec.nodes.filter((node) => node.kind === 'start')
    const objectives = spec.nodes.filter((node) => node.kind === 'objective')
    if (starts.length !== 1 || objectives.length !== 1) issues.push('ends')
    for (const node of spec.nodes) {
      if (!['start', 'option', 'objective'].includes(node.kind)) issues.push('kind')
      if (node.kind === 'option' && !(typeof node.leverage === 'number' && node.leverage >= 0 && node.leverage <= 1)) {
        issues.push('leverage')
      }
    }
    if (hasCycle(spec.nodes, spec.edges)) issues.push('cycle')
  }

  if (spec.grammar === 'bottleneck') {
    for (const node of spec.nodes) {
      if (node.kind !== 'stage') issues.push('kind')
      if (typeof node.order !== 'number') issues.push('order')
      if (!(typeof node.throughput === 'number' && node.throughput > 0)) issues.push('throughput')
    }
  }

  return issues
}

export function validateDiagram(spec, ctx = {}) {
  const issues = issueList(spec, ctx)
  if (issues.length) return { ok: false, issues }
  return { ok: true, spec }
}
