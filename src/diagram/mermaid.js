import { decisivePath } from './prune.js'
import { radialModel } from './layout/ethosRadial.js'

function campaignMermaid(spec) {
  const { pruned } = decisivePath(spec)
  const lines = ['flowchart LR']
  spec.edges.forEach((item) => lines.push(`${item.source} --> ${item.target}`))
  if (pruned.length) lines.push(`class ${pruned.join(',')} pruned`)
  return lines.join('\n')
}

function ethosMermaid(spec) {
  const model = radialModel(spec)
  const lines = ['flowchart TD']
  const walk = (id) => {
    for (const child of model.children.get(id) || []) {
      lines.push(`${id} --> ${child.id}`)
      walk(child.id)
    }
  }
  walk(model.core.id)
  return lines.join('\n')
}

export function toMermaid(spec) {
  if (spec.grammar === 'campaign') return campaignMermaid(spec)
  if (spec.grammar === 'core_radial') return ethosMermaid(spec)
  return 'flowchart LR'
}
