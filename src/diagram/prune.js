function adjacency(spec) {
  const next = new Map(spec.nodes.map((node) => [node.id, []]))
  spec.edges.forEach((item) => {
    if (next.has(item.source)) next.get(item.source).push(item.target)
  })
  return next
}

function meanLeverage(path, byId) {
  const options = path.map((id) => byId.get(id)).filter((node) => node?.kind === 'option')
  if (!options.length) return 0
  return options.reduce((sum, node) => sum + node.leverage, 0) / options.length
}

export function decisivePath(spec) {
  const byId = new Map(spec.nodes.map((node) => [node.id, node]))
  const start = spec.nodes.find((node) => node.kind === 'start')
  const objective = spec.nodes.find((node) => node.kind === 'objective')
  const removed = new Set(spec.nodes.filter((node) => node.killedBy === 'user').map((node) => node.id))
  const paths = []
  if (start && objective) {
    const next = adjacency(spec)
    const walk = (id, stack) => {
      if (removed.has(id)) return
      if (id === objective.id) {
        paths.push([...stack])
        return
      }
      for (const target of next.get(id) || []) {
        if (stack.includes(target)) continue
        stack.push(target)
        walk(target, stack)
        stack.pop()
      }
    }
    walk(start.id, [start.id])
  }

  if (!paths.length) {
    return {
      path: [],
      pruned: [],
      noPath: true,
      flags: { offPath: [] },
      spec,
    }
  }

  paths.sort((a, b) => {
    const score = meanLeverage(b, byId) - meanLeverage(a, byId)
    if (Math.abs(score) > 1e-9) return score
    if (a.length !== b.length) return a.length - b.length
    return a.join('>').localeCompare(b.join('>'))
  })
  const path = paths[0]
  const onPath = new Set(path)
  const offPath = []
  const pruned = []
  const nodes = spec.nodes.map((node) => {
    if (node.killedBy === 'user') return { ...node, status: 'pruned', killedBy: 'user' }
    if (node.kind === 'start' || node.kind === 'objective' || onPath.has(node.id)) {
      return { ...node, status: 'active' }
    }
    if (node.pinned) {
      offPath.push(node.id)
      return { ...node, status: 'active' }
    }
    pruned.push(node.id)
    return { ...node, status: 'pruned' }
  })
  return {
    path,
    pruned,
    noPath: false,
    flags: { offPath },
    spec: { ...spec, nodes },
  }
}

export function killBranch(spec, nodeId) {
  const marked = {
    ...spec,
    nodes: spec.nodes.map((node) => (
      node.id === nodeId ? { ...node, status: 'pruned', killedBy: 'user' } : node
    )),
  }
  return decisivePath(marked)
}
