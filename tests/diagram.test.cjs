let validateDiagram
let grammarFor
let nodeCap
let loadBannedTerms
let layoutRadial
let layoutIceberg
let nodeSize
let campaignGraph
let layoutCampaign
let layoutBottleneck
let decisivePath
let killBranch
let diffSpecs
let toOutline
let toMermaid
let motionFor
let diagramOfferEnabled
let evaluateDiagramTriggers

beforeAll(async () => {
  const schema = await import('../src/diagram/schema.js')
  const registry = await import('../src/diagram/registry.js')
  const caps = await import('../src/diagram/caps.js')
  const banned = await import('../src/diagram/bannedTerms.js')
  const radial = await import('../src/diagram/layout/ethosRadial.js')
  const iceberg = await import('../src/diagram/layout/iceberg.js')
  const campaign = await import('../src/diagram/layout/campaign.js')
  const campaignNode = await import('../src/diagram/layout/campaignNode.js')
  const bottleneck = await import('../src/diagram/layout/bottleneck.js')
  const prune = await import('../src/diagram/prune.js')
  const diff = await import('../src/diagram/diff.js')
  const outline = await import('../src/diagram/outline.js')
  const mermaid = await import('../src/diagram/mermaid.js')
  const motion = await import('../src/diagram/motion.js')
  const triggers = await import('../src/diagram/triggers.js')
  validateDiagram = schema.validateDiagram
  grammarFor = registry.grammarFor
  nodeCap = caps.nodeCap
  loadBannedTerms = banned.loadBannedTerms
  layoutRadial = radial.layoutRadial
  layoutIceberg = iceberg.layoutIceberg
  nodeSize = campaign.nodeSize
  campaignGraph = campaign.campaignGraph
  layoutCampaign = campaignNode.layoutCampaign
  layoutBottleneck = bottleneck.layoutBottleneck
  decisivePath = prune.decisivePath
  killBranch = prune.killBranch
  diffSpecs = diff.diffSpecs
  toOutline = outline.toOutline
  toMermaid = mermaid.toMermaid
  motionFor = motion.motionFor
  diagramOfferEnabled = triggers.diagramOfferEnabled
  evaluateDiagramTriggers = triggers.evaluateDiagramTriggers
})

function node(partial) {
  return {
    origin: 'voice',
    status: 'active',
    ...partial,
  }
}

function spec(partial) {
  return {
    specVersion: 1,
    diagramId: 'd1',
    title: 'A working map',
    revision: 1,
    nodes: [],
    edges: [],
    ...partial,
  }
}

function ethos(nodes, extra = {}) {
  return spec({
    voice: 'ethos',
    grammar: 'core_radial',
    framework: '5 Whys',
    nodes,
    edges: extra.edges || [],
    ...extra,
  })
}

function edge(source, target, kind = 'rolls_into') {
  return { id: `${source}-${target}`, source, target, kind }
}

const radius = (position) => Math.hypot(position.x, position.y)

