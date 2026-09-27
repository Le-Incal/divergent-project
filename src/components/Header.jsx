import { useEffect, useState } from 'react'

export default function Header({ onRestart }) {
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
          <span className="topNavBrand" aria-hidden="true">Divergent</span>
        </button>
      </div>
    </nav>
  )
}
