import { radialModel } from './layout/ethosRadial.js'
import { decisivePath } from './prune.js'

function ethosOutline(spec) {
  const model = radialModel(spec)
  const lines = []
  const coreMark = model.core.id === '__core' ? ' (unexamined)' : ''
  lines.push(`- Core: ${model.core.label}${coreMark}`)
  const walk = (id, depth) => {
    for (const child of model.children.get(id) || []) {
      const untraced = model.unexamined.includes(child.id)
      lines.push(`${'  '.repeat(depth)}- ${child.label}${untraced ? ' (untraced)' : ''}`)
      walk(child.id, depth + 1)
    }
  }
  walk(model.core.id, 1)
  return lines.join('\n')
}

function campaignOutline(spec) {
  const result = decisivePath(spec)
  const label = new Map(spec.nodes.map((node) => [node.id, node.label]))
  const lines = [`Decisive path: ${result.path.map((id) => label.get(id)).join(' → ')}`]
  if (result.pruned.length) lines.push(`Cut: ${result.pruned.map((id) => label.get(id)).join(', ')}`)
  return lines.join('\n')
}

export function toOutline(spec) {
  if (spec.grammar === 'campaign') return campaignOutline(spec)
  if (spec.grammar === 'core_radial') return ethosOutline(spec)
  return spec.nodes.map((node) => `- ${node.label}`).join('\n')
}
