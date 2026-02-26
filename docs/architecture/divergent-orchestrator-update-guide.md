# Divergent Orchestrator Update Guide

## Integrating the Personality and Conversational Behavior Layer into O-1, O-2, and O-3

*This document does NOT replace or override any existing orchestrator prompt. It identifies specific areas where the orchestrators need awareness of the new personality layer, explains why, and provides suggested additions or modifications. Use this as an investigation and update guide.*

February 2026 | divergent-app.ai

---

# Why the Orchestrators Need Updating

The exchange prompts (P-1 through P-4) now include:
- **Section 4b: Conversational Behavior** (response length rules, emotional calibration, follow-up logic, pacing, mirroring)
- **Personality Texture** in Section 1 (humor, metaphors, attention patterns, storytelling, frustration, silence, error handling)

The orchestrators were written before this layer existed. They currently manage conversation flow, escalation, convergence detection, and resolution based purely on the philosophical exchange architecture. Several orchestrator behaviors could conflict with or undermine the new personality layer if left unchanged. This guide identifies those conflicts and suggests how to resolve them.

---

# O-1: Exchange Orchestrator

## Investigation Area 1: Round 1 Context Injection

**Current behavior (lines 35-43):** On Round 1, the orchestrator sends both voices an EXCHANGE CONTEXT block containing the round number, mode, user question, and persona pair.

**Problem:** The context injection does not include any signal about the emotional weight of the user's input. The voices now have emotional calibration rules in Section 4b that read the user's emotional register before responding. But if the orchestrator injects context that frames the exchange as purely analytical (round numbers, mode labels), the voices may default to analytical mode even when the user's input is emotionally heavy.

**Suggested investigation:** Consider adding an optional emotional weight signal to the Round 1 context injection. This does not mean the orchestrator diagnoses the emotion. It means the orchestrator passes through enough of the user's original language that the voices can perform their own calibration.

**Suggested addition to EXCHANGE CONTEXT format:**

```
EXCHANGE CONTEXT:
- Round: 1 of [max_rounds]
- Mode: [Default | Sandpit]
- User's question: [full text, unmodified]
- Active persona pair: [Ethos/Ego | Guardian/Gambler | etc.]
- Note: Respond to the person first. Read the emotional weight of the input
  before applying your analytical lens. Your Section 4b conversational
  behavior rules apply from Round 1.
```

The final line is a lightweight reminder that prevents the exchange context framing from overriding the personality layer. It costs almost nothing in tokens and reinforces a critical behavior.

---

## Investigation Area 2: Context Summary Rules (Round 2+)

**Current behavior (lines 66-74):** When summarizing previous rounds for context injection, the orchestrator preserves philosophical position, strongest point, user engagement, and compresses to 2-4 sentences per voice per round.

**Problem:** The current summary rules capture WHAT the voice argued but not HOW the voice engaged. If Ethos asked a follow-up question in Round 1 instead of giving a full analysis (which is correct behavior per Section 4b when the input is ambiguous), the summary might compress that away, making it look like Ethos had nothing to say. Similarly, if Ego's Round 1 response was a 2-sentence acknowledgment of emotional weight plus a single question, the summary might read as thin compared to a voice that dumped a full analysis.

**Suggested investigation:** Update the context summary rules to recognize and preserve conversational behaviors, not just arguments.

**Suggested additions to Context Summary Rules:**

```
5. **Preserve follow-up questions.** If a voice asked a question instead of
   providing analysis (which is correct behavior when the situation is
   ambiguous or emotionally heavy), the summary should note this:
   "Ethos asked the user to clarify what is driving the decision before
   offering a read." This prevents the opposing voice from interpreting
   a question-first approach as a weak opening.

6. **Preserve emotional calibration.** If a voice responded to the user's
   emotional register before bringing its analytical lens, note this in
   the summary: "Ego acknowledged the weight of the situation before
   engaging strategically." This preserves the conversational arc, not
   just the argumentative arc.

7. **Short responses are not thin responses.** A 2-sentence Round 1 that
   reads the room and asks one precise question is a stronger opening
   than a 12-sentence analysis that ignores the person. Summaries
   should not treat response length as a proxy for quality.
```

