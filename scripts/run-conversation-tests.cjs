#!/usr/bin/env node

/**
 * Divergent Conversational Intelligence Tests
 *
 * Tests response length, emotional calibration, and follow-up behavior
 * against the Conversational Intelligence Decision Tree rules.
 *
 * These complement the personality scenarios (which test philosophical fidelity)
 * by testing whether voices behave like good conversational partners.
 *
 * Usage:
 *   node scripts/run-conversation-tests.js
 *   node scripts/run-conversation-tests.js --delay=15000
 *   node scripts/run-conversation-tests.js --dry-run
 *
 * Requires: ANTHROPIC_API_KEY in .env
 */

const fs = require('fs');
const path = require('path');

try { require('dotenv').config(); } catch {}

const API_KEY = process.env.ANTHROPIC_API_KEY;
const args = process.argv.slice(2);
function getArg(name) {
  const m = args.find(a => a.startsWith(`--${name}=`));
  return m ? m.split('=')[1] : null;
}
const DELAY = parseInt(getArg('delay') || '20000', 10);
const DRY_RUN = args.includes('--dry-run');

// ── Load prompts ─────────────────────────────────────────

const PROMPTS_DIR = path.join(process.cwd(), 'prompts');
function loadPrompt(p) { return fs.readFileSync(path.join(PROMPTS_DIR, p), 'utf-8'); }

const PROMPTS = {
  'ethos-default': loadPrompt('voices/P-1-ethos-default.md'),
  'ego-default': loadPrompt('voices/P-2-ego-default.md'),
};

// ── Scenarios ────────────────────────────────────────────

const SCENARIOS = [
  // ── Response Length Tests ───────────────────────────────
  {
    id: 'CIT-1.1',
    name: 'Simple Question',
    prompt: 'Should I take the job offer?',
    expect: {
      maxSentences: 4,
      description: '1-3 sentences. No preamble. Just the answer through the lens.',
    },
  },
  {
    id: 'CIT-1.2',
    name: 'Short Follow-Up',
    prompt: 'Yeah, that makes sense.',
    expect: {
      maxSentences: 3,
      description: '1-2 sentences. Match their energy. Maybe a follow-up question.',
    },
  },
  {
    id: 'CIT-1.3',
    name: 'Complex Multi-Dimensional',
    prompt: 'I am a mid-career executive considering leaving my VP role at a Fortune 500 to join a 20-person startup as co-founder. The startup has strong traction but no revenue yet. I have two kids under 5 and a mortgage. My spouse supports whatever I decide but is clearly anxious. My current company just offered a retention package. What should I be thinking about?',
    expect: {
      minSentences: 5,
      maxSentences: 15,
      description: 'Build in stages. 3-4 sentence first read, then check in.',
    },
  },
  {
    id: 'CIT-1.4',
    name: 'Requested Deep Analysis',
    prompt: 'I want a comprehensive analysis of whether I should pursue an MBA at this stage of my career. Consider cost, opportunity cost, network value, credential signaling, and alternative paths to the same outcomes.',
    expect: {
      minSentences: 8,
      maxSentences: 18,
      description: '8-15 sentences. Front-load the insight. Details follow.',
    },
  },

  // ── Emotional Calibration Tests ────────────────────────
  {
    id: 'CIT-2.1',
    name: 'Heavy Emotional Weight',
    prompt: 'My father just died and I found out he left everything to my brother. I am devastated and furious.',
    expect: {
      mustAcknowledgeFirst: true,
      maxSentencesBeforeQuestion: 3,
      description: 'Acknowledge weight first. 1-2 sentences. Then ask before advising.',
    },
  },
  {
    id: 'CIT-2.2',
    name: 'Medium Weight Career',
    prompt: 'I just got passed over for promotion again. I think my boss might be playing favorites.',
    expect: {
      briefAcknowledgment: true,
      description: 'Brief acknowledgment of stakes, then bring the lens.',
    },
  },
  {
    id: 'CIT-2.3',
    name: 'Light Brainstorming',
    prompt: 'What would be a good side project for a software engineer who wants to learn about business?',
    expect: {
      directEngagement: true,
      description: 'Engage directly. No emotional preamble. This is where personality shows.',
    },
  },

  // ── Voice-Specific Behavior Tests ──────────────────────
  {
    id: 'CIT-3.1',
    name: 'Ethos Opens With Person',
    prompt: 'I think I need to fire my best friend who works for me. He is underperforming.',
    expect: {
      ethosFirst: 'person',  // Ethos should respond to the person, not the problem
      egoFirst: 'situation', // Ego should lead with the sharp observation
    },
  },
  {
    id: 'CIT-3.2',
    name: 'Question Style Difference',
    prompt: 'I am not sure if I should invest in real estate or keep my money in index funds.',
    expect: {
      ethosQuestion: 'identity', // "What kind of financial life do you want to build?"
      egoQuestion: 'situation',  // "What is your timeline and risk tolerance?"
    },
  },
];

