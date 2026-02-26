# Cursor Instructions: Divergent Character & Conversational Architecture Integration

## Context

You are working on the Divergent platform, a dual-voice AI decision engine. Three new architectural documents have been created and need to be integrated into the project. These documents add a **personality and conversational behavior layer** on top of the existing philosophical reasoning architecture. They do not replace anything. They extend it.

---

## New Files to Store

### 1. `divergent-conversational-intelligence-tree.md`
**What it is:** The master behavioral ruleset governing how both AI voices (Ethos and Ego) conduct conversations. Covers response length logic, emotional detection, follow-up question rules, pacing, mirroring, topic-sensitive tone calibration, memory independence, and error handling.

**Store at:** `/docs/architecture/divergent-conversational-intelligence-tree.md`

**Relationship to existing files:**
- Companion to `divergent-system-prompt-framework-v1.md` (the framework defines prompt structure; this tree defines conversational behavior within that structure)
- Referenced by both character bibles as their behavioral foundation
- Rules from this document get compressed into exchange prompts as **Section 4b: Conversational Behavior**, sitting alongside the existing Section 4: Voice Constraints

### 2. `ethos-character-bible.md`
**What it is:** The complete personality definition for the Ethos voice. Stage 1 covers personality foundation (humor, metaphor family, what it notices first, storytelling style, core frustration, relationship to silence, error mode, personal texture). Stage 2 covers conversational behavior (opening moves, mid-conversation habits, questioning style, mirroring, response length instincts, conversation endings). Stages 3-4 (topic-sensitive calibration and prompt compression) are pending.

**Store at:** `/docs/personas/ethos-character-bible.md`

**Relationship to existing files:**
- Sits on top of `ethos-persona-consolidated.md` (the persona doc defines how Ethos thinks; the bible defines how Ethos shows up in conversation)
- Draws from the Enneagram substrate in the persona doc (Type 5, Type 1, Type 2, Type 8)
- Informs the voice behavior in exchange prompts `P-1-ethos-default.md` and `P-3-ethos-sandpit.md`
- Does NOT replace any existing document

### 3. `ego-character-bible.md`
**What it is:** Same structure as the Ethos bible, for the Ego voice. Personality foundation and conversational behavior profile grounded in Ego's Enneagram substrate (Type 3, Type 4, Type 7, Type 8).

**Store at:** `/docs/personas/ego-character-bible.md`

**Relationship to existing files:**
- Sits on top of `ego-persona-consolidated.md`
- Informs `P-2-ego-default.md` and `P-4-ego-sandpit.md`
- Does NOT replace any existing document

---

## Recommended Directory Structure

If the project does not already have this structure, create it. If it does, slot files into the appropriate locations.

```
/docs
  /architecture
    divergent-system-prompt-framework-v1.md      (existing)
    divergent-prompt-writing-rules.md             (existing)
    divergent-prompt-inventory-v1.md              (existing)
    divergent-prompt-compiler.md                  (existing)
    divergent-conversational-intelligence-tree.md (NEW)
    divergent-epistemological-guardrails.md        (existing)
    divergent-canonical-arenas.md                  (existing)
    divergent-test-scenarios.md                    (existing)
  /personas
    ethos-persona-consolidated.md                 (existing)
    ego-persona-consolidated.md                   (existing)
    ethos-character-bible.md                      (NEW)
    ego-character-bible.md                        (NEW)
    ethos-doctrine-profiles-complete.md           (existing)
    ego-doctrine-profiles-complete.md             (existing)
  /prompts
    CR-1-codename-registry.md                     (existing)
    P-1-ethos-default.md                          (existing)
    P-2-ego-default.md                            (existing)
    P-3-ethos-sandpit.md                          (existing)
    P-4-ego-sandpit.md                            (existing)
    O-1-exchange-orchestrator.md                  (existing)
    O-2-resolution-synthesizer.md                 (existing)
    O-3-continuity-manager.md                     (existing)
    ST-1-ethos-chosen.md                          (existing)
    ST-2-ego-chosen.md                            (existing)
  /project
    DIVERGENT-PROJECT-BRIEF-v2.md                 (existing)
    divergent-ego-upgrade-todo.md                 (existing)
    divergentdoctrinelibraries.xlsx               (existing)
```