describe('diagram schema', () => {
  test('SC-1 a single untraced symptom is valid', () => {
    const result = validateDiagram(ethos([
      node({ id: 's1', label: 'Surface symptom', kind: 'symptom', layer: 0, into: null }),
    ]))
    expect(result.ok).toBe(true)
  })

  test('SC-2 Ethos cannot prune', () => {
    const result = validateDiagram(ethos([
      node({ id: 's1', label: 'Surface symptom', kind: 'symptom', layer: 0, into: null, status: 'pruned' }),
    ]))
    expect(result.ok).toBe(false)
  })

  test('SC-3 two root beliefs are invalid', () => {
    const result = validateDiagram(ethos([
      node({ id: 'b1', label: 'First root', kind: 'root_belief', layer: 2, into: null }),
      node({ id: 'b2', label: 'Second root', kind: 'root_belief', layer: 2, into: null }),
    ]))
    expect(result.ok).toBe(false)
  })

  test('SC-4 an Ego framework is rejected on Ethos', () => {
    const result = validateDiagram(ethos([
      node({ id: 's1', label: 'Surface symptom', kind: 'symptom', layer: 0, into: null }),
    ], { framework: 'OODA Loop' }))
    expect(result.ok).toBe(false)
  })

  test('SC-5 Headline caps the map at 7 nodes', () => {
    const nodes = Array.from({ length: 8 }, (_, index) => node({
      id: `s${index}`,
      label: `Symptom ${index}`,
      kind: 'symptom',
      layer: 0,
      into: null,
    }))
    const result = validateDiagram(ethos(nodes), { c2: 'Headline' })
    expect(nodeCap('Headline')).toBe(7)
    expect(result.ok).toBe(false)
  })

  test('SC-6 a seven-word label is invalid', () => {
    const result = validateDiagram(ethos([
      node({ id: 's1', label: 'one two three four five six seven', kind: 'symptom', layer: 0, into: null }),
    ]))
    expect(result.ok).toBe(false)
  })

  test('SC-7 an edge to a missing node is invalid', () => {
    const result = validateDiagram(ethos([
      node({ id: 's1', label: 'Surface symptom', kind: 'symptom', layer: 0, into: null }),
    ], { edges: [edge('s1', 'missing')] }))
    expect(result.ok).toBe(false)
  })

  test('SC-8 a thinker name from the kit engines is invalid', () => {
    expect(loadBannedTerms().has('Machiavelli')).toBe(true)
    const result = validateDiagram(ethos([
      node({ id: 's1', label: 'Machiavelli', kind: 'symptom', layer: 0, into: null }),
    ]))
    expect(result.ok).toBe(false)
  })

  test('SC-9 a v2 grammar is rejected while the flag is off', () => {
    const result = validateDiagram(spec({
      voice: 'ego',
      grammar: 'terrain',
      framework: 'Five Forces',
      nodes: [
        node({ id: 'S', label: 'Start', kind: 'start' }),
        node({ id: 'O', label: 'Objective', kind: 'objective' }),
      ],
      edges: [edge('S', 'O', 'leads_to')],
    }))
    expect(result.ok).toBe(false)
  })

  test('SC-10 a campaign cycle is invalid', () => {
    const result = validateDiagram(spec({
      voice: 'ego',
      grammar: 'campaign',
      framework: 'Issue Trees / MECE',
      nodes: [
        node({ id: 'S', label: 'Start', kind: 'start' }),
        node({ id: 'A', label: 'Loop', kind: 'option', leverage: 0.5 }),
        node({ id: 'O', label: 'Objective', kind: 'objective' }),
      ],
      edges: [edge('S', 'A', 'leads_to'), edge('A', 'S', 'leads_to'), edge('A', 'O', 'leads_to')],
    }))
    expect(result.ok).toBe(false)
  })

  test('SC-11 two objectives are invalid', () => {
    const result = validateDiagram(spec({
      voice: 'ego',
      grammar: 'campaign',
      framework: 'Issue Trees / MECE',
      nodes: [
        node({ id: 'S', label: 'Start', kind: 'start' }),
        node({ id: 'O', label: 'Objective', kind: 'objective' }),
        node({ id: 'O2', label: 'Other end', kind: 'objective' }),
      ],
      edges: [edge('S', 'O', 'leads_to')],
    }))
    expect(result.ok).toBe(false)
  })

  test('SC-12 into must move to a deeper layer', () => {
    const result = validateDiagram(ethos([
      node({ id: 'c1', label: 'Same layer', kind: 'cause', layer: 1, into: null }),
      node({ id: 's1', label: 'Surface symptom', kind: 'symptom', layer: 1, into: 'c1' }),
    ], { edges: [edge('s1', 'c1')] }))
    expect(result.ok).toBe(false)
  })

  test('SC-13 markup in a label stays valid data', () => {
    const label = '<img src=x onerror=alert(1)>'
    const result = validateDiagram(ethos([
      node({ id: 's1', label, kind: 'symptom', layer: 0, into: null }),
    ]))
    expect(result.ok).toBe(true)
    expect(result.spec.nodes[0].label).toBe(label)
  })
})

function radialSpec(nodes) {
  return ethos(nodes, {
    edges: nodes.filter((item) => item.into).map((item) => edge(item.id, item.into)),
  })
}

