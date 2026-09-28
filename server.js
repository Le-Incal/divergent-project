import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createHash, timingSafeEqual } from 'crypto';
import { resolveSystemPrompt, getResolutionPrompt } from './promptLoader.js';
import { acceptDiagram, diagramTools } from './src/diagram/tool.js';

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

// Site access gate: validates the pre-launch password without shipping it to the client
app.post('/api/access', (req, res) => {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) {
    return res.status(503).json({ error: 'Access gate not configured' });
  }

  const { password } = req.body || {};
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Missing password' });
  }

  // Hash both sides so the comparison operates on equal-length buffers
  const hash = (value) => createHash('sha256').update(value).digest();
  if (!timingSafeEqual(hash(password), hash(expected))) {
    return res.status(401).json({ error: 'Incorrect password' });
  }

  res.json({ ok: true });
});

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

// Claude API endpoint
app.post('/api/chat-claude', async (req, res) => {
  try {
    const { message, voiceName } = req.body;
    const systemPrompt = await getSystemPrompt(req.body);
    if (!systemPrompt) {
      return res.status(400).json({ error: 'Missing systemPrompt or voice+mode' });
    }

    const claudeBody = {
      model: CLAUDE_MODEL,
      max_tokens: chatTokenLimit(req.body),
      thinking: { type: 'disabled' },
      stream: true,
      system: systemPrompt,
      messages: [{ role: 'user', content: message }],
    };
    if (req.body.diagram) claudeBody.tools = diagramTools();
    if (req.body.diagramOnly) claudeBody.tool_choice = { type: 'tool', name: 'emit_diagram' };

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(claudeBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Claude API error:', error);
      return res.status(response.status).json({ error: 'Claude API request failed' });
    }

    // Set up SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    const toolBlocks = new Map();
    let invalidDiagram = null;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
                toolBlocks.set(parsed.index, { name: parsed.content_block.name, json: '' });
              }
              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'input_json_delta') {
                const block = toolBlocks.get(parsed.index);
                if (block) block.json += parsed.delta.partial_json || '';
              }
              if (parsed.type === 'content_block_stop') {
                const block = toolBlocks.get(parsed.index);
                if (block) {
                  let input = null;
                  try { input = JSON.parse(block.json); } catch { input = null; }
                  if (block.name === 'emit_structure_hints' && input) {
                    res.write(`data: ${JSON.stringify({ diagram: { type: 'hints', hints: input }, voice: voiceName })}\n\n`);
                  }
                  if (block.name === 'emit_diagram') {
                    const accepted = acceptDiagram(input, { c2: req.body.c2 });
                    if (accepted.type === 'spec') {
                      res.write(`data: ${JSON.stringify({ diagram: { type: 'spec', spec: accepted.spec }, voice: voiceName })}\n\n`);
                    } else {
                      invalidDiagram = accepted;
                    }
                  }
                }
              }
              if (parsed.type === 'content_block_delta') {
                const text = parsed.delta?.text || '';
                if (text) {
                  res.write(`data: ${JSON.stringify({ text, voice: voiceName })}\n\n`);
                }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
    }

    if (invalidDiagram && req.body.diagram) {
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
        res.write(`data: ${JSON.stringify({
          diagram: { type: 'fallback', outline: invalidDiagram.outline, reason: invalidDiagram.issues.join(', ') },
          voice: voiceName,
        })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Claude handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// OpenAI API endpoint
app.post('/api/chat-openai', async (req, res) => {
  try {
    const { message, voiceName } = req.body;
    const systemPrompt = await getSystemPrompt(req.body);
    if (!systemPrompt) {
      return res.status(400).json({ error: 'Missing systemPrompt or voice+mode' });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-6-sol',
        stream: true,
        reasoning_effort: 'none',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_completion_tokens: chatTokenLimit(req.body),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      return res.status(response.status).json({ error: 'OpenAI API request failed' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content || '';
              if (text) {
                res.write(`data: ${JSON.stringify({ text, voice: voiceName })}\n\n`);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('OpenAI handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Gemini API endpoint
app.post('/api/chat-gemini', async (req, res) => {
  try {
    const { message, voiceName } = req.body;
    const systemPrompt = await getSystemPrompt(req.body);
    if (!systemPrompt) {
      return res.status(400).json({ error: 'Missing systemPrompt or voice+mode' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:streamGenerateContent?key=${process.env.GOOGLE_API_KEY}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            maxOutputTokens: chatTokenLimit(req.body),
            thinkingConfig: { thinkingLevel: 'LOW' },
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Gemini API error:', error);
      return res.status(response.status).json({ error: 'Gemini API request failed' });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            try {
              const parsed = JSON.parse(data);
              const parts = parsed.candidates?.[0]?.content?.parts || [];
              const text = parts.filter((part) => part.text && !part.thought).map((part) => part.text).join('');
              if (text) {
                res.write(`data: ${JSON.stringify({ text, voice: voiceName })}\n\n`);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Gemini handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Grok (xAI) API endpoint - OpenAI-compatible
app.post('/api/chat-grok', async (req, res) => {
  try {
    const { message, voiceName } = req.body;
    const systemPrompt = await getSystemPrompt(req.body);
    if (!systemPrompt) {
      return res.status(400).json({ error: 'Missing systemPrompt or voice+mode' });
    }

    if (!process.env.XAI_API_KEY) {
      return res.status(500).json({ error: 'Grok API key is not configured' });
    }

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-4.3',
        reasoning_effort: 'none',
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: chatTokenLimit(req.body),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Grok API error:', error);
      let detail = 'Grok API request failed';
      try {
        const parsed = JSON.parse(error);
        const message = parsed?.error?.message || parsed?.error || parsed?.message;
        if (typeof message === 'string' && message.length > 0 && message.length < 240) {
          detail = `Grok API request failed: ${message}`;
        }
      } catch {
        // Keep the generic message when xAI does not return JSON.
      }
      return res.status(response.status).json({ error: detail });
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content || '';
              if (text) {
                res.write(`data: ${JSON.stringify({ text, voice: voiceName })}\n\n`);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Stream error:', error);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Grok handler error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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
  if (process.env.SITE_PASSWORD) {
    console.log('Access gate: SITE_PASSWORD configured');
  } else {
    console.warn('Access gate: SITE_PASSWORD not set - nobody can pass the Coming Soon screen');
  }
});
