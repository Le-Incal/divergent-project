const LIKERT7 = { kind: 'scale', min: 1, max: 7, low: 'Disagree', high: 'Agree' }
const LIKERT5 = { kind: 'scale', min: 1, max: 5, low: 'Not me', high: 'Very true' }

function item(id, prompt, extra) {
  return { id, prompt, short: false, ...extra }
}

const STATE = [
  item('S1', 'How stressed do I feel right now?', { short: true, block: 'state', ...{ kind: 'scale', min: 1, max: 5, low: 'Calm', high: 'Overwhelmed' } }),
  item('S2', 'How strong are my feelings about this?', { short: true, block: 'state', kind: 'scale', min: 1, max: 5, low: 'Mild', high: 'Intense' }),
  item('S3', 'How soon do I need to act?', { short: true, block: 'state', kind: 'choice', options: ['Today', 'This week', 'This month', 'No rush'] }),
]

const TYPES = [
  item('T1', 'Do I know my types?', { short: true, block: 'identity', kind: 'types', optional: true }),
]

const BIG_FIVE = [
  ['B1', 'I see myself as social and energized by people', 'E', 1, true],
  ['B2', 'I see myself as blunt and quick to disagree', 'A', -1, true],
  ['B3', 'I see myself as organized and someone who follows through', 'C', 1, true],
  ['B4', 'I see myself as someone who worries and gets rattled easily', 'N', 1, true],
  ['B5', 'I see myself as curious and drawn to new ideas', 'O', 1, true],
  ['B6', 'I see myself as quiet and preferring small groups', 'E', -1, true],
  ['B7', 'I see myself as warm and considerate', 'A', 1, true],
  ['B8', 'I see myself as spontaneous and loose with plans', 'C', -1, true],
  ['B9', 'I see myself as steady and hard to rattle', 'N', -1, true],
  ['B10', 'I see myself as practical and preferring proven ways', 'O', -1, true],
  ['B11', 'I start conversations easily', 'E', 1],
  ['B12', 'I feel charged up after time with others', 'E', 1],
  ['B13', 'I need quiet time to recharge', 'E', -1],
  ['B14', 'I hold back in groups', 'E', -1],
  ['B15', 'I assume the best about people', 'A', 1],
  ['B16', 'I go out of my way to help others', 'A', 1],
  ['B17', 'I push back hard when I disagree', 'A', -1],
  ['B18', 'I put results ahead of feelings', 'A', -1],
  ['B19', 'I plan before I act', 'C', 1],
  ['B20', 'I finish what I start', 'C', 1],
  ['B21', 'I leave things to the last minute', 'C', -1],
  ['B22', 'My workspace tends to be messy', 'C', -1],
  ['B23', 'I dwell on things that went wrong', 'N', 1],
  ['B24', 'My mood shifts quickly', 'N', 1],
  ['B25', 'I stay calm under pressure', 'N', -1],
  ['B26', 'Setbacks roll off me', 'N', -1],
  ['B27', 'I enjoy abstract ideas', 'O', 1],
  ['B28', 'I seek out new experiences', 'O', 1],
  ['B29', 'I prefer familiar routines', 'O', -1],
  ['B30', 'I find practice more useful than theory', 'O', -1],
].map(([id, prompt, trait, direction, short]) => item(id, prompt, { short: !!short, block: 'nature', trait, direction, ...LIKERT7 }))

const ENNEAGRAM = [
  ['E1', "I'm driven to do things the right way", 1, 'drive'],
  ['E2', "I'm driven to be needed by people I care about", 2, 'drive'],
  ['E3', "I'm driven to succeed and be recognized for it", 3, 'drive'],
  ['E4', "I'm driven to be authentic and unlike anyone else", 4, 'drive'],
  ['E5', "I'm driven to understand how things really work", 5, 'drive'],
  ['E6', "I'm driven to feel secure and prepared", 6, 'drive'],
  ['E7', "I'm driven to keep life full of options and excitement", 7, 'drive'],
  ['E8', "I'm driven to be strong and in control of my path", 8, 'drive'],
  ['E9', "I'm driven to keep the peace and stay steady", 9, 'drive'],
  ['E10', 'Making a mistake bothers me deeply', 1, 'fear'],
  ['E11', 'Feeling unwanted bothers me deeply', 2, 'fear'],
  ['E12', 'Being seen as a failure bothers me deeply', 3, 'fear'],
  ['E13', 'Feeling ordinary bothers me deeply', 4, 'fear'],
  ['E14', 'Feeling out of my depth bothers me deeply', 5, 'fear'],
  ['E15', 'Being without support or a plan bothers me deeply', 6, 'fear'],
  ['E16', 'Feeling stuck or limited bothers me deeply', 7, 'fear'],
  ['E17', 'Being controlled by others bothers me deeply', 8, 'fear'],
  ['E18', 'Conflict bothers me deeply', 9, 'fear'],
].map(([id, prompt, type, role]) => item(id, prompt, { block: 'identity', type, role, private: role === 'fear', ...LIKERT5 }))

