import { useEffect, useRef, useState } from 'react'
import GrowingTextarea from './GrowingTextarea'
import { useApp, FRAMEWORKS } from '../context/AppContext'

function useComposer(onSubmit, disabled) {
  const [value, setValue] = useState('')

  const submit = (event) => {
    event.preventDefault()
    const text = value.trim()
    if (!text || disabled) return
    setValue('')
    onSubmit(text)
  }

  const onKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      event.currentTarget.form?.requestSubmit()
    }
  }

  return { value, setValue, submit, onKeyDown }
}

export function QuestionTools({ onHistory, onSettings }) {
  return (
    <div className="questionTools">
      <button type="button" className="composerIconBtn" onClick={onHistory} aria-label="Chat history">
        <svg viewBox="4.5 5.15 15 15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6.5 6h11a2 2 0 0 1 2 2v6.5a2 2 0 0 1-2 2H10l-3.5 2.8V16.5H6.5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z" />
        </svg>
      </button>
      <button type="button" className="composerIconBtn" onClick={onSettings} aria-label="AI modalities">
        <svg viewBox="1.6 1.6 20.8 20.8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
    </div>
  )
}

function personaLabel(framework) {
  if (!framework?.voiceA?.name || !framework?.voiceB?.name) return 'Ethos and Ego'
  return `${framework.voiceA.name} and ${framework.voiceB.name}`
}

export function QuestionPrompt({ disabled = false, onSubmit, onOpenHistory, onOpenSettings }) {
  const { state, setFramework, getActiveFramework } = useApp()
  const { value, setValue, submit, onKeyDown } = useComposer(onSubmit, disabled)
  const [open, setOpen] = useState(false)
  const personaRef = useRef(null)
  const framework = getActiveFramework()
  const label = personaLabel(framework)
  const personas = Object.values(FRAMEWORKS)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!personaRef.current?.contains(event.target)) setOpen(false)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  return (
    <form className="questionPrompt" onSubmit={submit}>
      <label className="questionPromptLabel" htmlFor="divergent-question">
        What decision do you need to make?
      </label>
      <GrowingTextarea
        id="divergent-question"
        className="input questionPromptField"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={`Ask ${label}`}
        disabled={disabled}
        rows={3}
      />
      <div className="questionPromptFooter">
      <div className="questionPersona" ref={personaRef}>
        <button
          type="button"
          className="questionPromptKicker"
          aria-expanded={open}
          aria-haspopup="listbox"
          onClick={() => setOpen((current) => !current)}
        >
          {label}
        </button>
        {open && (
          <ul className="questionPersonaMenu" role="listbox" aria-label="Personas">
            {personas.map((option) => (
              <li key={option.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.id === state.activeFramework}
                  className={option.id === state.activeFramework ? 'isActive' : ''}
                  onClick={() => {
                    setFramework(option.id)
                    setOpen(false)
                  }}
                >
                  {personaLabel(option)}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <QuestionTools onHistory={onOpenHistory} onSettings={onOpenSettings} />
      </div>
    </form>
  )
}

