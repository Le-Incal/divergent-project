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
    <div className="inputArea">
      <form onSubmit={handleSubmit} className="inputAreaForm">
        <label className="srOnly" htmlFor="divergent-input">
          Explore a new idea
        </label>
        <input
          id="divergent-input"
          className="input inputAreaField"
          type="text"
          value={localInput}
          onChange={(e) => setLocalInput(e.target.value)}
          placeholder="Explore a new idea…"
          disabled={state.isLoading}
        />
        <button type="submit" className="btn btn-primary inputAreaSubmit btn-arrow" disabled={state.isLoading || !localInput.trim()}>
          {state.isLoading ? 'Thinking…' : 'Send'}
        </button>
      </form>
    </div>
  )
}