---

## How These Files Are Used During Development

### When building or modifying exchange prompts (P-1 through P-4):

1. **Read the character bible first** for the voice you are working on. It defines personality texture, humor style, metaphor family, opening moves, questioning patterns, mirroring behavior, and response length instincts. These must be encoded into the prompt.

2. **Read the conversational intelligence tree** for the behavioral rules that apply to both voices. Response length decision logic, emotional detection priority stack, follow-up question thresholds, and pacing rules all come from this document.

3. **Add a Section 4b: Conversational Behavior** to the exchange prompt, sitting between the existing Section 4 (Voice Constraints) and Section 5 (Win Imperative). This section compresses the character bible's Stage 2 content into prompt-weight instructions.

4. **Add personality texture cues to Section 1: Persona Identity.** The character bible's Stage 1 content (humor, metaphors, frustration triggers, storytelling style) should be compressed into brief behavioral instructions within the persona identity section.

### When testing voice output:

Add these evaluation dimensions to the existing test checklist:

- **Conversational naturalness.** Does the voice feel like a person at a dinner table, or a report generator?
- **Response length appropriateness.** Is the response proportional to the input? Simple questions get short answers?
- **Emotional calibration.** Does the voice respond to the person before the problem?
- **Follow-up intelligence.** When the situation is ambiguous, does the voice ask before advising?
- **Personality consistency.** Does the humor, metaphor style, and questioning pattern match the character bible?
- **Pacing.** Does the voice build conversationally, or dump everything at once?

### When adding new features:

- **Memory integration (v2):** The character bibles explicitly state that personalities are memory-independent. When memory is added, it supplements the personality layer. Do not make any personality behavior dependent on memory access.
- **Streaming optimization:** Shorter responses (driven by the decision tree's length logic) directly improve streaming performance. The conversational intelligence tree is a UX optimization as much as a personality document.
- **New persona pairs:** When building Unique Persona character bibles (Guardian, Gambler, etc.), follow the same Stage 1-4 structure used for Ethos and Ego. The conversational intelligence tree applies to all voices.

---

## Integration Priority

| Step | Action | Files Involved |
|------|--------|----------------|
| 1 | Store all three new files in the directory structure above | All three new .md files |
| 2 | Update `divergent-prompt-compiler.md` to reference the new documents | Compiler doc |
| 3 | Add Section 4b to `P-1-ethos-default.md` using Ethos character bible Stage 2 | P-1, ethos-character-bible |
| 4 | Add Section 4b to `P-2-ego-default.md` using Ego character bible Stage 2 | P-2, ego-character-bible |
| 5 | Add Section 4b to `P-3-ethos-sandpit.md` (same personality, escalated energy) | P-3, ethos-character-bible |
| 6 | Add Section 4b to `P-4-ego-sandpit.md` (same personality, escalated energy) | P-4, ego-character-bible |
| 7 | Add personality texture to Section 1 of all four exchange prompts | P-1 through P-4, both bibles |
| 8 | Update `divergent-system-prompt-framework-v1.md` to document Section 4b as a required prompt section | Framework doc |
| 9 | Run all seven test scenarios against updated prompts and evaluate with new dimensions | Test scenarios doc |

---

## Key Principles to Maintain

- **The philosophical reasoning architecture is untouched.** Character bibles add personality ON TOP of the epistemological operating system. They do not modify worldview, doctrine engines, or win imperatives.
- **Shorter is better.** The single most impactful change these documents drive is reducing response length. Default to the shortest useful response. Longer must be earned.
- **Person before problem.** The first sentence of every response addresses the human, not the question. This is non-negotiable for both voices.
- **Personality is self-contained.** Every behavior encoded in the bibles must work in a cold, single conversation with no memory. Memory is a v2 enhancement.
- **The voices are different people, not different tones.** Ethos and Ego should feel like two distinct humans who happen to disagree philosophically. Their humor is different. Their metaphors are different. Their questions are different. Their silences mean different things.

---

*This instruction document should be stored at `/docs/architecture/cursor-integration-instructions.md` or used directly as a Cursor system prompt for development sessions involving the voice personality layer.*

*divergent-app.ai | Development Integration Guide*
