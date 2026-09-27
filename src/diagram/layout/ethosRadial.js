import { hierarchy, tree } from 'd3-hierarchy'

const R_OUTER = 300

function coreOf(spec) {
  return spec.nodes.find((node) => node.kind === 'root_belief') || null
}

export function radialModel(spec) {
  const belief = coreOf(spec)
  const core = belief || { id: '__core', label: '?', status: 'unexamined', kind: 'core' }
  const others = spec.nodes.filter((node) => node.id !== core.id)
  const maxLayer = others.reduce((highest, node) => Math.max(highest, node.layer || 0), 0)
  const children = new Map([[core.id, []]])
  others.forEach((node) => {
    const parent = node.into && (node.into === core.id || others.some((item) => item.id === node.into) || belief?.id === node.into)
      ? node.into
      : core.id
    if (!children.has(parent)) children.set(parent, [])
    children.get(parent).push(node)
  })
  const unexamined = others
    .filter((node) => node.into == null && node.layer < maxLayer)
    .map((node) => node.id)
  return { core, others, maxLayer, children, unexamined }
}

function hierarchyFrom(id, children) {
  const kids = children.get(id) || []
  const data = { id, children: kids.map((node) => hierarchyFrom(node.id, children)) }
  if (!data.children.length) delete data.children
  return data
}

export function layoutRadial(spec, opts = {}) {
  const model = radialModel(spec)
  const laid = tree().size([2 * Math.PI, 1])(hierarchy(hierarchyFrom(model.core.id, model.children)))
  const angles = new Map()
  laid.each((node) => angles.set(node.data.id, node.x))
  const nodes = []
  const place = (node, layer) => {
    if (node.pinned && node.pinnedPosition) {
      nodes.push({ ...node, ...node.pinnedPosition, layer, angle: angles.get(node.id) ?? 0 })
      return
    }
    const radius = node.id === model.core.id ? 0 : (opts.rOuter || R_OUTER) * (1 - layer / (model.maxLayer + 1))
    const angle = angles.get(node.id) ?? 0
    nodes.push({
      ...node,
      layer,
      angle,
      x: radius * Math.cos(angle - Math.PI / 2),
      y: radius * Math.sin(angle - Math.PI / 2),
    })
  }
  place(model.core, model.core.layer ?? model.maxLayer)
  model.others.forEach((node) => place(node, node.layer || 0))
  return {
    nodes,
    edges: spec.edges,
    maxLayer: model.maxLayer,
    flags: { unexamined: model.unexamined },
  }
}
