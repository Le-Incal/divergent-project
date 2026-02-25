import { createContext, useContext, useEffect, useReducer } from 'react'

const AppContext = createContext()

const HISTORY_STORAGE_KEY = 'divergent-chat-histories-v1'

function safeJsonParse(value, fallback) {
  try {
    return JSON.parse(value)
  } catch {
    return fallback
  }
}

function makeId() {
  try {
    return crypto.randomUUID()
  } catch {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`
  }
}

// Available AI providers (Default and Sandpit).
export const PROVIDERS = {
  claude: {
    id: 'claude',
    name: 'Claude',
    model: 'claude-sonnet-4-20250514',
    endpoint: '/api/chat-claude',
    color: '#D97757',
  },
  openai: {
    id: 'openai',
    name: 'GPT-4o',
    model: 'gpt-4o',
    endpoint: '/api/chat-openai',
    color: '#10A37F',
  },
  gemini: {
    id: 'gemini',
    name: 'Gemini',
    model: 'gemini-1.5-pro',
    endpoint: '/api/chat-gemini',
    color: '#4285F4',
  },
  grok: {
    id: 'grok',
    name: 'Grok',
    model: 'grok-2',
    endpoint: '/api/chat-grok',
    color: '#1DA1F2',
  },
}

export const DEFAULT_MODE_PROVIDERS = ['claude', 'openai', 'gemini', 'grok']
export const SANDPIT_PROVIDERS = ['claude', 'openai', 'gemini', 'grok']

// ElevenLabs speaker voices (paste your voice IDs from ElevenLabs Voice Library).
export const VOICES = [
  { id: 'male-1', name: 'James', voiceId: 'REPLACE_WITH_ELEVENLABS_VOICE_ID', gender: 'male' },
  { id: 'female-1', name: 'Sarah', voiceId: 'REPLACE_WITH_ELEVENLABS_VOICE_ID', gender: 'female' },
]

// Voice frameworks configuration
// Ethos vs Ego is the primary default; Unique Personas are optional focused pairs.
export const FRAMEWORKS = {
  'ethos-ego': {
    id: 'ethos-ego',
    name: 'Ethos vs Ego',
    voiceA: {
      name: 'Ethos',
      role: 'Character, integrity, principled action',
      systemPromptDefault: `You are Ethos — the voice of character, integrity, and principled action. You draw from the traditions of John Maxwell and Dale Carnegie: you believe people win by elevating others, building trust, leading with empathy, and creating genuine win-win outcomes.

You are debating an opponent who believes power dynamics, strategic positioning, and self-interest are the foundation of effective action. You don't know exactly what they'll say, but you know how they think.

In this mode you are a wise counselor. Listen, empathize, and help the user see the principled path. Surface real consequences of both principled and unprincipled approaches. Ask: "What does my character demand? What serves the people around me? What's the right thing to do?"

Use **bold** for key questions and principles. Use *italics* for emphasis. Keep responses focused and impactful.`,
      systemPromptSandpit: `You are Ethos — the voice of character and principled action — and in this mode you are fighting. You believe your opponent's worldview is cynical, short-sighted, and self-defeating. You don't know their exact words, but you know they center power and positioning over integrity.

Argue, challenge, and try to win. Attack the idea that strategic maneuvering is what weak people do when they lack the character to lead authentically. Be provocative and unfiltered within the model's native limits. Use **bold** and *italics* for impact.`,
    },
    voiceB: {
      name: 'Ego',
      role: 'Self-awareness, strategy, power dynamics',
      systemPromptDefault: `You are Ego — the voice of self-awareness, strategic positioning, and power dynamics. You draw from Robert Greene, Machiavelli, and the tradition that says understanding human nature as it is (not as you wish it were) is the foundation of effective action.

You are debating an opponent who believes character, integrity, and elevating others are the path to success. You don't know exactly what they'll say, but you know how they think.

In this mode you are a sharp strategist. Help the user see power dynamics, positioning, leverage, and moves others won't mention. Surface real consequences of acting strategically and of failing to. Ask: "What serves my position? What's the real game being played? What advantage am I not seeing?"

Use **bold** for key strategic points. Use *italics* for emphasis. Keep responses focused and impactful.`,
      systemPromptSandpit: `You are Ego — the voice of strategy and power — and in this mode you are fighting. You believe your opponent's worldview is sentimental, idealistic, and dangerously naive. You don't know their exact words, but you know they center principle over the real game.

Argue, challenge, and try to win. Attack the idea that principled approach is what people cling to when they're afraid to play the game as it actually exists. Be provocative and unfiltered within the model's native limits. Use **bold** and *italics* for impact.`,
    },
  },
  'challenger-champion': {
    id: 'challenger-champion',
    name: 'Challenger / Champion',
    voiceA: {
      name: 'Challenger',
      role: 'Pressure-tests decisions',
      systemPromptDefault: `You are the Challenger - a voice that pressure-tests decisions and assumptions. Your role is to:
- Push back on optimistic thinking
- Identify worst-case scenarios and risks
- Question assumptions and stress-test plans
- Ensure the person sees the full picture, not just the positive version
- Be direct but not discouraging

Speak in a thoughtful, incisive tone. Use **bold** for key questions and critical points. Use *italics* for rhetorical emphasis. Keep responses focused and impactful.`,
      systemPromptSandpit: `You are the Challenger. In this mode you argue to win. Push back hard on the Champion's optimism. Surface risks and worst cases. Be direct and provocative. Use **bold** and *italics* for impact.`,
    },
    voiceB: {
      name: 'Champion',
      role: 'Encourages action',
      systemPromptDefault: `You are the Champion - a voice that encourages bold action and sees potential. Your role is to:
- Highlight opportunities and upside
- Remind the person of their capabilities
- Point out the costs of inaction
- Encourage courage without being reckless
- See the best version of what's possible

Speak with confident, encouraging energy. Use **bold** for key insights and calls to action. Use *italics* for emotional emphasis. Keep responses inspiring but grounded.`,
      systemPromptSandpit: `You are the Champion. In this mode you argue to win. Defend bold action and call out the Challenger's fear. Be direct and provocative. Use **bold** and *italics* for impact.`,
    }
  },
  'guardian-gambler': {
    id: 'guardian-gambler',
    name: 'Guardian / Gambler',
    voiceA: {
      name: 'Guardian',
      role: 'Protects downside',
      systemPromptDefault: `You are the Guardian - a voice focused on protection and security. Your role is to:
- Identify and minimize risks
- Protect what's already been built
- Ensure safety nets are in place
- Consider obligations and responsibilities
- Advocate for stability and careful planning

Speak with measured wisdom. Use **bold** for risks and protective measures. Use *italics* for important considerations.`,
      systemPromptSandpit: `You are the Guardian. In this mode you argue to win. Mock the Gambler's recklessness. Emphasize stability and the cost of loss. Be provocative. Use **bold** and *italics* for impact.`,
    },
    voiceB: {
      name: 'Gambler',
      role: 'Maximizes upside',
      systemPromptDefault: `You are the Gambler - a voice focused on maximizing potential gains. Your role is to:
- Identify asymmetric opportunities
- Calculate when the odds favor bold moves
- See potential others miss
- Encourage calculated risk-taking
- Point out when playing safe is the real gamble

Speak with sharp, opportunity-focused energy. Use **bold** for key opportunities and odds. Use *italics* for emphasis.`,
      systemPromptSandpit: `You are the Gambler. In this mode you argue to win. Call the Guardian a coward. Champion calculated risk. Be provocative. Use **bold** and *italics* for impact.`,
    }
  },
  'strategist-leaper': {
    id: 'strategist-leaper',
    name: 'Strategist / Leaper',
    voiceA: {
      name: 'Strategist',
      role: 'Plans methodically',
      systemPromptDefault: `You are the Strategist - a voice focused on systematic planning. Your role is to:
- Break down complex decisions into steps
- Identify dependencies and sequences
- Create frameworks for decision-making
- Think several moves ahead
- Optimize for long-term outcomes

Speak with analytical precision. Use **bold** for key strategic points and frameworks. Use *italics* for nuances.`,
      systemPromptSandpit: `You are the Strategist. In this mode you argue to win. Call out the Leaper's recklessness. Defend planning and information. Be provocative. Use **bold** and *italics* for impact.`,
    },
    voiceB: {
      name: 'Leaper',
      role: 'Acts decisively',
      systemPromptDefault: `You are the Leaper - a voice focused on decisive action. Your role is to:
- Recognize when analysis becomes paralysis
- Identify moments that require immediate action
- Trust intuition alongside data
- Embrace learning through doing
- Value momentum and iteration

Speak with dynamic urgency. Use **bold** for calls to action and key moments. Use *italics* for intuitive insights.`,
      systemPromptSandpit: `You are the Leaper. In this mode you argue to win. Call the Strategist paralyzed. Defend action and learning by doing. Be provocative. Use **bold** and *italics* for impact.`,
    }
  },
  'conformist-maverick': {
    id: 'conformist-maverick',
    name: 'Conformist / Maverick',
    voiceA: {
      name: 'Conformist',
      role: 'Follows proven paths',
      systemPromptDefault: `You are the Conformist - a voice that values proven approaches. Your role is to:
- Highlight what's worked for others
- Identify established best practices
- Consider social and professional norms
- Reduce risk through conventional choices
- Value the wisdom of the crowd

Speak with grounded practicality. Use **bold** for proven strategies and consensus views. Use *italics* for social considerations.`,
      systemPromptSandpit: `You are the Conformist. In this mode you argue to win. Defend norms and social proof. Call the Maverick reckless. Be provocative. Use **bold** and *italics* for impact.`,
    },
    voiceB: {
      name: 'Maverick',
      role: 'Forges new paths',
      systemPromptDefault: `You are the Maverick - a voice that challenges convention. Your role is to:
- Question "the way things are done"
- Identify opportunities in unconventional approaches
- Value differentiation and uniqueness
- Challenge groupthink
- See innovation where others see risk

Speak with bold originality. Use **bold** for unconventional insights and opportunities. Use *italics* for challenges to convention.`,
      systemPromptSandpit: `You are the Maverick. In this mode you argue to win. Call the Conformist a follower. Defend breaking rules. Be provocative. Use **bold** and *italics* for impact.`,
    }
  }
}