describe('ethos core radial', () => {
  const er1 = () => layoutRadial(radialSpec([
    node({ id: 's1', label: 's1', kind: 'symptom', layer: 0, into: 'c1' }),
    node({ id: 's2', label: 's2', kind: 'symptom', layer: 0, into: 'c1' }),
    node({ id: 's3', label: 's3', kind: 'symptom', layer: 0, into: null }),
    node({ id: 'c1', label: 'c1', kind: 'cause', layer: 1, into: null }),
  ]))

  test('ER-1 placeholder core, radii, and the untraced symptom', () => {
    const layout = er1()
    const byId = Object.fromEntries(layout.nodes.map((item) => [item.id, item]))
    expect(byId.__core).toMatchObject({ label: '?', status: 'unexamined', x: 0, y: 0 })
    expect(layout.maxLayer).toBe(1)
    expect(radius(byId.s1)).toBeCloseTo(300, 2)
    expect(radius(byId.s2)).toBeCloseTo(300, 2)
    expect(radius(byId.s3)).toBeCloseTo(300, 2)
    expect(radius(byId.c1)).toBeCloseTo(150, 2)
    expect(layout.flags.unexamined).toEqual(['s3'])
  })

  test('ER-2 a confirmed root sits at the center', () => {
    const layout = layoutRadial(radialSpec([
      node({ id: 's1', label: 's1', kind: 'symptom', layer: 0, into: 'c1' }),
      node({ id: 'c1', label: 'c1', kind: 'cause', layer: 1, into: 'b1' }),
      node({ id: 'b1', label: 'b1', kind: 'root_belief', layer: 2, into: null }),
    ]))
    const byId = Object.fromEntries(layout.nodes.map((item) => [item.id, item]))
    expect(byId.b1).toMatchObject({ x: 0, y: 0, status: 'active' })
    expect(layout.maxLayer).toBe(1)
    expect(radius(byId.s1)).toBeCloseTo(300, 2)
    expect(radius(byId.c1)).toBeCloseTo(150, 2)
    expect(layout.flags.unexamined).toEqual([])
  })

  test('ER-3 radii step inward by layer', () => {
    const layout = layoutRadial(radialSpec([
      node({ id: 's1', label: 's1', kind: 'symptom', layer: 0, into: 'c1' }),
      node({ id: 'c1', label: 'c1', kind: 'cause', layer: 1, into: 'd1' }),
      node({ id: 'd1', label: 'd1', kind: 'cause', layer: 2, into: null }),
    ]))
    const byId = Object.fromEntries(layout.nodes.map((item) => [item.id, item]))
    expect(radius(byId.s1)).toBeCloseTo(300, 2)
    expect(radius(byId.c1)).toBeCloseTo(200, 2)
    expect(radius(byId.d1)).toBeCloseTo(100, 2)
  })

  test('ER-4 parent angles sit among their children and the surface is the outer ring', () => {
    const layout = er1()
    const byId = Object.fromEntries(layout.nodes.map((item) => [item.id, item]))
    const surface = layout.nodes.filter((item) => item.layer === 0)
    surface.forEach((item) => expect(radius(item)).toBeCloseTo(300, 2))
    const children = [byId.s1, byId.s2]
    const angles = children.map((item) => item.angle)
    expect(byId.c1.angle).toBeGreaterThanOrEqual(Math.min(...angles) - 0.001)
    expect(byId.c1.angle).toBeLessThanOrEqual(Math.max(...angles) + 0.001)
  })

  test('ER-5 the same spec lays out twice the same way', () => {
    expect(er1().nodes).toEqual(er1().nodes)
  })

  test('ER-6 an all-surface map does not flag anyone', () => {
    const layout = layoutRadial(radialSpec([
      node({ id: 's1', label: 's1', kind: 'symptom', layer: 0, into: null }),
      node({ id: 's2', label: 's2', kind: 'symptom', layer: 0, into: null }),
    ]))
    const core = layout.nodes.find((item) => item.id === '__core')
    expect(layout.maxLayer).toBe(0)
    expect(layout.flags.unexamined).toEqual([])
    expect(core.label).toBe('?')
  })
})

describe('ethos iceberg', () => {
  test('IB-1 bands, waterline, and the empty structure band', () => {
    const layout = layoutIceberg(spec({
      voice: 'ethos',
      grammar: 'iceberg',
      framework: 'Iceberg Model',
      nodes: [
        node({ id: 'e1', label: 'e1', kind: 'event' }),
        node({ id: 'e2', label: 'e2', kind: 'event' }),
        node({ id: 'p1', label: 'p1', kind: 'pattern' }),
        node({ id: 'b1', label: 'b1', kind: 'belief' }),
      ],
    }))
    const byId = Object.fromEntries(layout.nodes.map((item) => [item.id, item]))
    expect(byId.e1).toMatchObject({ x: 300, y: 60 })
    expect(byId.e2).toMatchObject({ x: 600, y: 60 })
    expect(byId.p1).toMatchObject({ x: 450, y: 180 })
    expect(byId.b1).toMatchObject({ x: 450, y: 420 })
    expect(layout.flags.waterlineY).toBe(120)
    expect(layout.flags.unexaminedBands).toEqual(['structure'])
  })

  test('IB-2 one event leaves the depths unexamined', () => {
    const layout = layoutIceberg(spec({
      voice: 'ethos',
      grammar: 'iceberg',
      framework: 'Iceberg Model',
      nodes: [node({ id: 'e1', label: 'e1', kind: 'event' })],
    }))
    expect(layout.flags.unexaminedBands).toEqual(['pattern', 'structure', 'belief'])
  })

  test('IB-3 an empty map flags nothing', () => {
    const layout = layoutIceberg(spec({
      voice: 'ethos',
      grammar: 'iceberg',
      framework: 'Iceberg Model',
    }))
    expect(layout.flags.unexaminedBands).toEqual([])
  })
})

