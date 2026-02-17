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
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: 'rgba(9, 37, 52, 0.7)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="max-w-md w-full rounded-xl p-6 shadow-xl"
        style={{
          background: 'rgba(224, 244, 242, 0.95)',
          border: '1px solid rgba(178, 226, 223, 0.3)',
          color: 'var(--jet-black)',
        }}
      >
        <h2 className="font-display text-lg font-bold mb-3" style={{ color: 'var(--yale-blue)' }}>
          Before you start
        </h2>
        <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--deep-space)' }}>
          Divergent is a decision tool that shows you contrasting perspectives. It is not professional advice. It does not replace therapy, legal, financial, or medical counsel. We surface possibilities and consequences; you make the choice.
        </p>
        <button
          onClick={handleAccept}
          className="w-full py-3 rounded-lg text-sm font-semibold transition-all duration-200"
          style={{ background: 'var(--yale-blue)', color: 'var(--soft-white)' }}
        >
          I understand
        </button>
      </div>
    </div>
  )
}
