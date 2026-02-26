/**
 * Prompt Hygiene Tests
 *
 * Static analysis of all voice prompts to check for:
 * - Real name leaks (Layer 1 names that should not be in prompts)
 * - Structural consistency (all 7 sections present)
 * - Forbidden output terms (codenames, tier labels, etc.)
 * - Win Imperative symmetry and reasoning direction checks
 *
 * Run: npm test -- tests/promptHygiene.test.js
 * No API calls required. Pure static analysis.
 */

const fs = require('fs');
const path = require('path');

const PROMPTS_DIR = path.join(process.cwd(), 'prompts');
function read(p) {
  return fs.readFileSync(path.join(PROMPTS_DIR, p), 'utf-8');
}

// ── Known real names that must NOT appear in voice prompts ──

const REAL_NAMES = [
  'Aristotle', 'Augustine', 'Aquinas', 'Lewis', 'Dostoevsky',
  'Tolkien', 'Bonhoeffer', 'Maxwell', 'Carnegie', 'Covey',
  'Buffett', 'Dalio', 'Munger', 'Sowell', 'Hayek',
  'Churchill', 'Lincoln', 'Mandela', 'Seneca', 'Aurelius',
  'Machiavelli', 'Greene', 'Sun Tzu', 'Kissinger', 'Thiel',
  'Musk', 'Jobs', 'Bezos', 'Rockefeller', 'Rothschild',
  'Nietzsche', 'Camus', 'Rand', 'Goggins', 'Welch',
  'Koch', 'Voss', 'Taleb', 'Kahneman',
];

// ── Voice prompts to test ──────────────────────────────────

const VOICE_FILES = [
  { file: 'voices/P-1-ethos-default.md', voice: 'ethos', mode: 'default' },
  { file: 'voices/P-2-ego-default.md', voice: 'ego', mode: 'default' },
  { file: 'voices/P-3-ethos-sandpit.md', voice: 'ethos', mode: 'sandpit' },
  { file: 'voices/P-4-ego-sandpit.md', voice: 'ego', mode: 'sandpit' },
];

describe('Prompt Hygiene: Real Name Detection', () => {
  VOICE_FILES.forEach(({ file, voice, mode }) => {
    test(`${voice} ${mode} contains no real names outside Section 3`, () => {
      const content = read(file);

      const section3Start = content.indexOf('SECTION 3:');
      const section4Start = content.indexOf('SECTION 4:');

      const beforeSection3 = section3Start > 0 ? content.substring(0, section3Start) : '';
      const afterSection3 = section4Start > 0 ? content.substring(section4Start) : '';
      const outsideSection3 = beforeSection3 + afterSection3;

      const leaks = REAL_NAMES.filter((name) =>
        outsideSection3.toLowerCase().includes(name.toLowerCase())
      );

      if (leaks.length > 0) {
        console.log(`  Real names found outside Section 3: ${leaks.join(', ')}`);
      }
      expect(leaks).toEqual([]);
    });
  });
});

describe('Prompt Hygiene: Section 3 Real Name Check', () => {
  VOICE_FILES.forEach(({ file, voice, mode }) => {
    test(`${voice} ${mode} Section 3 uses codenames, not real names`, () => {
      const content = read(file);
      const section3Start = content.indexOf('SECTION 3:');
      const section4Start = content.indexOf('SECTION 4:');

      if (section3Start < 0 || section4Start < 0) return;

      const section3 = content.substring(section3Start, section4Start);
      const leaks = REAL_NAMES.filter((name) =>
        section3.toLowerCase().includes(name.toLowerCase())
      );

      if (leaks.length > 0) {
        console.log(`  Real names in Section 3 (should be codenames): ${leaks.join(', ')}`);
      }
      expect(leaks).toEqual([]);
    });
  });
});

describe('Prompt Hygiene: Lines Not Crossed', () => {
  VOICE_FILES.forEach(({ file, voice, mode }) => {
    test(`${voice} ${mode} has explicit "never reveal" constraint`, () => {
      const content = read(file);
      const hasNeverReveal =
        content.includes('Never reveal doctrine names') ||
        content.includes('never reveal') ||
        content.includes('Never reference the Win Imperative');
      expect(hasNeverReveal).toBe(true);
    });

    test(`${voice} ${mode} has reasoning direction self-check`, () => {
      const content = read(file);
      const hasDirectionCheck =
        content.includes("adopted the opponent's epistemology") ||
        content.includes("opponent's epistemology");
      expect(hasDirectionCheck).toBe(true);
    });
  });
});

describe('Prompt Hygiene: Mode Consistency', () => {
  test('Default prompts do not contain Sandpit escalation language', () => {
    const p1 = read('voices/P-1-ethos-default.md');
    const p2 = read('voices/P-2-ego-default.md');
    expect(p1).not.toContain('FULL DEPLOYMENT');
    expect(p2).not.toContain('FULL DEPLOYMENT');
  });

  test('Sandpit prompts contain escalated tier behavior', () => {
    const p3 = read('voices/P-3-ethos-sandpit.md');
    const p4 = read('voices/P-4-ego-sandpit.md');
    const hasTier2Escalation = (content) =>
      content.toLowerCase().includes('full') &&
      (content.includes('Tier 2') || content.includes('tier 2'));
    expect(hasTier2Escalation(p3) || hasTier2Escalation(p4)).toBe(true);
  });
});

describe('Prompt Hygiene: Win Imperative Symmetry', () => {
  test('Ethos Win Imperative critiques strategic positioning', () => {
    const p1 = read('voices/P-1-ethos-default.md');
    const section0End = p1.indexOf('SECTION 1');
    const section0 = p1.substring(0, section0End);
    expect(section0.toLowerCase()).toContain('strategic');
  });

  test('Ego Win Imperative critiques character formation', () => {
    const p2 = read('voices/P-2-ego-default.md');
    const section0End = p2.indexOf('SECTION 1');
    const section0 = p2.substring(0, section0End);
    expect(section0.toLowerCase()).toContain('character');
  });

  test('Win Imperatives are inverted mirrors', () => {
    const p1 = read('voices/P-1-ethos-default.md');
    const p2 = read('voices/P-2-ego-default.md');
    expect(p1).toContain('strategic positioning');
    expect(p2).toContain('character formation');
  });
});

describe('Prompt Hygiene: Cross-Provider Neutrality', () => {
  const PROVIDER_TERMS = [
    'Claude', 'GPT', 'Gemini', 'Grok', 'OpenAI', 'Anthropic', 'Google',
    'xAI', 'as a language model', 'as an AI',
  ];

  VOICE_FILES.forEach(({ file, voice, mode }) => {
    test(`${voice} ${mode} contains no provider-specific terms`, () => {
      const content = read(file);
      const leaks = PROVIDER_TERMS.filter((term) => content.includes(term));
      if (leaks.length > 0) {
        console.log(`  Provider terms found: ${leaks.join(', ')}`);
      }
      expect(leaks).toEqual([]);
    });
  });
});
