import { z } from 'zod';

export const Stripe = z.object({
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
  weight: z.number().positive(),
  label: z.string().optional(),
});

export const FlagSpec = z.object({
  id: z.string(),
  name: z.string(), // Full official name
  displayName: z.string(),
  svgFilename: z.string().optional(),
  png_full: z.string(), // Required PNG for accurate rendering
  png_preview: z.string().optional(),
  category: z.enum(['authoritarian', 'occupied', 'stateless', 'oppressed']),
  reason: z.string().optional(), // Why this flag is included
  sources: z.object({
    referenceUrl: z.string().url().optional(),
    authorNote: z.string().optional(),
  }),
  status: z.enum(['active', 'hidden', 'deprecated']).default('active'),
  pattern: z.object({
    type: z.literal('stripes'),
    orientation: z.enum(['horizontal', 'vertical']),
    stripes: z.array(Stripe).min(2),
  }).optional(),
  layouts: z.array(z.object({
    type: z.string(),
    colors: z.array(z.string()),
  })).optional(),
  recommended: z.object({
    borderStyle: z.enum(['ring-stripes', 'ring-solid']),
    primaryColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}){1,2}$/)
      .optional(),
    defaultThicknessPct: z.number().min(5).max(20),
  }).optional(),
});

export type FlagSpec = z.infer<typeof FlagSpec>;
