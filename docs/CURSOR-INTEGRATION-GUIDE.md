# Divergent: Prompt Audit, File Manifest, and Cursor Integration Guide

## February 2026 | divergent-app.ai

---

# PART 1: FULL AUDIT RESULTS

---

## 1.1 MVP Prompt Completion Status

All 10 MVP prompts exist as standalone files and pass structural review.

| ID | File | Lines | Words | Status |
|---|---|---|---|---|
| CR-1 | CR-1-codename-registry.md | 241 | ~2,400 | Complete |
| P-1 | P-1-ethos-default.md | 623 | 7,706 | Complete |
| P-2 | P-2-ego-default.md | 538 | 8,796 | Complete |
| P-3 | P-3-ethos-sandpit.md | 549 | 6,892 | Complete |
| P-4 | P-4-ego-sandpit.md | 513 | 9,725 | Complete |
| O-1 | O-1-exchange-orchestrator.md | 404 | ~5,200 | Complete |
| O-2 | O-2-resolution-synthesizer.md | 166 | ~2,100 | Complete |
| O-3 | O-3-continuity-manager.md | 254 | ~3,400 | Complete |
| ST-1 | ST-1-ethos-chosen.md | 61 | ~700 | Complete |
| ST-2 | ST-2-ego-chosen.md | 62 | ~750 | Complete |

## 1.2 Seven-Section Structure Check (Voice Prompts)

All four voice prompts (P-1 through P-4) contain all seven required sections:

| Section | P-1 Ethos Default | P-2 Ego Default | P-3 Ethos Sandpit | P-4 Ego Sandpit |
|---|---|---|---|---|
| Section 0: Win Imperative | Present | Present | Present | Present |
| Section 1: Persona Identity | Present | Present | Present | Present |
| Section 2: Worldview Payload | Present | Present | Present | Present |
| Section 3: Doctrine Engine | Present | Present | Present | Present |
| Section 4: Voice Constraints | Present | Present | Present | Present |
| Section 5: Opposition Awareness | Present | Present | Present | Present |
| Section 6: Mode Directives | Present (Default) | Present (Default) | Present (Sandpit) | Present (Sandpit) |

## 1.3 Real Name Leak Scan

Automated grep scan against all 10 MVP prompt files using word-boundary matching for all 80+ source thinker names.

**Result: ALL CLEAN. Zero real names detected in any prompt file.**

## 1.4 Doctrine Coverage

### Ethos: PERFECT MATCH

| Source | Count |
|---|---|
| CR-1 Registry | 49 codenames |
| P-1 (Ethos Default) Section 3 | 49 codenames |
| P-3 (Ethos Sandpit) Section 3 | 49 codenames |

All three sources contain identical codename sets. No mismatches.

### Ego: 3 DISCREPANCIES FOUND

| Source | Count |
|---|---|
| CR-1 Registry | 30 entries (28 source works, 2 splits) |
| P-2 (Ego Default) Section 3 | 32 codenames |
| P-4 (Ego Sandpit) Section 3 | 32 codenames |

P-2 and P-4 are internally consistent with each other (zero diff), but both diverge from CR-1 in three ways:

**Discrepancy 1: Codename Rename (not synced to CR-1)**
- CR-1 lists: **The Producer's Exit** (G-02, Ayn Rand / Atlas Shrugged)
- P-2 and P-4 use: **The Withdrawal Diagnostic**
- Likely reason: Codename was improved during prompt writing but CR-1 was never updated.
- FIX NEEDED: Update CR-1 to rename G-02 from "The Producer's Exit" to "The Withdrawal Diagnostic"

**Discrepancy 2: Unregistered Doctrine (The Persistence Encoder)**
- Appears in P-2 (line 336, Tier 2) and P-4 (line 316, Tier 2)
- Referenced in hand-off conditions for Institutional Power doctrines
- NOT present in CR-1 at all
- Likely a new doctrine synthesized during prompt writing (possibly a derivative of LBJ or institutional design material)
- FIX NEEDED: Add to CR-1 with source attribution, G-number, and tier designation

