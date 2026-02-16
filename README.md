# Divergent

**See Where Your Paths Diverge** — A dual-perspective AI decision engine.

## Features

- 🎭 **Dual AI Voices** — Two perspectives respond simultaneously
- 🤖 **Multi-Provider** — Use Claude, GPT-4o, or Gemini for each voice
- 💬 **Live Debate** — Watch the voices challenge each other
- ✨ **Streaming** — Real-time text generation

## Deploy to Railway

### Step 1: Push to GitHub

```bash
cd divergent-app
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/divergent-app.git
git branch -M main
git push -u origin main
```

### Step 2: Deploy on Railway

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"** → **"Deploy from GitHub repo"**
3. Select your `divergent-app` repo
4. Railway will auto-detect the config and start building

### Step 3: Add Environment Variables

In Railway dashboard, go to your project → **Variables** tab → Add:

| Variable | Value |
|----------|-------|
| `ANTHROPIC_API_KEY` | Your Claude API key |
| `OPENAI_API_KEY` | Your OpenAI API key |
| `GOOGLE_API_KEY` | Your Google/Gemini API key |

You only need the keys for providers you want to use.

### Step 4: Connect Domain

1. In Railway → **Settings** → **Domains**
2. Add your custom domain: `divergent-app.ai`
3. Update DNS at your registrar with the provided records

## Local Development

```bash
npm install
npm run build
npm start
```

For development with hot reload:
```bash
npm run dev
```

## Tech Stack

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Express.js
- **AI:** Claude, GPT-4o, Gemini (streaming)
- **Hosting:** Railway

## API Keys

| Provider | Get Key From |
|----------|--------------|
| Claude | [console.anthropic.com](https://console.anthropic.com) |
| GPT-4o | [platform.openai.com](https://platform.openai.com/api-keys) |
| Gemini | [aistudio.google.com](https://aistudio.google.com/app/apikey) |

---

Built by Kyle
