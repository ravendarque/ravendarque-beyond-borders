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
  aspectRatio: z.number().optional().nullable(), // width:height ratio (e.g., 2.0 for 2:1, 1.5 for 3:2)
  source_page: z.string().optional().nullable(),
  media_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(), // Changed from enum to string for flexibility
  categoryDisplayName: z.string().optional().nullable(), // Original display name from source of truth
  categoryDisplayOrder: z.number().optional().nullable(), // Order for displaying categories in UI
  reason: z.string().optional().nullable(), // Why this flag is included
  link: z.string().optional().nullable(),
  colors: z.array(z.string()).optional().nullable(),
  size: z.number().optional().nullable(),
  stripe_order: z.any().optional(),
  horizontalInvariant: z.boolean().optional(), // True if flag is invariant under horizontal translation (e.g. horizontal stripes only)
  status: z.enum(['active', 'hidden', 'deprecated']).default('active').optional(),
  modes: z.object({
    ring: z.object({
      colors: z.array(z.string()).optional(),
    }).optional(),
    segment: z.object({
      // Future segment mode config
    }).optional(),
    cutout: z.object({
      offsetEnabled: z.boolean(),
      defaultOffset: z.number().min(-50).max(50),
    }).optional(),
  }).optional(),
  sources: z.object({
    referenceUrl: z.string().url().optional(),
    authorNote: z.string().optional(),
  }).optional(),
});

export type FlagSpec = z.infer<typeof FlagSpec>;
