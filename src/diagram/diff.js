export function diffSpecs(prev, next) {
  const prevIds = prev.nodes.map((node) => node.id)
  const nextById = new Map(next.nodes.map((node) => [node.id, node]))
  const prevById = new Map(prev.nodes.map((node) => [node.id, node]))
  const kept = []
  const pruned = []
  const restored = []
  prevIds.forEach((id) => {
    const after = nextById.get(id)
    if (!after) return
    const wasPruned = prevById.get(id).status === 'pruned'
    const nowPruned = after.status === 'pruned'
    if (!nowPruned) kept.push(id)
    if (!wasPruned && nowPruned) pruned.push(id)
    if (wasPruned && !nowPruned) restored.push(id)
  })
  return {
    kept,
    added: next.nodes.filter((node) => !prevById.has(node.id)).map((node) => node.id),
    removed: prevIds.filter((id) => !nextById.has(id)),
    pruned,
    restored,
  }
}
