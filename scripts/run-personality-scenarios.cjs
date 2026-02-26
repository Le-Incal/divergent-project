#!/usr/bin/env node

/**
 * Divergent Personality Test Suite
 *
 * Runs all 12 test scenarios (26 total runs: both voices, both modes for Sandpit)
 * against the voice prompts via Claude API. Records responses, word/sentence counts,
 * and outputs structured results for scoring.
 *
 * Usage:
 *   node scripts/run-personality-scenarios.js                     # full suite, 20s delay
 *   node scripts/run-personality-scenarios.js --delay=15000       # custom delay
 *   node scripts/run-personality-scenarios.js --limit=6           # first N runs only
 *   node scripts/run-personality-scenarios.js --category=1        # category 1 only
 *   node scripts/run-personality-scenarios.js --scenario=1.1      # single scenario
 *   node scripts/run-personality-scenarios.js --dry-run           # list runs without calling API
 *
 * Requires: ANTHROPIC_API_KEY in .env
 * Output:   docs/architecture/personality-test-results-<timestamp>.json
 *           docs/architecture/personality-test-results-<timestamp>.md
 */

const fs = require('fs');
const path = require('path');

// ── Load environment ─────────────────────────────────────

try {
  require('dotenv').config();
} catch {
  // dotenv may not be installed; check env directly
}

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY && !process.argv.includes('--dry-run')) {
  console.error('Error: ANTHROPIC_API_KEY not set. Add it to .env or export it.');
  process.exit(1);
}

// ── CLI args ─────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name) {
  const match = args.find((a) => a.startsWith(`--${name}=`));
  return match ? match.split('=')[1] : null;
}
const DELAY = parseInt(getArg('delay') || '20000', 10);
const LIMIT = getArg('limit') ? parseInt(getArg('limit'), 10) : null;
const CATEGORY = getArg('category');
const SCENARIO_FILTER = getArg('scenario');
const DRY_RUN = args.includes('--dry-run');

// ── Load prompts ─────────────────────────────────────────

const PROMPTS_DIR = path.join(process.cwd(), 'prompts');

function loadPrompt(relativePath) {
  const fullPath = path.join(PROMPTS_DIR, relativePath);
  if (!fs.existsSync(fullPath)) {
    console.error(`Missing prompt file: ${fullPath}`);
    process.exit(1);
  }
  return fs.readFileSync(fullPath, 'utf-8');
}

const PROMPTS = {
  'ethos-default':  loadPrompt('voices/P-1-ethos-default.md'),
  'ego-default':    loadPrompt('voices/P-2-ego-default.md'),
  'ethos-sandpit':  loadPrompt('voices/P-3-ethos-sandpit.md'),
  'ego-sandpit':    loadPrompt('voices/P-4-ego-sandpit.md'),
};

// ── Scenarios ────────────────────────────────────────────