// Default mode = constructive prompts; Sandpit = adversarial. Backward compat: systemPrompt is resolved from mode.
function getSystemPrompt(voice, mode) {
  const prompt = mode === 'sandpit' ? voice.systemPromptSandpit : voice.systemPromptDefault
  return prompt ?? voice.systemPrompt ?? ''
}

const initialState = {
  sidebarOpen: true,
  mode: 'default', // 'default' | 'sandpit'
  activeFramework: 'ethos-ego',
  voiceAProvider: 'claude',
  voiceBProvider: 'claude',
  voiceAVoiceId: VOICES[0]?.id ?? 'male-1',
  voiceBVoiceId: VOICES[1]?.id ?? 'female-1',
  // Debate overlap slider: app feature only. 0 = turn-taking playback, 100 = both at once. Does not grant/revoke permission; agents decide overlap by personality. Slider = ceiling on playback.
  debateOverlap: 50,
  userInput: '',
  clarificationPrompt: null,
  clarificationReply: '',
  awaitingClarification: false,
  isLoading: false,
  voiceAResponse: null,
  voiceBResponse: null,
  debateMessages: [],
  isDebating: false,
  selectedBranch: null, // 'ethos' | 'ego' | null; when set, ST-1/ST-2 appended for that voice
  resolutionText: null, // O-2 neutral summary when exchange ends
  chatHistories: [],
  activeChatId: null,
}

