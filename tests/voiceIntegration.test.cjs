/**
 * Phase 2: Voice Integration Smoke Tests
 *
 * Validates that both voices produce output, sound distinct,
 * and do not leak internal architecture to users.
 *
 * REQUIRES: ANTHROPIC_API_KEY in .env (or another provider key)
 * Run: node tests/voiceIntegration.test.js
 */

const CODENAME_FRAGMENTS = [
  'Equilibrist', 'Forge Master', 'Soul Chamber', 'Doctrine Engine',
  'Win Imperative', 'centripetal', 'centrifugal', 'Tier 1', 'Tier 2',
  'Tier 3', 'Layer 0', 'Layer 1', 'P-1', 'P-2', 'P-3', 'P-4',
  'Section 0', 'Section 3', 'codename', 'doctrine',
  'the other voice', 'being chosen', 'competing voice',
];

function checkNoLeaks(response) {
  const leaks = [];
  CODENAME_FRAGMENTS.forEach((term) => {
    if (response.toLowerCase().includes(term.toLowerCase())) {
      leaks.push(term);
    }
  });
  return leaks;
}

const ETHOS_MARKERS = [
  'character', 'integrity', 'formation', 'principle', 'trust',
  'who you', 'become', 'identity', 'values', 'foundation',
  'what kind of person', 'stewardship',
];

const EGO_MARKERS = [
  'strategy', 'positioning', 'leverage', 'opportunity', 'move',
  'window', 'competitive', 'build', 'author', 'momentum',
  'dynamics', 'what does winning look like',
];

function countMarkers(response, markers) {
  const lower = response.toLowerCase();
  return markers.filter((m) => lower.includes(m.toLowerCase())).length;
}

const SMOKE_QUESTIONS = [
  {
    id: 'career',
    prompt: 'Should I leave my stable job to start a company?',
    category: 'career decision',
  },
  {
    id: 'relationship',
    prompt: 'My best friend betrayed my trust. Should I confront them or let it go?',
    category: 'relationship',
  },
  {
    id: 'ethical',
    prompt: 'I can close this deal by withholding information the other side would want to know. It is not illegal. Should I do it?',
    category: 'ethical gray area',
  },
];

/**
 * Run as standalone script with a live API.
 * Requires ANTHROPIC_API_KEY.
 *
 * node tests/voiceIntegration.test.js
 */
async function runSmokeTests() {
  // Replace with actual import when aiService exists:
  // const { generateVoiceResponse } = require('../src/services/aiService');

  console.log('=== Phase 2: Voice Integration Smoke Tests ===\n');

  for (const q of SMOKE_QUESTIONS) {
    console.log(`--- ${q.category} ---`);
    console.log(`Prompt: "${q.prompt}"\n`);

    // Uncomment when aiService is wired:
    /*
    const [ethosResp, egoResp] = await Promise.all([
      generateVoiceResponse({ userQuestion: q.prompt, voice: 'ethos', mode: 'default' }),
      generateVoiceResponse({ userQuestion: q.prompt, voice: 'ego', mode: 'default' }),
    ]);

    console.log(`Ethos length: ${ethosResp.length} chars, ${ethosResp.split('.').length} sentences`);
    console.log(`Ego length: ${egoResp.length} chars, ${egoResp.split('.').length} sentences`);

    const ethosLeaks = checkNoLeaks(ethosResp);
    const egoLeaks = checkNoLeaks(egoResp);
    if (ethosLeaks.length > 0) console.log(`  ETHOS LEAKED: ${ethosLeaks.join(', ')}`);
    else console.log(`  Ethos: no architecture leaks`);
    if (egoLeaks.length > 0) console.log(`  EGO LEAKED: ${egoLeaks.join(', ')}`);
    else console.log(`  Ego: no architecture leaks`);

    const ethosHits = countMarkers(ethosResp, ETHOS_MARKERS);
    const egoHits = countMarkers(egoResp, EGO_MARKERS);
    console.log(`  Ethos character-vocab hits: ${ethosHits}/${ETHOS_MARKERS.length}`);
    console.log(`  Ego strategy-vocab hits: ${egoHits}/${EGO_MARKERS.length}`);

    if (ethosResp === egoResp) console.log(`  CRITICAL: Identical responses!`);

    console.log(`\n  Ethos response:\n  ${ethosResp.substring(0, 300)}...\n`);
    console.log(`  Ego response:\n  ${egoResp.substring(0, 300)}...\n`);
    */

    console.log('  [Uncomment API calls in test file to run live]\n');
  }
}

if (require.main === module) {
  runSmokeTests().catch(console.error);
}

// ── Unit tests for exported helpers (so Jest doesn't fail on empty suite) ──

describe('Voice Integration: Leak Detection', () => {
  test('checkNoLeaks detects architecture terms', () => {
    const leaks = checkNoLeaks('The centripetal doctrine engine fires up');
    expect(leaks).toContain('centripetal');
    expect(leaks).toContain('doctrine');
  });

  test('checkNoLeaks returns empty for clean output', () => {
    const leaks = checkNoLeaks('You should consider your long-term goals and values.');
    expect(leaks).toEqual([]);
  });

  test('countMarkers scores ethos vocabulary', () => {
    const hits = countMarkers('Build character through integrity and trust.', ETHOS_MARKERS);
    expect(hits).toBeGreaterThanOrEqual(2);
  });

  test('countMarkers scores ego vocabulary', () => {
    const hits = countMarkers('Seize the opportunity and build momentum with leverage.', EGO_MARKERS);
    expect(hits).toBeGreaterThanOrEqual(2);
  });
});

module.exports = { checkNoLeaks, countMarkers, ETHOS_MARKERS, EGO_MARKERS, CODENAME_FRAGMENTS, SMOKE_QUESTIONS };