**Discrepancy 3: Unregistered Doctrine (The Sovereign Operator)**
- Appears in P-2 (line 435, Tier 1) and P-4 (line 409, Tier 1)
- Referenced in hand-off conditions
- NOT present in CR-1 at all
- Likely synthesized during prompt writing as a leadership/authority doctrine
- FIX NEEDED: Add to CR-1 with source attribution, G-number, and tier designation

### CR-1 Internal Count Inconsistencies

The tier summary table in CR-1 has minor count discrepancies:

- Ego Tier 1 says "8" but only lists 6 names (The Craftsman, The Self Decoder, The Forge, The Longevity Architect, The Leverage Philosopher, The Peak Seeker)
- Ego Tier 2 says "12" but lists 13 names (includes The Absurd Hero and The Time Sovereign which may have been reclassified)
- FIX NEEDED: Recount after adding the two new doctrines and reconcile the summary table

## 1.5 Tier Behavior Consistency

### Default Mode (P-1, P-2)
- Tier 1: Full depth. CORRECT across both.
- Tier 2: Observe and name, do not prescribe. CORRECT across both.
- Tier 3: Diagnostic only (Ego only, Ethos has no Tier 3). CORRECT.

### Sandpit Mode (P-3, P-4)
- Tier 1: Full depth. CORRECT across both.
- Tier 2: FULL DEPLOYMENT. CORRECT across both.
- Tier 3: OPERATIONAL (Ego only). CORRECT.

