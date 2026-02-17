import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useChat } from '../hooks/useChat'

export default function InputArea() {
  const { state, setUserInput, getActiveFramework } = useApp()
  const { sendMessage } = useChat()
  const [localInput, setLocalInput] = useState('')
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!localInput.trim() || state.isLoading) return
    
    setUserInput(localInput)
    const message = localInput
    setLocalInput('')
    await sendMessage(message)
  }
  
  return (
    <div className="mt-6 max-w-[900px] mx-auto w-full">
      <form onSubmit={handleSubmit}>
        <div className="input-wrapper flex items-center gap-3 p-2">
          <input
            type="text"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            placeholder="Explore a new idea..."
            className="flex-1 bg-transparent border-none outline-none text-sm px-3 py-2"
            style={{ color: 'var(--jet-black)', letterSpacing: '-0.01em' }}
            disabled={state.isLoading}
          />
          <button
            type="submit"
            disabled={state.isLoading || !localInput.trim()}
            className="w-10 h-10 rounded-md flex items-center justify-center transition-all duration-200 disabled:opacity-50"
            style={{
              background:
                state.mode === 'sandpit' ? 'rgba(var(--icy-aqua-rgb), 0.8)' : 'var(--yale-blue)',
              color: state.mode === 'sandpit' ? 'var(--jet-black)' : 'var(--soft-white)',
              border: state.mode === 'sandpit' ? '1px solid rgba(var(--jet-black-rgb), 0.18)' : 'none',
            }}
          >
            {state.isLoading ? (
              <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/><path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"/>
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
