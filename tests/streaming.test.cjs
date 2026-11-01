/**
 * Streaming + provider fallback tests
 *
 * Covers the bugs found in pressure testing (Oct 31 2026):
 *  - SSE events split across network reads were silently dropped
 *    (missing words, orphaned ** markers in GPT/Grok output)
 *  - multi-byte characters split across reads were corrupted
 *  - Gemini 402 surfaced to the user instead of falling back silently
 *
 * Run: npx jest tests/streaming.test.cjs
 */

const {
  readSSE,
  extractors,
  buildChain,
  streamWithFallback,
  GEMINI_MODELS,
} = require('../lib/streaming.cjs');

// ── Helpers ─────────────────────────────────────────────

const SAMPLE =
  'The question is **whether a good father** shows up. It’s not ' +
  'about feeling — it is *about* the moves you make. Café, naïve, 日本 ✓.';

// Split text into small token-like pieces, the way providers stream.
function tokenize(text) {
  return text.match(/.{1,3}/gsu);
}

const formats = {
  openai: (t) => ({ choices: [{ delta: { content: t } }] }),
  anthropic: (t) => ({ type: 'content_block_delta', delta: { type: 'text_delta', text: t } }),
  gemini: (t) => ({ candidates: [{ content: { parts: [{ text: t }] } }] }),
};

function buildSSE(format, text, { eol = '\n', trailingDone = true, finalNewline = true } = {}) {
  let out = '';
  if (format === 'anthropic') out += `event: message_start${eol}data: {"type":"message_start"}${eol}${eol}`;
  for (const tok of tokenize(text)) {
    out += `data: ${JSON.stringify(formats[format](tok))}${eol}${eol}`;
  }
  if (trailingDone) out += `data: [DONE]${eol}${eol}`;
  if (!finalNewline) out = out.replace(/(\r?\n)+$/, '');
  return out;
}

// Fake web ReadableStream body that delivers bytes in the given slice sizes.
function bodyFromBytes(bytes, cuts) {
  const pieces = [];
  let i = 0;
  for (const c of cuts) {
    if (i >= bytes.length) break;
    pieces.push(bytes.slice(i, i + c));
    i += c;
  }
  if (i < bytes.length) pieces.push(bytes.slice(i));
  let n = 0;
  return {
    getReader() {
      return {
        read: async () => (n < pieces.length ? { done: false, value: pieces[n++] } : { done: true, value: undefined }),
        cancel: async () => {},
        releaseLock() {},
      };
    },
  };
}

function seededCuts(seed, len) {
  let s = seed;
  const cuts = [];
  let total = 0;
  while (total < len) {
    s = (s * 1103515245 + 12345) % 2147483648;
    const c = 1 + (s % 23);
    cuts.push(c);
    total += c;
  }
  return cuts;
}

async function collect(format, body) {
  let text = '';
  for await (const data of readSSE(body)) {
    if (data === '[DONE]') continue;
    text += extractors[format](JSON.parse(data));
  }
  return text;
}

// ── readSSE: chunk boundary robustness ──────────────────

