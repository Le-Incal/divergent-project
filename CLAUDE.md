# Divergent
## What This Is
AI decision-making platform. Two voices (Ethos and Ego) reason from incompatible philosophical operating systems about the same user question. No consensus. Genuine tension. User hears both, picks one to explore further.
## Stack
- Frontend: React (liquid glass UI)
- Backend: Express.js
- AI Providers: Claude, GPT-4o, Gemini, Grok (multi-provider)
- Deployment: Railway -> divergent-app.ai
- Node 18+
## Commands
- `npm install` - install deps
- `npm run dev` - start dev server
- `npm run test` - run unit tests
- `npm run test:personality` - run voice personality test suite (26 runs, ~9 min with rate limit delays)
- `node scripts/run-personality-scenarios.js --delay=20000` - personality tests with explicit delay
- `node scripts/run-personality-scenarios.js --limit=6 --delay=20000` - run subset
## Key Directories
```
prompts/
├── voices/           # P-1 to P-4: AI voice system prompts (RUNTIME)
├── orchestration/    # O-1 to O-3: exchange management logic
├── transitions/      # ST-1, ST-2: branch selection addenda
└── registry/         # CR-1: codename mapping (DEV ONLY, never sent to AI)
src/
├── services/         # AI service, prompt loader
├── routes/           # API endpoints
└── types/            # TypeScript interfaces
docs/
├── divergent-implementation-guide.md    # Full 5-phase build plan with code
├── divergent-personality-contrast.md    # Voice scoring rubric (7 dimensions)
├── divergent-test-scenarios.md          # 12 QA scenarios for voice testing
├── divergent-canonical-arenas.md        # 8 collision domains
├── divergent-epistemological-guardrails.md
└── architecture/                        # Test results (timestamped)
```
## Critical Rules
1. **Voice prompts are the system message.** P-1 through P-4 go in the `system` field of API calls. User question goes in `user` field.
2. **Never expose codenames to users.** Doctrine names, chamber names, tier labels must never appear in AI output.
3. **Never send CR-1 to an AI provider.** It maps real names to codenames. Dev reference only.
4. **ST-1/ST-2 are appended, not standalone.** Concatenate to the active voice prompt on branch selection.
5. **O-1 and O-3 are backend code, not AI calls.** Only O-2 (Resolution Synthesizer) requires an AI call.
6. **Ethos = left/top. Ego = right/bottom.** Always. Consistent spatial metaphor.
## Sensitive Files (DO NOT COMMIT)
These contain real names (the IP). They are listed in `.gitignore`:
```
CR-1-codename-registry.md, *-doctrine-profiles-complete.md,
*-persona-consolidated.md, *-character-bible.md,
divergentdoctrinelibraries.xlsx, divergent-ego-upgrade-todo.md,
divergent-prompt-inventory-v1.md, divergent-prompt-compiler.md,
divergent-prompt-writing-rules.md
```
## Architecture Concepts
**Centripetal (Ethos):** Reasons Identity -> Action -> Impact. Character first.
**Centrifugal (Ego):** Reasons Action -> Identity -> Meaning. Build first.
**Win Imperative:** Each voice competes to be chosen. User never sees the competition.
**Tier System:** T1 always active. T2 analytical in Default, full in Sandpit. T3 diagnostic in Default, operational in Sandpit.
**Modes:** Default (constructive advisor) vs Sandpit (adversarial debate, gloves off).
## How To Work On This Project
Read `docs/divergent-implementation-guide.md` for the full 5-phase build plan with code patterns.
Read `docs/divergent-personality-contrast.md` when scoring test results or tuning voice prompts.
Use `/divergent-phase` commands (see `.claude/commands/`) to execute each phase.
Commit between phases. Each phase has its own test checklist.
