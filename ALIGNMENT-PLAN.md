# Divergent Repo ↔ Project Brief v2 — Alignment Plan

This document maps the **current repo** to the **DIVERGENT-PROJECT-BRIEF-v2.md** and lists required changes.

---

## 1. Persona Architecture

| Brief | Current Repo | Action |
|-------|--------------|--------|
| **Ethos vs Ego** is the default, pre-selected, primary experience | Only Challenger/Champion, Guardian/Gambler, Strategist/Leaper, Conformist/Maverick exist | **Add** Ethos and Ego as a full persona pair with rich system prompts (Default + Sandpit variants) |
| Unique Personas: four pairs below Ethos vs Ego, labeled section | All four pairs are top-level; no hierarchy | **Reorganize** selector: 1) Ethos vs Ego (default), 2) "Unique Personas" section with four pills |
| Default framework ID | `activeFramework: 'challenger-champion'` | **Change** default to `'ethos-ego'` |

**Files to modify:** `src/context/AppContext.jsx` (add `ethos-ego` to FRAMEWORKS with two prompt sets per voice when we add mode), `src/components/Sidebar.jsx` (selector hierarchy + labels).

---

## 2. Default vs Sandpit Mode

| Brief | Current Repo | Action |
|-------|--------------|--------|
| Two modes: **Default** (decision engine) and **Sandpit** (adversarial) | No mode concept | **Add** `mode: 'default' \| 'sandpit'` to state |
| Mode toggle in header | Header has view toggle (Cards/Thread) only | **Add** Default / Sandpit toggle in Header |
| Same layout in both modes; only tone/guardrails/prompts change | N/A | **Implement** mode-aware context and prompt selection |

**Files to modify:** `src/context/AppContext.jsx` (mode state, actions), `src/components/Header.jsx` (mode toggle), new `src/context/ThemeProvider.jsx` or extend AppContext for theme.

---

## 3. Theme & Visual Identity

