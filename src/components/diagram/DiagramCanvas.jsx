import { useEffect, useMemo, useRef, useState } from 'react'
import { ReactFlow } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { toPng } from 'html-to-image'
import { layoutRadial } from '../../diagram/layout/ethosRadial.js'
import { layoutIceberg } from '../../diagram/layout/iceberg.js'
import { layoutBottleneck } from '../../diagram/layout/bottleneck.js'
import { layoutCampaignBrowser } from '../../diagram/layout/campaignBrowser.js'
import { toOutline } from '../../diagram/outline.js'
import { motionFor } from '../../diagram/motion.js'

function DiagramNode({ data }) {
  const classes = [
    'diagramNode',
    data.voice === 'ego' ? 'diagramNode--ego' : 'diagramNode--ethos',
    data.core ? 'diagramNode--core' : '',
    data.status === 'pruned' ? 'diagramNode--pruned' : '',
    data.status === 'unexamined' || data.untraced ? 'diagramNode--unexamined' : '',
  ].filter(Boolean).join(' ')
  return (
    <div
      className={classes}
      style={data.width ? { width: data.width, minHeight: data.height } : undefined}
      aria-label={`${data.label}, ${data.kind}, ${data.status}`}
    >
      {data.label}
    </div>
  )
}

function WaterlineNode() {
  return <div className="diagramWaterline" aria-hidden="true" />
}

const nodeTypes = { diagram: DiagramNode, waterline: WaterlineNode }

function shift(nodes) {
  if (!nodes.length) return nodes
  const minX = Math.min(...nodes.map((node) => node.x || 0))
  const minY = Math.min(...nodes.map((node) => node.y || 0))
  return nodes.map((node) => ({ ...node, x: (node.x || 0) - minX + 32, y: (node.y || 0) - minY + 32 }))
}

async function layOut(spec) {
  if (spec.grammar === 'iceberg') return layoutIceberg(spec)
  if (spec.grammar === 'bottleneck') return layoutBottleneck(spec)
  if (spec.grammar === 'campaign') return layoutCampaignBrowser(spec)
  return layoutRadial(spec)
}

export default function DiagramCanvas({ spec }) {
  const frame = useRef(null)
  const [layout, setLayout] = useState(null)
  const [error, setError] = useState('')
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const motion = motionFor(spec.voice, reduced)

  useEffect(() => {
    let cancelled = false
    layOut(spec).then((next) => {
      if (!cancelled) setLayout(next)
    }).catch((err) => {
      if (!cancelled) setError(err?.message || 'The map could not be laid out.')
    })
    return () => { cancelled = true }
  }, [spec])

  const flow = useMemo(() => {
    if (!layout) return { nodes: [], edges: [] }
    const placed = shift(layout.nodes)
    const unexamined = new Set(layout.flags?.unexamined || [])
    const nodes = placed.map((node) => ({
      id: node.id,
      type: 'diagram',
      position: { x: node.x, y: node.y },
      data: {
        label: node.label,
        kind: node.kind || 'node',
        status: node.status || 'active',
        voice: spec.voice,
        core: node.id === '__core' || node.kind === 'root_belief',
        untraced: unexamined.has(node.id),
        width: spec.voice === 'ego' ? node.width : undefined,
        height: spec.voice === 'ego' ? node.height : undefined,
      },
      draggable: false,
    }))
    if (layout.flags?.waterlineY != null) {
      const minY = Math.min(...layout.nodes.map((node) => node.y || 0))
      nodes.push({
        id: '__waterline',
        type: 'waterline',
        position: { x: 32, y: layout.flags.waterlineY - minY + 32 },
        data: {},
        draggable: false,
        selectable: false,
        focusable: false,
      })
    }
    const edges = (spec.edges || []).map((item) => ({
      id: item.id,
      source: item.source,
      target: item.target,
      type: spec.voice === 'ethos' ? 'simplebezier' : 'smoothstep',
      style: { stroke: 'var(--ink-tertiary)' },
    }))
    unexamined.forEach((id) => {
      edges.push({
        id: `untraced-${id}`,
        source: id,
        target: '__core',
        type: 'simplebezier',
        style: { stroke: 'var(--ink-ghost)', strokeDasharray: '4 4' },
      })
    })
    return { nodes, edges }
  }, [layout, spec])

  const outline = useMemo(() => {
    try { return toOutline(spec) } catch { return '' }
  }, [spec])

  const savePng = async () => {
    if (!frame.current) return
    const data = await toPng(frame.current, { cacheBust: true })
    const link = document.createElement('a')
    link.href = data
    link.download = `${spec.diagramId || 'diagram'}.png`
    link.click()
  }

  return (
    <div className="diagramWrap">
      {error && <p className="diagramOutline">{error}</p>}
      <div ref={frame} className="diagramCanvas" style={{ '--diagram-motion': `${motion.duration}ms` }}>
        <ReactFlow
          nodes={flow.nodes}
          edges={flow.edges}
          nodeTypes={nodeTypes}
          fitView
          nodesDraggable={false}
          nodesFocusable
          edgesFocusable={false}
          panOnDrag
          proOptions={{ hideAttribution: true }}
        />
      </div>
      {outline && <pre className="diagramOutline">{outline}</pre>}
      <button type="button" className="brainstormChoice" onClick={savePng}>Save image</button>
    </div>
  )
}
