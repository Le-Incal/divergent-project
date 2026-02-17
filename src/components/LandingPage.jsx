export default function LandingPage({ onEnter }) {
  return (
    <div className="landing-hero">
      <div className="landing-overlay" />

      <div className="landing-shell">
        <div className="landing-content">
          <div className="landing-kicker">Ethos vs Ego</div>

          <div className="landing-title font-display">Divergent</div>
          <div className="landing-tagline">See where your paths diverge.</div>

          <div className="landing-blurb">
            A dual-mode AI platform that externalizes the internal dialogue you have when facing a choice—two contrasting
            voices side-by-side, then rounds of exchange to reveal where the paths split.
          </div>

          <button className="landing-enter-btn" onClick={onEnter}>
            <span>Enter Divergent</span>
            <span className="landing-enter-arrow-box" aria-hidden="true">
              <span className="landing-enter-arrow">→</span>
            </span>
          </button>

          <div className="landing-fineprint">
            Divergent is a decision tool that shows contrasting perspectives. It is not professional advice and does not
            replace therapy, legal, financial, or medical counsel. In Sandpit mode, content is experimental and adversarial
            by design.
          </div>
        </div>

        <div className="landing-credit">
          Artwork used with rights held by the project owner.
        </div>
      </div>
    </div>
  )
}

