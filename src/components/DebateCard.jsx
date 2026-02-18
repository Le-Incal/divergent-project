import { useState } from 'react'
import { useApp } from '../context/AppContext'
import { useChat } from '../hooks/useChat'
import { playDebateAudio } from '../utils/playDebateAudio'

export default function DebateCard() {
  const { state, getActiveFramework, getVoiceASpeakerVoiceId, getVoiceBSpeakerVoiceId } = useApp()
  const { continueDebate } = useChat()
  const [isPlayingDebate, setIsPlayingDebate] = useState(false)
  const framework = getActiveFramework()
  
  const hasRealResponses = state.voiceAResponse && state.voiceBResponse
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
  
  const demoDebate = [
    { speaker: 'A', name: framework.voiceA.name, text: '"Boldest version of yourself"—that\'s <em>romantic</em>, but let\'s get specific. <strong>What happens when this fails?</strong>' },
    { speaker: 'B', name: framework.voiceB.name, text: 'And what happens when you <em>don\'t</em> act? Your risk analysis is just <strong>fear dressed up in a spreadsheet.</strong>' },
    { speaker: 'A', name: framework.voiceA.name, text: 'Fear dressed up? I call it <strong>wisdom.</strong> <strong>Preparation isn\'t paralysis</strong>—it\'s the difference between courage and recklessness.' },
    { speaker: 'B', name: framework.voiceB.name, text: 'And the graveyard of <em>regret</em> is full of people who prepared forever. <strong>The information you need only exists on the other side of action.</strong>' },
  ]
  
  const debateContent = hasRealResponses ? state.debateMessages : demoDebate
  
  return (
    <div className="max-w-[1300px] mx-auto w-full">
      <div className="debate-card">
        <div className="flex items-center gap-3 mb-6">
          <span className="text-lg font-semibold" style={{ letterSpacing: '-0.01em', color: 'var(--jet-black)' }}>The Debate</span>
          <span className="px-2 py-0.5 rounded text-xs font-semibold uppercase" style={{ background: 'rgba(104, 177, 182, 0.2)', color: 'var(--cerulean)', letterSpacing: '0.05em' }}>
            Live
          </span>
        </div>
        
        <div className="flex flex-col gap-4">
          {debateContent.length > 0 ? (
            debateContent.map((turn, index) => (
              <div key={index}>
                <div className="flex gap-4 items-start">
                  <div className="w-[90px] flex-shrink-0">
                    <span className="text-xs font-semibold" style={{ letterSpacing: '-0.01em', color: turn.speaker === 'A' ? 'var(--yale-blue)' : 'var(--jet-black)' }}>
                      {turn.name}
                    </span>
                  </div>
                  <div className="flex-1 text-sm leading-relaxed" style={{ color: 'var(--deep-space)', letterSpacing: '-0.01em' }} dangerouslySetInnerHTML={{ __html: turn.text }} />
                </div>
                {index < debateContent.length - 1 && <div className="h-px my-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(9, 37, 52, 0.15), transparent)' }} />}
              </div>
            ))
          ) : (
            <p className="text-sm italic text-center py-4" style={{ color: 'var(--cerulean)' }}>
              Click "Continue Debate" to have the voices challenge each other's perspectives.
            </p>
          )}
        </div>
        
        <div className="mt-6 pt-6" style={{ borderTop: '1px solid rgba(9, 37, 52, 0.1)' }}>
          {canPlayDebate && (
            <div className="mb-4">
              <button
                type="button"
                className="choice-btn flex items-center gap-2"
                onClick={handlePlayDebate}
                disabled={isPlayingDebate}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {isPlayingDebate ? 'Playing…' : 'Play debate'}
              </button>
            </div>
          )}
          <p className="text-sm font-medium mb-4" style={{ color: 'var(--cerulean)' }}>Where do you want to go from here?</p>
          <div className="flex flex-wrap gap-3">
            <button className="choice-btn">Follow {framework?.voiceA?.name}</button>
            <button className="choice-btn">Follow {framework?.voiceB?.name}</button>
            <button className="choice-btn" onClick={continueDebate} disabled={state.isDebating}>
              {state.isDebating ? 'Debating...' : 'Continue Debate'}
            </button>
            <button className="choice-btn">Explore Both</button>
          </div>
        </div>
      </div>
    </div>
  )
}
