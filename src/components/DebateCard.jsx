import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useChat } from '../hooks/useChat'
import { playDebateAudio } from '../utils/playDebateAudio'

export default function DebateCard() {
  const { state, setSelectedBranch, getActiveFramework, getVoiceASpeakerVoiceId, getVoiceBSpeakerVoiceId } = useApp()
  const { continueDebate, fetchResolution, isResolving } = useChat()
  const [isPlayingDebate, setIsPlayingDebate] = useState(false)
  const framework = getActiveFramework()

  const maxRounds = state.mode === 'sandpit' ? 5 : 3
  const currentRounds = 1 + state.debateMessages.length
  const atRoundLimit = currentRounds >= maxRounds
  
  const hasRealResponses = !!(state.voiceAResponse || state.voiceBResponse)
  const canPlayDebate = (state.voiceAResponse || state.voiceBResponse) && (getVoiceASpeakerVoiceId() || getVoiceBSpeakerVoiceId())

  const handlePlayDebate = async () => {
    if (!canPlayDebate || isPlayingDebate) return
    setIsPlayingDebate(true)
    try {
      await playDebateAudio(
        state.voiceAResponse ?? '',
        state.voiceBResponse ?? '',
        getVoiceASpeakerVoiceId(),
        getVoiceBSpeakerVoiceId(),
        state.debateOverlap
      )
    } catch (e) {
      console.error('Play debate error:', e)
    } finally {
      setIsPlayingDebate(false)
    }
  }
  
  const debateContent = state.debateMessages
  
  return (
    <section className="card debateCard">
      <header className="debateHeader">
        <div>
          <div className="debateOverline">Exchange</div>
          <div className="debateTitle">The Debate</div>
        </div>
        <div className="debateBadge" aria-label="Live">
          Live
        </div>
      </header>
        
      <div className="debateBody">
        {debateContent.length > 0 ? (
          debateContent.map((turn, index) => (
            <div key={index} className="debateTurn">
              <div className="debateSpeaker">{turn.name}</div>
              <div className="debateText" dangerouslySetInnerHTML={{ __html: turn.text }} />
              {index < debateContent.length - 1 && <div className="debateDivider" />}
            </div>
          ))
        ) : (
          <p className="debateEmpty">Continue the exchange to see the voices challenge each other.</p>
        )}
      </div>
        
      <footer className="debateFooter">
        {state.resolutionText && (
          <div className="debateResolution">
            <div className="debateResolutionLabel">Resolution summary</div>
            <div className="debateResolutionText">{state.resolutionText}</div>
          </div>
        )}

        <div className="debateActions">
          {canPlayDebate && (
            <button type="button" className="btn btn-secondary" onClick={handlePlayDebate} disabled={isPlayingDebate}>
              {isPlayingDebate ? 'Playing…' : 'Play debate'}
            </button>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => setSelectedBranch('ethos')}>
            Follow {framework?.voiceA?.name}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => setSelectedBranch('ego')}>
            Follow {framework?.voiceB?.name}
          </button>
          <button type="button" className="btn btn-primary" onClick={continueDebate} disabled={state.isDebating || atRoundLimit || !hasRealResponses}>
            {state.isDebating ? 'Debating…' : atRoundLimit ? `Round limit (${maxRounds})` : 'Continue debate'}
          </button>
          <button type="button" className="btn btn-accent" onClick={() => fetchResolution()} disabled={isResolving || !hasRealResponses}>
            {isResolving ? 'Generating…' : 'End exchange & get summary'}
          </button>
        </div>
      </footer>
    </section>
  )
}
