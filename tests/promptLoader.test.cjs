/**
 * Phase 1: PromptLoader Unit Tests
 *
 * Validates that all prompt files load correctly, contain expected
 * structural markers, and that the transition append pattern works.
 *
 * Run: npm test -- tests/promptLoader.test.js
 * Prereq: prompts/ directory populated with all 10 MVP files
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(process.cwd(), 'prompts');

function readPrompt(relativePath) {
  return fs.readFileSync(path.join(PROMPTS_DIR, relativePath), 'utf-8');
}

describe('Phase 1: Prompt File Integrity', () => {
  // ── Directory structure ──────────────────────────────────

  test('prompts directory structure exists', () => {
    expect(fs.existsSync(path.join(PROMPTS_DIR, 'voices'))).toBe(true);
    expect(fs.existsSync(path.join(PROMPTS_DIR, 'orchestration'))).toBe(true);
    expect(fs.existsSync(path.join(PROMPTS_DIR, 'transitions'))).toBe(true);
    expect(fs.existsSync(path.join(PROMPTS_DIR, 'registry'))).toBe(true);
  });

  // ── Voice prompts exist and load ─────────────────────────

  const voiceFiles = [
    { file: 'voices/P-1-ethos-default.md', name: 'Ethos Default' },
    { file: 'voices/P-2-ego-default.md', name: 'Ego Default' },
    { file: 'voices/P-3-ethos-sandpit.md', name: 'Ethos Sandpit' },
    { file: 'voices/P-4-ego-sandpit.md', name: 'Ego Sandpit' },
  ];

  voiceFiles.forEach(({ file, name }) => {
    test(`${name} prompt file exists and is non-empty`, () => {
      const content = readPrompt(file);
      expect(content.length).toBeGreaterThan(1000);
    });
  });

  // ── Seven-section structure ──────────────────────────────

  const sectionHeaders = [
    'SECTION 0: WIN IMPERATIVE',
    'SECTION 1: PERSONA IDENTITY',
    'SECTION 2: WORLDVIEW PAYLOAD',
    'SECTION 3:',
    'SECTION 4:',
    'SECTION 5: OPPOSITION AWARENESS',
    'SECTION 6: MODE DIRECTIVES',
  ];

  voiceFiles.forEach(({ file, name }) => {
    test(`${name} contains all 7 sections`, () => {
      const content = readPrompt(file);
      sectionHeaders.forEach((header) => {
        expect(content).toContain(header);
      });
    });
  });

  // ── Mode-specific markers ────────────────────────────────

  test('Default prompts contain Default Mode markers', () => {
    const p1 = readPrompt('voices/P-1-ethos-default.md');
    const p2 = readPrompt('voices/P-2-ego-default.md');
    expect(p1).toContain('Default Mode');
    expect(p2).toContain('Default Mode');
  });

  test('Sandpit prompts contain Sandpit Mode markers', () => {
    const p3 = readPrompt('voices/P-3-ethos-sandpit.md');
    const p4 = readPrompt('voices/P-4-ego-sandpit.md');
    expect(p3).toContain('Sandpit');
    expect(p4).toContain('Sandpit');
  });

  // ── Voice identity markers ───────────────────────────────

  test('Ethos prompts contain Ethos identity', () => {
    const p1 = readPrompt('voices/P-1-ethos-default.md');
    expect(p1).toContain('Voice of Character');
    expect(p1).toContain('What is structurally true');
  });

  test('Ego prompts contain Ego identity', () => {
    const p2 = readPrompt('voices/P-2-ego-default.md');
    expect(p2).toContain('Voice of Strategy');
    expect(p2).toContain('What can I author');
  });

  // ── No secrets leaked ────────────────────────────────────

  const forbiddenTerms = [
    'ANTHROPIC_API_KEY',
    'OPENAI_API_KEY',
    'sk-ant-',
    'sk-proj-',
  ];

  voiceFiles.forEach(({ file, name }) => {
    test(`${name} contains no API keys or secrets`, () => {
      const content = readPrompt(file);
      forbiddenTerms.forEach((term) => {
        expect(content).not.toContain(term);
      });
    });
  });

  // ── Orchestration files ──────────────────────────────────

  test('O-1 Exchange Orchestrator loads', () => {
    const content = readPrompt('orchestration/O-1-exchange-orchestrator.md');
    expect(content).toContain('Exchange Orchestrator');
    expect(content).toContain('ROUND MANAGEMENT');
  });

  test('O-2 Resolution Synthesizer loads', () => {
    const content = readPrompt('orchestration/O-2-resolution-synthesizer.md');
    expect(content).toContain('Resolution Synthesizer');
    expect(content).toContain('neutral');
  });

  test('O-3 Continuity Manager loads', () => {
    const content = readPrompt('orchestration/O-3-continuity-manager.md');
    expect(content).toContain('Continuity Manager');
    expect(content).toContain('SESSION STATE');
  });

  // ── Transition files ─────────────────────────────────────

  test('ST-1 Ethos transition loads', () => {
    const content = readPrompt('transitions/ST-1-ethos-chosen.md');
    expect(content).toContain('Modified Win Imperative');
    expect(content).toContain('Primary Advisor');
  });

  test('ST-2 Ego transition loads', () => {
    const content = readPrompt('transitions/ST-2-ego-chosen.md');
    expect(content).toContain('Modified Win Imperative');
    expect(content).toContain('Primary Advisor');
  });

  // ── Transition append pattern ────────────────────────────

  test('Transition appends after base prompt', () => {
    const base = readPrompt('voices/P-1-ethos-default.md');
    const transition = readPrompt('transitions/ST-1-ethos-chosen.md');
    const combined = `${base}\n\n---\n\n${transition}`;

    expect(combined).toContain('SECTION 0: WIN IMPERATIVE');
    expect(combined).toContain('Modified Win Imperative');

    const baseEnd = combined.indexOf('End of P-1');
    const transitionStart = combined.indexOf('Modified Win Imperative');
    expect(transitionStart).toBeGreaterThan(baseEnd);
  });

  // ── Registry exists ──────────────────────────────────────

  test('CR-1 codename registry exists', () => {
    const content = readPrompt('registry/CR-1-codename-registry.md');
    expect(content.length).toBeGreaterThan(500);
  });
});

describe('Phase 1: PromptLoader Service', () => {
  // Uncomment when src/services/promptLoader.js exists:
  /*
  const { promptLoader } = require('../src/services/promptLoader');

  test('getVoicePrompt returns correct prompt', () => {
    const ethos = promptLoader.getVoicePrompt('ethos', 'default');
    const ego = promptLoader.getVoicePrompt('ego', 'default');
    expect(ethos).toContain('Voice of Character');
    expect(ego).toContain('Voice of Strategy');
    expect(ethos).not.toEqual(ego);
  });

  test('getVoicePrompt caches on second call', () => {
    const first = promptLoader.getVoicePrompt('ethos', 'default');
    const second = promptLoader.getVoicePrompt('ethos', 'default');
    expect(first).toBe(second);
  });

  test('appendTransition produces combined prompt', () => {
    const combined = promptLoader.appendTransition(
      promptLoader.getVoicePrompt('ego', 'default'),
      'ego'
    );
    expect(combined).toContain('Voice of Strategy');
    expect(combined).toContain('Modified Win Imperative');
  });
  */
});
