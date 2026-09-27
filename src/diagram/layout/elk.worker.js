import ELK from 'elkjs/lib/elk.bundled.js'

const elk = new ELK()

self.onmessage = async (event) => {
  try {
    const laid = await elk.layout(event.data)
    self.postMessage({ ok: true, laid })
  } catch (error) {
    self.postMessage({ ok: false, error: error?.message || 'layout failed' })
  }
}
