export default function LandingPage({ onEnter }) {
  return (
    <div className="landing-hero">
      <div className="landing-overlay" />

      <div className="landing-shell">
        <div className="landing-card">
          <div className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-4 flex-wrap">
              <div>
                <div
                  className="font-display text-2xl font-extrabold tracking-[0.22em]"
                  style={{ color: 'var(--soft-white)' }}
                >
                  DIVERGENT
                </div>
                <div className="text-sm font-medium mt-2" style={{ color: 'rgba(245, 250, 250, 0.82)' }}>
                  See where your paths diverge.
                </div>
              </div>

              <div className="text-xs font-semibold uppercase" style={{ color: 'rgba(245, 250, 250, 0.7)' }}>
                Ethos vs Ego
              </div>
            </div>

            <p className="text-sm leading-relaxed mt-2" style={{ color: 'rgba(245, 250, 250, 0.86)' }}>
              Divergent is a dual-mode AI platform that externalizes the internal dialogue you have when facing a choice.
              Two contrasting voices respond side-by-side, then exchange rounds of debate to clarify where they truly disagree.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
              <div className="landing-pill">
                <div className="landing-pill-title">Default mode</div>
                <div className="landing-pill-body">
                  Constructive, opinionated perspectives designed to help you think more clearly. Guardrails + decision-tool
                  disclaimer.
                </div>
              </div>
              <div className="landing-pill">
                <div className="landing-pill-title">Sandpit mode</div>
                <div className="landing-pill-body">
                  Adversarial by design. Same personas, but instructed to argue and compete. Research disclaimer; model-native
                  limits only.
                </div>
              </div>
            </div>

            <div className="landing-disclaimer mt-2">
              <div className="text-xs font-semibold uppercase mb-2" style={{ letterSpacing: '0.08em' }}>
                Disclaimer
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'rgba(245, 250, 250, 0.82)' }}>
                Divergent is a decision tool that shows contrasting perspectives. It is not professional advice and does not
                replace therapy, legal, financial, or medical counsel. In Sandpit mode, content is experimental and
                adversarial by design.
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 flex-wrap">
              <button className="landing-enter-btn" onClick={onEnter}>
                Enter Divergent
              </button>
              <div className="text-[11px] opacity-75" style={{ color: 'rgba(245, 250, 250, 0.8)' }}>
                No account. Ephemeral sessions for v1.
              </div>
            </div>
          </div>
        </div>

        <div className="landing-credit">
          Artwork used with rights held by the project owner.
        </div>
      </div>
    </div>
  )
}