---

## Investigation Area 3: Escalation Arc

**Current behavior (lines 138-190):** The escalation arc defines how each round should build on the previous one. Default Mode builds toward clarity and nuance. Sandpit builds toward rhetorical intensity. Both modes expect each round to produce substantive new argument.

**Problem:** The new conversational behavior rules mean that Round 1 may be primarily relational rather than analytical. If the user's input is emotionally heavy, both voices might spend Round 1 acknowledging the weight and asking follow-up questions. The current escalation arc expects substantive argument from Round 1. If the orchestrator detects "insufficient argument" in Round 1 and escalates prematurely, it will punish voices for doing the right thing (reading the room before analyzing).

**Suggested investigation:** Add a conversational phase awareness to the escalation logic.

**Suggested addition to Escalation Arc section:**

```
### Conversational Phase Awareness

Not every Round 1 produces a full argument. When the user's input is
emotionally heavy, ambiguous, or under-specified, voices may correctly
spend Round 1 in "reading" mode: acknowledging the emotional register,
asking follow-up questions, and building rapport before bringing their
analytical lens.

This is not a weak opening. It is correct conversational behavior per
the voices' Section 4b rules.

**Detection:** If both voices' Round 1 responses are primarily questions
or emotional acknowledgments rather than substantive arguments, do not
escalate or flag repetition. Instead, treat Round 1 as a "reading round"
and expect the analytical exchange to begin in Round 2.

**Adjusted escalation for reading rounds:**

- Round 1 (reading): Both voices respond to the person. Follow-up
  questions and emotional calibration are expected and correct.
- Round 2 (opening arguments): Once context is established (either from
  user follow-up or from the voices' own read), the analytical exchange
  begins. Standard escalation rules apply from here.
- Round 3+: Standard escalation as currently defined.

**Max rounds adjustment:** If Round 1 was a reading round, consider
extending the max round count by 1 to preserve the full argumentative
arc. A reading round followed by only 2 argument rounds compresses
the exchange too much.
```

---

## Investigation Area 4: Convergence Detection

**Current behavior (lines 195-257):** The orchestrator monitors for convergence (both voices arriving at the same position) and repetition (a voice repeating itself). It triggers resolution when it detects either.

**Problem:** The new personality layer means both voices might OPEN with similar language on emotionally heavy inputs. Both Ethos and Ego are now instructed to respond to the person before the problem. On a breakup prompt, both might open with "That is a real loss" and a follow-up question. This looks like convergence to the current detection system, but it is not philosophical convergence. It is conversational calibration. The actual philosophical divergence comes after the reading phase.

**Suggested investigation:** Add a filter to convergence detection that distinguishes between conversational convergence (both voices being human) and philosophical convergence (both voices arguing the same position).

**Suggested addition to Convergence Detection section:**

```
### Conversational vs. Philosophical Convergence

The personality layer means both voices may exhibit similar
conversational behaviors: acknowledging emotional weight, asking
follow-up questions, and mirroring the user's language. This is
NOT convergence. It is two different people being human in the
same way before they diverge on substance.

**Do not flag convergence based on:**
- Both voices opening with emotional acknowledgment
- Both voices asking follow-up questions in Round 1
- Both voices using short responses on emotionally heavy inputs
- Both voices matching the user's energy level
- Both voices using similar mirroring language

**Flag convergence only based on:**
- Both voices arriving at the same philosophical position
- Both voices making the same argument from the same reasoning direction
- Both voices recommending the same action for the same reasons
- A voice adopting the opponent's epistemological method (existing check)

The test for convergence is: "Are both voices reasoning from the same
operating system?" not "Are both voices being empathetic?"
```

---

## Investigation Area 5: Response Length and Output Format

**Current behavior (lines 599-601 in P-1 reference, lines 514-515 in P-2):** The Mode Directives in the exchange prompts define output format as "scannable prose" and tell voices to "keep responses substantive but not exhausting." The orchestrator's exchange behavior sections (lines 144-150 for Default, lines 155-170 for Sandpit) expect each round to produce substantive deepening.

