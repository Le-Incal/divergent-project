import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { resolveSystemPrompt, getResolutionPrompt } from './promptLoader.js';
import { acceptDiagram, diagramTools } from './src/diagram/tool.js';
import streaming from './lib/streaming.cjs';

const { buildChain, streamWithFallback } = streaming;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const CLAUDE_MODEL = 'claude-sonnet-5';

function chatTokenLimit(body) {
  const requested = Number(body?.maxTokens);
  const cap = body?.diagram ? 2048 : 1024;
  if (!Number.isFinite(requested)) return body?.diagram ? 1400 : 1024;
  return Math.min(cap, Math.max(80, Math.round(requested)));
}

function emitDiagramResult(res, voiceName, raw, body) {
  const accepted = acceptDiagram(raw, { c2: body?.c2 });
  if (accepted.type !== 'spec') return false;
  res.write(`data: ${JSON.stringify({ diagram: { type: 'spec', spec: accepted.spec }, voice: voiceName })}\n\n`);
  return true;
}

app.use(cors());
app.use(express.json());

// Serve static files from the dist folder
app.use(express.static(join(__dirname, 'dist')));

// Resolve system prompt: use file-based prompts for Ethos/Ego when voice+mode provided
async function getSystemPrompt(body) {
  if (body.voice && body.mode) {
    const loaded = await resolveSystemPrompt({
      voice: body.voice,
      mode: body.mode,
      appendTransition: body.appendTransition || null,
    });
    if (loaded) return loaded;
  }
  return body.systemPrompt || null;
}

// Chat endpoints: one shared streaming path with silent provider fallback.
// Gemini and Grok fall back to Claude then GPT; GPT falls back to Claude;
// Claude falls back to GPT. See lib/streaming.cjs for why the old
// per-provider parsers dropped words.
function chatHandler(providerId) {
  return async (req, res) => {
    try {
      const { message, voiceName } = req.body;
      const systemPrompt = await getSystemPrompt(req.body);
      if (!systemPrompt) {
        return res.status(400).json({ error: 'Missing systemPrompt or voice+mode' });
      }

      let started = false;
      const start = () => {
        if (started) return;
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        started = true;
      };
      const send = (payload) => {
        start();
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      };

      // Claude-only diagram tooling. Applied only when Claude answers.
      const claudeExtras = {};
      if (req.body.diagram) claudeExtras.tools = diagramTools();
      if (req.body.diagramOnly) claudeExtras.tool_choice = { type: 'tool', name: 'emit_diagram' };
      const toolBlocks = new Map();
      let invalidDiagram = null;

      const onEvent = (parsed, attempt) => {
        if (attempt.provider !== 'claude') return false;
        if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
          toolBlocks.set(parsed.index, { name: parsed.content_block.name, json: '' });
        }
        if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'input_json_delta') {
          const block = toolBlocks.get(parsed.index);
          if (block) block.json += parsed.delta.partial_json || '';
        }
        if (parsed.type === 'content_block_stop') {
          const block = toolBlocks.get(parsed.index);
          if (!block) return false;
          let input = null;
          try { input = JSON.parse(block.json); } catch { input = null; }
          if (block.name === 'emit_structure_hints' && input) {
            send({ diagram: { type: 'hints', hints: input }, voice: voiceName });
            return true;
          }
          if (block.name === 'emit_diagram') {
            const accepted = acceptDiagram(input, { c2: req.body.c2 });
            if (accepted.type === 'spec') {
              send({ diagram: { type: 'spec', spec: accepted.spec }, voice: voiceName });
            } else {
              invalidDiagram = accepted;
            }
            return true;
          }
        }
        return false;
      };

      const result = await streamWithFallback({
        chain: buildChain(providerId),
        systemPrompt,
        message,
        maxTokens: chatTokenLimit(req.body),
        extras: { claude: claudeExtras },
        onText: (text) => send({ text, voice: voiceName }),
        onEvent,
      });

      if (!result.ok) {
        console.error(`[${providerId}] all providers failed:`, result.errors);
        return res.status(502).json({ error: 'No AI provider is available right now' });
      }
      if (result.used.provider !== providerId) {
        console.warn(`[${providerId}] served by fallback ${result.used.provider}/${result.used.model}`);
      }

      if (invalidDiagram && req.body.diagram && result.used.provider === 'claude') {
        start();
        try {
          const retry = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.ANTHROPIC_API_KEY,
              'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
              model: CLAUDE_MODEL,
              max_tokens: 1400,
              thinking: { type: 'disabled' },
              system: systemPrompt,
              tools: diagramTools(),
              tool_choice: { type: 'tool', name: 'emit_diagram' },
              messages: [{
                role: 'user',
                content: `${message}\n\nThe diagram was invalid (${invalidDiagram.issues.join(', ')}). Call emit_diagram again with a corrected spec and no coordinates.`,
              }],
            }),
          });
          if (retry.ok) {
            const data = await retry.json();
            const tool = (data.content || []).find((block) => block.type === 'tool_use' && block.name === 'emit_diagram');
            if (tool?.input && emitDiagramResult(res, voiceName, tool.input, req.body)) {
              invalidDiagram = null;
            }
          }
        } catch (error) {
          console.error('Diagram retry error:', error);
        }
        if (invalidDiagram) {
          send({
            diagram: { type: 'fallback', outline: invalidDiagram.outline, reason: invalidDiagram.issues.join(', ') },
            voice: voiceName,
          });
        }
      }

      start();
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (error) {
      console.error(`${providerId} handler error:`, error);
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
      else res.end();
    }
  };
}

app.post('/api/chat-claude', chatHandler('claude'));
app.post('/api/chat-openai', chatHandler('openai'));
app.post('/api/chat-gemini', chatHandler('gemini'));
app.post('/api/chat-grok', chatHandler('grok'));

// O-2 Resolution: generate neutral summary when exchange ends
app.post('/api/resolution', async (req, res) => {
  try {
    const { mode, userQuestion, personaPair, rounds, conversationHistory, triggerReason } = req.body;
    if (!userQuestion || !conversationHistory || !Array.isArray(conversationHistory)) {
      return res.status(400).json({ error: 'Missing userQuestion or conversationHistory' });
    }

    const resolutionPrompt = await getResolutionPrompt();
    const contextBlock = `
RESOLUTION CONTEXT:
- Mode: ${mode || 'Default'}
- User's original question: ${userQuestion}
- Active persona pair: ${personaPair || 'Ethos/Ego'}
- Number of rounds completed: ${rounds ?? 0}
- Full conversation history:
${conversationHistory.map((m) => `${m.name || m.speaker}: ${m.text}`).join('\n')}
- Trigger reason: ${triggerReason || 'user request'}
`.trim();

    // Use Claude for resolution (neutral narrator); could be configurable
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'Resolution requires ANTHROPIC_API_KEY' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        thinking: { type: 'disabled' },
        system: resolutionPrompt,
        messages: [{ role: 'user', content: contextBlock }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Resolution API error:', error);
      return res.status(response.status).json({ error: 'Resolution request failed' });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';
    res.json({ resolution: text });
  } catch (error) {
    console.error('Resolution handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fallback to index.html for SPA routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Divergent server running on port ${PORT}`);
});
