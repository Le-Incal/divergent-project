import { useEffect, useMemo, useRef, useState } from 'react'
import GrowingTextarea from './GrowingTextarea'
import { itemsFor } from '../brainstorm/items.js'
import { routeBrainstorm } from '../brainstorm/routing.js'
import {
  PROFILE_LABELS,
  affinityNudge,
  guessProblemType,
  loadProfile,
  profileReady,
  saveProfile,
  scoreAnswers,
} from '../brainstorm/profile.js'

const TYPES = [
  ['problem', 'a problem'],
  ['idea', 'an idea'],
  ['decision', 'a decision'],
  ['person', 'a person'],
  ['ourselves', 'ourselves'],
  ['experiment', 'an experiment'],
  ['big_picture', 'the big picture'],
  ['process', 'a process'],
]

const MBTI = ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP']

function orderedItems(version) {
  const items = itemsFor(version === 'deep' ? 'deep' : 'short')
  if (version !== 'deep') return items
  const enneagram = items.filter((item) => /^E\d+/.test(item.id))
  const rest = items.filter((item) => !/^E\d+/.test(item.id))
  const shuffled = [...enneagram].sort((a, b) => a.id.charCodeAt(1) % 5 - b.id.charCodeAt(1) % 5 || a.id.localeCompare(b.id))
  const insertAt = rest.findIndex((item) => item.id === 'R1')
  return [...rest.slice(0, insertAt), ...shuffled, ...rest.slice(insertAt)]
}

function summaryFor(scores, answers) {
  const bands = Object.entries(scores.bands || {}).map(([trait, level]) => `${trait} ${level}`).join(', ')
  const open = [answers.O1, answers.O2, answers.O3].filter(Boolean).join(' ')
  const type = scores.enneagram?.display ? `Style ${scores.enneagram.display}.` : ''
  return [bands && `Bands: ${bands}.`, type, open && `In their words: ${open}`].filter(Boolean).join(' ')
}