describe('readSSE reassembles events split across reads', () => {
  for (const format of ['openai', 'anthropic', 'gemini']) {
    test(`${format}: exact text survives 50 random split patterns`, async () => {
      const bytes = new TextEncoder().encode(buildSSE(format, SAMPLE));
      for (let seed = 1; seed <= 50; seed++) {
        const body = bodyFromBytes(bytes, seededCuts(seed, bytes.length));
        await expect(collect(format, body)).resolves.toBe(SAMPLE);
      }
    });

    test(`${format}: one byte per read`, async () => {
      const bytes = new TextEncoder().encode(buildSSE(format, SAMPLE));
      const body = bodyFromBytes(bytes, new Array(bytes.length).fill(1));
      await expect(collect(format, body)).resolves.toBe(SAMPLE);
    });
  }

  test('bold markers are never orphaned', async () => {
    const bytes = new TextEncoder().encode(buildSSE('openai', SAMPLE));
    const body = bodyFromBytes(bytes, seededCuts(7, bytes.length));
    const text = await collect('openai', body);
    expect((text.match(/\*\*/g) || []).length % 2).toBe(0);
  });

  test('handles CRLF line endings', async () => {
    const bytes = new TextEncoder().encode(buildSSE('openai', SAMPLE, { eol: '\r\n' }));
    const body = bodyFromBytes(bytes, seededCuts(3, bytes.length));
    await expect(collect('openai', body)).resolves.toBe(SAMPLE);
  });

  test('flushes a final event with no trailing newline', async () => {
    const bytes = new TextEncoder().encode(
      buildSSE('gemini', SAMPLE, { trailingDone: false, finalNewline: false })
    );
    const body = bodyFromBytes(bytes, seededCuts(11, bytes.length));
    await expect(collect('gemini', body)).resolves.toBe(SAMPLE);
  });
});

// ── Extractors ──────────────────────────────────────────

describe('extractors', () => {
  test('gemini joins all text parts and skips thought parts', () => {
    const parsed = {
      candidates: [{ content: { parts: [
        { text: 'internal reasoning', thought: true },
        { text: 'Hello ' },
        { text: 'world' },
      ] } }],
    };
    expect(extractors.gemini(parsed)).toBe('Hello world');
  });

  test('anthropic ignores non-delta events', () => {
    expect(extractors.anthropic({ type: 'message_start' })).toBe('');
  });

  test('openai tolerates empty choices', () => {
    expect(extractors.openai({ choices: [] })).toBe('');
  });
});

// ── Fallback chain ──────────────────────────────────────

describe('buildChain', () => {
  const allKeys = {
    ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'o', GOOGLE_API_KEY: 'g', XAI_API_KEY: 'x',
  };
  const ids = (chain) => chain.map((c) => `${c.provider}/${c.model}`);

  test('Gemini: Argon, then Claude, then GPT (no Flash step)', () => {
    expect(ids(buildChain('gemini', allKeys))).toEqual([
      'gemini/gemini-4-argon', 'claude/claude-sonnet-4-20250514', 'openai/gpt-4o',
    ]);
    expect(GEMINI_MODELS).toEqual(['gemini-4-argon']);
  });

  test('Grok: grok-4.7, then Claude, then GPT', () => {
    expect(ids(buildChain('grok', allKeys))).toEqual([
      'grok/grok-4.7', 'claude/claude-sonnet-4-20250514', 'openai/gpt-4o',
    ]);
  });

  test('GPT falls back to Claude', () => {
    expect(buildChain('openai', allKeys).map((c) => c.provider)).toEqual(['openai', 'claude']);
  });

  test('Claude falls back to GPT', () => {
    expect(buildChain('claude', allKeys).map((c) => c.provider)).toEqual(['claude', 'openai']);
  });

  test('skips fallbacks with no API key', () => {
    expect(buildChain('grok', { XAI_API_KEY: 'x', OPENAI_API_KEY: 'o' }).map((c) => c.provider))
      .toEqual(['grok', 'openai']);
  });

  test('no retired or in-family fallback model ids remain', () => {
    const all = ['claude', 'openai', 'gemini', 'grok']
      .flatMap((p) => buildChain(p, allKeys).map((c) => c.model));
    for (const dead of ['gemini-1.5-pro', 'grok-2', 'gemini-3.8-flash', 'grok-4.3']) {
      expect(all).not.toContain(dead);
    }
  });
});

