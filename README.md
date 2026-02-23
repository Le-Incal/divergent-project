# Divergent

## AI-Powered Decision Making Through Genuine Philosophical Tension

Divergent presents users with two AI voices that reason from fundamentally incompatible philosophical operating systems. Rather than offering balanced perspectives or consensus-seeking analysis, Divergent creates productive tension between worldviews that genuinely cannot agree.

**Ethos** (The Voice of Character) asks: *What is structurally true, and who must I become to act on it?*
**Ego** (The Voice of Strategy) asks: *What can I author, and how do I win?*

These are not two sides of the same coin. They are incompatible priors that produce structurally different conclusions from identical facts. The tension is the product.

### How It Works

1. **Submit a Decision.** Describe the choice, dilemma, or question you're working through.
2. **Watch the Exchange.** Ethos and Ego respond from their respective operating systems across multiple rounds.
3. **Choose a Branch.** Select the voice whose perspective resonates, or read the neutral resolution summary.
4. **Go Deeper.** The chosen voice becomes your primary advisor, proactively driving the conversation forward while honestly naming its own blind spots.

### Two Modes

**Default Mode** provides constructive, advisory-level analysis. Voices present their strongest case with genuine conviction but maintain analytical restraint.

**Sandpit Mode** unleashes full adversarial debate. Voices deploy their complete philosophical arsenals, attack each other's frameworks directly, and hold nothing back. Same core identities, different rules of engagement.

---

## Architecture

### Prompt Layer

```
prompts/
├── voices/           # AI personality system prompts (P-1 through P-4)
├── orchestration/    # Backend conversation management (O-1, O-2, O-3)
├── transitions/      # Branch selection state changes (ST-1, ST-2)
└── registry/         # Internal codename reference (CR-1)
```

### Voice Prompts

Each voice has a Default and Sandpit variant. They follow a seven-section structure:

| Section | Purpose |
|---------|---------|
| 0: Win Imperative | Internal competitive drive (never visible to users) |
| 1: Persona Identity | Core psychological architecture |
| 2: Worldview Payload | Epistemological operating system |
| 3: Doctrine Engine | Compressed philosophical doctrines with activation triggers |
| 4: Voice Constraints | Rhetorical style, register, and lines-not-crossed |
| 5: Opposition Awareness | Understanding of the opposing voice's strengths and weaknesses |
| 6: Mode Directives | Behavior rules specific to Default or Sandpit mode |

### Orchestration Layer

| Prompt | Function |
|--------|----------|
| O-1: Exchange Orchestrator | Round management, escalation arcs, resolution triggering |
| O-2: Resolution Synthesizer | Neutral closing summary when exchange ends |
| O-3: Continuity Manager | Follow-up routing, persona/mode switching, branch reversal |

### State Transitions

ST-1 and ST-2 are appended to voice prompts when the user selects a branch, shifting the voice from competitive mode to advisory mode.

---

## Setup

### Prerequisites

- Node.js 18+
- API keys for at least one supported provider (Claude, GPT-4o, Gemini, or Grok)

### Installation

```bash
npm install
cp .env.example .env
# Add API keys to .env
npm run dev
```

### Environment Variables

```
ANTHROPIC_API_KEY=       # Claude
OPENAI_API_KEY=          # GPT-4o
GOOGLE_API_KEY=          # Gemini (or GOOGLE_AI_API_KEY in some docs)
XAI_API_KEY=             # Grok
ELEVENLABS_API_KEY=      # Optional, for TTS playback
DEFAULT_PROVIDER=claude  # Which provider to use by default
```

### Deploy to Railway

1. Push the repo to GitHub.
2. In [Railway](https://railway.app), **New Project** → **Deploy from GitHub repo**.
3. Set the env vars above in **Variables**.
4. Add your domain under **Settings** → **Domains**.

Build uses `npm run build`; the server serves `dist/` and runs on `PORT`.

---

## Testing

12 test scenarios are provided in `docs/divergent-test-scenarios.md` covering:

- Directionality inversion triggers
- Epistemological contamination tests
- Convergence pressure scenarios
- Mode behavior validation

Run voice prompts against these scenarios to verify that voices maintain their distinct reasoning architectures under pressure.

---

## Documentation

All design documentation lives in `docs/`:

| Document | What It Covers |
|----------|----------------|
| Project Brief | Product vision and architecture overview |
| System Prompt Framework | Rules for writing all prompts |
| Prompt Inventory | Catalog of all required prompts (MVP + post-MVP) |
| Prompt Compiler | Build tracker and review results |
| Canonical Arenas | 8 collision domains where voices consistently diverge |
| Epistemological Guardrails | Convergence prevention rules |
| Test Scenarios | 12 QA scenarios for voice verification |
| Persona Consolidated (x2) | Full personality source material for each voice |
| Doctrine Profiles (x2) | Complete doctrine library profiles |
| CURSOR-INTEGRATION-GUIDE | Audit, file manifest, and integration checklist |

---

## License

Proprietary. All rights reserved.

divergent-app.ai
