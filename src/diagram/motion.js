export function motionFor(voice, reducedMotion) {
  if (reducedMotion) return { duration: 0, easing: voice === 'ego' ? 'easeOutQuad' : 'easeInOutCubic' }
  if (voice === 'ego') return { duration: 250, easing: 'easeOutQuad' }
  return { duration: 900, easing: 'easeInOutCubic' }
}