describe('streamWithFallback', () => {
  const okBody = (format, text) => bodyFromBytes(
    new TextEncoder().encode(buildSSE(format, text)), [17, 5, 9, 31]
  );
  const res = (status, body) => ({ ok: status < 400, status, body, text: async () => `err ${status}` });

  test('falls back silently when the first attempt returns 402', async () => {
    const calls = [];
    const fetchImpl = async (url) => {
      calls.push(url);
      return calls.length === 1 ? res(402) : res(200, okBody('gemini', 'Recovered text.'));
    };
    let out = '';
    const result = await streamWithFallback({
      chain: [{ provider: 'gemini', model: 'gemini-4-argon' }, { provider: 'gemini', model: 'gemini-3.8-flash' }],
      systemPrompt: 'sys', message: 'hi', env: { GOOGLE_API_KEY: 'g' },
      fetchImpl, onText: (t) => { out += t; }, log: () => {},
    });
    expect(result.ok).toBe(true);
    expect(result.used).toEqual({ provider: 'gemini', model: 'gemini-3.8-flash' });
    expect(out).toBe('Recovered text.');
    expect(calls).toHaveLength(2);
  });

  test('falls back when fetch throws', async () => {
    let n = 0;
    const fetchImpl = async () => {
      if (n++ === 0) throw new Error('ECONNRESET');
      return res(200, okBody('openai', 'From OpenAI.'));
    };
    let out = '';
    const result = await streamWithFallback({
      chain: [{ provider: 'grok', model: 'grok-x' }, { provider: 'openai', model: 'gpt-4o' }],
      systemPrompt: 's', message: 'm', env: { XAI_API_KEY: 'x', OPENAI_API_KEY: 'o' },
      fetchImpl, onText: (t) => { out += t; }, log: () => {},
    });
    expect(result.ok).toBe(true);
    expect(result.used.provider).toBe('openai');
    expect(out).toBe('From OpenAI.');
  });

  test('falls back when a 200 stream produces no text', async () => {
    let n = 0;
    const empty = bodyFromBytes(new TextEncoder().encode('data: [DONE]\n\n'), [100]);
    const fetchImpl = async () => (n++ === 0 ? res(200, empty) : res(200, okBody('anthropic', 'Claude here.')));
    let out = '';
    const result = await streamWithFallback({
      chain: [{ provider: 'gemini', model: 'gemini-4-argon' }, { provider: 'claude', model: 'c' }],
      systemPrompt: 's', message: 'm', env: { GOOGLE_API_KEY: 'g', ANTHROPIC_API_KEY: 'a' },
      fetchImpl, onText: (t) => { out += t; }, log: () => {},
    });
    expect(result.used.provider).toBe('claude');
    expect(out).toBe('Claude here.');
  });

  test('reports failure only when every attempt fails', async () => {
    const result = await streamWithFallback({
      chain: [{ provider: 'gemini', model: 'a' }, { provider: 'openai', model: 'b' }],
      systemPrompt: 's', message: 'm', env: { GOOGLE_API_KEY: 'g', OPENAI_API_KEY: 'o' },
      fetchImpl: async () => res(500), onText: () => {}, log: () => {},
    });
    expect(result.ok).toBe(false);
    expect(result.errors).toHaveLength(2);
  });

  test('sends the system prompt as the system message for each provider', async () => {
    const bodies = [];
    const fetchImpl = async (url, init) => { bodies.push({ url, body: JSON.parse(init.body) }); return res(500); };
    await streamWithFallback({
      chain: [
        { provider: 'claude', model: 'c' }, { provider: 'openai', model: 'o' },
        { provider: 'gemini', model: 'g' }, { provider: 'grok', model: 'x' },
      ],
      systemPrompt: 'SYS', message: 'USER',
      env: { ANTHROPIC_API_KEY: 'a', OPENAI_API_KEY: 'o', GOOGLE_API_KEY: 'g', XAI_API_KEY: 'x' },
      fetchImpl, onText: () => {}, log: () => {},
    });
    expect(bodies[0].body.system).toBe('SYS');
    expect(bodies[1].body.messages[0]).toEqual({ role: 'system', content: 'SYS' });
    expect(bodies[2].body.systemInstruction.parts[0].text).toBe('SYS');
    expect(bodies[2].url).toContain('models/g:streamGenerateContent');
    expect(bodies[3].body.messages[1]).toEqual({ role: 'user', content: 'USER' });
  });
});
