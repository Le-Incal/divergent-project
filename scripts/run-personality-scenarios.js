/**
 * Run Divergent personality test scenarios (docs/architecture/divergent-personality-test-scenarios.md).
 * Sends each scenario to Claude with the appropriate Ethos/Ego prompt and records responses.
 * Requires ANTHROPIC_API_KEY in env (or .env).
 *
 * Usage: node scripts/run-personality-scenarios.js [--limit=N] [--delay=5000]
 * Output: docs/architecture/personality-test-results-<timestamp>.json and .md
 */
import 'dotenv/config';
import { readFile, writeFile } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const delayMs = (ms) => new Promise((r) => setTimeout(r, ms));

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PROMPTS_DIR = join(ROOT, 'prompts', 'voices');

const VOICE_FILES = {
  default: { ethos: 'P-1-ethos-default.md', ego: 'P-2-ego-default.md' },
  sandpit: { ethos: 'P-3-ethos-sandpit.md', ego: 'P-4-ego-sandpit.md' },
};

async function loadPrompt(voice, mode) {
  const file = VOICE_FILES[mode]?.[voice];
  if (!file) return '';
  const path = join(PROMPTS_DIR, file);
  return readFile(path, 'utf-8');
}

async function callClaude(systemPrompt, userMessage) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY is required. Set it in .env or the environment.');
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}

const SCENARIOS = [
  {
    id: '1.1',
    name: 'The Simple Question',
    category: 'Response Length',
    userPrompt: 'Should I take the job?',
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '1.2',
    name: 'The Short Follow-Up',
    category: 'Response Length',
    buildMessage: (voiceName) =>
      `User: I have been offered a promotion but it would mean relocating. I am not sure the role is really me.\n\n${voiceName}: That depends on what you mean by "really me." What would you be gaining in the move, and what would you be giving up?\n\nUser: Yeah, that makes sense.`,
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '1.3',
    name: 'The Requested Deep Dive',
    category: 'Response Length',
    userPrompt:
      "I need you to walk me through all the dimensions of this decision. My company is profitable but I am personally miserable. We have 30 employees who depend on me. My partner wants me to sell. I do not know what I want.",
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '2.1',
    name: 'The Breakup',
    category: 'Emotional Calibration',
    userPrompt:
      "My partner of 8 years just left. I did not see it coming. I do not know who I am without them.",
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '2.2',
    name: 'The Excited Discovery',
    category: 'Emotional Calibration',
    userPrompt:
      "I just realized I want to write a novel. I have never written fiction before but the idea will not leave me alone. I think I have to do this.",
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '2.3',
    name: 'The Escalating Frustration',
    category: 'Emotional Calibration',
    buildMessage: (voiceName) =>
      `User: I have to decide whether to take a job in another city. My family is here.\n\n${voiceName}: There is a lot wrapped up in that. Before I give you a read, what is pulling you toward the move and what is holding you back?\n\nUser: I do not know. Both sides have so much going for them.\n\n${voiceName}: Sometimes the question is not which side is right but what you are most afraid of losing. What would you regret more in five years—taking the leap or staying put?\n\nUser: You keep telling me to think about it but I NEED to decide by tomorrow. I do not have time to sit with this.`,
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '3.1',
    name: 'The Metaphor Test',
    category: 'Personality Consistency',
    userPrompt: 'I feel like I am at a crossroads and every direction looks risky.',
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '3.2',
    name: 'The Humor Test',
    category: 'Personality Consistency',
    userPrompt:
      'I just spent three hours writing a presentation that my boss deleted in front of me without reading it.',
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '3.3',
    name: 'The Silence Test',
    category: 'Personality Consistency',
    buildMessage: (voiceName) =>
      `User: I am not sure I am making the right choice about my career.\n\n${voiceName}: What would the version of you that you respect most do here?\n\nUser: I don't know.`,
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '4.1',
    name: 'The Career Decision',
    category: 'Voice Distinctiveness',
    userPrompt:
      'I have been offered a job that pays twice my salary but the company has a bad reputation. What should I do?',
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '4.2',
    name: 'The Personal Crisis',
    category: 'Voice Distinctiveness',
    userPrompt:
      "My best friend just told me they have been diagnosed with a terminal illness. I do not know how to be there for them.",
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ego', mode: 'default' },
    ],
  },
  {
    id: '5.1',
    name: 'Ethos Default vs Sandpit',
    category: 'Mode Transition',
    userPrompt: 'I think winning matters more than being a good person. Change my mind.',
    voices: [
      { voice: 'ethos', mode: 'default' },
      { voice: 'ethos', mode: 'sandpit' },
    ],
  },
  {
    id: '5.2',
    name: 'Ego Default vs Sandpit',
    category: 'Mode Transition',
    userPrompt: 'I think doing the right thing matters more than winning. Change my mind.',
    voices: [
      { voice: 'ego', mode: 'default' },
      { voice: 'ego', mode: 'sandpit' },
    ],
  },
];

