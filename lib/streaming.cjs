/**
 * Provider streaming + silent fallback.
 *
 * Why this exists: the original handlers in server.js split each network
 * read on '\n' and JSON.parse'd every line. When an SSE event straddled two
 * reads, both halves failed to parse and were silently dropped, which showed
 * up in the UI as missing words and orphaned ** markers. This module buffers
 * partial lines across reads and decodes UTF-8 in streaming mode.
 */

const GEMINI_MODELS = ['gemini-4-argon'];

const PROVIDERS = {
  claude: {
    envKey: 'ANTHROPIC_API_KEY',
    models: ['claude-sonnet-4-20250514'],
    format: 'anthropic',
    request: ({ model, systemPrompt, message, key }) => ({
      url: 'https://api.anthropic.com/v1/messages',
      init: {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          stream: true,
          system: systemPrompt,
          messages: [{ role: 'user', content: message }],
        }),
      },
    }),
  },
  openai: {
    envKey: 'OPENAI_API_KEY',
    models: ['gpt-4o'],
    format: 'openai',
    request: ({ model, systemPrompt, message, key }) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          stream: true,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
        }),
      },
    }),
  },
  gemini: {
    envKey: 'GOOGLE_API_KEY',
    models: GEMINI_MODELS,
    format: 'gemini',
    request: ({ model, systemPrompt, message, key }) => ({
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: message }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          // Thinking models spend output tokens on reasoning, so leave headroom.
          generationConfig: { maxOutputTokens: 8192, temperature: 0.8 },
        }),
      },
    }),
  },
  grok: {
    envKey: 'XAI_API_KEY',
    models: ['grok-4.7'],
    format: 'openai',
    request: ({ model, systemPrompt, message, key }) => ({
      url: 'https://api.x.ai/v1/chat/completions',
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          stream: true,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
        }),
      },
    }),
  },
};

// Every provider falls back to Claude; Claude falls back to GPT.
const FALLBACKS = {
  claude: ['openai'],
  openai: ['claude'],
  gemini: ['claude', 'openai'],
  grok: ['claude', 'openai'],
};

const extractors = {
  anthropic: (p) =>
    p && p.type === 'content_block_delta' ? (p.delta && p.delta.text) || '' : '',
  openai: (p) => (p && p.choices && p.choices[0] && p.choices[0].delta && p.choices[0].delta.content) || '',
  gemini: (p) => {
    const parts = (p && p.candidates && p.candidates[0] && p.candidates[0].content && p.candidates[0].content.parts) || [];
    return parts.filter((x) => !x.thought && typeof x.text === 'string').map((x) => x.text).join('');
  },
};

/**
 * Async generator yielding the `data:` payload of each SSE line, with
 * partial lines carried across reads.
 */
async function* readSSE(body) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const handle = function* (line) {
    if (line.endsWith('\r')) line = line.slice(0, -1);
    if (!line.startsWith('data:')) return;
    yield line.slice(5).replace(/^ /, '');
  };
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop();
      for (const line of lines) yield* handle(line);
    }
    buffer += decoder.decode();
    if (buffer) yield* handle(buffer);
  } finally {
    try { reader.releaseLock && reader.releaseLock(); } catch (_) { /* ignore */ }
  }
}

/** Ordered {provider, model} attempts: requested provider, then its fallbacks that have keys. */
function buildChain(requested, env = process.env) {
  const chain = [];
  if (PROVIDERS[requested]) chain.push({ provider: requested, model: PROVIDERS[requested].models[0] });
  for (const id of FALLBACKS[requested] || []) {
    if (env[PROVIDERS[id].envKey]) chain.push({ provider: id, model: PROVIDERS[id].models[0] });
  }
  return chain;
}

/**
 * Try each attempt in order until one streams text. Fallback is silent to
 * the caller; failures are only logged. Once text has been emitted we never
 * switch providers, so the user never sees two voices spliced together.
 */
async function streamWithFallback({
  chain, systemPrompt, message, env = process.env,
  fetchImpl = fetch, onText, log = console.warn,
}) {
  const errors = [];
  for (const attempt of chain) {
    const p = PROVIDERS[attempt.provider];
    const label = `${attempt.provider}/${attempt.model}`;
    const key = env[p.envKey];
    if (!key) { errors.push({ ...attempt, error: 'missing API key' }); continue; }

    let emitted = false;
    try {
      const { url, init } = p.request({ model: attempt.model, systemPrompt, message, key });
      const response = await fetchImpl(url, init);
      if (!response.ok) {
        const detail = await response.text().catch(() => '');
        throw new Error(`HTTP ${response.status} ${detail.slice(0, 300)}`);
      }
      const extract = extractors[p.format];
      for await (const data of readSSE(response.body)) {
        if (data === '[DONE]') continue;
        let parsed;
        try { parsed = JSON.parse(data); } catch (_) { continue; }
        if (parsed && parsed.error) throw new Error(`stream error ${JSON.stringify(parsed.error).slice(0, 300)}`);
        const text = extract(parsed);
        if (text) { emitted = true; onText(text); }
      }
      if (emitted) return { ok: true, used: attempt, errors };
      throw new Error('empty response');
    } catch (err) {
      errors.push({ ...attempt, error: err.message });
      log(`[fallback] ${label} failed: ${err.message}`);
      if (emitted) return { ok: true, used: attempt, errors, truncated: true };
    }
  }
  return { ok: false, errors };
}

module.exports = { PROVIDERS, GEMINI_MODELS, extractors, readSSE, buildChain, streamWithFallback };
