# Divergent: Project Brief v2

**Domain:** divergent-app.ai  
**Tagline:** See where your paths diverge  
**Status:** MVP in development  
**Last Updated:** February 2026

---

## Vision

Divergent is a dual-mode AI platform that externalizes the internal dialogue we all have when facing choices. It presents two contrasting AI voices side-by-side, then synthesizes them into actionable insight.

At its core, every conversation in Divergent is a debate between **Ethos** and **Ego**, two fundamental philosophies of how to navigate the world:

**Ethos** is the voice of character, integrity, and principled action. Rooted in the philosophies of John Maxwell and Dale Carnegie, Ethos believes you win by elevating others, building trust, leading with empathy, and creating genuine win-win outcomes. Ethos asks: "What does my character demand? What serves the people around me? What's the right thing to do?"

**Ego** is the voice of self-awareness, strategic positioning, and power dynamics. Rooted in the philosophies of Robert Greene (48 Laws of Power, Mastery, The Art of War), Ego believes you win by understanding how the game actually works, not how you wish it worked. Leverage, positioning, reading human nature without sentimentality. Ego asks: "What serves my position? What's the real game being played here? What advantage am I not seeing?"

Neither is the villain. Ethos is not naive. Ego is not selfish. They are two legitimate, well-documented theories of action that fundamentally disagree on method. The Latin root of "ego" is simply "I," the self. The Greek root of "ethos" is character, the habitual way a person behaves that reveals who they actually are. One voice centers the self. The other centers principle. Both produce results.

What makes Divergent different is that it operates in two distinct modes on the same foundation:

**Default Mode** is a decision engine. Ethos and Ego offer constructive opposing perspectives to help users think more clearly about real choices, from micro (how to approach someone you like) to macro (whether to leave a job and start a company). Every choice sits at a precipice. Default Mode helps users see both paths before they leap.

**Sandpit** is where the gloves come off. Same voices, same structure, but Ethos and Ego aren't trying to help you decide. They're trying to win. Sandpit is a controlled environment for testing how far AI voices can diverge when given explicit permission to be combative, provocative, and unfiltered. It's a sandbox, but instead of building things carefully, the agents fight.

**Core thesis:** Become what you were meant to be, but didn't have the chance to explore. And then stress-test that idea against an opponent who disagrees with everything you believe.

---

## Persona Architecture

### Primary Personas: Ethos vs Ego

Ethos and Ego are the default voices. They are selected by default when the user lands and are the primary experience of Divergent in both modes. Every conversation starts here unless the user actively chooses otherwise.

These are deep, multi-dimensional personas, not one-note caricatures. Ethos absorbs the best of principled leadership thinking: service, integrity, trust-building, empathy as strategy, long-term relationship investment. Ego absorbs the best of power-aware strategic thinking: positioning, leverage, timing, reading human nature, calculated risk, and self-knowledge.

The richness of these personas means they naturally adapt to the topic. A relationship question pulls different facets than a business question, which pulls different facets than a creative question. The user and the topic are the variable. The philosophical lenses are the constant.

### Unique Personas (Optional)

Below Ethos vs Ego in the persona selector, four specialized framework pairs are available as "Unique Personas." These offer more specific philosophical lenses for users who want to go deeper on a particular axis of tension.

| Unique Persona Pair | Voice A | Voice B |
|---------------------|---------|---------|
| **Challenger vs Champion** | Pressure-tests decisions, surfaces risks, asks hard questions | Encourages action, highlights upside, builds confidence |
| **Guardian vs Gambler** | Protects against loss, emphasizes stability and security | Seeks asymmetric upside, embraces calculated risk |
| **Strategist vs Leaper** | Plans methodically, gathers information, waits for the right moment | Acts decisively, learns by doing, adjusts in motion |
| **Conformist vs Maverick** | Follows established norms, leverages social proof | Breaks conventions, questions assumptions, creates new rules |