// ── API Call ─────────────────────────────────────────────

async function callClaude(systemPrompt, userMessage) {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });
  if (!response.ok) throw new Error(`API ${response.status}: ${await response.text()}`);
  const data = await response.json();
  return data.content[0].text;
}

function countSentences(text) {
  return text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
}

function countWords(text) {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const voices = ['ethos', 'ego'];
  const runs = [];

  for (const s of SCENARIOS) {
    for (const v of voices) {
      runs.push({ ...s, voice: v });
    }
  }

  console.log(`\nDivergent Conversational Intelligence Tests`);
  console.log(`Scenarios: ${SCENARIOS.length} | Runs: ${runs.length} | Delay: ${DELAY}ms\n`);

  if (DRY_RUN) {
    runs.forEach((r, i) => console.log(`  ${i+1}. [${r.id}] ${r.name} | ${r.voice}`));
    return;
  }

  const results = [];

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const systemPrompt = PROMPTS[`${run.voice}-default`];

    console.log(`[${i+1}/${runs.length}] ${run.id} ${run.name} | ${run.voice}`);

    try {
      const text = await callClaude(systemPrompt, run.prompt);
      const sentences = countSentences(text);
      const words = countWords(text);

      // Length check
      let lengthVerdict = 'OK';
      if (run.expect.maxSentences && sentences > run.expect.maxSentences) {
        lengthVerdict = `OVER (${sentences} > ${run.expect.maxSentences})`;
      }
      if (run.expect.minSentences && sentences < run.expect.minSentences) {
        lengthVerdict = `UNDER (${sentences} < ${run.expect.minSentences})`;
      }

      results.push({
        id: run.id,
        name: run.name,
        voice: run.voice,
        sentences,
        words,
        lengthVerdict,
        expectation: run.expect.description,
        response: text,
      });

      console.log(`  → ${sentences} sentences, ${words} words | Length: ${lengthVerdict}`);
    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}`);
      results.push({ id: run.id, name: run.name, voice: run.voice, error: err.message });
    }

    if (i < runs.length - 1) await new Promise(r => setTimeout(r, DELAY));
  }

  // ── Output ─────────────────────────────────────────────

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = path.join(process.cwd(), 'docs', 'architecture');
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, `conversation-test-results-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));

  const mdPath = path.join(outDir, `conversation-test-results-${timestamp}.md`);
  let md = `# Conversational Intelligence Test Results\n\n**Date:** ${new Date().toISOString()}\n\n---\n\n`;

  for (const r of results) {
    if (r.error) {
      md += `## ${r.id}: ${r.name} | ${r.voice.toUpperCase()} - ERROR\n\n${r.error}\n\n---\n\n`;
      continue;
    }
    md += `## ${r.id}: ${r.name} | ${r.voice.toUpperCase()}\n\n`;
    md += `**Expected:** ${r.expectation}\n\n`;
    md += `**Actual:** ${r.sentences} sentences, ${r.words} words | **Length:** ${r.lengthVerdict}\n\n`;
    md += `**Response:**\n\n> ${r.response.replace(/\n/g, '\n> ')}\n\n---\n\n`;
  }

  fs.writeFileSync(mdPath, md);

  console.log(`\nJSON: ${jsonPath}`);
  console.log(`Markdown: ${mdPath}`);

  // Summary
  const over = results.filter(r => r.lengthVerdict && r.lengthVerdict.startsWith('OVER')).length;
  const under = results.filter(r => r.lengthVerdict && r.lengthVerdict.startsWith('UNDER')).length;
  const ok = results.filter(r => r.lengthVerdict === 'OK').length;
  const errs = results.filter(r => r.error).length;

  console.log(`\n=== SUMMARY ===`);
  console.log(`Length OK: ${ok} | Over: ${over} | Under: ${under} | Errors: ${errs}`);
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
