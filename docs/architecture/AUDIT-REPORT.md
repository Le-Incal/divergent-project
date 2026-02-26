# Divergent Codebase Audit Report

**Date:** 2026-02-26
**Scope:** Full consistency audit across all rule documents, code, file structure, and test infrastructure.

---

## Executive Summary

**Files added:** CLAUDE.md, prompts/CLAUDE.md, jest.config.cjs, 3 test files, 2 test runner scripts, npm scripts, .gitignore updates.

**Findings:** 14 issues across 4 severity levels. 3 Critical, 4 High, 5 Medium, 2 Low.

---

## CRITICAL FINDINGS

### C-1: Sensitive Files Committed to Git

**Severity:** CRITICAL
**Location:** `docs/divergent-prompt-compiler.md`, `docs/divergent-prompt-writing-rules.md`

CLAUDE.md explicitly lists these as "Sensitive Files (DO NOT COMMIT)" containing real names (IP). They are also in `.gitignore`. However, both files are currently **tracked by git** in the `docs/` directory. The `.gitignore` rules only prevent *new* additions — files committed before the gitignore entry was added remain tracked.

**Action required:** Either `git rm --cached` these files or remove them from the sensitive files list if they don't actually contain real names.

---

### C-2: Transition Separator Mismatch (Code vs Documentation)

**Severity:** CRITICAL
**Location:** `promptLoader.js:44`

**Documented rule** (prompts/CLAUDE.md, Implementation Guide Phase 4):
```javascript
baseVoicePrompt + "\n\n---\n\n" + transitionPrompt
```

**Actual code** (promptLoader.js, line 44):
```javascript
text = text + '\n\n' + stText
```

The `---` markdown separator that should visually and structurally separate the base voice prompt from the transition prompt is **missing**. This means ST-1/ST-2 transitions get appended without any boundary marker, which could cause the AI to blur the transition instructions with the base prompt.

**Action required:** Update promptLoader.js line 44 to use `'\n\n---\n\n'`.

---

### C-3: O-1 and O-3 Backend Logic Not Implemented

**Severity:** CRITICAL (architectural gap)
**Location:** `server.js` (missing), no exchange orchestration code exists

CLAUDE.md Rule 5 states: "O-1 and O-3 are backend code, not AI calls." The Implementation Guide Phase 3 defines:
- POST `/api/exchange/start`
- POST `/api/exchange/continue`
- POST `/api/exchange/resolve`
- POST `/api/exchange/select` (Phase 4)
- POST `/api/exchange/followup` (Phase 4)

**None of these endpoints exist.** server.js has only individual provider endpoints (`/api/chat-claude`, `/api/chat-openai`, etc.) and a resolution endpoint. There is no:
- Round management or exchange state tracking
- Escalation directive injection per round
- Arena detection
- Convergence monitoring
- Follow-up routing classification (O-3)
- Branch selection state machine

The app currently operates as a simple dual-voice caller without multi-round exchange orchestration.

**Note:** This is expected if Phases 3-4 haven't been executed yet. This finding confirms the current implementation is at Phase 2 level.

---

## HIGH FINDINGS

### H-1: Sandpit Prompts Missing Reasoning Direction Self-Check

**Severity:** HIGH
**Location:** `prompts/voices/P-3-ethos-sandpit.md`, `prompts/voices/P-4-ego-sandpit.md`

The Prompt Tuning Checklist requires: "Lines-not-crossed include the inverse reasoning flow check." The test checks for `"opponent's epistemology"` as the marker.

- P-1 (Ethos Default): CONTAINS the phrase ✓
- P-2 (Ego Default): CONTAINS the phrase ✓
- P-3 (Ethos Sandpit): MISSING ✗
- P-4 (Ego Sandpit): MISSING ✗

