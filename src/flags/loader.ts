import { retryFetch } from '@/utils/retry';
import { FlagDataError } from '@/types/errors';

export type FlagMeta = {
  id: string;
  displayName: string;
  svgFilename?: string | null;
  png_full?: string | null;
  png_preview?: string | null;
  source_page?: string | null;
  media_url?: string | null;
  description?: string | null;
  type?: string | null;
  reason?: string | null;
  link?: string | null;
  colors?: string[] | null;
  size?: number | null;
  stripe_order?: any;
};

let cached: FlagMeta[] | null = null;

/**
 * Load flags data from JSON file with retry logic
 * Throws FlagDataError on failure
 */
export async function loadFlags(): Promise<FlagMeta[]> {
  if (cached) return cached;
  
  try {
    // Use base URL from Vite config to support GitHub Pages deployment
    const flagsUrl = `${import.meta.env.BASE_URL}flags/flags.json`;
    
    // Use retryFetch for automatic retry on network failures
    const resp = await retryFetch(flagsUrl, {}, {
      maxAttempts: 3,
      initialDelay: 500,
    });
    
    if (!resp.ok) {
      throw FlagDataError.loadFailed(
        new Error(`HTTP ${resp.status}: ${resp.statusText}`)
      );
    }
    
    const j = await resp.json();
    
    if (!Array.isArray(j)) {
      throw FlagDataError.dataInvalid('flags.json');
    }
    
    cached = j as FlagMeta[];
    return cached;
  } catch (error) {
    // If it's already a FlagDataError, re-throw it
    if (error instanceof FlagDataError) {
      throw error;
    }
    
    // Otherwise, wrap it in a FlagDataError
    throw FlagDataError.loadFailed(error as Error);
  }
}

export function getFlagById(id: string): FlagMeta | undefined {
  if (!cached) return undefined;
  return cached.find((f) => f.id === id);
}