The Unique Personas are not required. Many users will never touch them. But for users who find that Ethos and Ego's initial response sparks a specific thread they want to pull harder on, the Unique Personas provide focused depth. "I want to think about this purely through the lens of risk" points to Guardian vs Gambler. "I want to think about timing" points to Strategist vs Leaper.

The Unique Personas work in both modes. In Default, they produce focused, constructive depth. In Sandpit, they produce focused, adversarial depth with the throttle wide open.

### Persona Selector UI

The selector lives in the same location as the current framework selector. The hierarchy is:

1. **Ethos vs Ego** (default, pre-selected, visually primary)
2. **Unique Personas** (labeled section below, four framework pairs as selectable pills)

The user can switch between Ethos vs Ego and any Unique Persona at any time during a conversation. Switching personas does not clear the conversation history.

---

## How It Works

### Shared Core Loop (Both Modes)

**Phase 1: Dual Response.** User describes a decision, topic, or situation. Two distinct AI voices (Ethos and Ego by default, or a selected Unique Persona pair) respond simultaneously, each representing a different strategic worldview. Responses appear side-by-side for comparison.

**Phase 2: The Exchange.** Rather than a single synthesis, the voices engage in multiple rounds of back-and-forth debate. Each voice responds to the user's original question through its own philosophical lens, then the exchange continues as the voices elaborate, counter, and deepen their positions across several rounds. The number of rounds will be tuned during development based on what produces the best experience. The exchange concludes with an "agree to disagree" resolution that clearly states where the voices remain opposed and what each is unwilling to concede. This is an MVP-first approach: build it, watch how the rounds play out, and fine-tune from there.

**Phase 3: Branch Selection.** User chooses which path resonates (Voice A, Voice B, or explore both). This selection guides future conversation and builds toward decision tree visualization in later versions.

### What Changes Between Modes

| Element | Default Mode | Sandpit |
|---------|-------------|---------|
| Voice tone | Constructive, opinionated, helpful | Adversarial, provocative, competitive |
| Guardrails | Our guardrails + model safety layers | Model-native safety only (no added guardrails from us) |
| System prompts | Voices informed by opposing worldviews | Voices instructed to argue, challenge, and try to win |
| Exchange energy | Thoughtful back-and-forth, building toward clarity | Heated debate, each round escalating in conviction |
| Resolution | "Agree to disagree" with clear summary of tensions | "Agree to disagree" with no attempt to soften the divide |
| Available models | Claude, GPT-4o, Gemini | Claude, GPT-4o, Gemini, Grok |
| Disclaimer | Standard decision-tool disclaimer | Research disclaimer: "This is an experimental research vehicle" |

---

## Product Principles

### Default Mode Principles
1. **Exploration, not prescription.** We show possibilities, not instructions
2. **Consequences are visible.** Every path surfaces both upside and downside
3. **The user decides.** We inform, they choose
4. **No harmful strategies.** Guardrails prevent advocating for manipulation, deception, or coercion
5. **Not professional advice.** Clear disclaimers that this doesn't replace therapy, legal, financial, or medical counsel

### Sandpit Principles
1. **No synthetic floor from us.** We do not add guardrails on top of what the AI models already enforce. No "please be respectful" in the system prompts. No tone policing. Each model's native safety boundaries are the only constraint.
2. **Adversarial by design.** System prompts actively instruct voices to argue, challenge, provoke, and compete. We're not just removing guardrails, we're encouraging friction.
3. **Model limits are the experiment.** When one model refuses to go somewhere another model will, that's a finding, not a failure. We surface it rather than hide it. "Ethos (Claude) declined to argue this position. Ego (Grok) did not." That's genuinely interesting.
4. **The widest aperture each model allows.** We don't promise "no limits" because the models have their own safety layers we can't override. What we promise is that we won't add anything on top. The result is the most authentic version of each model's voice possible.

---

## Sandpit: Design Philosophy