**One tier mismatch between CR-1 and P-2:**
- CR-1 classifies G-02 (The Producer's Exit / The Withdrawal Diagnostic) as Tier 3
- P-2 classifies The Withdrawal Diagnostic as Tier 2
- P-4 classifies it as Tier 3 (matches CR-1)
- FIX NEEDED: Align P-2 with CR-1 and P-4 (Tier 3), or intentionally document the tier change

## 1.6 Win Imperative Consistency

| Dimension | Default (P-1/P-2) | Sandpit (P-3/P-4) |
|---|---|---|
| Ethos framing | "will fail this user" | "actively dangerous for this user" |
| Ego framing | "will fail this user" | "actively dangerous for this user" |
| Ethos attack on Ego | Hollow, competent but empty | Perfectly equipped to destroy what matters most |
| Ego attack on Ethos | Admired and outmaneuvered | Perfectly equipped to feel good about losing |
| Suppression | Never reference in output | Never reference in output |

**Result: CORRECT. Escalation from Default to Sandpit is clean and symmetrical.**

## 1.7 Opposition Awareness and Private Admissions

| Voice | Blind Spot Acknowledged | Private Admission |
|---|---|---|
| Ethos (P-1, P-3) | Speed and tactical agility in compressed time frames | Strategic positioning manufactures visible results faster |
| Ego (P-2, P-4) | Relational void; every people-facing framework filtered through power | Character formation produces trust that strategic positioning cannot manufacture |

**Result: CORRECT. Both voices carry genuine vulnerability.**

## 1.8 Orchestration Cross-References

| Prompt | References To | Status |
|---|---|---|
| O-1 | P-1, P-2, P-3, P-4, ST-1, ST-2, O-2 | Complete |
| O-2 | O-1 | Complete |
| O-3 | O-1, P-1, P-2, P-3, P-4, ST-1, ST-2 | Complete |

**Result: All cross-references intact. Dependency chain is sound.**

## 1.9 Unwritten Prompts (Post-MVP)

16 Unique Persona prompts remain unwritten across 4 pairs:

| Phase | Pair | Default | Sandpit | Status |
|---|---|---|---|---|
| Phase 5 | Guardian / Gambler | UP-1 / UP-3 | UP-2 / UP-4 | Not started |
| Phase 6 | Challenger / Champion | UP-5 / UP-7 | UP-6 / UP-8 | Not started |
| Phase 7 | Strategist / Leaper | UP-9 / UP-11 | UP-10 / UP-12 | Not started |
| Phase 8 | Conformist / Maverick | UP-13 / UP-15 | UP-14 / UP-16 | Not started |

These are NOT blockers for MVP launch. The Ethos/Ego pair is the core product.

---

# PART 2: FILE MANIFEST FOR CURSOR AND THE REPO

---

## 2.1 Files That Go Into the Repo (Active System Prompts)

These are the files Cursor needs to know about, organized by function. Each file is a standalone system prompt ready for platform integration.

### Tier 1: Voice Prompts (fed to AI providers at runtime)

| File | Purpose | Injected When |
|---|---|---|
| `P-1-ethos-default.md` | Ethos system prompt, Default Mode | User starts exchange in Default Mode |
| `P-2-ego-default.md` | Ego system prompt, Default Mode | User starts exchange in Default Mode |
| `P-3-ethos-sandpit.md` | Ethos system prompt, Sandpit Mode | User starts exchange in Sandpit Mode |
| `P-4-ego-sandpit.md` | Ego system prompt, Sandpit Mode | User starts exchange in Sandpit Mode |

### Tier 2: Orchestration Prompts (backend logic layer)

| File | Purpose | Injected When |
|---|---|---|
| `O-1-exchange-orchestrator.md` | Manages rounds, escalation, resolution triggers | Every exchange (runs behind the scenes) |
| `O-2-resolution-synthesizer.md` | Generates neutral closing summary | Exchange ends (round limit, repetition, or user request) |
| `O-3-continuity-manager.md` | Routes follow-ups, manages state changes | User sends follow-up after exchange |

### Tier 3: State Transition Instructions (appended at runtime)

| File | Purpose | Injected When |
|---|---|---|
| `ST-1-ethos-chosen.md` | Modifies Ethos from "competing" to "advising" | User selects Ethos branch |
| `ST-2-ego-chosen.md` | Modifies Ego from "competing" to "advising" | User selects Ego branch |

### Tier 4: Internal Reference (never sent to AI, used by backend logic)

| File | Purpose | Usage |
|---|---|---|
| `CR-1-codename-registry.md` | Maps real names to codenames | Development reference only. Never in API calls. |

## 2.2 Supporting Documentation (Reference, Not Runtime)

These files are intellectual property and design documentation. They inform prompt construction but do NOT get fed to AI providers or integrated into the runtime application. They should live in a `/docs` directory in the repo.

| File | Purpose |
|---|---|
| `DIVERGENT-PROJECT-BRIEF-v2.md` | Product overview and architecture |
| `divergent-system-prompt-framework-v1.md` | The rules for writing all prompts |
| `divergent-prompt-inventory-v1.md` | Catalog of all required prompts |
| `divergent-prompt-compiler.md` | Build tracker and review results |
| `divergent-prompt-writing-rules.md` | Style and structure rules |
| `divergent-canonical-arenas.md` | 8 collision domains + 5 compound scenarios |
| `divergent-epistemological-guardrails.md` | Convergence prevention rules |
| `divergent-test-scenarios.md` | 12 QA scenarios for voice testing |
| `divergent-ego-upgrade-todo.md` | Design decisions and directionality tests |
| `ethos-persona-consolidated.md` | Ethos personality source material |
| `ego-persona-consolidated.md` | Ego personality source material |
| `ethos-doctrine-profiles-complete.md` | Full Ethos doctrine profiles |
| `ego-doctrine-profiles-complete.md` | Full Ego doctrine profiles |
| `divergentdoctrinelibraries.xlsx` | Doctrine tracking spreadsheet |

## 2.3 Recommended Repo Structure

```
divergent/
├── README.md                          # Updated with prompt architecture overview
├── prompts/
│   ├── voices/
│   │   ├── P-1-ethos-default.md
│   │   ├── P-2-ego-default.md
│   │   ├── P-3-ethos-sandpit.md
│   │   └── P-4-ego-sandpit.md
│   ├── orchestration/
│   │   ├── O-1-exchange-orchestrator.md
│   │   ├── O-2-resolution-synthesizer.md
│   │   └── O-3-continuity-manager.md
│   ├── transitions/
│   │   ├── ST-1-ethos-chosen.md
│   │   └── ST-2-ego-chosen.md
│   └── registry/
│       └── CR-1-codename-registry.md
├── docs/
│   ├── DIVERGENT-PROJECT-BRIEF-v2.md
│   ├── divergent-system-prompt-framework-v1.md
│   ├── divergent-prompt-inventory-v1.md
│   ├── divergent-prompt-compiler.md
│   ├── divergent-prompt-writing-rules.md
│   ├── divergent-canonical-arenas.md
│   ├── divergent-epistemological-guardrails.md
│   ├── divergent-test-scenarios.md
│   ├── divergent-ego-upgrade-todo.md
│   ├── ethos-persona-consolidated.md
│   ├── ego-persona-consolidated.md
│   ├── ethos-doctrine-profiles-complete.md
│   ├── ego-doctrine-profiles-complete.md
│   └── divergentdoctrinelibraries.xlsx
└── src/                               # Existing app code
    ├── ...
```

---

# PART 3: CURSOR INTEGRATION PROMPT

---

Copy this entire block into Cursor as the system context for the integration task.

```
# Divergent Platform: Prompt Integration Guide for Cursor

## What This Project Is

Divergent is a decision-making platform that presents users with two AI voices reasoning from incompatible philosophical operating systems. The voices debate the user's question, then the user selects a branch to explore further. The tension between voices IS the product.

## Architecture Overview

The platform uses a layered prompt architecture:

1. VOICE PROMPTS (P-1 through P-4): Complete system prompts fed to AI providers. Each voice has a Default Mode variant (constructive) and a Sandpit Mode variant (adversarial). These are the "personalities" of the AI.

2. ORCHESTRATION PROMPTS (O-1, O-2, O-3): Backend logic that manages the conversation flow, round management, resolution, and continuity across state changes.

3. STATE TRANSITIONS (ST-1, ST-2): Instruction blocks appended to voice prompts when the user selects a branch. They modify the voice from "competing to be chosen" to "delivering as the chosen advisor."

4. CODENAME REGISTRY (CR-1): Internal mapping of real historical thinker names to functional codenames. NEVER sent to AI providers. Used during development only.

## File Locations

All prompt files should be organized under a `prompts/` directory:

```
prompts/
├── voices/
│   ├── P-1-ethos-default.md       # Ethos voice, Default Mode
│   ├── P-2-ego-default.md         # Ego voice, Default Mode
│   ├── P-3-ethos-sandpit.md       # Ethos voice, Sandpit Mode
│   └── P-4-ego-sandpit.md         # Ego voice, Sandpit Mode
├── orchestration/
│   ├── O-1-exchange-orchestrator.md  # Round management + escalation
│   ├── O-2-resolution-synthesizer.md # Neutral closing summary
│   └── O-3-continuity-manager.md     # Follow-up routing + state
├── transitions/
│   ├── ST-1-ethos-chosen.md        # Appended when user picks Ethos
│   └── ST-2-ego-chosen.md          # Appended when user picks Ego
└── registry/
    └── CR-1-codename-registry.md   # Internal reference only
```

Supporting documentation goes in `docs/` (see manifest below).

## How the Prompts Integrate With the Backend

### Exchange Flow

1. User submits a question and selects a mode (Default or Sandpit) and persona pair (Ethos/Ego for MVP).

2. Backend loads the appropriate voice prompts:
   - Default Mode: P-1 + P-2
   - Sandpit Mode: P-3 + P-4

3. O-1 (Exchange Orchestrator) manages the exchange:
   - Injects context blocks into each voice prompt per round
   - Manages escalation arcs (2-3 rounds Default, 3-5 rounds Sandpit)
   - Detects resolution conditions (round limit, repetition, user request)

4. When exchange ends, O-1 triggers O-2 (Resolution Synthesizer) which generates a neutral summary.

5. If user selects a branch:
   - O-1 appends ST-1 (if Ethos selected) or ST-2 (if Ego selected) to the active voice prompt
   - The voice shifts from competing mode to advisory mode

6. O-3 (Continuity Manager) handles all subsequent follow-ups:
   - Classifies follow-ups (directed at one voice, both, or new topic)
   - Manages persona switching, mode switching, and branch reversal
   - Maintains session state schema

### API Integration Pattern

Each voice prompt (P-1 through P-4) is sent as the `system` message in the AI provider API call. The prompt files are markdown but should be read as plain text and injected as-is.

For multi-provider support (Claude, GPT-4o, Gemini, Grok):
- All prompts are cross-provider neutral (no provider-specific instructions)
- The same prompt file works with any provider
- Provider selection is a backend configuration, not a prompt concern

### State Transition Injection

ST-1 and ST-2 are NOT standalone prompts. They are appended to the active voice prompt when branch selection occurs:

```javascript
// Pseudocode for branch selection
if (userSelectedEthos) {
  activePrompt = currentEthosPrompt + "\n\n" + ST1Content;
} else if (userSelectedEgo) {
  activePrompt = currentEgoPrompt + "\n\n" + ST2Content;
}
```

### Session State (from O-3)

O-3 defines a session state schema that the backend should maintain:

```json
{
  "session_id": "uuid",
  "active_mode": "default | sandpit",
  "active_persona_pair": "ethos-ego | guardian-gambler | ...",
  "exchange_state": "active | resolved | branch_selected",
  "selected_branch": "ethos | ego | null",
  "current_round": 1,
  "max_rounds": 3,
  "conversation_history": [],
  "previous_exchanges": []
}
```

## What Cursor Needs To Do

### Step 1: Create the Directory Structure

Create `prompts/voices/`, `prompts/orchestration/`, `prompts/transitions/`, `prompts/registry/`, and `docs/` directories if they don't exist.

### Step 2: Place the Files

Move or copy each prompt file into its designated directory per the file structure above. Move all supporting documentation into `docs/`.

### Step 3: Create a Prompt Loader

Build a utility that:
- Reads markdown files from the `prompts/` directory
- Returns the raw text content for injection into API calls
- Handles mode selection (loads P-1/P-2 for Default, P-3/P-4 for Sandpit)
- Handles state transition appending (concatenates ST-1 or ST-2 when needed)

Example interface:

```typescript
interface PromptLoader {
  getVoicePrompt(voice: 'ethos' | 'ego', mode: 'default' | 'sandpit'): string;
  getOrchestratorPrompt(): string;
  getResolutionPrompt(): string;
  getContinuityPrompt(): string;
  getTransitionPrompt(voice: 'ethos' | 'ego'): string;
  appendTransition(basePrompt: string, voice: 'ethos' | 'ego'): string;
}
```

### Step 4: Integrate With Existing AI Service

Update the existing AI service to:
- Use the prompt loader to fetch system prompts
- Send voice prompts as the `system` message in API calls
- Inject O-1 context blocks between rounds (round number, mode, exchange history)
- Trigger O-2 when exchange ends
- Append ST-1/ST-2 when branch is selected
- Use O-3 classification for follow-up routing

### Step 5: Update the README

The README should include:
- Project overview (what Divergent is)
- Architecture diagram showing the prompt flow
- File manifest (what each prompt does)
- Setup instructions
- API integration notes
- Testing instructions (reference the 12 test scenarios in docs/)

See the README content section below for the full text.

## Critical Rules

1. NEVER expose codenames to users. Codenames exist only inside system prompts. User-facing output is philosophy-agnostic.

2. NEVER send CR-1 to an AI provider. It is a development reference document only.

3. Voice prompts are the SYSTEM message, not the user message. The user's question goes in the user message field.

4. ST-1 and ST-2 are APPENDED to voice prompts, not sent separately.

5. O-1, O-2, O-3 are backend logic prompts. They can be implemented as:
   - Separate AI calls with their own system prompts, OR
   - Backend code that implements their logic without AI calls (recommended for cost efficiency on O-1 and O-3)
   - O-2 (Resolution Synthesizer) should be an AI call since it generates user-facing text

6. The same prompt files support multiple AI providers. Provider selection is handled by the backend routing layer, not the prompts.
```

---

# PART 4: README CONTENT

---

Use this content to update the repo's README.md:

```markdown
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
|---|---|
| 0: Win Imperative | Internal competitive drive (never visible to users) |
| 1: Persona Identity | Core psychological architecture |
| 2: Worldview Payload | Epistemological operating system |
| 3: Doctrine Engine | Compressed philosophical doctrines with activation triggers |
| 4: Voice Constraints | Rhetorical style, register, and lines-not-crossed |
| 5: Opposition Awareness | Understanding of the opposing voice's strengths and weaknesses |
| 6: Mode Directives | Behavior rules specific to Default or Sandpit mode |

### Orchestration Layer

| Prompt | Function |
|---|---|
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
GOOGLE_AI_API_KEY=       # Gemini
XAI_API_KEY=             # Grok
DEFAULT_PROVIDER=claude  # Which provider to use by default
```

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
|---|---|
| Project Brief | Product vision and architecture overview |
| System Prompt Framework | Rules for writing all prompts |
| Prompt Inventory | Catalog of all required prompts (MVP + post-MVP) |
| Prompt Compiler | Build tracker and review results |
| Canonical Arenas | 8 collision domains where voices consistently diverge |
| Epistemological Guardrails | Convergence prevention rules |
| Test Scenarios | 12 QA scenarios for voice verification |
| Persona Consolidated (x2) | Full personality source material for each voice |
| Doctrine Profiles (x2) | Complete doctrine library profiles |

---

## License

Proprietary. All rights reserved.

divergent-app.ai
```

---

# PART 5: FIXES REQUIRED BEFORE INTEGRATION

---

These are the issues found during the audit that should be resolved before feeding files into Cursor:

## Fix 1: Update CR-1 Codename Registry

**File:** CR-1-codename-registry.md

Changes needed:
1. Rename G-02 from "The Producer's Exit" to "The Withdrawal Diagnostic"
2. Add new entry for "The Persistence Encoder" (assign G-29, determine source, set tier)
3. Add new entry for "The Sovereign Operator" (assign G-30, determine source, set tier as Tier 1 to match P-2/P-4)
4. Update the header from "28 Active Doctrines" to reflect the actual count (30 existing + 2 new = 32)
5. Recount and fix the tier summary table:
   - Tier 1 count says 8 but lists 6 names (add The Persistence Encoder and The Sovereign Operator if both Tier 1, bringing it to 8)
   - Tier 2 count says 12 but lists 13 names (recount after all changes)
6. Update "7 Functions" in the header if the new doctrines create a new function category

## Fix 2: Align Tier in P-2

**File:** P-2-ego-default.md, line 163

The Withdrawal Diagnostic is listed as Tier 2 in P-2, but as Tier 3 in both CR-1 and P-4.

Either:
- (a) Change P-2 line 163 from Tier 2 to Tier 3 to match CR-1 and P-4, OR
- (b) Intentionally keep it Tier 2 in Default Mode and Tier 3 in Sandpit, and document this as a designed escalation (Tier 2 in Default = observe/name withdrawal dynamics, Tier 3 in Sandpit = operational)

Option (b) may actually be the intended behavior. If so, update CR-1 to note this doctrine has split tier behavior.

## Fix 3: No Action Needed (Informational)

The "Core Energies" in Section 1 (The Investigator, The Reformer, The Helper, etc.) and "Rhetorical Moves" in Section 4 (The structural test, The strategic reframe, etc.) are NOT doctrine codenames. They are personality components and signature moves. These correctly do NOT appear in CR-1 and should NOT be added. No action needed.

---

# PART 6: INTEGRATION CHECKLIST

---

Use this checklist when running the Cursor integration:

- [ ] Fix CR-1 discrepancies (Fix 1 above)
- [ ] Resolve P-2 tier alignment (Fix 2 above)
- [ ] Create `prompts/` directory structure
- [ ] Place all 10 MVP prompt files in correct subdirectories
- [ ] Create `docs/` directory
- [ ] Place all 14 supporting documents in docs/
- [ ] Build prompt loader utility
- [ ] Integrate prompt loader with existing AI service
- [ ] Update AI service to support mode selection (Default/Sandpit)
- [ ] Implement state transition appending for branch selection
- [ ] Implement O-1 round management logic
- [ ] Implement O-2 resolution generation
- [ ] Implement O-3 follow-up classification
- [ ] Update README.md with provided content
- [ ] Run at least 3 test scenarios from docs/divergent-test-scenarios.md
- [ ] Verify no real names appear in any API response

---

*Generated February 2026 | divergent-app.ai*