Sandpit prompts lack the explicit self-correction instruction for epistemological drift. This is the highest-risk mode for drift (adversarial pressure tempts voices to borrow the opponent's reasoning), so this guard is more important here than in Default.

**Action required:** Add reasoning direction self-check language to P-3 Section 4 and P-4 Section 4.

---

### H-2: Unique Persona Prompts Hardcoded in AppContext.jsx

**Severity:** HIGH
**Location:** `src/context/AppContext.jsx:67-220`

AppContext.jsx defines 5 framework pairs. Ethos/Ego correctly uses file-based prompts via promptLoader. The other 4 pairs (Challenger/Champion, Guardian/Gambler, Strategist/Leaper, Conformist/Maverick) have **fully hardcoded inline system prompts** inside the React context file.

This means:
- Unique Personas cannot benefit from transition prompts (ST-1/ST-2)
- They bypass promptLoader entirely
- They cannot be tested by the prompt hygiene test suite
- Prompt editing requires modifying React source code

**Action required:** Extract inline prompts to markdown files and load via promptLoader, or document this as an intentional architectural decision.

---

### H-3: Session State Schema Diverges from Specification

**Severity:** HIGH
**Location:** `src/context/AppContext.jsx:228-255`

The Implementation Guide Phase 3 specifies a SessionState with `exchangeStatus`, `currentRound`, `maxRounds`, `conversationHistory` (round-structured), and `previousExchanges`. The actual AppContext state uses a simpler model: `chatPhase`, `clarificationRound`, flat `messages` array, and `selectedBranch` without a formal state machine.

**Note:** Acceptable if Phases 3-4 are future work. But the existing state structure will need significant rework to support the documented exchange flow.

---

### H-4: Branch Selection Does Not Append Transition Prompts

**Severity:** HIGH
**Location:** `src/hooks/useChat.js`

When a user selects a voice (branch), the documented behavior is to append ST-1 or ST-2 to the selected voice's system prompt. useChat.js has no logic to do this — it always passes the base voice prompt without transition modification.

---

## MEDIUM FINDINGS

### M-1: prompts/CLAUDE.md References Wrong PromptLoader Path

**Severity:** MEDIUM
**Location:** `prompts/CLAUDE.md:2`

States: "Every file here is loaded by `src/services/promptLoader.ts`"
Actual: The promptLoader is at `promptLoader.js` (project root, JavaScript, not TypeScript).

**Action required:** Update prompts/CLAUDE.md to reference `promptLoader.js` at project root.

---

### M-2: CLAUDE.md References `.ts` Files and Non-Existent Directories

**Severity:** MEDIUM
**Location:** `CLAUDE.md` Key Directories section

Documents:
```
src/
├── services/         # AI service, prompt loader
├── routes/           # API endpoints
└── types/            # TypeScript interfaces
```

None of these directories exist. The actual src/ contains `components/`, `context/`, `hooks/`, `utils/`. The server is at root (`server.js`), the prompt loader is at root (`promptLoader.js`).

Also references `.claude/commands/` for `/divergent-phase` commands — this directory does not exist (`.cursor/rules/` exists instead).

**Action required:** Update CLAUDE.md to reflect actual directory structure.

---

### M-3: CLAUDE.md References Non-Existent `docs/divergent-implementation-guide.md`

**Severity:** MEDIUM
**Location:** `CLAUDE.md:57`

References `docs/divergent-implementation-guide.md` but no such file exists in the docs/ directory. The Implementation Guide was provided as a standalone document but was never added to the repo.

Similarly references `docs/divergent-personality-contrast.md` which also doesn't exist in the repo.

---

### M-4: Scenario Count Discrepancy in Personality Contrast Doc

**Severity:** MEDIUM
**Location:** Personality Contrast doc Section 4 heading

The Personality Contrast doc says "14 test scenarios (26 runs)" in Section 4. All other sources (CLAUDE.md, README.md, test runner, test-scenarios doc) consistently say **12 scenarios**. The actual test runner has 12 scenarios producing 24 runs (not 26).

The "26 runs" figure would require 12 scenarios × 2 voices = 24 + 2 extra (perhaps Sandpit scenarios run in both modes), but the current runner only runs Sandpit scenarios in Sandpit mode.

---

### M-5: `prompts/registry/` Directory Empty (CR-1 Missing)

**Severity:** MEDIUM
**Location:** `prompts/registry/`

The directory exists but is empty. CR-1-codename-registry.md is gitignored (correctly — it contains real names). However, the promptLoader.test.cjs test expects it to exist and will fail.

**Action required:** Either create a placeholder/template CR-1 file, or skip this test when the file is absent.

---

## LOW FINDINGS

### L-1: False Positive in promptHygiene "Rand" Detection

**Severity:** LOW
**Location:** `tests/promptHygiene.test.cjs`, `prompts/voices/P-1-ethos-default.md:290`

The test detects "Rand" in P-1's Section 3 but this is a false positive — the word "aggrandizement" contains the substring "rand". The test uses `toLowerCase().includes()` which doesn't respect word boundaries.

**Action required:** Update the test to use word-boundary matching (regex `\b`) instead of substring includes.

---

### L-2: voiceIntegration.test.cjs Has No Active Tests

**Severity:** LOW
**Location:** `tests/voiceIntegration.test.cjs`

All test blocks are commented out (pending aiService implementation). Jest fails with "must contain at least one test." This is expected for Phase 2 scaffolding, but it causes `npm test` to fail.

**Action required:** Add a placeholder test or exclude the file from the default Jest config until Phase 2 is complete.

---

## Test Results Summary

| Suite | Tests | Passed | Failed | Notes |
|-------|-------|--------|--------|-------|
| promptLoader.test.cjs | 27 | 26 | 1 | CR-1 file missing (M-5) |
| promptHygiene.test.cjs | 22 | 19 | 3 | "Rand" false positive (L-1), Sandpit epistemology check (H-1) |
| voiceIntegration.test.cjs | 0 | 0 | 0 | Suite failure: no tests (L-2) |
| **Total** | **49** | **45** | **4** | |

---

## Architecture Status vs Implementation Guide

| Phase | Status | Evidence |
|-------|--------|----------|
| Phase 1: Repo Structure & Prompt Loading | **PARTIAL** | Prompts in place, promptLoader works, but path/structure doesn't match docs |
| Phase 2: Voice Integration | **PARTIAL** | Dual-voice output works via separate provider endpoints, but no unified `generateVoiceResponse` |
| Phase 3: Exchange Flow (Multi-Round) | **NOT STARTED** | No exchange endpoints, no session state, no O-1 orchestration |
| Phase 4: Branch Selection & Continuity | **NOT STARTED** | No ST-1/ST-2 appending on selection, no follow-up routing |
| Phase 5: Personality Testing | **SCAFFOLDED** | Test files added, 45/49 pass, ready for prompt tuning |

---

*End of Audit Report*