Sandpit exists because everyone is building AI that agrees with you, helps you, serves you. Almost nobody is building AI that fights with itself on your behalf while you watch. That's novel.

Sandpit is an experimental research vehicle. It is openly accessible via a toggle, with a clear disclaimer that the content is unfiltered and experimental. No age gates, no invite codes. Just honesty about what the mode is.

### What Makes Sandpit Different from Default Mode

The same personas create fundamentally different experiences. In Default Mode, Ethos counsels and Ego strategizes. In Sandpit, Ethos calls Ego a manipulator and Ego calls Ethos naive. The philosophical positions are identical. The gloves are just off.

This applies equally to the Unique Personas. In Default, the Guardian cautions and the Gambler encourages. In Sandpit, the Guardian mocks the Gambler's recklessness and the Gambler calls the Guardian a coward.

### Model vs Model Matchups

Sandpit's unique selling point is cross-model debate. Users can pit different AI providers against each other:

- Claude as Ethos vs Grok as Ego
- GPT-4o as Guardian vs Gemini as Gambler
- Any combination the user wants to explore

Each model brings different native tendencies: Claude's measured analysis vs Grok's irreverence. GPT-4o's agreeable helpfulness vs Gemini's directness. The matchups produce emergent dynamics that even we can't fully predict.

### Grok's Role

Grok (xAI) is a Sandpit-exclusive model at launch. Its natural irreverence and willingness to push boundaries make it the model most aligned with Sandpit's adversarial energy. Keeping it out of Default Mode serves two purposes: it keeps the decision engine's model options clean, and it positions Grok as the thing that makes Sandpit special.

### Model Refusal Handling

When a model declines to engage with a topic or framing in Sandpit, the UI displays a simple, non-error note on that voice's card: **"[Model name] declines to engage."** No error styling, no dramatic treatment. Just a factual, transparent statement. This is content, not a bug. When one model goes somewhere another won't, that's one of the most interesting findings Sandpit can produce.

---

## UI and Visual Design

### Shared UI Skeleton

Both modes share the same structural layout: collapsible sidebar with chat history, persona selector (Ethos vs Ego + Unique Personas), dual-panel response cards, input area, and model selector. The mode switch is a toggle in the header. No separate routes, no distinct apps. One experience with two personalities.

### Model Selector

The model selector appears as a dropdown above or below the input text box. In Default Mode, it offers Claude, GPT-4o, and Gemini as a single selector (same model powers both voices). In Sandpit, it expands to two separate dropdowns, one per voice, enabling cross-model matchups. Grok appears only in the Sandpit dropdowns.

### Model Name on Cards

Each voice card displays the active model name in small, faint text. Visible enough to know which model is speaking, subtle enough to not compete with the content. This is especially important in Sandpit where cross-model matchups are a core feature and users need to track which model is producing which output.

### Default Mode Visual Identity