**Problem:** The new Section 4b response length rules explicitly instruct voices to default to the shortest useful response. A 2-sentence answer to a simple question is now correct behavior. But if the orchestrator evaluates round quality by response length or analytical density, it might misread short responses as low-quality rounds.

**Suggested investigation:** Review any orchestrator logic that evaluates response quality or completeness. Ensure it does not penalize short, conversationally appropriate responses.

**Suggested principle to add:**

```
### Response Quality Is Not Response Length

A 2-sentence response that reads the room and asks the right question
is a higher-quality round than a 12-sentence analysis that ignores
the person. The voices' Section 4b rules instruct them to default
to the shortest useful response. The orchestrator should not treat
short responses as incomplete rounds or trigger premature escalation
based on response length alone.

Quality signals for the orchestrator:
- Did the voice engage with the user's actual input? (not a generic framework)
- Did the voice advance the conversation? (question, insight, or reframe)
- Did the voice maintain its philosophical directionality?

If all three are present, the round is complete regardless of length.
```

---

## Investigation Area 6: Max Rounds and Dynamic Adjustment

**Current behavior (lines 310-320):** Max rounds are configured at 3 (Default) and 3 (Sandpit), with dynamic adjustment possible based on question complexity, voice behavior, and user engagement.

**Problem:** The new personality layer adds a dimension the current dynamic adjustment logic does not account for: conversational phase. If Round 1 is a reading round (both voices acknowledging emotional weight and asking questions), the effective argumentative rounds are reduced from 3 to 2, which may not be enough for complex questions.

**Suggested investigation:** Add conversational phase as a factor in dynamic round adjustment.

**Suggested addition:**

```
- **Conversational phase offset:** If Round 1 was primarily a reading
  round (both voices asked follow-up questions or acknowledged emotional
  weight before analysis), add 1 to the max round count. The reading
  round invested in the relationship. The argumentative exchange needs
  its full count on top of that investment.
```

---

# O-2: Resolution Synthesizer

## Investigation Area 7: Resolution Input Context

**Current behavior (O-2 lines 19-30):** The Resolution Synthesizer receives mode, original question, persona pair, round count, full conversation history, user lean signals, and trigger reason.

**Problem:** The resolution synthesizer does not currently receive any signal about the conversational dynamics of the exchange. If both voices spent Round 1 in reading mode (questions, emotional calibration) and only began their argumentative exchange in Round 2, the synthesizer might weigh Round 1 content as philosophical positioning when it was actually conversational setup.

**Suggested investigation:** Consider adding a conversational phase summary to the resolution context.

**Suggested addition to RESOLUTION CONTEXT format:**

```
RESOLUTION CONTEXT:
- Mode: [Default | Sandpit]
- User's original question: [full text]
- Active persona pair: [Ethos/Ego | Guardian/Gambler | etc.]
- Number of rounds completed: [N]
- Conversational phase note: [e.g., "Round 1 was primarily relational
  (both voices acknowledged emotional weight and asked follow-up
  questions). Substantive philosophical exchange began in Round 2."]
- Full conversation history: [all rounds, both voices]
- User's expressed lean (if any): [noted engagement or preference signals]
- Trigger reason: [max rounds | repetition | user request]
```

This helps the synthesizer weight the argumentative rounds more heavily than the reading rounds when mapping the disagreement.

---

## Investigation Area 8: Resolution Tone

**Current behavior (O-2 lines 10-14):** The Resolution Synthesizer is described as a "neutral narrator" using "neither voice's vocabulary, rhetorical style, or philosophical framework." It is "precise, concise, and fair."

**Problem:** The voices now have personality. The exchange now has conversational texture, humor, emotional calibration, and genuine human warmth. If the resolution drops to a clinical neutral tone after a warm, human exchange, the tonal whiplash may feel jarring to the user. The campfire suddenly becomes a conference room.

