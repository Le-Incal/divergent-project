import { campaignGraph, positionsFromElk } from './campaign.js'

export function layoutCampaignBrowser(spec) {
  const graph = campaignGraph(spec)
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./elk.worker.js', import.meta.url), { type: 'module' })
    const finish = (error) => {
      worker.terminate()
      if (error) reject(error)
    }
    worker.onmessage = (event) => {
      worker.terminate()
      if (!event.data?.ok) {
        reject(new Error(event.data?.error || 'layout failed'))
        return
      }
      resolve(positionsFromElk(spec, event.data.laid))
    }
    worker.onerror = (event) => finish(event.error || new Error('ELK worker failed'))
    worker.postMessage(graph)
  })
}