| Brief | Current Repo | Action |
|-------|--------------|--------|
| **Default:** Teal spectrum Jet Black → Icy Aqua → Azure Mist; animated water background; liquid glass cards; Ethos = Icy Aqua, Ego = Jet Black | Teal palette and water-style gradient exist; cards use challenger/champion styling | **Keep** Default palette; rename card semantics to Ethos (light) / Ego (dark) where applicable |
| **Sandpit:** Sand palette (Deep Umber #2C1810 → Desert White #FAF6EF); animated sand texture; same liquid glass structure, warm tones | No Sandpit theme | **Add** Sandpit CSS variables and sand background; **ThemeProvider** switches variables + background on mode |
| Mode transition: cross-fade between Default and Sandpit | N/A | **Add** cross-fade animation on mode switch |
| Typography: Syne (display, 700–800), Inter (body, 300–700) | Syne and Inter in tailwind and index.html | **Verify** usage (e.g. logo/headers use Syne) |
| Model name on cards: small, faint text | ProviderBadge on cards | **Adjust** to “model name in small faint text” per brief |

**Files to modify:** `src/index.css` (Sandpit variables, sand background, cross-fade), `tailwind.config.js` (sand colors if needed), new `ThemeProvider` that sets `data-mode="default"` or `"sandpit"` and applies class or CSS vars.

---

## 4. Model Selector

| Brief | Current Repo | Action |
|-------|--------------|--------|
| **Default:** Single dropdown (same model for both voices): Claude, GPT-4o, Gemini | Two selectors in sidebar (Voice A, Voice B) | **Move** model selector to input area; **single** dropdown in Default; same model for both voices |
| **Sandpit:** Two dropdowns (one per voice); Claude, GPT-4o, Gemini, **Grok** | No Grok | **Add** Grok (Sandpit-only); show **two** dropdowns in Sandpit |
| Grok only in Sandpit | N/A | **Add** xAI provider; include only when `mode === 'sandpit'` |

**Files to modify:** `src/context/AppContext.jsx` (single model in Default; optional Grok in PROVIDERS or separate Sandpit providers), `src/components/ProviderSelector.jsx` (single vs dual UI), `src/components/InputArea.jsx` or layout (selector above/below input), `src/components/Sidebar.jsx` (remove or relocate model selection).

---

## 5. API & Backend

| Brief | Current Repo | Action |
|-------|--------------|--------|
| **Architecture:** `/api/voice-a`, `/api/voice-b`, `/api/exchange`, `/api/resolution`; mode + persona aware | `/api/chat-claude`, `/api/chat-openai`, `/api/chat-gemini` | **Option A:** Keep existing endpoints but pass `mode` and `persona` and select prompt set server-side. **Option B:** Add voice-a/voice-b wrappers that route to correct model and prompt. Add `/api/exchange` and `/api/resolution` for multi-round and “agree to disagree” |
| **Stack:** Vercel Edge Functions | Express (server.js), Railway | Brief says Vercel; repo uses Express. For MVP, **keep Express** and make routes mode- and persona-aware; document future Vercel migration if desired |
| **Grok (xAI):** Sandpit only | Not implemented | **Add** Grok endpoint (e.g. `/api/chat-grok`) when in Sandpit |

**Files to modify:** `server.js` (add mode/persona to body; add Grok route; optionally add exchange/resolution routes), `src/hooks/useChat.js` (send mode + persona; handle resolution step).

---

## 6. Prompts

| Brief | Current Repo | Action |
|-------|--------------|--------|
| Two prompt sets per persona: **constructive** (Default) and **adversarial** (Sandpit) | One prompt per voice, no Ethos/Ego | **Add** Ethos and Ego prompts (Default + Sandpit). **Duplicate** each Unique Persona into Default vs Sandpit variants (constructive vs adversarial) |
| Voice awareness: each voice knows opposing philosophy, not exact response | Prompts don’t describe opponent | **Update** all prompts to include “you are debating an opponent who believes…” style context |
| 10 prompt pairs total: Ethos vs Ego + 4 Unique, each × 2 modes | 4 pairs × 1 mode | **Implement** 5 pairs × 2 modes in config (e.g. in AppContext or separate prompts file) |

**Files to modify:** `src/context/AppContext.jsx` or new `src/prompts/` (persona + mode → system prompts).

---

## 7. Exchange & Resolution

| Brief | Current Repo | Action |
|-------|--------------|--------|
| Multi-round exchange; ends with **“agree to disagree”** resolution | “Continue Debate” adds turns; no resolution step | **Add** resolution phase: after N rounds (tunable), call resolution endpoint or final prompt to produce “agree to disagree” summary; display it |
| Branch selection: Follow Voice A, Voice B, Explore both | Buttons exist but not wired | **Wire** “Follow Voice A/B” and “Explore both” to guide next step (e.g. set branch in state for future tree visualization) |
| Remove “Synthesize” if brief implies only branch selection | “Synthesize” button in DebateCard | **Align** with brief: keep only Voice A, Voice B, Explore both; remove or repurpose “Synthesize” |

**Files to modify:** `src/components/DebateCard.jsx`, `src/hooks/useChat.js`, server (resolution endpoint if used).

---

## 8. Disclaimers

| Brief | Current Repo | Action |
|-------|--------------|--------|
| **Default:** Disclaimer modal on first use (decision tool, not professional advice) | None | **Add** `DisclaimerModal`; show once per session; store in sessionStorage or state |
| **Sandpit:** Research disclaimer on first access: “This is an experimental research vehicle” | None | **Add** `ResearchDisclaimer` for Sandpit; show on first Sandpit access |

**Files to modify:** New `src/components/DisclaimerModal.jsx`, `src/components/ResearchDisclaimer.jsx`; `App.jsx` or layout to render based on mode and “first use” state.

---

## 9. Model Refusal (Sandpit)

| Brief | Current Repo | Action |
|-------|--------------|--------|
| When model declines: show “[Model name] declines to engage” on card; non-error styling | Errors show as error message in card | **Detect** refusal (e.g. 4xx or specific response body); display brief’s text on VoiceCard without error styling |

**Files to modify:** `src/hooks/useChat.js` (detect refusal), `src/components/VoiceCard.jsx` (refusal state + copy).

---

## 10. Copy & Naming

| Brief | Current Repo | Action |
|-------|--------------|--------|
| Domain: divergent-app.ai; tagline: “See where your paths diverge” | Same in README/index | **Keep**; ensure README matches brief (no “Challenger/Champion” as primary) |
| “Voice Framework” / “Unique Personas” | Sidebar: “Voice Framework” with all four | **Rename** section to “Ethos vs Ego” (primary) and “Unique Personas” (four pills) |
| “New Exploration” | Sidebar has “New Exploration” | **Keep**; ensure it clears state for new thread |

---

## 11. Explicitly Out of Scope (MVP)

- User accounts / auth  
- Psychological profiling  
- Decision tree visualization  
- Scenario roleplay  
- Visual comic-style playouts  
- Conversation persistence (ephemeral for v1)  

**Repo:** Chat history in sidebar is static. For MVP, either keep as placeholder or hide; no persistence required.

---

## 12. Design notes (for agents & developers)

### Debate and the Overlap slider

- **Agents debate based on their personalities.** The content and style of argument (whether to interrupt, overlap, or take turns) should be driven by the persona’s system prompt and the framework (Ethos vs Ego, etc.), not by a single global rule.
- **The Overlap slider is an app feature, not a permission structure.** It does not tell the agent “you can” or “you can’t” overlap. The agent (via its personality and prompts) decides *whether* to argue or overlap.
- **The slider sets how much we allow an agent to go.** It’s a ceiling: it controls the *maximum* overlap the app will use when playing back the debate (e.g. 0 = strict turn-taking playback, 100 = both voices can start together). It does not grant or revoke permission; it only caps the playback behavior.

---

## Implementation Order (Suggested)

1. **Personas:** Add Ethos vs Ego to `AppContext` (Default prompts first), set as default; keep Unique Personas as-is.
2. **Mode:** Add `mode` state and mode toggle in Header; no visual change yet.
3. **Theme:** Add ThemeProvider + Sandpit palette + cross-fade; wire mode to theme.
4. **Persona selector UI:** Sidebar: Ethos vs Ego primary, then “Unique Personas” with four options.
5. **Model selector:** Single dropdown in Default (above/below input), dual in Sandpit; add Grok to Sandpit only.
6. **Prompts:** Add Sandpit (adversarial) prompt set for Ethos/Ego and for each Unique Persona; wire mode to prompt choice.
7. **Disclaimers:** Default first-use modal; Sandpit research disclaimer.
8. **Exchange/Resolution:** Add “agree to disagree” resolution step and wire branch buttons.
9. **API:** Add Grok route; make existing routes mode- and persona-aware; add resolution endpoint if needed.
10. **Model refusal:** Sandpit-only refusal message on cards.

---

*Generated from DIVERGENT-PROJECT-BRIEF-v2.md. Updated as changes are implemented. Items 1–7 implemented.*
