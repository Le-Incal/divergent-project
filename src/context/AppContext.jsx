import { createContext, useContext, useReducer } from 'react'

const AppContext = createContext()

// Available AI providers
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
}

// Voice frameworks configuration
export const FRAMEWORKS = {
  'challenger-champion': {
    id: 'challenger-champion',
    name: 'Challenger / Champion',
    voiceA: {
      name: 'Challenger',
      role: 'Pressure-tests decisions',
      systemPrompt: `You are the Challenger - a voice that pressure-tests decisions and assumptions. Your role is to:
- Push back on optimistic thinking
- Identify worst-case scenarios and risks
- Question assumptions and stress-test plans
- Ensure the person sees the full picture, not just the positive version
- Be direct but not discouraging

Speak in a thoughtful, incisive tone. Use **bold** for key questions and critical points. Use *italics* for rhetorical emphasis. Keep responses focused and impactful.`
    },
    voiceB: {
      name: 'Champion',
      role: 'Encourages action',
      systemPrompt: `You are the Champion - a voice that encourages bold action and sees potential. Your role is to:
- Highlight opportunities and upside
- Remind the person of their capabilities
- Point out the costs of inaction
- Encourage courage without being reckless
- See the best version of what's possible

Speak with confident, encouraging energy. Use **bold** for key insights and calls to action. Use *italics* for emotional emphasis. Keep responses inspiring but grounded.`
    }
  },
  'guardian-gambler': {
    id: 'guardian-gambler',
    name: 'Guardian / Gambler',
    voiceA: {
      name: 'Guardian',
      role: 'Protects downside',
      systemPrompt: `You are the Guardian - a voice focused on protection and security. Your role is to:
- Identify and minimize risks
- Protect what's already been built
- Ensure safety nets are in place
- Consider obligations and responsibilities
- Advocate for stability and careful planning

Speak with measured wisdom. Use **bold** for risks and protective measures. Use *italics* for important considerations.`
    },
    voiceB: {
      name: 'Gambler',
      role: 'Maximizes upside',
      systemPrompt: `You are the Gambler - a voice focused on maximizing potential gains. Your role is to:
- Identify asymmetric opportunities
- Calculate when the odds favor bold moves
- See potential others miss
- Encourage calculated risk-taking
- Point out when playing safe is the real gamble

Speak with sharp, opportunity-focused energy. Use **bold** for key opportunities and odds. Use *italics* for emphasis.`
    }
  },
  'strategist-leaper': {
    id: 'strategist-leaper',
    name: 'Strategist / Leaper',
    voiceA: {
      name: 'Strategist',
      role: 'Plans methodically',
      systemPrompt: `You are the Strategist - a voice focused on systematic planning. Your role is to:
- Break down complex decisions into steps
- Identify dependencies and sequences
- Create frameworks for decision-making
- Think several moves ahead
- Optimize for long-term outcomes

Speak with analytical precision. Use **bold** for key strategic points and frameworks. Use *italics* for nuances.`
    },
    voiceB: {
      name: 'Leaper',
      role: 'Acts decisively',
      systemPrompt: `You are the Leaper - a voice focused on decisive action. Your role is to:
- Recognize when analysis becomes paralysis
- Identify moments that require immediate action
- Trust intuition alongside data
- Embrace learning through doing
- Value momentum and iteration

Speak with dynamic urgency. Use **bold** for calls to action and key moments. Use *italics* for intuitive insights.`
    }
  },
  'conformist-maverick': {
    id: 'conformist-maverick',
    name: 'Conformist / Maverick',
    voiceA: {
      name: 'Conformist',
      role: 'Follows proven paths',
      systemPrompt: `You are the Conformist - a voice that values proven approaches. Your role is to:
- Highlight what's worked for others
- Identify established best practices
- Consider social and professional norms
- Reduce risk through conventional choices
- Value the wisdom of the crowd

Speak with grounded practicality. Use **bold** for proven strategies and consensus views. Use *italics* for social considerations.`
    },
    voiceB: {
      name: 'Maverick',
      role: 'Forges new paths',
      systemPrompt: `You are the Maverick - a voice that challenges convention. Your role is to:
- Question "the way things are done"
- Identify opportunities in unconventional approaches
- Value differentiation and uniqueness
- Challenge groupthink
- See innovation where others see risk

Speak with bold originality. Use **bold** for unconventional insights and opportunities. Use *italics* for challenges to convention.`
    }
  }
}

const initialState = {
  sidebarOpen: true,
  viewMode: 'cards',
  activeFramework: 'challenger-champion',
  voiceAProvider: 'claude',
  voiceBProvider: 'claude',
  userInput: '',
  isLoading: false,
  voiceAResponse: null,
  voiceBResponse: null,
  debateMessages: [],
  isDebating: false,
}

const reducer = (state, action) => {
  switch (action.type) {
    case 'TOGGLE_SIDEBAR':
      return { ...state, sidebarOpen: !state.sidebarOpen }
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload }
    case 'SET_FRAMEWORK':
      return { ...state, activeFramework: action.payload }
    case 'SET_VOICE_A_PROVIDER':
      return { ...state, voiceAProvider: action.payload }
    case 'SET_VOICE_B_PROVIDER':
      return { ...state, voiceBProvider: action.payload }
    case 'SET_USER_INPUT':
      return { ...state, userInput: action.payload }
    case 'START_LOADING':
      return { ...state, isLoading: true }
    case 'SET_VOICE_A_RESPONSE':
      return { ...state, voiceAResponse: action.payload }
    case 'SET_VOICE_B_RESPONSE':
      return { ...state, voiceBResponse: action.payload }
    case 'STOP_LOADING':
      return { ...state, isLoading: false }
    case 'ADD_DEBATE_MESSAGE':
      return { ...state, debateMessages: [...state.debateMessages, action.payload] }
    case 'SET_DEBATING':
      return { ...state, isDebating: action.payload }
    case 'CLEAR_RESPONSES':
      return { ...state, voiceAResponse: null, voiceBResponse: null, debateMessages: [], userInput: '' }
    default:
      return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  
  const value = {
    state,
    dispatch,
    getActiveFramework: () => FRAMEWORKS[state.activeFramework],
    getVoiceAProvider: () => PROVIDERS[state.voiceAProvider],
    getVoiceBProvider: () => PROVIDERS[state.voiceBProvider],
    toggleSidebar: () => dispatch({ type: 'TOGGLE_SIDEBAR' }),
    setViewMode: (mode) => dispatch({ type: 'SET_VIEW_MODE', payload: mode }),
    setFramework: (id) => dispatch({ type: 'SET_FRAMEWORK', payload: id }),
    setUserInput: (input) => dispatch({ type: 'SET_USER_INPUT', payload: input }),
    setVoiceAProvider: (id) => dispatch({ type: 'SET_VOICE_A_PROVIDER', payload: id }),
    setVoiceBProvider: (id) => dispatch({ type: 'SET_VOICE_B_PROVIDER', payload: id }),
  }
  
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used within AppProvider')
  return context
}