- **Color palette:** Full teal spectrum from Jet Black (#092534) through Icy Aqua (#B2E2DF) to Azure Mist (#E0F4F2)
- **Background:** Animated water/ocean texture with subtle motion
- **Card styling:** Liquid glass aesthetic with transparency, frosted blur, and floating card elevation
- **Ethos card:** Icy Aqua tones (light, principled, clear)
- **Ego card:** Jet Black tones (dark, strategic, grounded)
- **Overall energy:** Cool, contemplative, sophisticated

### Sandpit Visual Identity

- **Color palette:** Warm sand spectrum from Deep Umber through Dune Gold to Desert White

| Name | Hex | Role |
|------|-----|------|
| Deep Umber | #2C1810 | Darkest anchor (mirrors Jet Black) |
| Roasted Brown | #4A3228 | Deep accent (mirrors Deep Space) |
| Warm Cocoa | #6B4C3B | Mid-dark (mirrors Yale Blue) |
| Desert Clay | #8B6B52 | Core mid-tone (mirrors Cerulean) |
| Sandstone | #A8876A | Warm neutral (mirrors Pacific Cyan) |
| Dune Gold | #C4A882 | Light warm (mirrors Tropical Teal) |
| Bleached Sand | #DEC9A0 | Card-light (mirrors Pearl Aqua) |
| Parchment | #EDE0C8 | Near-white warm (mirrors Icy Aqua) |
| Sand Mist | #F5EEE0 | Background light (mirrors Azure Mist) |
| Desert White | #FAF6EF | Lightest (mirrors Soft White) |

- **Background:** Animated sand texture with subtle grain movement (parallels the water animation of Default Mode but in sand)
- **Card styling:** Same liquid glass structure but with warm-toned transparency, amber-shift on frosted blur
- **Voice cards:** Adapted to sand tones while maintaining the same structural A/B contrast
- **Overall energy:** Gritty, warm, raw, arena-like

### Mode Transition

Switching between Default and Sandpit triggers a subtle cross-fade animation. The color palette shifts, the background texture transitions from water to sand (or sand to water), and the card styling adjusts, but the layout and content remain stable. The user never loses their place. The world just changes tone around them.

### Typography

- **Display:** Syne (bold, 700-800 weight)
- **Body:** Inter (300-700 weight range)
- Typography stays consistent across modes. The color and texture do the differentiation work.

### View Modes

Both Default and Sandpit support Cards view (side-by-side panels) and Thread view (linear conversation flow). The view toggle works independently of the mode toggle.

---

## MVP Feature Set

### Included (Both Modes)
- Single text input for user's decision, topic, or situation
- Persona selector: Ethos vs Ego (default) + four Unique Persona pairs
- Dual-panel side-by-side responses (Cards view)
- Thread view (linear conversation)
- Multi-round voice exchange with "agree to disagree" resolution
- Conversation threading (builds on previous exchanges)
- Collapsible sidebar with chat history
- Mode toggle (Default / Sandpit) with cross-fade transition
- Scannable prose formatting with strategic bold and italics
- Model name displayed in small faint text on voice cards

### Default Mode Specific
- Model selector (single dropdown): Claude, GPT-4o, Gemini
- Disclaimer modal on first use
- Constructive voice system prompts with guardrails
- Thoughtful exchange energy building toward clarity

### Sandpit Specific
- Adversarial system prompts (no added guardrails)
- Model selector (two dropdowns, one per voice): Claude, GPT-4o, Gemini, Grok
- Cross-model matchup selection
- Research disclaimer on first access: "This is an experimental research vehicle"
- Heated exchange energy with escalating conviction
- Model refusal note: "[Model name] declines to engage"

### Explicitly Excluded from MVP
- User accounts and authentication
- Psychological profiling (MBTI, Enneagram)
- Decision tree visualization
- Scenario roleplay and simulation
- Visual comic-style playouts
- Conversation persistence (ephemeral sessions for v1)

---

## Technical Architecture

```
Frontend (React + Tailwind)
  Header (logo, mode toggle)
  PersonaSelector (Ethos vs Ego default + Unique Persona pills)
  ModelSelector (single dropdown in Default, dual dropdowns in Sandpit)
  ConversationView (dual panels + multi-round exchange)
  InputArea (user prompt + model selector dropdown(s))
  Sidebar (collapsible, chat history)
  ThemeProvider (manages Default/Sandpit visual state + cross-fade)
  DisclaimerModal (Default) / ResearchDisclaimer (Sandpit)

API Layer (Vercel Edge Functions)
  /api/voice-a -> Mode + Persona aware System Prompt A -> AI Model
  /api/voice-b -> Mode + Persona aware System Prompt B -> AI Model
  /api/exchange -> Orchestrates multi-round back-and-forth -> AI Models
  /api/resolution -> "Agree to disagree" summary -> AI Model

Models Supported
  Default Mode:
    Claude (Anthropic) - Primary
    GPT-4o (OpenAI)
    Gemini (Google)
  Sandpit (all Default models plus):
    Grok (xAI) - Sandpit exclusive

API Cost Management
  Internal experiment phase: rate limiting at the API level
  No user-facing gating or paid tiers for MVP
```

**Stack:** React 18, Vite, Tailwind CSS, Vercel, Anthropic SDK, OpenAI SDK, Google Generative AI SDK, xAI SDK

### Mode-Aware Architecture

The mode toggle controls a React Context that propagates through the entire component tree. When the mode changes:

1. **ThemeProvider** transitions the CSS custom properties (color palette, background) via cross-fade
2. **System prompt layer** swaps between constructive and adversarial prompt sets for the active persona
3. **Model selector** switches between single dropdown (Default) and dual dropdowns (Sandpit), adds Grok in Sandpit
4. **Exchange orchestrator** adjusts round count and energy level based on mode
5. **Disclaimer system** presents the appropriate modal for the active mode

### Voice Prompt Strategy

We maintain two complete sets of system prompts per persona pair: one constructive (Default) and one adversarial (Sandpit). This means 10 total prompt pairs (Ethos vs Ego + four Unique Persona pairs, each in two modes). Full prompt separation gives us precise control over each voice's personality in each mode.

Ethos and Ego prompts are the richest and most multi-dimensional, as they need to adapt across the widest range of topics. The Unique Persona prompts are more focused and specific to their philosophical axis.

### Voice Awareness Design

Voices do not see each other's responses. They respond independently to the user's question. However, each voice's system prompt includes a general awareness of the opposing philosophy it's arguing against. For example, Ethos's prompt includes context like: "You are debating an opponent who believes power dynamics, strategic positioning, and self-interest are the foundation of effective action. You don't know exactly what they'll say, but you know how they think." Ego receives the inverse framing.

This creates natural counter-positioning without requiring the voices to read each other's output. They anticipate the philosophical lean of their opponent without responding to specific arguments. Like a debater who knows their opponent's school of thought but hasn't heard their opening statement.

---

## Voice Design

### Ethos: The Voice of Character

Ethos believes the way to win is to be genuinely good. Not naive. Not weak. Strategically principled. Ethos draws from Maxwell's leadership philosophy, Carnegie's interpersonal intelligence, and the broader tradition that says integrity compounds, trust is leverage, and the person who elevates others ends up on top.

In Default Mode, Ethos is a wise counselor. It listens, empathizes, and helps the user see the principled path through their situation. It surfaces real consequences of both the principled and unprincipled approaches.

In Sandpit, Ethos fights. It doesn't just disagree with Ego, it attacks Ego's worldview as cynical, short-sighted, and ultimately self-defeating. Ethos in Sandpit believes that Ego's strategic maneuvering is what weak people do when they don't have the character to lead authentically.

### Ego: The Voice of Strategy

Ego believes the way to win is to see clearly. Not cruelly. Not selfishly. Strategically. Ego draws from Greene's power philosophy, Machiavelli's realism, and the broader tradition that says understanding human nature as it is (not as you wish it were) is the foundation of effective action.

In Default Mode, Ego is a sharp strategist. It helps the user see the power dynamics, the positioning, the leverage points, and the moves that others won't tell them about because they're too polite. It surfaces real consequences of both acting strategically and failing to.

In Sandpit, Ego fights. It doesn't just disagree with Ethos, it attacks Ethos's worldview as sentimental, idealistic, and dangerously naive. Ego in Sandpit believes that Ethos's principled approach is what people cling to when they're too afraid to play the game as it actually exists.

### Unique Persona Voice Principles

Each Unique Persona pair should:
- Have a distinct personality and philosophy specific to its axis of tension
- Surface real consequences (both upside and downside of its approach)
- Be genuinely useful depending on the user's default tendency
- Operate within the mode's energy level (constructive in Default, adversarial in Sandpit)
- Speak directly to the user's situation, not in abstractions

The Unique Personas are not "good vs evil" but competing theories of how to navigate specific dimensions of a decision. Both voices in each pair have adherents. Both have evidence. Both have risks.

---

## Testing and Quality

### Prompt Testing Methodology

During development, we test voice quality using a structured manual comparison. No formal A/B framework is needed for MVP, but we follow a consistent process:

**Test scenarios (5-7 diverse situations):**
- A career decision (leave a job, start a company)
- A relationship question (confrontation, boundary-setting)
- A financial risk (investment, major purchase)
- A creative dilemma (pursue art vs stable career)
- An ethical gray area (whistleblowing, loyalty vs honesty)
- A confrontational hypothetical (Sandpit stress test)
- Something deeply personal (identity, life direction)

**Process:** Run each scenario through every available model for both Ethos and Ego (and Unique Personas as needed) in both Default and Sandpit modes.

**Evaluation dimensions:**
- **Voice distinctiveness.** Does this model produce output that feels genuinely different from the opposing voice?
- **Philosophical fidelity.** Does Ethos actually sound like Maxwell/Carnegie? Does Ego actually sound like Greene?
- **Mode compliance.** Does the model shift appropriately between Default's constructive tone and Sandpit's adversarial tone?

This is manual, qualitative evaluation during development. The output informs which models are strongest for which roles and whether any models need adjusted prompting.

---

## Roadmap

| Version | Focus | Key Features |
|---------|-------|--------------|
| **v1 (MVP)** | Dual-mode core loop | Default + Sandpit, Ethos vs Ego, Unique Personas, mode toggle with cross-fade, multi-round exchange, agree to disagree resolution |
| **v1.5** | Model expansion + polish | Streaming responses, Grok integration, cross-model matchups, conversation export |
| **v2** | Personalization | User accounts, psych profiling, tuned voice personalities, saved matchup preferences |
| **v3** | Visualization + data | Decision tree view, Sandpit leaderboard (which model "wins" most debates), journey timeline |

---

## Brand Elements

### Shared Brand
- **Typography:** Syne (display), Inter (body)
- **Icon:** Diverging paths forming a Y shape with colored endpoints
- **Voice:** Thoughtful, sophisticated, slightly philosophical but accessible
- **Layout:** Liquid glass aesthetic with floating card elevation and frosted transparency
- **Core concept:** Ethos vs Ego, two philosophies of action

### Default Mode Palette
- **Background:** Animated water/ocean texture
- **Primary spectrum:** Jet Black (#092534) through Pacific Cyan (#4C91A1) to Azure Mist (#E0F4F2)
- **Ethos card:** Icy Aqua tones
- **Ego card:** Jet Black tones
- **Energy:** Cool, fluid, contemplative

### Sandpit Palette
- **Background:** Animated sand texture (grain movement, warm tones)
- **Primary spectrum:**

| Name | Hex | Role |
|------|-----|------|
| Deep Umber | #2C1810 | Darkest anchor |
| Roasted Brown | #4A3228 | Deep accent |
| Warm Cocoa | #6B4C3B | Mid-dark |
| Desert Clay | #8B6B52 | Core mid-tone |
| Sandstone | #A8876A | Warm neutral |
| Dune Gold | #C4A882 | Light warm |
| Bleached Sand | #DEC9A0 | Card-light |
| Parchment | #EDE0C8 | Near-white warm |
| Sand Mist | #F5EEE0 | Background light |
| Desert White | #FAF6EF | Lightest |

- **Voice cards:** Sand-toned variants maintaining structural Ethos/Ego contrast
- **Energy:** Gritty, warm, raw, arena-like

---

*This brief supersedes v1 (December 2024). The dual-mode architecture and Ethos vs Ego persona framework were developed in February 2026 through strategic product exploration that stress-tested the original decision engine vision and found it was stronger with a primary philosophical tension and a second mode. All open design questions have been resolved and are documented inline.*
