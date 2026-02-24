import { useEffect, useState } from 'react'

export default function Header({ onOpenPanel, onRestart }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className={`topNav ${scrolled ? 'isScrolled' : ''}`} aria-label="Primary">
      <div className="topNavInner">
        <button type="button" className="topNavBrandBtn" onClick={onRestart} aria-label="Restart and start a new chat">
          <span className="topNavBrand">DIVERGENT</span>
        </button>
        <div className="topNavActions">
          <button type="button" className="hamburgerBtn" onClick={onOpenPanel} aria-label="Open panel">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  )
}
