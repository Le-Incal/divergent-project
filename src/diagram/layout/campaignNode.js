import { campaignGraph, positionsFromElk } from './campaign.js'

async function loadElk() {
  const { createRequire } = await import('node:module')
  const require = createRequire(import.meta.url)
  const imported = require('elkjs/lib/elk.bundled.js')
  return imported.default || imported
}

export async function layoutCampaign(spec) {
  const ELK = await loadElk()
  const laid = await new ELK().layout(campaignGraph(spec))
  return positionsFromElk(spec, laid)
}
