import { z } from 'zod';

export const Stripe = z.object({
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
  weight: z.number().positive(),
  label: z.string().optional(),
});

export const FlagSpec = z.object({
  id: z.string(),
  displayName: z.string(),
  category: z.enum(['marginalized', 'national']),
  sources: z.object({
    referenceUrl: z.string().url().optional(),
    authorNote: z.string().optional(),
  }),
  status: z.enum(['active', 'hidden', 'deprecated']).default('active'),
  pattern: z.object({
    type: z.literal('stripes'),
    orientation: z.enum(['horizontal', 'vertical']),
    stripes: z.array(Stripe).min(2),
  }),
  recommended: z.object({
    borderStyle: z.enum(['ring-stripes', 'ring-solid']),
    primaryColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}){1,2}$/)
      .optional(),
    defaultThicknessPct: z.number().min(5).max(20),
  }),
});

export type FlagSpec = z.infer<typeof FlagSpec>;
