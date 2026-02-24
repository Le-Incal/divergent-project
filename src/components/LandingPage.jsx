import { useLayoutEffect, useRef, useState } from 'react'

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

    if (!hero || !titleLayer || !titleText || !imageFrame) return

    let raf = 0
    const isMobile = () => window.matchMedia?.('(max-width: 960px)')?.matches ?? false
    const align = () => {
      if (isMobile()) {
        titleLayer.style.top = ''
        return
      }

      const heroRect = hero.getBoundingClientRect()
      const frameRect = imageFrame.getBoundingClientRect()

      const imageTop = frameRect.top - heroRect.top
      const fontSize = parseFloat(getComputedStyle(titleText).fontSize || '0')
      const capOffset = fontSize * 0.08
      const offsetValue = getComputedStyle(hero).getPropertyValue('--landing-title-offset')?.trim() || '0'
      const titleOffsetPx = offsetValue.endsWith('in')
        ? parseFloat(offsetValue) * 96
        : parseFloat(offsetValue)
      titleLayer.style.top = `${imageTop - capOffset + titleOffsetPx}px`
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(align)
    }

    const ro = new ResizeObserver(schedule)
    ro.observe(hero)
    ro.observe(imageFrame)
    ro.observe(titleText)

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
                <span className="landingSubtitleText">EGO vs ETHOS</span>
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
                  Dual-mode AI externalizing internal dialogue. Two contrasting voices<br />side-by-side, in debate will reveal where your paths split.
                </p>
                <ul className="landingHypotheses" style={{ marginTop: 'var(--space-4)' }}>
                  <li>
                    <span className="landingHypNum">Hypothesis 01:</span> Complete worldviews can be created for AI
                  </li>
                  <li>
                    <span className="landingHypNum">Hypothesis 02:</span> Worldviews can be used to build unique LLM personas
                  </li>
                  <li>
                    <span className="landingHypNum">Hypothesis 03:</span> Opposing personas can organically debate each other
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

