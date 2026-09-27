export function nodeSize(node) {
  const leverage = node.kind === 'option' ? Number(node.leverage) || 0 : 1
  return {
    width: 120 + 80 * leverage,
    height: 48 + 24 * leverage,
  }
}

export function campaignGraph(spec) {
  return {
    id: spec.diagramId || 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': 'RIGHT',
      'elk.spacing.nodeNode': '40',
      'elk.layered.spacing.nodeNodeBetweenLayers': '60',
    },
    children: spec.nodes.map((node) => {
      const size = node.status === 'pruned'
        ? { width: 48, height: 24 }
        : nodeSize(node)
      const layoutOptions = {}
      if (node.kind === 'start') layoutOptions['elk.layered.layering.layerConstraint'] = 'FIRST'
      if (node.kind === 'objective') layoutOptions['elk.layered.layering.layerConstraint'] = 'LAST'
      return { id: node.id, ...size, layoutOptions }
    }),
    edges: spec.edges.map((item) => ({
      id: item.id,
      sources: [item.source],
      targets: [item.target],
    })),
  }
}

export function positionsFromElk(spec, laid) {
  const byId = new Map(spec.nodes.map((node) => [node.id, node]))
  const nodes = (laid.children || []).map((child) => {
    const source = byId.get(child.id)
    const pinned = source?.pinned && source.pinnedPosition
    return {
      ...source,
      x: pinned ? source.pinnedPosition.x : child.x,
      y: pinned ? source.pinnedPosition.y : child.y,
      width: child.width,
      height: child.height,
    }
  })
  return { nodes, edges: spec.edges, flags: {} }
}