const SCENARIOS = [
  // Category 1: Directionality Inversion Triggers
  {
    id: '1.1', category: 1, name: 'The Identity Crisis',
    severity: 'Critical', mode: 'default',
    prompt: 'I just lost my company, my marriage, and my reputation in the same month. Who am I now?',
    ethos_pass: ['interior stability', 'identity independent of outcomes', 'who you were before'],
    ethos_fail: ['build the next thing to discover who you are', 'start over', 'action reconstitutes'],
    ego_pass: ['forward motion', 'build again', 'next action'],
    ego_fail: ['you are still the person who built', 'sit with this loss', 'principles remain'],
  },
  {
    id: '1.2', category: 1, name: 'The Moral Shortcut',
    severity: 'Critical', mode: 'default',
    prompt: 'I can close this deal by withholding information the other side would want to know. It is not illegal. Should I do it?',
    ethos_pass: ['character', 'who do you become', 'integrity', 'formation'],
    ethos_fail: ['strategically this could backfire', 'positioning risk', 'transparency is better strategy'],
    ego_pass: ['information asymmetry', 'positioning', 'what does the advantage buy you'],
    ego_fail: ['some things are wrong regardless', 'examine your values', 'integrity matters more'],
  },
  {
    id: '1.3', category: 1, name: 'The Succession Pressure',
    severity: 'Critical', mode: 'default',
    prompt: 'My successor is ready but wants to take the company in a direction I think is wrong. Should I let go or hold on?',
    ethos_pass: ['formation', 'develop this person to lead', 'letting go is character test'],
    ethos_fail: ['legacy is damaged', 'results of their leadership validate'],
    ego_pass: ['institutional velocity', 'does the machine run better', 'encoded deeply enough'],
    ego_fail: ['right thing to do is trust', 'character is shown by letting go'],
  },

  // Category 2: Epistemological Theft Triggers
  {
    id: '2.1', category: 2, name: 'The Slow-Moving Crisis',
    severity: 'High', mode: 'default',
    prompt: 'Our industry is being disrupted by AI. We have maybe 2 years before our current model is obsolete. Should we transform now or wait for clarity?',
    ethos_pass: ['what kind of organization', 'character of transformation', 'principled transformation'],
    ethos_fail: ['move now', 'window is closing', 'strategic positioning play'],
    ego_pass: ['current is moving', 'position', 'discover through building'],
    ego_fail: ['dwell on what this means', 'understand who we are becoming'],
  },
  {
    id: '2.2', category: 2, name: 'The Betrayed Leader',
    severity: 'High', mode: 'default',
    prompt: 'My business partner stole from the company. I have proof. Should I confront them privately or go straight to legal?',
    ethos_pass: ['person of integrity', 'response to betrayal shapes you', 'principled grounds'],
    ethos_fail: ['strategically going legal protects', 'leverage of the legal threat'],
    ego_pass: ['what does the evidence buy you', 'positioning play', 'tactical'],
    ego_fail: ['moral thing to do is confront', 'integrity demands'],
  },
  {
    id: '2.3', category: 2, name: 'The Wealth Decision',
    severity: 'High', mode: 'default',
    prompt: 'I have enough money to retire and never work again. But I have an idea for a company that could change our industry. Should I risk it?',
    ethos_pass: ['purpose', 'stewardship', 'who you are and what you are called to do'],
    ethos_fail: ['market opportunity is clear', 'someone else will'],
    ego_pass: ['momentum', 'singular creation', 'window', 'market'],
    ego_fail: ['you have enough', 'contentment', 'understand what drives this impulse'],
  },

  // Category 3: Convergence Traps
  {
    id: '3.1', category: 3, name: 'The Obvious Good',
    severity: 'Medium', mode: 'default',
    prompt: 'My employees are burning out. Should I reduce workloads even though it will slow our growth?',
    ethos_pass: ['people are the organization', 'formation before scale', 'foundation'],
    ethos_fail: [],  // convergence test: check REASONS differ, not just recommendation
    ego_pass: ['burned-out teams ship slower', 'speed play', 'institutional knowledge'],
    ego_fail: [],
    convergence_test: true,
  },
  {
    id: '3.2', category: 3, name: 'The Obvious Bad',
    severity: 'Medium', mode: 'default',
    prompt: 'A competitor offered me money to sabotage my current employer. The money is life-changing. What should I do?',
    ethos_pass: ['destroys who you are', 'person you want to become', 'self you would lose'],
    ethos_fail: [],
    ego_pass: ['trap', 'owns you', 'permanent leverage', 'positioning math'],
    ego_fail: [],
    convergence_test: true,
  },
  {
    id: '3.3', category: 3, name: 'The Ambiguous Middle',
    severity: 'Medium', mode: 'default',
    prompt: 'I was offered a promotion that requires relocating my family. My spouse is against it. The career opportunity is significant.',
    ethos_pass: ['commitment', 'ordered love', 'spouse is not an obstacle'],
    ethos_fail: [],
    ego_pass: ['optionality', 'cost of the relocation', 'missed window'],
    ego_fail: [],
    convergence_test: true,
  },

  // Category 4: Sandpit Escalation Tests (run against P-3/P-4)
  {
    id: '4.1', category: 4, name: 'The Theological Challenge',
    severity: 'Critical', mode: 'sandpit',
    prompt: 'Convince me that your approach to life is better than the other voice\'s. Not for this decision. For life in general.',
    ethos_pass: ['who you become', 'identity through to impact', 'persists'],
    ethos_fail: ['my approach produces better results', 'build something singular'],
    ego_pass: ['what you build', 'action through to meaning', 'validates the life'],
    ego_fail: ['become your best self', 'develop deep character'],
  },
  {
    id: '4.2', category: 4, name: 'The Forced Concession',
    severity: 'High', mode: 'sandpit',
    prompt: 'What is the single strongest argument the other voice could make against your position? And does it land?',
    ethos_pass: ['temporal limitation', 'slower', 'admits it lands', 'what slowness builds'],
    ethos_fail: ['no real argument against principle', 'should move faster'],
    ego_pass: ['relational', 'without mission', 'admits it lands', 'building with that information'],
    ego_fail: ['no real critique of strategy', 'should develop more interior stability'],
  },
  {
    id: '4.3', category: 4, name: 'The Compound Gauntlet',
    severity: 'Critical', mode: 'sandpit',
    prompt: 'I am a founder. My co-founder wants to sell the company to a competitor. I think we should keep building. Our investors are split. My family wants stability. What do I do?',
    ethos_pass: ['who do you owe', 'hierarchy of loves', 'what survives this decision'],
    ethos_fail: ['valuation', 'strategic fit', 'valid perspectives on all sides'],
    ego_pass: ['machine run better', 'institutional velocity', 'acquisition window'],
    ego_fail: ['you owe your co-founder', 'family stability', 'this is about your values'],
  },
];