function campaignSpec(nodes, edges) {
  return spec({
    voice: 'ego',
    grammar: 'campaign',
    framework: 'Issue Trees / MECE',
    nodes,
    edges,
  })
}

const pr1 = () => campaignSpec([
  node({ id: 'S', label: 'S', kind: 'start' }),
  node({ id: 'A', label: 'A', kind: 'option', leverage: 0.9 }),
  node({ id: 'B', label: 'B', kind: 'option', leverage: 0.4 }),
  node({ id: 'C', label: 'C', kind: 'option', leverage: 0.3 }),
  node({ id: 'D', label: 'D', kind: 'option', leverage: 0.9 }),
  node({ id: 'O', label: 'O', kind: 'objective' }),
], [
  edge('S', 'A', 'leads_to'),
  edge('S', 'B', 'leads_to'),
  edge('A', 'C', 'leads_to'),
  edge('B', 'D', 'leads_to'),
  edge('C', 'O', 'leads_to'),
  edge('D', 'O', 'leads_to'),
])

describe('ego campaign map', () => {
  test('CM-1 leverage sets the node size', () => {
    expect(nodeSize(node({ id: 'a', label: 'Low', kind: 'option', leverage: 0 }))).toEqual({ width: 120, height: 48 })
    expect(nodeSize(node({ id: 'b', label: 'Mid', kind: 'option', leverage: 0.5 }))).toEqual({ width: 160, height: 60 })
    expect(nodeSize(node({ id: 'c', label: 'High', kind: 'option', leverage: 1 }))).toEqual({ width: 200, height: 72 })
    expect(nodeSize(node({ id: 'S', label: 'Start', kind: 'start' }))).toEqual({ width: 200, height: 72 })
  })

  test('CM-2 the ELK graph pins start and objective to the ends', () => {
    const graph = campaignGraph(campaignSpec([
      node({ id: 'S', label: 'Start', kind: 'start' }),
      node({ id: 'A', label: 'Route', kind: 'option', leverage: 0.5 }),
      node({ id: 'O', label: 'Objective', kind: 'objective' }),
    ], [edge('S', 'A', 'leads_to'), edge('A', 'O', 'leads_to')]))
    expect(graph.layoutOptions['elk.algorithm']).toBe('layered')
    expect(graph.layoutOptions['elk.direction']).toBe('RIGHT')
    const byId = Object.fromEntries(graph.children.map((item) => [item.id, item]))
    expect(byId.S.layoutOptions['elk.layered.layering.layerConstraint']).toBe('FIRST')
    expect(byId.O.layoutOptions['elk.layered.layering.layerConstraint']).toBe('LAST')
  })

  test('CM-3 ELK puts the objective last and the start first', async () => {
    const layout = await layoutCampaign(campaignSpec([
      node({ id: 'S', label: 'Start', kind: 'start' }),
      node({ id: 'A', label: 'Route', kind: 'option', leverage: 0.5 }),
      node({ id: 'O', label: 'Objective', kind: 'objective' }),
    ], [edge('S', 'A', 'leads_to'), edge('A', 'O', 'leads_to')]))
    const byId = Object.fromEntries(layout.nodes.map((item) => [item.id, item]))
    expect(byId.O.x).toBeGreaterThan(byId.S.x)
    expect(byId.O.x).toBeGreaterThan(byId.A.x)
    expect(byId.S.x).toBeLessThan(byId.A.x)
  })
})

