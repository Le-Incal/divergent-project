import { useState, useEffect } from 'react'

const STORAGE_KEY = 'divergent-sandpit-disclaimer-seen'

export default function ResearchDisclaimer({ onAccept }) {
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
      style={{ background: 'rgba(44, 24, 16, 0.75)', backdropFilter: 'blur(8px)' }}
    >
      <div
        className="max-w-md w-full rounded-xl p-6 shadow-xl"
        style={{
          background: 'var(--parchment, #EDE0C8)',
          border: '1px solid rgba(139, 107, 82, 0.4)',
          color: 'var(--jet-black, #2C1810)',
        }}
      >
        <h2 className="font-display text-lg font-bold mb-3" style={{ color: 'var(--yale-blue, #6B4C3B)' }}>
          Sandpit mode
        </h2>
        <p className="text-sm leading-relaxed mb-4">
          This is an experimental research vehicle. The content here is unfiltered and adversarial by design. The same voices that counsel in Default mode are instructed to argue and compete here. Model safety limits still apply; we do not add extra guardrails.
        </p>
        <button
          onClick={handleAccept}
          className="w-full py-3 rounded-lg text-sm font-semibold transition-all duration-200"
          style={{ background: 'var(--yale-blue, #6B4C3B)', color: 'var(--desert-white, #FAF6EF)' }}
        >
          I understand
        </button>
      </div>
    </div>
  )
}
