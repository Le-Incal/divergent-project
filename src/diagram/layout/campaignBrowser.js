import { campaignGraph, positionsFromElk } from './campaign.js'

let elkPromise

function getElk() {
  if (!elkPromise) {
    elkPromise = import('elkjs/lib/elk.bundled.js').then((mod) => new mod.default())
  }
  return elkPromise
}

export async function layoutCampaignBrowser(spec) {
  const elk = await getElk()
  const laid = await elk.layout(campaignGraph(spec))
  return positionsFromElk(spec, laid)
}