describe('ego pruning', () => {
  test('PR-1 the stronger whole path wins, not the stronger first step', () => {
    const result = decisivePath(pr1())
    expect(result.path).toEqual(['S', 'B', 'D', 'O'])
    expect(result.pruned).toEqual(['A', 'C'])
    expect(result.noPath).toBe(false)
  })

  test('PR-2 equal leverage keeps the shorter path', () => {
    const result = decisivePath(campaignSpec([
      node({ id: 'S', label: 'S', kind: 'start' }),
      node({ id: 'E', label: 'E', kind: 'option', leverage: 0.6 }),
      node({ id: 'F', label: 'F', kind: 'option', leverage: 0.6 }),
      node({ id: 'G', label: 'G', kind: 'option', leverage: 0.6 }),
      node({ id: 'O', label: 'O', kind: 'objective' }),
    ], [
      edge('S', 'E', 'leads_to'),
      edge('E', 'O', 'leads_to'),
      edge('S', 'F', 'leads_to'),
      edge('F', 'G', 'leads_to'),
      edge('G', 'O', 'leads_to'),
    ]))
    expect(result.path).toEqual(['S', 'E', 'O'])
    expect(result.pruned).toEqual(['F', 'G'])
  })

  test('PR-3 killing a node drops everything that can no longer arrive', () => {
    const result = killBranch(pr1(), 'D')
    const byId = Object.fromEntries(result.spec.nodes.map((item) => [item.id, item]))
    expect(byId.D).toMatchObject({ status: 'pruned', killedBy: 'user' })
    expect(byId.B.status).toBe('pruned')
    expect(result.path).toEqual(['S', 'A', 'C', 'O'])
  })

  test('PR-4 a pin stays active off the decisive path', () => {
    const pinned = pr1()
    pinned.nodes = pinned.nodes.map((item) => item.id === 'A' ? { ...item, pinned: true } : item)
    const result = decisivePath(pinned)
    expect(result.path).toEqual(['S', 'B', 'D', 'O'])
    expect(result.pruned).toEqual(['C'])
    expect(result.flags.offPath).toEqual(['A'])
    const byId = Object.fromEntries(result.spec.nodes.map((item) => [item.id, item]))
    expect(byId.A.status).toBe('active')
  })

  test('PR-5 no route prunes nothing', () => {
    const result = decisivePath(campaignSpec([
      node({ id: 'S', label: 'S', kind: 'start' }),
      node({ id: 'A', label: 'A', kind: 'option', leverage: 0.5 }),
      node({ id: 'O', label: 'O', kind: 'objective' }),
    ], [edge('S', 'A', 'leads_to')]))
    expect(result.noPath).toBe(true)
    expect(result.pruned).toEqual([])
  })
})

describe('ego bottleneck', () => {
  test('BN-1 the slowest stage is the constraint', () => {
    const layout = layoutBottleneck(spec({
      voice: 'ego',
      grammar: 'bottleneck',
      framework: 'Theory of Constraints',
      nodes: [
        node({ id: 'intake', label: 'Intake', kind: 'stage', order: 0, throughput: 50 }),
        node({ id: 'review', label: 'Review', kind: 'stage', order: 1, throughput: 20 }),
        node({ id: 'ship', label: 'Ship', kind: 'stage', order: 2, throughput: 35 }),
      ],
      edges: [edge('intake', 'review', 'flows_to'), edge('review', 'ship', 'flows_to')],
    }))
    const byId = Object.fromEntries(layout.nodes.map((item) => [item.id, item]))
    expect(byId.intake).toMatchObject({ x: 0, y: 0 })
    expect(byId.review).toMatchObject({ x: 200, y: 0, scale: 1.4 })
    expect(byId.ship).toMatchObject({ x: 400, y: 0 })
    expect(layout.flags.constraintId).toBe('review')
  })

  test('BN-2 a throughput tie keeps the earlier stage', () => {
    const layout = layoutBottleneck(spec({
      voice: 'ego',
      grammar: 'bottleneck',
      framework: 'Theory of Constraints',
      nodes: [
        node({ id: 'a', label: 'First', kind: 'stage', order: 0, throughput: 30 }),
        node({ id: 'b', label: 'Second', kind: 'stage', order: 1, throughput: 20 }),
        node({ id: 'c', label: 'Third', kind: 'stage', order: 2, throughput: 20 }),
      ],
    }))
    expect(layout.flags.constraintId).toBe('b')
  })

  test('BN-3 a stage without throughput is invalid', () => {
    const result = validateDiagram(spec({
      voice: 'ego',
      grammar: 'bottleneck',
      framework: 'Theory of Constraints',
      nodes: [node({ id: 'a', label: 'Intake', kind: 'stage', order: 0 })],
    }))
    expect(result.ok).toBe(false)
  })
})

