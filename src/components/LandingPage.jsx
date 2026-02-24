import { useLayoutEffect, useRef, useState } from 'react'

function hypPhrases(text) {
  const trimmed = text.trim()
  if (!trimmed) return trimmed
  const segments = trimmed.split(/(?<=[.,;:!?])\s+/)
  return segments.map((segment, i) => (
    <span key={i}>
      {i > 0 && ' '}
      <span className="landingHypSentence">{segment}</span>
    </span>
  ))
}

export default function LandingPage({ onEnter }) {
  const [isEntering, setIsEntering] = useState(false)
  const heroRef = useRef(null)
  const titleLayerRef = useRef(null)
  const titleTextRef = useRef(null)
  const imageFrameRef = useRef(null)
  const imageRef = useRef(null)
  const ctaAreaRef = useRef(null)
  const contentColRef = useRef(null)

  const handleEnter = () => {
    if (isEntering) return
    setIsEntering(true)
    // Let the button animation play briefly before entering.
    window.setTimeout(() => onEnter?.(), 280)
  }

  useLayoutEffect(() => {
    const hero = heroRef.current
    const titleLayer = titleLayerRef.current
    const titleText = titleTextRef.current
    const imageFrame = imageFrameRef.current
    const contentCol = contentColRef.current

    if (!hero || !titleLayer || !titleText || !imageFrame || !contentCol) return

    let raf = 0
    const isMobile = () => window.matchMedia?.('(max-width: 960px)')?.matches ?? false
    const align = () => {
      if (isMobile()) {
        titleLayer.style.removeProperty('--landing-title-base')
        titleLayer.style.removeProperty('--landing-title-offset')
        contentCol.style.height = ''
        return
      }

      const heroRect = hero.getBoundingClientRect()
      const frameRect = imageFrame.getBoundingClientRect()

      const imageTop = frameRect.top - heroRect.top
      const imageBottom = frameRect.bottom - heroRect.top
      const paddingTopPx = parseFloat(getComputedStyle(contentCol).paddingTop) || 0
      const contentHeightPx = Math.max(0, imageBottom - paddingTopPx)
      const fontSize = parseFloat(getComputedStyle(titleText).fontSize || '0')
      const capOffset = fontSize * 0.08
      const basePx = imageTop - capOffset
      const root = hero.closest('.landingPage')
      const offsetValue = root ? getComputedStyle(root).getPropertyValue('--landing-title-offset').trim() || '0.5in' : '0.5in'
      titleLayer.style.setProperty('--landing-title-base', `${basePx}px`)
      titleLayer.style.setProperty('--landing-title-offset', offsetValue)
      contentCol.style.height = `${contentHeightPx}px`
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(align)
    }

    const ro = new ResizeObserver(schedule)
    ro.observe(hero)
    ro.observe(imageFrame)
    ro.observe(titleText)
    ro.observe(contentCol)

    window.addEventListener('resize', schedule)
    const img = imageRef.current
    img?.addEventListener?.('load', schedule, { once: true })

    schedule()
    const t1 = window.setTimeout(schedule, 300)
    const t2 = window.setTimeout(schedule, 800)

    return () => {
      window.removeEventListener('resize', schedule)
      ro.disconnect()
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      cancelAnimationFrame(raf)
      img?.removeEventListener?.('load', schedule)
    }
  }, [])

  return (
    <div className="landingPage">
      <div className="landingContainer">
        <div className="landingHero" id="hero" ref={heroRef}>
          <div className="landingTitleLayer" id="titleLayer" ref={titleLayerRef} aria-hidden="true">
            <span className="landingTitleText" id="titleText" ref={titleTextRef}>
              Divergent
            </span>
          </div>

          <div className="landingImageCol">
            <div className="landingImageFrame" id="imageFrame" ref={imageFrameRef}>
              <img ref={imageRef} src="/divergent-hero.jpg" alt="" loading="eager" decoding="async" />
              <div className="landingSubtitleOverlay" id="subtitleOverlay">
                <span className="landingSubtitleText"><span className="landingSubtitleStrong">EGO</span> vs <span className="landingSubtitleStrong">ETHOS</span></span>
              </div>
            </div>
            <p className="landingCaption">
              A worker torn between the devil of the strike and the angel of the law. A satirical commentary on labor unrest
              in post-unification Italy. <em>Il Fischietto</em>, August 3, 1872. Used with Rights, Getty Images
            </p>
          </div>

          <div className="landingContentCol" ref={contentColRef}>
            <div className="landingBlocks">
              <div className="landingBlock">
                <p className="landingBody">
                  Most AI persona work engineers voice. Vocabulary, tone, opinion sets. Divergent asks a deeper question: can AI reason from fundamentally incompatible foundations, and is the tension between those foundations more useful to a human decision-maker than any single perspective?
                </p>
                <p className="landingBody landingBodySecond">
                  Dual-mode AI externalizing internal dialogue. Two contrasting voices side-by-side, in debate, revealing where your paths diverge.
                </p>
                <ul className="landingHypotheses" style={{ marginTop: 'var(--space-4)' }}>
                  <li>
                    <span className="landingHypHighlight"><span className="landingHypNum">H1:</span></span>
                    {' '}
                    {hypPhrases('AI voices can be built from epistemological operating systems, not just personality traits.')}
                  </li>
                  <li>
                    <span className="landingHypHighlight"><span className="landingHypNum">H2:</span></span>
                    {' '}
                    {hypPhrases('Inverse reasoning architectures can hold structural separation under pressure.')}
                  </li>
                  <li>
                    <span className="landingHypHighlight"><span className="landingHypNum">H3:</span></span>
                    {' '}
                    {hypPhrases('Genuine tension produces better decisions than consensus or single-perspective advice.')}
                  </li>
                </ul>
              </div>

              <div className="landingBlock">
                <p className="landingBody landingBodyNotice">
                  Divergent is not professional advice and does not replace therapy, legal,<br />financial, or medical counsel. In Sandpit mode content becomes unfiltered<br />and adversarial by design.
                </p>
              </div>
            </div>

            <div className="landingCta" ref={ctaAreaRef}>
              <p className="landingCtaTagline">See where your paths diverge</p>
              <button type="button" className="btn btn-primary btn-arrow" onClick={handleEnter} disabled={isEntering}>
                Enter Divergent
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

