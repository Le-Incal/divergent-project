import { useEffect, useRef, useState } from 'react'
import { useApp } from '../context/AppContext'
import { useChat } from '../hooks/useChat'

export default function InputArea() {
  const { state } = useApp()
  const { sendMessage } = useChat()
  const [localInput, setLocalInput] = useState('')
  const inputRef = useRef(null)
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!localInput.trim() || state.isLoading) return
    
    const message = localInput
    setLocalInput('')
    await sendMessage(message)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (localInput.trim() && !state.isLoading) {
        handleSubmit(e)
      }
    }
  }

  const minHeight = 96

  useEffect(() => {
    const el = inputRef.current
    if (!el) return
    el.style.height = `${minHeight}px`
    const newHeight = Math.min(el.scrollHeight, 320)
    el.style.height = `${newHeight}px`

    const lineHeight = parseFloat(getComputedStyle(el).lineHeight) || 20
    const currentHeight = parseFloat(el.style.height) || minHeight
    const paddingTop = Math.max(10, (currentHeight - lineHeight) / 2)
    el.style.paddingTop = `${paddingTop}px`
    el.style.textAlign = 'center'
  }, [localInput])
  
  return (
    <div className="inputArea">
      <form onSubmit={handleSubmit} className="inputAreaForm">
        <label className="srOnly" htmlFor="divergent-input">
          {state.awaitingClarification ? 'Reply to clarifying question' : 'Explore a new idea'}
        </label>
        <textarea
          ref={inputRef}
          id="divergent-input"
          className="input inputAreaField"
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={state.awaitingClarification ? 'Share a quick clarification... press Enter when ready.' : 'Explore a new idea.... press Enter or say Go when ready.'}
          disabled={state.isLoading}
          rows={1}
        />
      </form>
    </div>
  )
}