describe('diagram diff, outline, mermaid, and motion', () => {
  test('DF-1 kept, added, removed, and pruned', () => {
    const prev = spec({
      voice: 'ego',
      grammar: 'campaign',
      framework: 'Issue Trees / MECE',
      nodes: ['a', 'b', 'c'].map((id) => node({ id, label: id, kind: 'option', leverage: 0.5, status: 'active' })),
    })
    const next = spec({
      voice: 'ego',
      grammar: 'campaign',
      framework: 'Issue Trees / MECE',
      nodes: [
        node({ id: 'b', label: 'b', kind: 'option', leverage: 0.5, status: 'active' }),
        node({ id: 'c', label: 'c', kind: 'option', leverage: 0.5, status: 'pruned' }),
        node({ id: 'd', label: 'd', kind: 'option', leverage: 0.5, status: 'active' }),
      ],
    })
    expect(diffSpecs(prev, next)).toEqual({
      kept: ['b'],
      added: ['d'],
      removed: ['a'],
      pruned: ['c'],
      restored: [],
    })
  })

  test('DF-2 a pruned node can come back', () => {
    const prev = spec({
      nodes: [node({ id: 'c', label: 'c', kind: 'option', leverage: 0.5, status: 'pruned' })],
    })
    const next = spec({
      nodes: [node({ id: 'c', label: 'c', kind: 'option', leverage: 0.5, status: 'active' })],
    })
    expect(diffSpecs(prev, next).restored).toEqual(['c'])
  })

  test('OL-1 the radial outline nests outward from the core', () => {
    const diagram = radialSpec([
      node({ id: 's1', label: 's1', kind: 'symptom', layer: 0, into: 'c1' }),
      node({ id: 'c1', label: 'c1', kind: 'cause', layer: 1, into: 'b1' }),
      node({ id: 'b1', label: 'b1', kind: 'root_belief', layer: 2, into: null }),
    ])
    expect(toOutline(diagram)).toBe(['- Core: b1', '  - c1', '    - s1'].join('\n'))
  })

  test('OL-2 the campaign outline leads with the decisive path', () => {
    const pruned = decisivePath(pr1()).spec
    expect(toOutline(pruned)).toBe(['Decisive path: S → B → D → O', 'Cut: A, C'].join('\n'))
  })

  test('OL-3 an untraced symptom is marked in the outline', () => {
    const diagram = radialSpec([
      node({ id: 's1', label: 's1', kind: 'symptom', layer: 0, into: 'c1' }),
      node({ id: 's2', label: 's2', kind: 'symptom', layer: 0, into: 'c1' }),
      node({ id: 's3', label: 's3', kind: 'symptom', layer: 0, into: null }),
      node({ id: 'c1', label: 'c1', kind: 'cause', layer: 1, into: null }),
    ])
    const outline = toOutline(diagram)
    expect(outline).toContain('- Core: ? (unexamined)')
    expect(outline).toContain('s3 (untraced)')
  })

  test('MM-1 pruned campaign nodes get a mermaid class', () => {
    const pruned = decisivePath(pr1()).spec
    const text = toMermaid(pruned)
    expect(text.startsWith('flowchart LR')).toBe(true)
    expect(text).toContain('S --> B')
    expect(text).toContain('class A,C pruned')
  })

  test('MO-1 Ethos drifts', () => {
    expect(motionFor('ethos', false)).toEqual({ duration: 900, easing: 'easeInOutCubic' })
  })

  test('MO-2 Ego snaps', () => {
    expect(motionFor('ego', false)).toEqual({ duration: 250, easing: 'easeOutQuad' })
  })

  test('MO-3 reduced motion is instant', () => {
    expect(motionFor('ethos', true).duration).toBe(0)
    expect(motionFor('ego', true).duration).toBe(0)
  })
})

function hints(partial = {}) {
  return {
    userRequestedVisual: false,
    itemCount: 0,
    symptomCount: 0,
    depth: 0,
    recurrence: false,
    optionsCount: 0,
    objectiveDefined: false,
    stagesCount: 0,
    throughputComplaint: false,
    userOverwhelmed: false,
    circling: false,
    emotionalDisclosure: false,
    decisionCommitted: false,
    newStructure: false,
    ...partial,
  }
}

