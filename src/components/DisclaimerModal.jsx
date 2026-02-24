import { useState, useEffect } from 'react'

const STORAGE_KEY = 'divergent-default-disclaimer-seen'

export default function DisclaimerModal({ onAccept }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const seen = sessionStorage.getItem(STORAGE_KEY)
    if (!seen) setOpen(true)
  }, [])

  const handleAccept = () => {
    sessionStorage.setItem(STORAGE_KEY, 'true')
    setOpen(false)
    onAccept?.()
  }

  if (!open) return null

  return (
    <div className="modalOverlay" role="dialog" aria-label="Disclaimer">
      <div className="modalPanel">
        <div className="modalTitle">Before you start</div>
        <p className="modalBody">
          Divergent is a decision tool that shows you contrasting perspectives. It is not professional advice. It does not
          replace therapy, legal, financial, or medical counsel. We surface possibilities and consequences; you make the
          choice.
        </p>
        <button type="button" onClick={handleAccept} className="btn btn-primary" style={{ width: '100%' }}>
          I understand
        </button>
      </div>
    </div>
  )
}
