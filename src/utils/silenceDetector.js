/**
 * Monitor an audio stream for silence after speech using Web Audio API.
 * Calls onSilence() when the user stops talking for the configured duration.
 * Returns an object with a stop() method to tear down.
 */
export function createSilenceDetector(stream, onSilence, options = {}) {
  const {
    threshold = 0.035,
    silenceDuration = 2000,
    minSpeechDuration = 500,
  } = options

  const audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream)
  const analyser = audioContext.createAnalyser()
  analyser.fftSize = 2048
  source.connect(analyser)

  const dataArray = new Float32Array(analyser.fftSize)
  let silentSince = null
  let hasSpeechStarted = false
  let speechStartTime = null
  let animationId = null
  let stopped = false

  function check() {
    if (stopped) return
    analyser.getFloatTimeDomainData(dataArray)
    let sum = 0
    for (let i = 0; i < dataArray.length; i++) {
      sum += dataArray[i] * dataArray[i]
    }
    const rms = Math.sqrt(sum / dataArray.length)

    if (rms >= threshold) {
      if (!hasSpeechStarted) {
        hasSpeechStarted = true
        speechStartTime = Date.now()
      }
      silentSince = null
    } else if (
      hasSpeechStarted &&
      speechStartTime &&
      Date.now() - speechStartTime >= minSpeechDuration
    ) {
      if (!silentSince) {
        silentSince = Date.now()
      } else if (Date.now() - silentSince >= silenceDuration) {
        onSilence()
        stop()
        return
      }
    }
    animationId = requestAnimationFrame(check)
  }

  function stop() {
    stopped = true
    if (animationId) cancelAnimationFrame(animationId)
    try { source.disconnect() } catch {}
    audioContext.close().catch(() => {})
  }

  check()
  return { stop }
}