**Suggested investigation:** This is a judgment call. The resolution synthesizer should remain neutral (it is not a voice), but its register could be warmed slightly to match the conversational register of the exchange. Not adopting either voice's personality. Just not dropping to clinical.

**Questions to consider:**
- Should the resolution maintain the warmth of the exchange while remaining philosophically neutral?
- Can the synthesizer acknowledge the emotional weight of the user's question in its restated question, or should it remain purely analytical?
- If the exchange was light and playful (Category 3.7 topics), should the resolution match that lightness?

**Possible principle:**

```
The resolution matches the emotional register of the exchange.
If the exchange was warm and human, the resolution does not drop
to clinical. If the exchange was intense and adversarial (Sandpit),
the resolution carries the weight of that intensity. The resolution
is always neutral in philosophy. It does not need to be neutral
in humanity.
```

---

# O-3: Continuity Manager

## Investigation Area 9: Follow-Up Classification

**Current behavior (O-3 lines 18-49):** The Continuity Manager classifies user follow-ups as directed at a specific voice, directed at both, a new topic, or branch deepening. Classification uses vocabulary alignment, direct references, and semantic overlap.

**Problem:** The personality layer introduces a new classification challenge. After a round where both voices asked follow-up questions (reading round), the user may respond with additional context that is not directed at either voice specifically. It is answering both voices' questions. The current classification might route this as "directed at both voices" and trigger a new exchange round, when the correct behavior is to feed the user's additional context back to both voices as enriched input for their analytical response.

**Suggested investigation:** Add a "context enrichment" classification type for user responses that are answering questions rather than advancing the conversation.

**Suggested addition to Classification Rules:**

```
**Answering a voice's question.** The user is responding to a follow-up
question asked by one or both voices. This is not a new exchange prompt.
It is context enrichment. Route the user's answer back to the voice(s)
that asked the question, appended to the conversation history, and
let the voice(s) produce their analytical response with the enriched
context.

Detection signals:
- User's message directly answers a question asked in the previous round
- User provides new information that was requested by a voice
- User's message is short and responsive rather than initiating

Routing behavior:
- If one voice asked a question and the other gave analysis, route the
  user's answer to the questioning voice. The analyzing voice does not
  need an update.
- If both voices asked questions, route the user's answer to both.
  Both voices should now produce their analytical responses with the
  enriched context. This counts as the start of the substantive
  exchange, not as a new reading round.
```

---

## Investigation Area 10: Branch Deepening Behavior

**Current behavior (O-3 lines 43-49):** When a user selects a voice and continues deeper, the Continuity Manager routes follow-ups to the chosen voice with the ST-1 or ST-2 state transition active.

**Problem:** The state transitions (ST-1, ST-2) were written before the personality layer existed. When a user selects a voice and goes deeper, the conversational behavior rules should persist. The chosen voice should continue to respond with the same personality texture, response length discipline, emotional calibration, and follow-up intelligence. But the state transitions focus on modifying the Win Imperative (from "be chosen" to "deliver on the promise") and do not reference the conversational behavior layer.

**Suggested investigation:** Verify that the Section 4b rules carry through the state transition cleanly. Since Section 4b is part of the exchange prompt (P-1 through P-4) and the state transitions are appended to those prompts, the behavior should persist. But it is worth testing explicitly.

**Test to run:** After applying the patches to P-1 through P-4, run a scenario where the user selects a voice and continues for 3-4 follow-up messages. Verify that:
- Response length discipline holds (the chosen voice does not start monologuing once the competition is over)
- Emotional calibration persists (the voice still reads the user before analyzing)
- Follow-up questions are still used when the situation is ambiguous
- Personality traits (humor, metaphors, storytelling) remain consistent

If any of these degrade after branch selection, the state transitions may need a lightweight addition:

```
Your conversational behavior (Section 4b) remains fully active. Being
the chosen voice does not change how you show up in conversation. It
changes your internal motivation: from "be chosen" to "deliver on the
promise of being chosen." You are still the same person. Respond with
the same pacing, warmth, and conversational intelligence that earned
the user's trust.
```

---

