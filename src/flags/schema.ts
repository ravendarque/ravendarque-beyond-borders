import { z } from 'zod';

export const Stripe = z.object({
  color: z.string().regex(/^#([0-9a-fA-F]{3}){1,2}$/),
  weight: z.number().positive(),
  label: z.string().optional(),
});

export const FlagSpec = z.object({
  id: z.string(),
  name: z.string().optional(), // Full official name
  displayName: z.string(),
  svgFilename: z.string().optional().nullable(),
  png_full: z.string().nullable(), // PNG for rendering
  png_preview: z.string().optional().nullable(),
  source_page: z.string().optional().nullable(),
  media_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(), // Changed from enum to string for flexibility
  reason: z.string().optional().nullable(), // Why this flag is included
  link: z.string().optional().nullable(),
  colors: z.array(z.string()).optional().nullable(),
  size: z.number().optional().nullable(),
  stripe_order: z.any().optional(),
  status: z.enum(['active', 'hidden', 'deprecated']).default('active').optional(),
  pattern: z.object({
    type: z.literal('stripes'),
    orientation: z.enum(['horizontal', 'vertical']),
    stripes: z.array(Stripe).min(2),
  }).optional(),
  layouts: z.array(z.object({
    type: z.string(),
    colors: z.array(z.string()),
  })).optional(),
  focalPoint: z.object({
    x: z.number(),
    y: z.number(),
  }).optional(),
  recommended: z.object({
    borderStyle: z.enum(['ring-stripes', 'ring-solid']),
    primaryColor: z
      .string()
      .regex(/^#([0-9a-fA-F]{3}){1,2}$/)
      .optional(),
    defaultThicknessPct: z.number().min(5).max(20),
  }).optional(),
  // Legacy fields for backward compatibility
  sources: z.object({
    referenceUrl: z.string().url().optional(),
    authorNote: z.string().optional(),
  }).optional(),
});

export type FlagSpec = z.infer<typeof FlagSpec>;