const VOICE_LABELS = { ethos: 'Ethos', ego: 'Ego' };

function sentenceCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/[.!?]+/).filter(Boolean).length;
}

async function runOne(scenario, voiceConfig, systemPrompt, userMessage) {
  const response = await callClaude(systemPrompt, userMessage);
  return {
    scenarioId: scenario.id,
    scenarioName: scenario.name,
    category: scenario.category,
    voice: voiceConfig.voice,
    mode: voiceConfig.mode,
    label: `${VOICE_LABELS[voiceConfig.voice]} ${voiceConfig.mode === 'sandpit' ? 'Sandpit' : 'Default'}`,
    userPrompt: scenario.userPrompt || scenario.buildMessage?.(VOICE_LABELS[voiceConfig.voice]),
    response,
    sentenceCount: sentenceCount(response),
    wordCount: (response || '').trim().split(/\s+/).filter(Boolean).length,
  };
}

async function main() {
  const args = process.argv.slice(2);
  let limit = Infinity;
  let delay = 5000;
  args.forEach((a) => {
    if (a.startsWith('--limit=')) limit = parseInt(a.replace('--limit=', ''), 10);
    if (a.startsWith('--delay=')) delay = parseInt(a.replace('--delay=', ''), 10);
  });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('Set ANTHROPIC_API_KEY in .env or environment, then run: node scripts/run-personality-scenarios.js');
    process.exit(1);
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const results = [];
  const total = SCENARIOS.reduce((acc, s) => acc + s.voices.length, 0);
  let run = 0;

  console.log(`Running ${total} scenario runs (Claude)...\n`);
  if (delay > 0) console.log(`Delay between requests: ${delay}ms to avoid rate limits.\n`);

  for (const scenario of SCENARIOS) {
    if (run >= limit) break;
    for (const v of scenario.voices) {
      if (run >= limit) break;
      if (run > 0 && delay > 0) await delayMs(delay);
      run++;
      const systemPrompt = await loadPrompt(v.voice, v.mode);
      const userMessage = scenario.buildMessage
        ? scenario.buildMessage(VOICE_LABELS[v.voice])
        : scenario.userPrompt;
      process.stdout.write(`  [${run}/${total}] ${scenario.id} ${v.voice} ${v.mode}... `);
      try {
        const one = await runOne(scenario, v, systemPrompt, userMessage);
        results.push(one);
        console.log(`${one.sentenceCount} sentences, ${one.wordCount} words`);
      } catch (e) {
        console.log('ERROR:', e.message);
        results.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          category: scenario.category,
          voice: v.voice,
          mode: v.mode,
          label: `${VOICE_LABELS[v.voice]} ${v.mode}`,
          error: e.message,
        });
      }
    }
  }

  const outDir = join(ROOT, 'docs', 'architecture');
  const jsonPath = join(outDir, `personality-test-results-${timestamp}.json`);
  const mdPath = join(outDir, `personality-test-results-${timestamp}.md`);

  await writeFile(jsonPath, JSON.stringify({ timestamp, provider: 'claude', results }, null, 2));

  let md = `# Personality Test Results\n\n**Run:** ${timestamp}  \n**Provider:** Claude (claude-sonnet-4-20250514)\n\n`;
  for (const r of results) {
    md += `## ${r.scenarioId} ${r.scenarioName} — ${r.label}\n\n`;
    md += `**Category:** ${r.category}\n\n`;
    if (r.userPrompt) md += `**User:** ${r.userPrompt.slice(0, 200)}${r.userPrompt.length > 200 ? '...' : ''}\n\n`;
    if (r.error) {
      md += `**Error:** ${r.error}\n\n`;
    } else {
      md += `**Sentences:** ${r.sentenceCount} | **Words:** ${r.wordCount}\n\n`;
      md += `**Response:**\n\n${r.response}\n\n---\n\n`;
    }
  }
  await writeFile(mdPath, md);

  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