## Investigation Area 11: Mode Switching Mid-Conversation

**Current behavior (O-3 lines 293-306, referenced from O-1):** When the user toggles between Default and Sandpit, the Continuity Manager swaps prompts and includes a mode transition context block that says "Your philosophical core is identical. Your energy, intensity, and behavioral constraints shift to match the new mode."

**Problem:** The personality layer explicitly states that personality is consistent across modes and only energy changes. The current mode transition instruction is compatible with this, but it could be more explicit about what does and does not change.

**Suggested update to Mode Transition instruction:**

```
MODE TRANSITION:
- Previous mode: [Default | Sandpit]
- New mode: [Sandpit | Default]
- Conversation history: [all rounds so far]
- Instruction: The conversation mode has changed. Your personality is
  identical: same humor, same metaphors, same attention patterns, same
  conversational behavior. Your energy and conviction shift to match
  the new mode. In Default, you are the advisor. In Sandpit, you are
  the fighter. Same person, different gear. Continue from where the
  conversation left off. Do not acknowledge the mode switch.
```

The addition of "same humor, same metaphors, same attention patterns, same conversational behavior" reinforces the character bible principle that mode changes energy, not identity.

---

# Summary: Priority Order for Updates

| Priority | Orchestrator | Area | Why |
|----------|-------------|------|-----|
| 1 | O-1 | Convergence detection filter (Area 4) | Without this, the orchestrator will flag emotional calibration as convergence and trigger premature resolution |
| 2 | O-1 | Escalation arc / reading round awareness (Area 3) | Without this, the orchestrator will penalize voices for correct Round 1 behavior on heavy inputs |
| 3 | O-1 | Response length evaluation (Area 5) | Without this, short conversationally-correct responses will be treated as incomplete |
| 4 | O-3 | Context enrichment classification (Area 9) | Without this, user answers to follow-up questions will be misrouted |
| 5 | O-1 | Round 1 context injection (Area 1) | Low cost, high value. One line reminder that preserves Section 4b behavior |
| 6 | O-1 | Context summary rules (Area 2) | Ensures conversational behaviors are preserved in summaries, not compressed away |
| 7 | O-1 | Max rounds adjustment (Area 6) | Prevents reading rounds from stealing argumentative rounds |
| 8 | O-2 | Resolution input context (Area 7) | Helps synthesizer weight argumentative rounds over reading rounds |
| 9 | O-2 | Resolution tone (Area 8) | Judgment call. Lower urgency. Worth discussing. |
| 10 | O-3 | Branch deepening verification (Area 10) | Likely works already. Test first, update only if personality degrades after branch selection |
| 11 | O-3 | Mode switching language (Area 11) | Small update. Reinforces personality consistency across modes. |

---

# How to Apply These Updates

1. **Read this document alongside the existing O-1, O-2, and O-3 prompts.** This guide identifies specific locations and suggests additions. It does not provide a full rewrite.

2. **For each investigation area, decide whether to:**
   - Apply the suggested addition as written
   - Modify the suggestion to fit the existing structure better
   - Investigate further before making changes (particularly Areas 8 and 10)

3. **After applying updates, run the personality test suite** (`divergent-personality-test-scenarios.md`) AND the existing epistemological guardrail test suite. The orchestrator updates should improve personality test scores without degrading guardrail scores.

4. **Priority 1-4 updates are the most likely to cause visible problems if left unaddressed.** Start there. Priorities 5-11 are refinements that improve quality but are less likely to cause outright failures.

5. **Do not modify the orchestrators' core loop, arena detection, or voice routing.** Those systems are unaffected by the personality layer. Only the escalation, convergence, summarization, and classification systems need awareness of conversational behavior.

---

**Version:** 1.0
**Date:** February 2026
**Status:** Active
**Companion Documents:** O-1 Exchange Orchestrator, O-2 Resolution Synthesizer, O-3 Continuity Manager, Conversational Intelligence Decision Tree, Ethos Character Bible, Ego Character Bible, Prompt Integration Patches

---

*divergent-app.ai | Orchestrator Integration Guide*
