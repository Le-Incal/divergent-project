import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { resolveSystemPrompt, getResolutionPrompt } from './promptLoader.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

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

// Claude API endpoint
app.post('/api/chat-claude', async (req, res) => {
  try {
    const { message, voiceName } = req.body;
    const systemPrompt = await getSystemPrompt(req.body);
    if (!systemPrompt) {
      return res.status(400).json({ error: 'Missing systemPrompt or voice+mode' });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
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
        model: 'gpt-4o',
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
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
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:streamGenerateContent?key=${process.env.GOOGLE_API_KEY}&alt=sse`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: { maxOutputTokens: 1024, temperature: 0.8 },
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
              const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
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

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.XAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'grok-2',
        stream: true,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
        ],
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Grok API error:', error);
      return res.status(response.status).json({ error: 'Grok API request failed' });
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
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
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

// ElevenLabs TTS proxy (keeps API key server-side)
app.post('/api/tts', async (req, res) => {
  try {
    const { text, voiceId } = req.body;
    const apiKey = process.env.ELEVENLABS_API_KEY;

    if (!apiKey) {
      return res.status(503).json({ error: 'TTS not configured: ELEVENLABS_API_KEY missing' });
    }
    if (!text || typeof text !== 'string' || !voiceId || typeof voiceId !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid text or voiceId' });
    }

    const url = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: text.slice(0, 5000), // ElevenLabs limits text length
        model_id: 'eleven_multilingual_v2',
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('ElevenLabs TTS error:', response.status, errText);
      return res.status(response.status).json({ error: 'TTS request failed' });
    }

    const buffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('TTS handler error:', error);
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
