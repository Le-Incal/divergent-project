import { useEffect, useState } from 'react'

export default function Header({ onOpenSettings }) {
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
        <div className="topNavBrand">DIVERGENT</div>
        <div className="topNavActions">
          <button type="button" className="btn btn-secondary" onClick={onOpenSettings}>
            Settings
          </button>
        </div>
      </div>
    </nav>
  )
}
