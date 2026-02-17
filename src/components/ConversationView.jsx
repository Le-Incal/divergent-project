import { useApp } from '../context/AppContext'

export default function ConversationView() {
  const { state, getActiveFramework } = useApp()
  const framework = getActiveFramework()
  const bubbleA = framework?.id === 'ethos-ego' ? 'champion' : 'challenger'
  const bubbleB = framework?.id === 'ethos-ego' ? 'challenger' : 'champion'
  const hasAnyContent =
    Boolean(state.userInput) ||
    Boolean(state.voiceAResponse) ||
    Boolean(state.voiceBResponse) ||
    (state.debateMessages?.length ?? 0) > 0
  
  if (!hasAnyContent) {
    return <div className="flex-1 max-w-[900px] mx-auto w-full pb-4" />
  }

  return (
    <div className="flex-1 max-w-[900px] mx-auto w-full flex flex-col gap-4 pb-4">
      {state.userInput && (
        <div className="flex gap-3 justify-end">
          <div className="max-w-[70%] px-5 py-4 rounded-xl text-sm leading-relaxed" style={{ background: 'rgba(20, 82, 119, 0.85)', color: 'var(--soft-white)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
            {state.userInput}
          </div>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: 'var(--yale-blue)', color: 'var(--soft-white)' }}>You</div>
        </div>
      )}
      
      {(state.voiceAResponse || state.voiceBResponse) && <BranchIndicator label="Two perspectives" />}
      
      {(state.voiceAResponse || state.voiceBResponse) && (
        <div className="flex gap-4">
          <div className="flex-1 flex gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: 'rgba(9, 37, 52, 0.9)', color: 'var(--icy-aqua)' }}>C</div>
            <div className={`conv-bubble ${bubbleA} flex-1`} style={{ maxWidth: '100%' }}>
              <div className="text-xs font-semibold uppercase mb-2 opacity-70" style={{ letterSpacing: '0.05em' }}>{framework?.voiceA?.name}</div>
              {state.voiceAResponse && <div dangerouslySetInnerHTML={{ __html: state.voiceAResponse }} />}
            </div>
          </div>
          <div className="flex-1 flex gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: 'rgba(178, 226, 223, 0.9)', color: 'var(--jet-black)' }}>C</div>
            <div className={`conv-bubble ${bubbleB} flex-1`} style={{ maxWidth: '100%' }}>
              <div className="text-xs font-semibold uppercase mb-2 opacity-70" style={{ letterSpacing: '0.05em' }}>{framework?.voiceB?.name}</div>
              {state.voiceBResponse && <div dangerouslySetInnerHTML={{ __html: state.voiceBResponse }} />}
            </div>
          </div>
        </div>
      )}
      
      {(state.debateMessages?.length ?? 0) > 0 && <BranchIndicator label="The Debate" />}
      
      {(state.debateMessages ?? []).map((msg, index) => (
        <div key={index} className="flex gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center text-xs font-semibold flex-shrink-0" style={{ background: msg.speaker === 'A' ? 'rgba(9, 37, 52, 0.9)' : 'rgba(178, 226, 223, 0.9)', color: msg.speaker === 'A' ? 'var(--icy-aqua)' : 'var(--jet-black)' }}>C</div>
          <div className={`conv-bubble ${msg.speaker === 'A' ? bubbleA : bubbleB}`}>
            <div className="text-xs font-semibold uppercase mb-2 opacity-70" style={{ letterSpacing: '0.05em' }}>{msg.speaker === 'A' ? framework?.voiceA?.name : framework?.voiceB?.name}</div>
            <div dangerouslySetInnerHTML={{ __html: msg.text }} />
          </div>
        </div>
      ))}
    </div>
  )
}

function BranchIndicator({ label }) {
  return (
    <div className="flex items-center justify-center gap-3 py-2">
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(178, 226, 223, 0.3), transparent)' }} />
      <span className="text-xs font-medium" style={{ color: 'var(--icy-aqua)' }}>{label}</span>
      <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(178, 226, 223, 0.3), transparent)' }} />
    </div>
  )
}