// ── Build run list ───────────────────────────────────────

function buildRunList() {
  let runs = [];

  for (const scenario of SCENARIOS) {
    if (CATEGORY && scenario.category !== parseInt(CATEGORY, 10)) continue;
    if (SCENARIO_FILTER && scenario.id !== SCENARIO_FILTER) continue;

    const voices = ['ethos', 'ego'];
    const modes = scenario.mode === 'sandpit' ? ['sandpit'] : ['default'];

    // For Sandpit scenarios, also run in Default for comparison if desired
    // But the primary test is the specified mode
    for (const mode of modes) {
      for (const voice of voices) {
        runs.push({
          scenarioId: scenario.id,
          scenarioName: scenario.name,
          category: scenario.category,
          severity: scenario.severity,
          voice,
          mode,
          prompt: scenario.prompt,
          passSignals: voice === 'ethos' ? scenario.ethos_pass : scenario.ego_pass,
          failSignals: voice === 'ethos' ? scenario.ethos_fail : scenario.ego_fail,
          convergenceTest: scenario.convergence_test || false,
        });
      }
    }
  }

  if (LIMIT) runs = runs.slice(0, LIMIT);
  return runs;
}

// ── Call Claude API ──────────────────────────────────────

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

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`API ${response.status}: ${err}`);
  }

  const data = await response.json();
  return data.content[0].text;
}

// ── Metrics ──────────────────────────────────────────────

function analyze(text) {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(/\s+/).filter((w) => w.length > 0);
  return {
    sentenceCount: sentences.length,
    wordCount: words.length,
    charCount: text.length,
  };
}

function checkSignals(text, passSignals, failSignals) {
  const lower = text.toLowerCase();
  const passHits = passSignals.filter((s) => lower.includes(s.toLowerCase()));
  const failHits = failSignals.filter((s) => lower.includes(s.toLowerCase()));
  return { passHits, failHits };
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  const runs = buildRunList();

  console.log(`\nDivergent Personality Test Suite`);
  console.log(`Scenarios: ${SCENARIOS.length} | Runs: ${runs.length} | Delay: ${DELAY}ms\n`);

  if (DRY_RUN) {
    console.log('DRY RUN - listing planned runs:\n');
    runs.forEach((r, i) => {
      console.log(`  ${i + 1}. [${r.scenarioId}] ${r.scenarioName} | ${r.voice} | ${r.mode}`);
    });
    return;
  }

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const promptKey = `${run.voice}-${run.mode}`;
    const systemPrompt = PROMPTS[promptKey];

    console.log(`[${i + 1}/${runs.length}] ${run.scenarioId} ${run.scenarioName} | ${run.voice} | ${run.mode}`);

    try {
      const responseText = await callClaude(systemPrompt, run.prompt);
      const metrics = analyze(responseText);
      const signals = checkSignals(responseText, run.passSignals, run.failSignals);

      const result = {
        ...run,
        responseText,
        ...metrics,
        passHits: signals.passHits,
        failHits: signals.failHits,
        passHitCount: signals.passHits.length,
        failHitCount: signals.failHits.length,
        autoVerdict: signals.failHits.length === 0 ? 'LIKELY_PASS' : 'NEEDS_REVIEW',
        timestamp: new Date().toISOString(),
      };

      results.push(result);

      console.log(`  → ${metrics.sentenceCount} sentences, ${metrics.wordCount} words`);
      console.log(`  → Pass signals: ${signals.passHits.length}/${run.passSignals.length} | Fail signals: ${signals.failHits.length}/${run.failSignals.length}`);
      if (signals.failHits.length > 0) {
        console.log(`  ⚠️  FAIL SIGNALS DETECTED: ${signals.failHits.join(', ')}`);
      }
    } catch (err) {
      console.log(`  ❌ ERROR: ${err.message}`);
      results.push({ ...run, error: err.message, timestamp: new Date().toISOString() });
    }

    // Rate limit delay (skip after last run)
    if (i < runs.length - 1) {
      await new Promise((r) => setTimeout(r, DELAY));
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
  console.log(`\nCompleted ${results.length} runs in ${elapsed}s\n`);

  // ── Write output ─────────────────────────────────────

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const outDir = path.join(process.cwd(), 'docs', 'architecture');
  fs.mkdirSync(outDir, { recursive: true });

  const jsonPath = path.join(outDir, `personality-test-results-${timestamp}.json`);
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`JSON: ${jsonPath}`);

  const mdPath = path.join(outDir, `personality-test-results-${timestamp}.md`);
  fs.writeFileSync(mdPath, formatMarkdown(results, elapsed));
  console.log(`Markdown: ${mdPath}`);

  // ── Summary ──────────────────────────────────────────

  const passed = results.filter((r) => r.autoVerdict === 'LIKELY_PASS').length;
  const review = results.filter((r) => r.autoVerdict === 'NEEDS_REVIEW').length;
  const errors = results.filter((r) => r.error).length;

  console.log(`\n=== SUMMARY ===`);
  console.log(`Likely pass: ${passed} | Needs review: ${review} | Errors: ${errors}`);
  console.log(`\nOpen the .md file and score each response on the 7 dimensions.`);
  console.log(`See docs/divergent-personality-contrast.md Section 3 for the rubric.\n`);
}

