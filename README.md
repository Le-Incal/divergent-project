# Divergent

**See where your paths diverge** — A dual-mode AI platform that externalizes the internal dialogue we all have when facing choices.

**Domain:** divergent-app.ai  
**Status:** MVP in development

## What it is

Divergent presents two contrasting AI voices side-by-side (**Ethos** vs **Ego** by default, or optional Unique Personas), then supports multi-round exchange and branch selection. It runs in two modes:

- **Default mode** — A decision engine. Constructive, opinionated perspectives to help you think through real choices. Guardrails and disclaimers; Claude, GPT-4o, Gemini (single model for both voices).
- **Sandpit mode** — Adversarial by design. Same personas, but the voices argue and compete. Cross-model matchups; Grok is available here only. Research disclaimer.

See **DIVERGENT-PROJECT-BRIEF-v2** (or your project brief) and **ALIGNMENT-PLAN.md** for full product and alignment details.

## Features

- **Ethos vs Ego** — Default persona pair (character & integrity vs strategy & power dynamics)
- **Unique Personas** — Challenger/Champion, Guardian/Gambler, Strategist/Leaper, Conformist/Maverick
- **Default / Sandpit** — Mode toggle with cross-fade; different prompts and model options per mode
- **Dual AI voices** — Two perspectives respond simultaneously; multi-round debate and “agree to disagree”
- **Model choice** — Default: one model for both. Sandpit: two dropdowns + Grok
- **Cards & Thread views** — Side-by-side panels or linear conversation
- **Liquid glass UI** — Teal (Default) and sand (Sandpit) palettes; Syne + Inter typography

## Deploy to Railway

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/divergent-app.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. **New Project** → **Deploy from GitHub repo**
3. Select your repo; Railway will use the config and build

### 3. Environment variables

In Railway → **Variables**:

| Variable | Value |
|----------|--------|
| `ANTHROPIC_API_KEY` | Claude API key |
| `OPENAI_API_KEY` | OpenAI API key |
| `GOOGLE_API_KEY` | Google/Gemini API key |
| `XAI_API_KEY` | Grok API key (Sandpit only) |

You only need the keys for providers you use. For Sandpit cross-model matchups, add `/api/chat-grok` and set `XAI_API_KEY`.

### 4. Domain

Railway → **Settings** → **Domains** → Add `divergent-app.ai` and update DNS.

## Local development

```bash
npm install
npm run dev
```

Build and run production locally (same as Railway):

```bash
NODE_ENV=production npm install && npm run build && npm start
```

```bash
npm run build
npm start
```

## Build note

Vite, Tailwind, and other build tools are listed in `dependencies` (not `devDependencies`) so that Railway’s production install (`NODE_ENV=production npm install`) still installs them and `npm run build` succeeds. The running app only needs Express and the built `dist/` output.

## Tech stack

- **Frontend:** React 18, Vite, Tailwind CSS
- **Backend:** Express.js (MVP); brief references Vercel Edge for future
- **AI:** Claude, GPT-4o, Gemini, Grok (streaming; Grok in Sandpit only)
- **Hosting:** Railway

## API keys

| Provider | Get key from |
|----------|----------------|
| Claude | [console.anthropic.com](https://console.anthropic.com) |
| GPT-4o | [platform.openai.com](https://platform.openai.com/api-keys) |
| Gemini | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| Grok | [console.x.ai](https://console.x.ai) (Sandpit only) |

## Repo alignment

Implementation is aligned with **Divergent Project Brief v2**. Pending items (e.g. resolution endpoint, Grok API, model refusal UI) are listed in **ALIGNMENT-PLAN.md**.

---

Built by Kyle
