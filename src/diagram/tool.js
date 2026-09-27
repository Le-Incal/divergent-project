import { z } from 'zod'
import { structureHintsSchema } from './hints.js'
import { validateDiagram } from './schema.js'

const diagramSchema = z.object({
  specVersion: z.literal(1),
  diagramId: z.string(),
  voice: z.enum(['ethos', 'ego']),
  grammar: z.enum([
    'core_radial', 'iceberg', 'ripple', 'fishbone', 'balance_wheel', 'balancing_loops',
    'campaign', 'bottleneck', 'terrain', 'move_tree', 'ooda', 'leverage_web',
  ]),
  framework: z.string(),
  title: z.string(),
  revision: z.number().int(),
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    kind: z.string(),
    origin: z.enum(['voice', 'user']),
    status: z.enum(['active', 'unexamined', 'pruned']),
    layer: z.number().optional(),
    into: z.string().nullable().optional(),
    leverage: z.number().optional(),
    order: z.number().optional(),
    throughput: z.number().optional(),
    note: z.string().optional(),
    pinned: z.boolean().optional(),
  })),
  edges: z.array(z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    kind: z.string(),
    polarity: z.enum(['+', '-']).optional(),
  })),
  derivedFrom: z.string().optional(),
})

function anthropicSchema(schema) {
  const json = z.toJSONSchema(schema)
  delete json.$schema
  return json
}

export function diagramTools() {
  return [
    {
      name: 'emit_structure_hints',
      description: 'Describe the shape of this brainstorm turn so the app can decide whether a map would help. Call this once every brainstorm turn. Do not include coordinates.',
      input_schema: anthropicSchema(structureHintsSchema),
    },
    {
      name: 'emit_diagram',
      description: 'Emit a structured diagram for the current framework. Never include coordinates.',
      input_schema: anthropicSchema(diagramSchema),
    },
  ]
}

export function acceptDiagram(raw, ctx = {}) {
  const result = validateDiagram(raw, ctx)
  if (result.ok) return { type: 'spec', spec: result.spec }
  const labels = Array.isArray(raw?.nodes) ? raw.nodes.map((node) => `- ${node.label || node.id}`).filter(Boolean) : []
  return {
    type: 'invalid',
    issues: result.issues,
    raw,
    outline: labels.length ? labels.join('\n') : 'A map could not be drawn from that pass.',
  }
}