export default function BrainstormFlow({ history = '', disabled, onStart }) {
  const stored = useMemo(() => loadProfile(), [])
  const ready = profileReady(stored)
  const [step, setStep] = useState(ready ? 'voice' : 'choose')
  const [version, setVersion] = useState(stored?.version || 'short')
  const [answers, setAnswers] = useState(stored?.answers || {})
  const [index, setIndex] = useState(0)
  const [scores, setScores] = useState(stored?.scores || null)
  const [problemType, setProblemType] = useState(() => guessProblemType(history))
  const items = step === 'checkin'
    ? orderedItems('short').filter((item) => ['S1', 'S2', 'S3'].includes(item.id))
    : orderedItems(version)
  const current = items[index]

  const finishTest = (nextAnswers) => {
    const knownTypes = {
      mbti: nextAnswers.T1?.mbti || undefined,
      enneagram: nextAnswers.T1?.enneagram ? Number(nextAnswers.T1.enneagram) : undefined,
    }
    const nextScores = scoreAnswers(nextAnswers, knownTypes)
    nextScores.calibration = {
      gentle: nextAnswers.C1 === 'Gentle',
      supportedFirst: nextAnswers.C4 === 'Supported first',
    }
    nextScores.openText = { O1: nextAnswers.O1 || '', O2: nextAnswers.O2 || '', O3: nextAnswers.O3 || '' }
    const saved = saveProfile({
      version: step === 'checkin' ? (stored?.version || 'short') : version,
      createdAt: stored?.createdAt || Date.now(),
      answers: nextAnswers,
      scores: nextScores,
      corrections: {},
    })
    setScores(saved.scores)
    setStep('type')
  }

  const choose = (answer) => {
    const next = { ...answers, [current.id]: answer }
    setAnswers(next)
    if (index + 1 >= items.length) finishTest(next)
    else setIndex(index + 1)
  }

  const startVoice = (voice) => {
    const route = routeBrainstorm({
      profile: scores,
      problemType,
      voice,
      requestedMode: 'default',
    })
    onStart?.({
      voice,
      route,
      summary: summaryFor(scores, answers),
      session: {
        c2: answers.C2 || null,
        flooded: !!scores?.flags?.flooded,
        urgent: !!scores?.flags?.urgent,
        n1Complete: route.framework !== 'Name It to Tame It',
        profile: {
          ...(typeof answers.R3 === 'number' ? { r3: answers.R3 } : {}),
          ...(typeof answers.R4 === 'number' ? { r4: answers.R4 } : {}),
        },
        collect: ready,
      },
    })
  }

  return (
    <div className="brainstormPanel">
      {step === 'choose' && (
        <div className="brainstormStep">
          <p className="brainstormLead">Which profile do you want to build?</p>
          <div className="brainstormChoices">
            <button type="button" className="brainstormChoice" onClick={() => { setVersion('short'); setStep('test'); setIndex(0) }}>
              {PROFILE_LABELS.short}
            </button>
            <button type="button" className="brainstormChoice" onClick={() => { setVersion('deep'); setStep('test'); setIndex(0) }}>
              {PROFILE_LABELS.deep}
            </button>
          </div>
        </div>
      )}

      {(step === 'test' || step === 'checkin') && current && (
        <Question
          key={current.id}
          name={version === 'deep' ? PROFILE_LABELS.deep : PROFILE_LABELS.short}
          item={current}
          index={index}
          total={items.length}
          value={answers[current.id]}
          onAnswer={choose}
          onBack={index > 0 ? () => setIndex(index - 1) : null}
        />
      )}

      {step === 'type' && (
        <div className="brainstormStep">
          <p className="brainstormLead">This sounds like</p>
          <div className="brainstormChoices">
            {TYPES.map(([id, label]) => (
              <button key={id} type="button" className={`brainstormChoice ${problemType === id ? 'isSelected' : ''}`} onClick={() => setProblemType(id)}>
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="chatDebateBtn" onClick={() => setStep('voice')}>Continue</button>
        </div>
      )}

      {step === 'voice' && (
        <div className="brainstormStep">
          <p className="brainstormLead">{ready ? 'Pick the Voice you want in the room.' : affinityNudge(scores?.affinity?.label)}</p>
          <div className="brainstormChoices">
            <button type="button" className="brainstormChoice brainstormChoice--ethos" disabled={disabled} onClick={() => startVoice('ethos')}>Ethos</button>
            <button type="button" className="brainstormChoice brainstormChoice--ego" disabled={disabled} onClick={() => startVoice('ego')}>Ego</button>
          </div>
        </div>
      )}
    </div>
  )
}

function StyleMenu({ label, value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return undefined
    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  return (
    <div className="brainstormMenu" ref={ref}>
      <button
        type="button"
        className="brainstormSelect"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((isOpen) => !isOpen)}
      >
        <span>{current?.label || label}</span>
        <span className="brainstormSelectChevron" aria-hidden="true" />
      </button>
      {open && (
        <ul className="brainstormMenuList" role="listbox" aria-label={label}>
          {options.map((option) => (
            <li key={option.value || label}>
              <button
                type="button"
                role="option"
                aria-selected={option.value === value}
                className={option.value === value ? 'isSelected' : ''}
                onClick={() => {
                  onChange(option.value)
                  setOpen(false)
                }}
              >
                {option.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Question({ name, item, index, total, value, onAnswer, onBack }) {
  const [text, setText] = useState(typeof value === 'string' ? value : '')
  const [ranked, setRanked] = useState(Array.isArray(value) ? value : [])
  const [types, setTypes] = useState(value && typeof value === 'object' ? value : {})

  return (
    <div className="brainstormStep">
      <p className="brainstormProgress">{name}</p>
      <p className="brainstormProgress">{index + 1} of {total}</p>
      <p className="brainstormLead">{item.prompt}</p>
      {item.kind === 'scale' && (
        <div className="brainstormScale">
          {Array.from({ length: item.max - item.min + 1 }, (_, offset) => item.min + offset).map((point) => (
            <button key={point} type="button" className="brainstormChoice" onClick={() => onAnswer(point)}>{point}</button>
          ))}
        </div>
      )}
      {item.kind === 'choice' && (
        <div className="brainstormChoices">
          {item.options.map((option) => (
            <button key={option} type="button" className="brainstormChoice" onClick={() => onAnswer(option)}>{option}</button>
          ))}
        </div>
      )}
      {item.kind === 'text' && (
        <form onSubmit={(event) => { event.preventDefault(); onAnswer(text.trim()) }}>
          <GrowingTextarea className="input brainstormText" rows={3} value={text} onChange={(event) => setText(event.target.value)} />
          <button type="submit" className="chatDebateBtn">Next</button>
        </form>
      )}
      {item.kind === 'rank' && (
        <div className="brainstormRank">
          <p className="brainstormNote">{ranked.join(' · ') || 'Pick five, in order.'}</p>
          <div className="brainstormChoices">
            {item.options.map((option) => (
              <button
                key={option}
                type="button"
                className={`brainstormChoice ${ranked.includes(option) ? 'isSelected' : ''}`}
                onClick={() => {
                  const next = ranked.includes(option) ? ranked.filter((entry) => entry !== option) : [...ranked, option].slice(0, 5)
                  setRanked(next)
                  if (next.length === 5) onAnswer(next)
                }}
              >
                {option}
              </button>
            ))}
          </div>
        </div>
      )}
      {item.kind === 'types' && (
        <form onSubmit={(event) => { event.preventDefault(); onAnswer(types) }}>
          <div className="brainstormChoices">
            <StyleMenu
              label="MBTI style"
              value={types.mbti || ''}
              options={[{ value: '', label: 'MBTI style' }, ...MBTI.map((type) => ({ value: type, label: type }))]}
              onChange={(mbti) => setTypes({ ...types, mbti })}
            />
            <StyleMenu
              label="Enneagram style"
              value={types.enneagram || ''}
              options={[{ value: '', label: 'Enneagram style' }, ...Array.from({ length: 9 }, (_, type) => ({ value: String(type + 1), label: String(type + 1) }))]}
              onChange={(enneagram) => setTypes({ ...types, enneagram })}
            />
          </div>
          <div className="brainstormActions">
            {onBack && <button type="button" className="brainstormChoice" onClick={onBack}>Back</button>}
            <button type="button" className="brainstormChoice" onClick={() => onAnswer({})}>Skip</button>
            <button type="submit" className="chatDebateBtn">Next</button>
          </div>
        </form>
      )}
      {item.kind === 'scale' && (
        <p className="brainstormNote brainstormScaleKey">
          <span>{item.min} · {item.low}</span>
          <span className="brainstormScaleArrow" aria-hidden="true">→</span>
          <span>{item.max} · {item.high}</span>
        </p>
      )}
      {onBack && item.kind !== 'types' && <button type="button" className="brainstormChoice" onClick={onBack}>Back</button>}
    </div>
  )
}
