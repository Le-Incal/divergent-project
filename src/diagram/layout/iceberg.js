const BANDS = ['event', 'pattern', 'structure', 'belief']
const W = 900
const BAND_H = 120

export function layoutIceberg(spec, opts = {}) {
  const width = opts.width || W
  const bandH = opts.bandH || BAND_H
  const grouped = new Map(BANDS.map((kind) => [kind, []]))
  spec.nodes.forEach((node) => {
    if (grouped.has(node.kind)) grouped.get(node.kind).push(node)
  })
  const nodes = []
  BANDS.forEach((kind, bandIndex) => {
    const band = grouped.get(kind)
    band.forEach((node, index) => {
      const position = node.pinned && node.pinnedPosition
        ? node.pinnedPosition
        : {
          x: ((index + 1) * width) / (band.length + 1),
          y: bandIndex * bandH + bandH / 2,
        }
      nodes.push({ ...node, ...position })
    })
  })
  const hasEvent = grouped.get('event').length > 0
  const unexaminedBands = hasEvent
    ? BANDS.filter((kind) => grouped.get(kind).length === 0)
    : []
  return {
    nodes,
    edges: spec.edges,
    flags: { unexaminedBands, waterlineY: bandH },
  }
}
