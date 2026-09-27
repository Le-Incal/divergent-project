const STAGE_W = 160
const GAP = 40

export function layoutBottleneck(spec, opts = {}) {
  const stageW = opts.stageW || STAGE_W
  const gap = opts.gap || GAP
  const stages = [...spec.nodes].sort((a, b) => a.order - b.order)
  let constraint = stages[0]
  stages.forEach((stage) => {
    if (stage.throughput < constraint.throughput) constraint = stage
  })
  const nodes = stages.map((stage, index) => ({
    ...stage,
    x: stage.pinned && stage.pinnedPosition ? stage.pinnedPosition.x : index * (stageW + gap),
    y: stage.pinned && stage.pinnedPosition ? stage.pinnedPosition.y : 0,
    scale: stage.id === constraint?.id ? 1.4 : 1,
  }))
  return {
    nodes,
    edges: spec.edges,
    flags: { constraintId: constraint?.id || null },
  }
}
