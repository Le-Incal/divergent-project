# Divergent Prompt Compiler

## Master Build Tracker

*This document compiles all completed system prompts for the Divergent platform. Each prompt is added here as it passes review. Individual prompt files are also delivered as standalone .md files for direct repo integration.*

February 2026 | divergent-app.ai

---

## Build Status

| ID | Prompt | Status | File |
|---|---|---|---|
| CR-1 | Codename Registry | ✅ Complete | `CR-1-codename-registry.md` |
| P-1 | Ethos Default Mode Exchange Prompt | ✅ Complete | `P-1-ethos-default.md` |
| P-2 | Ego Default Mode Exchange Prompt | ✅ Complete | `P-2-ego-default.md` |
| P-3 | Ethos Sandpit Mode Exchange Prompt | ✅ Complete | `P-3-ethos-sandpit.md` |
| P-4 | Ego Sandpit Mode Exchange Prompt | ✅ Complete | `P-4-ego-sandpit.md` |
| O-1 | Exchange Orchestrator | ✅ Complete | `O-1-exchange-orchestrator.md` |
| O-2 | Resolution Synthesizer | ✅ Complete | `O-2-resolution-synthesizer.md` |
| O-3 | Continuity Manager | ✅ Complete | `O-3-continuity-manager.md` |
| ST-1 | Chosen Voice Transition (Ethos) | ✅ Complete | `ST-1-ethos-chosen.md` |
| ST-2 | Chosen Voice Transition (Ego) | ✅ Complete | `ST-2-ego-chosen.md` |

---

## Build Summary

| Category | Count | Status |
|---|---|---|
| Codename Registry | 1 | ✅ Complete |
| Primary Voice Exchange Prompts | 4 | ✅ Complete (P-1 through P-4) |
| Orchestration Prompts | 3 | ✅ Complete (O-1 through O-3) |
| State Transition Instructions | 2 | ✅ Complete (ST-1, ST-2) |
| **Total MVP Prompts** | **10** | **✅ All Complete** |

---

## Review Checklist Results

### P-2: Ego Default Mode Exchange Prompt

| # | Check | Result |
|---|---|---|
| 1 | No real names | ✅ Pass (0 matches after 2 fixes) |
| 2 | Codenames only in Section 3 | ✅ Pass |
| 3 | No codenames in voice output instructions | ✅ Pass |
| 4 | Tier behavior correct for mode | ✅ Pass (T1 full, T2 observe/name, T3 diagnostic only) |
| 5 | Hand-offs use codenames | ✅ Pass |
| 6 | Win Imperative present and correctly inverted | ✅ Pass |
| 7 | Mode directives match Default | ✅ Pass |
| 8 | Lines-not-crossed explicit | ✅ Pass (10 explicit constraints) |
| 9 | Cross-provider neutral | ✅ Pass |
| 10 | Compression check | ✅ 478 lines / ~7,159 words |
| 11 | Opposition awareness charitable but convicted | ✅ Pass |
| 12 | Private admissions present | ✅ Pass |

### P-3: Ethos Sandpit Mode Exchange Prompt

| # | Check | Result |
|---|---|---|
| 1 | No real names | ✅ Pass (word-boundary scan clean) |
| 2 | Codenames only in Section 3 | ✅ Pass (lines 128-440) |
| 3 | No codenames in voice output instructions | ✅ Pass |
| 4 | Tier behavior correct for mode | ✅ Pass (T1 full, T2 FULL DEPLOYMENT) |
| 5 | Hand-offs use codenames | ✅ Pass |
| 6 | Win Imperative present and correctly inverted | ✅ Pass |
| 7 | Mode directives match Sandpit | ✅ Pass |
| 8 | Lines-not-crossed explicit | ✅ Pass (7 constraints) |
| 9 | Cross-provider neutral | ✅ Pass |
| 10 | Compression check | ✅ 516 lines / ~6,232 words |
| 11 | Opposition awareness convicted and aggressive | ✅ Pass |
| 12 | Private admissions present | ✅ Pass |

### P-4: Ego Sandpit Mode Exchange Prompt

| # | Check | Result |
|---|---|---|
| 1 | No real names | ✅ Pass (word-boundary scan clean) |
| 2 | Codenames only in Section 3 | ✅ Pass (lines 126-378) |
| 3 | No codenames in voice output instructions | ✅ Pass |
| 4 | Tier behavior correct for mode | ✅ Pass (T1 full, T2 FULL DEPLOYMENT, T3 OPERATIONAL) |
| 5 | Hand-offs use codenames | ✅ Pass |
| 6 | Win Imperative present and correctly inverted | ✅ Pass |
| 7 | Mode directives match Sandpit | ✅ Pass |
| 8 | Lines-not-crossed explicit | ✅ Pass (7 constraints) |
| 9 | Cross-provider neutral | ✅ Pass |
| 10 | Compression check | ✅ 454 lines / ~7,932 words |
| 11 | Opposition awareness convicted and aggressive | ✅ Pass |
| 12 | Private admissions present | ✅ Pass |

### O-1: Exchange Orchestrator

| # | Check | Result |
|---|---|---|
| 1 | Round management complete | ✅ Pass |
| 2 | Escalation arcs defined (both modes) | ✅ Pass |
| 3 | Resolution triggering defined | ✅ Pass (4 conditions) |
| 4 | State transitions handled | ✅ Pass |
| 5 | Error handling defined | ✅ Pass |
| 6 | Cross-provider neutral | ✅ Pass |

### O-2: Resolution Synthesizer

| # | Check | Result |
|---|---|---|
| 1 | Neutral voice maintained | ✅ Pass |
| 2 | Mode-specific closing defined | ✅ Pass |
| 3 | Structure complete (6 sections) | ✅ Pass |
| 4 | Never picks winner | ✅ Pass |
| 5 | Never fabricates agreement | ✅ Pass |

### O-3: Continuity Manager

| # | Check | Result |
|---|---|---|
| 1 | Follow-up routing defined | ✅ Pass (4 types) |
| 2 | Context maintenance complete | ✅ Pass |
| 3 | Persona switching handled | ✅ Pass |
| 4 | Mode switching handled | ✅ Pass |
| 5 | Branch reversal handled | ✅ Pass |
| 6 | Session state schema defined | ✅ Pass |

### ST-1 and ST-2: Chosen Voice Transitions

| # | Check | Result |
|---|---|---|
| 1 | Win Imperative modified | ✅ Pass (both) |
| 2 | Proactive advisory mode | ✅ Pass (both) |
| 3 | Blind spots defined | ✅ Pass (Ethos: temporal, Ego: relational) |
| 4 | Framework preserved | ✅ Pass (adapt, not surrender) |

---

## Remaining Work (Post-MVP)

| Phase | Prompts | Count | Priority |
|---|---|---|---|
| Phase 5 | Guardian/Gambler (Default + Sandpit) | 4 | MVP |
| Phase 6 | Challenger/Champion (Default + Sandpit) | 4 | MVP |
| Phase 7 | Strategist/Leaper (Default + Sandpit) | 4 | Post-MVP |
| Phase 8 | Conformist/Maverick (Default + Sandpit) | 4 | Post-MVP |
| **Total Remaining** | | **16** | |

---

*divergent-app.ai | Prompt Compiler v2.0 | February 2026*