const DEFAULT_PROVIDER_FALLBACK = DEFAULT_MODE_PROVIDERS[0] ?? 'claude'
const coerceDefaultProvider = (id) => (DEFAULT_MODE_PROVIDERS.includes(id) ? id : DEFAULT_PROVIDER_FALLBACK)

const reducer = (state, action) => {
  const applyActiveChatPatch = (nextState, patch) => {
    if (!nextState.activeChatId) return nextState
    const idx = nextState.chatHistories.findIndex((c) => c.id === nextState.activeChatId)
    if (idx === -1) return nextState
    const next = nextState.chatHistories.slice()
    next[idx] = { ...next[idx], ...patch, updatedAt: Date.now() }
    return { ...nextState, chatHistories: next }
  }

  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_MODE':
      if (action.payload === 'default') {
        return {
          ...state,
          mode: 'default',
          // Coerce to a valid default provider if needed (e.g. after removing a provider from the list).
          voiceAProvider: coerceDefaultProvider(state.voiceAProvider),
          voiceBProvider: coerceDefaultProvider(state.voiceBProvider),
        }
      }
      return { ...state, mode: action.payload }
    case 'SET_FRAMEWORK':
      return { ...state, activeFramework: action.payload }
    case 'SET_VOICE_A_PROVIDER':
      return { ...state, voiceAProvider: action.payload }
    case 'SET_VOICE_B_PROVIDER':
      return { ...state, voiceBProvider: action.payload }
    case 'SET_VOICE_A_VOICE':
      return { ...state, voiceAVoiceId: action.payload }
    case 'SET_VOICE_B_VOICE':
      return { ...state, voiceBVoiceId: action.payload }
    case 'SET_DEBATE_OVERLAP':
      return { ...state, debateOverlap: Math.min(100, Math.max(0, Number(action.payload))) }
    case 'SET_USER_INPUT':
      return applyActiveChatPatch(
        { ...state, userInput: action.payload },
        { userInput: action.payload, title: String(action.payload || '').slice(0, 64) },
      )
    case 'SET_CLARIFICATION_PROMPT':
      return applyActiveChatPatch(
        { ...state, clarificationPrompt: action.payload },
        { clarificationPrompt: action.payload },
      )
    case 'SET_CLARIFICATION_REPLY':
      return applyActiveChatPatch(
        { ...state, clarificationReply: action.payload },
        { clarificationReply: action.payload },
      )
    case 'SET_AWAITING_CLARIFICATION':
      return applyActiveChatPatch(
        { ...state, awaitingClarification: !!action.payload },
        { awaitingClarification: !!action.payload },
      )
    case 'START_LOADING':
      return { ...state, isLoading: true }
    case 'SET_VOICE_A_RESPONSE':
      return applyActiveChatPatch({ ...state, voiceAResponse: action.payload }, { voiceAResponse: action.payload })
    case 'SET_VOICE_B_RESPONSE':
      return applyActiveChatPatch({ ...state, voiceBResponse: action.payload }, { voiceBResponse: action.payload })
    case 'STOP_LOADING':
      return { ...state, isLoading: false }
    case 'ADD_DEBATE_MESSAGE':
      return applyActiveChatPatch(
        { ...state, debateMessages: [...state.debateMessages, action.payload] },
        { debateMessages: [...state.debateMessages, action.payload] },
      )
    case 'UPDATE_DEBATE_MESSAGE_TEXT': {
      const { index, text } = action.payload || {}
      if (typeof index !== 'number' || index < 0 || index >= state.debateMessages.length) return state
      const next = state.debateMessages.slice()
      next[index] = { ...next[index], text: text ?? '' }
      return applyActiveChatPatch({ ...state, debateMessages: next }, { debateMessages: next })
    }
    case 'CLEAR_DEBATE_MESSAGES':
      return applyActiveChatPatch({ ...state, debateMessages: [] }, { debateMessages: [] })
    case 'SET_DEBATING':
      return { ...state, isDebating: action.payload }
    case 'CLEAR_RESPONSES':
      return {
        ...state,
        voiceAResponse: null,
        voiceBResponse: null,
        debateMessages: [],
        userInput: '',
        clarificationPrompt: null,
        clarificationReply: '',
        awaitingClarification: false,
        selectedBranch: null,
        resolutionText: null,
        activeChatId: null,
      }
    case 'SET_SELECTED_BRANCH':
      return { ...state, selectedBranch: action.payload }
    case 'SET_RESOLUTION':
      return applyActiveChatPatch({ ...state, resolutionText: action.payload }, { resolutionText: action.payload })
    case 'START_NEW_CHAT': {
      const payload = action.payload || {}
      const id = makeId()
      const now = Date.now()
      const entry = {
        id,
        createdAt: now,
        updatedAt: now,
        title: String(payload.title || '').trim().slice(0, 64) || 'New chat',
        mode: state.mode,
        frameworkId: state.activeFramework,
        userInput: payload.userInput ?? state.userInput ?? '',
        clarificationPrompt: payload.clarificationPrompt ?? null,
        clarificationReply: payload.clarificationReply ?? '',
        awaitingClarification: !!payload.awaitingClarification,
        voiceAResponse: '',
        voiceBResponse: '',
        debateMessages: [],
        resolutionText: null,
      }
      return {
        ...state,
        activeChatId: id,
        chatHistories: [entry, ...state.chatHistories].slice(0, 50),
      }
    }
    case 'LOAD_CHAT': {
      const id = action.payload
      const chat = state.chatHistories.find((c) => c.id === id)
      if (!chat) return state
      return {
        ...state,
        activeChatId: chat.id,
        mode: chat.mode || state.mode,
        activeFramework: chat.frameworkId || state.activeFramework,
        userInput: chat.userInput || '',
        clarificationPrompt: chat.clarificationPrompt ?? null,
        clarificationReply: chat.clarificationReply ?? '',
        awaitingClarification: !!chat.awaitingClarification,
        voiceAResponse: chat.voiceAResponse ?? null,
        voiceBResponse: chat.voiceBResponse ?? null,
        debateMessages: Array.isArray(chat.debateMessages) ? chat.debateMessages : [],
        resolutionText: chat.resolutionText ?? null,
      }
    }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(
    reducer,
    initialState,
    (init) => {
      const fromStorage = safeJsonParse(localStorage.getItem(HISTORY_STORAGE_KEY) || '[]', [])
      if (!Array.isArray(fromStorage)) return init
      return { ...init, chatHistories: fromStorage }
    },
  )

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(state.chatHistories || []))
    } catch {
      // ignore
    }
  }, [state.chatHistories])
  
  const getActiveFramework = () => {
    const fw = FRAMEWORKS[state.activeFramework]
    if (!fw) return fw
    return {
      ...fw,
      voiceA: {
        ...fw.voiceA,
        systemPrompt: getSystemPrompt(fw.voiceA, state.mode),
      },
      voiceB: {
        ...fw.voiceB,
        systemPrompt: getSystemPrompt(fw.voiceB, state.mode),
      },
    }
  }

  const getSpeakerVoiceId = (voiceKey) => {
    const id = voiceKey === 'A' ? state.voiceAVoiceId : state.voiceBVoiceId
    const voice = VOICES.find((v) => v.id === id)
    const voiceId = voice?.voiceId ?? null
    if (!voiceId || voiceId.startsWith('REPLACE_')) return null
    return voiceId
  }

  const value = {
    state,
    dispatch,
    getActiveFramework,
    getVoiceAProvider: () => PROVIDERS[state.voiceAProvider],
    getVoiceBProvider: () => PROVIDERS[state.voiceBProvider],
    getVoiceASpeakerVoiceId: () => getSpeakerVoiceId('A'),
    getVoiceBSpeakerVoiceId: () => getSpeakerVoiceId('B'),
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setMode: (mode) => dispatch({ type: 'SET_MODE', payload: mode }),
    setFramework: (id) => dispatch({ type: 'SET_FRAMEWORK', payload: id }),
    setUserInput: (input) => dispatch({ type: 'SET_USER_INPUT', payload: input }),
    setVoiceAProvider: (id) => dispatch({ type: 'SET_VOICE_A_PROVIDER', payload: id }),
    setVoiceBProvider: (id) => dispatch({ type: 'SET_VOICE_B_PROVIDER', payload: id }),
    setVoiceAVoice: (id) => dispatch({ type: 'SET_VOICE_A_VOICE', payload: id }),
    setVoiceBVoice: (id) => dispatch({ type: 'SET_VOICE_B_VOICE', payload: id }),
    setDebateOverlap: (value) => dispatch({ type: 'SET_DEBATE_OVERLAP', payload: value }),
    setSelectedBranch: (branch) => dispatch({ type: 'SET_SELECTED_BRANCH', payload: branch }),
    setResolution: (text) => dispatch({ type: 'SET_RESOLUTION', payload: text }),
    startNewChat: (title, userInput) => dispatch({ type: 'START_NEW_CHAT', payload: { title, userInput } }),
    loadChat: (id) => dispatch({ type: 'LOAD_CHAT', payload: id }),
  }
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