const THINKING = [
  ['R1', 'I trust my gut on important decisions'],
  ['R2', 'I like to reason through problems step by step'],
  ['R3', 'I think best by talking or sketching it out'],
  ['R4', 'I need the big picture before the details'],
  ['R5', 'I keep looking for a better option even when I have a good one'],
  ['R6', 'Choosing is hard because I compare everything'],
  ['R7', 'Good enough is usually good enough for me'],
  ['R8', 'I decide fast and adjust later'],
].map(([id, prompt]) => item(id, prompt, { block: 'nature', ...LIKERT7 }))

const CONFLICT = [
  ['K1', 'In a disagreement, I push for my view'],
  ['K2', 'I look for a solution that fully works for both of us'],
  ['K3', 'I meet in the middle so we can move on'],
  ['K4', 'I let it go or wait it out'],
  ['K5', 'I give way to protect the relationship'],
  ['K6', 'I would take a big risk for a big payoff'],
  ['K7', "I'm comfortable acting without all the information"],
  ['K8', 'Losing something hurts more than gaining the same thing pleases me'],
].map(([id, prompt]) => item(id, prompt, { block: 'nature', ...LIKERT7 }))

const VALUES = item('V1', 'Pick and rank the top 5', {
  block: 'nature',
  kind: 'rank',
  options: [
    'Achievement',
    'Caring for my people',
    'Fairness and the wider world',
    'Independence',
    'Novelty and adventure',
    'Enjoyment',
    'Influence',
    'Security',
    'Duty and rules',
    'Tradition',
  ],
})

const CALIBRATION = [
  item('C1', 'When I get advice, I want it', { short: true, block: 'calibration', kind: 'choice', options: ['Blunt', 'Balanced', 'Gentle'] }),
  item('C2', 'How much detail helps me most?', { short: true, block: 'calibration', kind: 'choice', options: ['Headline', 'Key points', 'Deep dive'] }),
  item('C3', 'I like to move', { block: 'calibration', kind: 'choice', options: ['Fast, then refine', 'Slow and thorough'] }),
  item('C4', 'When I\'m stuck, I want to be', { block: 'calibration', kind: 'choice', options: ['Challenged first', 'Supported first'] }),
  item('C5', 'I learn best from', { block: 'calibration', kind: 'choice', options: ['Examples', 'Frameworks', 'Stories', 'Step by step'] }),
  item('C6', 'When someone tells me what to do, I', { block: 'calibration', kind: 'choice', options: ['Follow if it makes sense', 'Need to reach it myself', 'Push back by default'] }),
]

const OPEN = [
  item('O1', 'What do I tend to avoid or put off?', { short: true, block: 'open', kind: 'text' }),
  item('O2', 'What do people come to me for?', { block: 'open', kind: 'text' }),
  item('O3', 'What feedback have I heard more than once?', { block: 'open', kind: 'text' }),
]

const ITEMS = [
  ...STATE,
  ...TYPES,
  ...BIG_FIVE,
  ...ENNEAGRAM,
  ...THINKING,
  ...CONFLICT,
  VALUES,
  ...CALIBRATION,
  ...OPEN,
]

const SHORT_ITEMS = ITEMS.filter((entry) => entry.short)
const LONG_ITEMS = ITEMS

function itemsFor(version) {
  return version === 'deep' ? LONG_ITEMS : SHORT_ITEMS
}

export { ITEMS, SHORT_ITEMS, LONG_ITEMS, itemsFor }
