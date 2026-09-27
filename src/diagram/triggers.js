import { grammarFor } from './registry.js'
import { structureHintsSchema } from './hints.js'

const EXPLICIT_CORE = new Set(['5 Whys', 'CBT ABC Model', 'Ladder of Inference'])

export const OFFER_COPY = {
  'ethos.core_radial': 'There\'s a lot on the surface here. Want to see it laid out, with room for what might be underneath?',
  'ethos.iceberg': 'This keeps coming back. Want to map what\'s under the surface?',
  'ethos.ladder': 'We\'ve built a few conclusions on one moment. Want to see which parts we saw and which parts we added?',
  'ethos.circling': 'We keep returning to the same place. Want to put it all in one picture?',
  'ethos.universal': 'There\'s a lot here. Want to see it all in one place before we go further?',
  'ego.campaign': 'Let\'s map it. Every route to the objective, and I\'ll show you which ones I\'d cut.',
  'ego.bottleneck': 'Let\'s draw the pipeline. I\'ll show you the one stage holding everything back.',
  'ego.universal': 'Too many moving pieces to hold in our heads. Let\'s put them on a map.',
  'ego.ask_objective': 'Before I map anything: what\'s the objective? I need the finish line first.',
}

export function diagramOfferEnabled({ flooded, n1Complete }) {
  return !(flooded && !n1Complete)
}

function voiceTrigger(ctx, hints, grammar) {
  if (ctx.voice === 'ethos') {
    if (ctx.framework === 'Iceberg Model' && hints.recurrence) {
      return { action: 'offer', grammar: 'iceberg', copyKey: 'ethos.iceberg', reason: 'recurrence' }
    }
    if (EXPLICIT_CORE.has(ctx.framework) && hints.symptomCount >= 3 && hints.depth <= 1) {
      return { action: 'offer', grammar: 'core_radial', copyKey: 'ethos.core_radial', reason: 'symptoms' }
    }
    if (ctx.framework === 'Ladder of Inference' && hints.itemCount >= 3) {
      return { action: 'offer', grammar: 'core_radial', copyKey: 'ethos.ladder', reason: 'ladder' }
    }
    if (hints.circling) {
      return { action: 'offer', grammar: 'core_radial', copyKey: 'ethos.circling', reason: 'circling' }
    }
    return null
  }
  if (grammar === 'campaign' && hints.optionsCount >= 3) {
    if (!hints.objectiveDefined) {
      return { action: 'ask_objective', grammar, copyKey: 'ego.ask_objective', reason: 'objective' }
    }
    return { action: 'offer', grammar: 'campaign', copyKey: 'ego.campaign', reason: 'options' }
  }
  if (ctx.framework === 'Theory of Constraints' && hints.stagesCount >= 3 && hints.throughputComplaint) {
    return { action: 'offer', grammar: 'bottleneck', copyKey: 'ego.bottleneck', reason: 'throughput' }
  }
  return null
}

function universalTrigger(ctx, hints, grammar) {
  const sketch = typeof ctx.profile?.r3 === 'number' && ctx.profile.r3 >= 6
  const itemThreshold = sketch ? 4 : 5
  const depthThreshold = sketch ? 2 : 3
  const hit = hints.itemCount >= itemThreshold || hints.depth >= depthThreshold || hints.userOverwhelmed
  if (!hit) return { action: 'none', reason: 'quiet' }
  if (ctx.voice === 'ego' && !hints.objectiveDefined) {
    return { action: 'ask_objective', grammar, copyKey: 'ego.ask_objective', reason: 'objective' }
  }
  return {
    action: 'offer',
    grammar,
    copyKey: ctx.voice === 'ego' ? 'ego.universal' : 'ethos.universal',
    reason: 'universal',
  }
}

export function evaluateDiagramTriggers(ctx) {
  const parsed = structureHintsSchema.safeParse(ctx.hints)
  if (!parsed.success) return { action: 'none', reason: 'invalid_hints' }
  const hints = {
    userRequestedVisual: false,
    itemCount: 0,
    symptomCount: 0,
    depth: 0,
    recurrence: false,
    optionsCount: 0,
    objectiveDefined: false,
    stagesCount: 0,
    throughputComplaint: false,
    userOverwhelmed: false,
    circling: false,
    emotionalDisclosure: false,
    decisionCommitted: false,
    newStructure: false,
    ...parsed.data,
  }
  const grammar = grammarFor(ctx.voice, ctx.framework, { v2: !!ctx.v2 })

  if (ctx.crisis) return { action: 'none', reason: 'crisis' }
  if (ctx.flooded && !ctx.n1Complete) {
    if (hints.userRequestedVisual) return { action: 'queue', grammar, reason: 'flooded' }
    return { action: 'none', reason: 'flooded' }
  }
  if (hints.userRequestedVisual) return { action: 'draw', grammar, reason: 'requested' }
  if (ctx.mapExists && hints.newStructure) return { action: 'update', grammar, reason: 'new_structure' }
  if (hints.emotionalDisclosure) return { action: 'none', reason: 'disclosure' }
  if (ctx.urgent) return { action: 'none', reason: 'urgent' }
  if (ctx.c2 === 'Headline') return { action: 'none', reason: 'headline' }
  if (ctx.offerDeclinedForFramework === ctx.framework) return { action: 'none', reason: 'declined' }
  if (ctx.voice === 'ego' && hints.decisionCommitted) return { action: 'none', reason: 'committed' }
  const seesWhole = typeof ctx.profile?.r4 === 'number' && ctx.profile.r4 >= 6
  if (ctx.voice === 'ethos' && ctx.brainstormUserTurn < 2 && !seesWhole) {
    return { action: 'none', reason: 'listen' }
  }

  return voiceTrigger(ctx, hints, grammar) || universalTrigger(ctx, hints, grammar)
}
