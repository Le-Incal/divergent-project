import { z } from 'zod'

export const structureHintsSchema = z.object({
  userRequestedVisual: z.boolean(),
  itemCount: z.number(),
  symptomCount: z.number(),
  depth: z.number(),
  recurrence: z.boolean(),
  optionsCount: z.number(),
  objectiveDefined: z.boolean(),
  stagesCount: z.number(),
  throughputComplaint: z.boolean(),
  userOverwhelmed: z.boolean(),
  circling: z.boolean(),
  emotionalDisclosure: z.boolean(),
  decisionCommitted: z.boolean(),
  newStructure: z.boolean(),
}).partial()
