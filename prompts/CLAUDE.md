# Prompts Directory
These are runtime files injected into AI API calls. Every file here is loaded by `src/services/promptLoader.ts`.
## Voice Prompts (P-1 to P-4)
Each follows a 7-section structure: Win Imperative, Persona Identity, Worldview Payload, Doctrine Engine, Voice Constraints, Opposition Awareness, Mode Directives.
- `P-1-ethos-default.md` - Ethos in Default Mode (constructive advisor)
- `P-2-ego-default.md` - Ego in Default Mode (constructive advisor)
- `P-3-ethos-sandpit.md` - Ethos in Sandpit Mode (adversarial debate)
- `P-4-ego-sandpit.md` - Ego in Sandpit Mode (adversarial debate)
## Orchestration (O-1 to O-3)
- `O-1-exchange-orchestrator.md` - Round management logic. Implement as BACKEND CODE, not an AI call.
- `O-2-resolution-synthesizer.md` - Neutral closing summary. This one IS an AI call.
- `O-3-continuity-manager.md` - Follow-up routing. Implement as BACKEND CODE.
## Transitions (ST-1, ST-2)
Appended to voice prompts when user selects a branch. NOT standalone system prompts.
```javascript
const advisoryPrompt = baseVoicePrompt + "\n\n---\n\n" + transitionPrompt;
```
## Registry
`CR-1-codename-registry.md` maps real names to codenames. NEVER send to an AI provider. Dev reference only.
## Editing Rules
- No real names anywhere in voice prompts (P-1 to P-4)
- Codenames only appear in Section 3 (Doctrine Engine)
- Cross-provider neutral: no provider-specific instructions
- After any edit, run `npm run test:personality` to verify voice fidelity