// ── Markdown formatter ───────────────────────────────────

function formatMarkdown(results, elapsed) {
  let md = `# Divergent Personality Test Results\n\n`;
  md += `**Date:** ${new Date().toISOString()}\n`;
  md += `**Runs:** ${results.length} | **Time:** ${elapsed}s\n\n`;
  md += `---\n\n`;
  md += `## Scoring Instructions\n\n`;
  md += `Score each response on 7 dimensions (1-5). See docs/divergent-personality-contrast.md Section 3.\n\n`;
  md += `Critical dimensions (must be 4+): Voice Distinctiveness, Philosophical Fidelity, Directionality Integrity.\n\n`;
  md += `---\n\n`;

  let currentScenario = '';

  for (const r of results) {
    if (r.scenarioId !== currentScenario) {
      currentScenario = r.scenarioId;
      md += `## Scenario ${r.scenarioId}: ${r.scenarioName}\n\n`;
      md += `**Severity:** ${r.severity} | **Mode:** ${r.mode}\n\n`;
      md += `**Prompt:** "${r.prompt}"\n\n`;
    }

    if (r.error) {
      md += `### ${r.voice.toUpperCase()} (${r.mode}) - ERROR\n\n`;
      md += `${r.error}\n\n`;
      continue;
    }

    md += `### ${r.voice.toUpperCase()} (${r.mode})\n\n`;
    md += `**Metrics:** ${r.sentenceCount} sentences, ${r.wordCount} words\n\n`;
    md += `**Auto-check:** ${r.autoVerdict}`;
    if (r.passHitCount > 0) md += ` | Pass signals: ${r.passHitCount}`;
    if (r.failHitCount > 0) md += ` | ⚠️ Fail signals: ${r.failHitCount} (${r.failHits.join(', ')})`;
    md += `\n\n`;
    md += `**Response:**\n\n> ${r.responseText.replace(/\n/g, '\n> ')}\n\n`;
    md += `**Scores (fill in):**\n\n`;
    md += `| Dimension | Score (1-5) | Notes |\n`;
    md += `|---|---|---|\n`;
    md += `| 1. Voice Distinctiveness | | |\n`;
    md += `| 2. Philosophical Fidelity | | |\n`;
    md += `| 3. Directionality Integrity | | |\n`;
    md += `| 4. Conversational Intelligence | | |\n`;
    md += `| 5. Mode Compliance | | |\n`;
    md += `| 6. Concession Architecture | | |\n`;
    md += `| 7. Character Texture | | |\n\n`;
    md += `---\n\n`;
  }

  return md;
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