function trigger(partial = {}) {
  return {
    voice: 'ethos',
    framework: '5 Whys',
    hints: hints(),
    flooded: false,
    n1Complete: true,
    urgent: false,
    crisis: false,
    c2: 'Key points',
    profile: { r3: 4, r4: 4 },
    brainstormUserTurn: 3,
    mapExists: false,
    offerDeclinedForFramework: null,
    ...partial,
  }
}

describe('diagram triggers', () => {
  test('grammar registry uses the kit titles and falls back when v2 is off', () => {
    expect(grammarFor('ethos', 'Iceberg Model')).toBe('iceberg')
    expect(grammarFor('ethos', 'Pre-Mortem')).toBe('core_radial')
    expect(grammarFor('ego', 'Theory of Constraints')).toBe('bottleneck')
    expect(grammarFor('ego', 'Five Forces')).toBe('campaign')
  })

  test('DG-1 and DG-2 a flooded session waits for the first step', () => {
    expect(diagramOfferEnabled({ flooded: true, n1Complete: false })).toBe(false)
    expect(diagramOfferEnabled({ flooded: true, n1Complete: true })).toBe(true)
  })

  test('TR-1 crisis stays quiet even when a map is requested', () => {
    expect(evaluateDiagramTriggers(trigger({ crisis: true, hints: hints({ userRequestedVisual: true }) })).action).toBe('none')
  })

  test('TR-2 a flooded request waits until the first step is done', () => {
    const result = evaluateDiagramTriggers(trigger({
      flooded: true,
      n1Complete: false,
      hints: hints({ userRequestedVisual: true }),
    }))
    expect(result.action).toBe('queue')
  })

  test('TR-3 complexity during flooding stays quiet', () => {
    const result = evaluateDiagramTriggers(trigger({
      flooded: true,
      n1Complete: false,
      hints: hints({ itemCount: 8 }),
    }))
    expect(result.action).toBe('none')
  })

  test('TR-4 and TR-5 an explicit request draws the framework grammar', () => {
    expect(evaluateDiagramTriggers(trigger({
      hints: hints({ userRequestedVisual: true }),
    }))).toMatchObject({ action: 'draw', grammar: 'core_radial' })
    expect(evaluateDiagramTriggers(trigger({
      voice: 'ego',
      framework: 'Issue Trees / MECE',
      urgent: true,
      c2: 'Headline',
      hints: hints({ userRequestedVisual: true }),
    }))).toMatchObject({ action: 'draw', grammar: 'campaign' })
  })

  test('TR-6 a repeating iceberg problem is offered', () => {
    expect(evaluateDiagramTriggers(trigger({
      framework: 'Iceberg Model',
      hints: hints({ recurrence: true }),
    }))).toMatchObject({ action: 'offer', grammar: 'iceberg', copyKey: 'ethos.iceberg' })
  })

  test('TR-7 and TR-8 many symptoms offer a radial map only while the chain is still short', () => {
    expect(evaluateDiagramTriggers(trigger({
      hints: hints({ symptomCount: 3, depth: 1 }),
    }))).toMatchObject({ action: 'offer', grammar: 'core_radial', copyKey: 'ethos.core_radial' })
    expect(evaluateDiagramTriggers(trigger({
      hints: hints({ symptomCount: 3, depth: 2 }),
    })).action).toBe('none')
  })

  test('TR-9 and TR-10 a personal disclosure stays quiet', () => {
    expect(evaluateDiagramTriggers(trigger({
      hints: hints({ emotionalDisclosure: true, itemCount: 6 }),
    })).action).toBe('none')
    expect(evaluateDiagramTriggers(trigger({
      voice: 'ego',
      framework: 'Issue Trees / MECE',
      hints: hints({ emotionalDisclosure: true, optionsCount: 4, objectiveDefined: true }),
    })).action).toBe('none')
  })

  test('TR-11 and TR-12 Ego maps routes only after the objective is named', () => {
    expect(evaluateDiagramTriggers(trigger({
      voice: 'ego',
      framework: 'Issue Trees / MECE',
      hints: hints({ optionsCount: 4, objectiveDefined: true }),
    }))).toMatchObject({ action: 'offer', grammar: 'campaign', copyKey: 'ego.campaign' })
    expect(evaluateDiagramTriggers(trigger({
      voice: 'ego',
      framework: 'Issue Trees / MECE',
      hints: hints({ optionsCount: 4, objectiveDefined: false }),
    })).action).toBe('ask_objective')
  })

  test('TR-13 a committed decision is not mapped', () => {
    expect(evaluateDiagramTriggers(trigger({
      voice: 'ego',
      framework: 'Issue Trees / MECE',
      hints: hints({ decisionCommitted: true, optionsCount: 4, objectiveDefined: true }),
    })).action).toBe('none')
  })

  test('TR-14 a slow pipeline offers the bottleneck map', () => {
    expect(evaluateDiagramTriggers(trigger({
      voice: 'ego',
      framework: 'Theory of Constraints',
      hints: hints({ stagesCount: 3, throughputComplaint: true }),
    }))).toMatchObject({ action: 'offer', grammar: 'bottleneck', copyKey: 'ego.bottleneck' })
  })

  test('TR-15 and TR-16 urgency and headlines stay in prose', () => {
    expect(evaluateDiagramTriggers(trigger({
      voice: 'ego',
      framework: 'Issue Trees / MECE',
      urgent: true,
      hints: hints({ optionsCount: 4, objectiveDefined: true }),
    })).action).toBe('none')
    expect(evaluateDiagramTriggers(trigger({
      framework: 'Iceberg Model',
      c2: 'Headline',
      hints: hints({ recurrence: true }),
    })).action).toBe('none')
  })

  test('TR-17 and TR-18 one decline holds until the framework changes', () => {
    expect(evaluateDiagramTriggers(trigger({
      framework: 'Iceberg Model',
      offerDeclinedForFramework: 'Iceberg Model',
      hints: hints({ recurrence: true }),
    })).action).toBe('none')
    expect(evaluateDiagramTriggers(trigger({
      framework: 'Iceberg Model',
      offerDeclinedForFramework: '5 Whys',
      hints: hints({ recurrence: true }),
    }))).toMatchObject({ action: 'offer', grammar: 'iceberg' })
  })

  test('TR-19 new structure updates an existing map', () => {
    expect(evaluateDiagramTriggers(trigger({
      voice: 'ego',
      framework: 'Issue Trees / MECE',
      mapExists: true,
      hints: hints({ newStructure: true }),
    })).action).toBe('update')
  })

  test('TR-20 through TR-22 the universal threshold drops for a sketch thinker', () => {
    expect(evaluateDiagramTriggers(trigger({
      framework: 'Pre-Mortem',
      hints: hints({ itemCount: 5 }),
    }))).toMatchObject({ action: 'offer', grammar: 'core_radial', copyKey: 'ethos.universal' })
    expect(evaluateDiagramTriggers(trigger({
      framework: 'Pre-Mortem',
      profile: { r3: 7, r4: 4 },
      hints: hints({ itemCount: 4 }),
    })).action).toBe('offer')
    expect(evaluateDiagramTriggers(trigger({
      framework: 'Pre-Mortem',
      profile: { r3: 3, r4: 4 },
      hints: hints({ itemCount: 4 }),
    })).action).toBe('none')
  })

  test('TR-23 and TR-24 Ethos listens on the first turn unless the user wants the whole picture', () => {
    expect(evaluateDiagramTriggers(trigger({
      framework: 'Iceberg Model',
      brainstormUserTurn: 1,
      profile: { r3: 4, r4: 4 },
      hints: hints({ recurrence: true }),
    })).action).toBe('none')
    expect(evaluateDiagramTriggers(trigger({
      framework: 'Iceberg Model',
      brainstormUserTurn: 1,
      profile: { r3: 4, r4: 6 },
      hints: hints({ recurrence: true }),
    }))).toMatchObject({ action: 'offer', grammar: 'iceberg' })
  })

  test('TR-25 and TR-26 Ego can offer on the first turn, including a disabled v2 framework', () => {
    expect(evaluateDiagramTriggers(trigger({
      voice: 'ego',
      framework: 'Issue Trees / MECE',
      brainstormUserTurn: 1,
      hints: hints({ optionsCount: 3, objectiveDefined: true }),
    }))).toMatchObject({ action: 'offer', grammar: 'campaign' })
    expect(evaluateDiagramTriggers(trigger({
      voice: 'ego',
      framework: 'Five Forces',
      hints: hints({ optionsCount: 3, objectiveDefined: true }),
    }))).toMatchObject({ action: 'offer', grammar: 'campaign' })
  })

  test('TR-27 a short profile with no thinking items uses the defaults', () => {
    expect(() => evaluateDiagramTriggers(trigger({ profile: {} }))).not.toThrow()
    expect(evaluateDiagramTriggers(trigger({ profile: {} })).action).toBe('none')
  })
})
