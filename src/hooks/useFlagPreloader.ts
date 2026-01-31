import { useEffect, useRef } from 'react';
import type { FlagSpec } from '@/flags/schema';
import { getAssetUrl } from '@/config';

/**
 * Priority flags that should be preloaded on idle
 * These are commonly used flags based on typical usage patterns
 */
const PRIORITY_FLAGS = [
  'transgender-pride',
  'rainbow-pride',
  'bisexual-pride',
  'pansexual-pride',
  'lesbian-pride',
  'nonbinary-pride',
  'asexual-pride',
];

/**
 * Preload flag PNG images on browser idle time
 * Uses requestIdleCallback to avoid blocking main thread
 *
 * @param flags Available flags
 * @param flagImageCache Cache to store preloaded images
 * @param currentFlagId Currently selected flag (don't preload this one)
 */
export function useFlagPreloader(
  flags: FlagSpec[],
  flagImageCache: Map<string, ImageBitmap>,
  currentFlagId: string,
) {
  const preloadedRef = useRef(new Set<string>());

  useEffect(() => {
    // Only run in browser with idle callback support
    if (typeof window === 'undefined' || !('requestIdleCallback' in window)) {
      return;
    }

    // Don't preload if no flags available
    if (flags.length === 0) {
      return;
    }

    /**
     * Preload a single flag image
     */
    async function preloadFlag(flag: FlagSpec): Promise<void> {
      // Skip if no PNG available
      if (!flag.png_full) {
        return;
      }

      const cacheKey = flag.png_full;

      // Skip if already in cache
      if (flagImageCache.has(cacheKey)) {
        return;
      }

      // Skip if already preloaded
      if (preloadedRef.current.has(cacheKey)) {
        return;
      }

      try {
        // Mark as preloaded (even if fetch fails, don't retry)
        preloadedRef.current.add(cacheKey);

        // Fetch and cache the flag image
        const response = await fetch(getAssetUrl(`flags/${flag.png_full}`));
        if (!response.ok) {
          return; // Silent fail for preloading
        }

        const blob = await response.blob();
        const bitmap = await createImageBitmap(blob);

        // Add to cache
        flagImageCache.set(cacheKey, bitmap);

        // Preload successful - no logging needed (best-effort operation)
      } catch {
        // Silent fail - preloading is best-effort
        // Errors are handled silently to avoid user-facing noise
      }
    }

    /**
     * Preload priority flags on idle
     */
    function preloadOnIdle() {
      // Get priority flags in order
      const flagsToPreload = PRIORITY_FLAGS.map((id) => flags.find((f) => f.id === id))
        .filter((f): f is FlagSpec => f !== undefined)
        .filter((f) => f.id !== currentFlagId); // Skip current flag

      // Preload one flag at a time on idle
      let currentIndex = 0;

      function preloadNext(deadline: IdleDeadline) {
        // Continue while we have time and flags to preload
        while (
          currentIndex < flagsToPreload.length &&
          (deadline.timeRemaining() > 0 || deadline.didTimeout)
        ) {
          const flag = flagsToPreload[currentIndex];
          currentIndex++;

          // Preload asynchronously (don't await)
          void preloadFlag(flag);

          // If we've used enough time, schedule next batch
          if (deadline.timeRemaining() < 10) {
            break;
          }
        }

        // Schedule next batch if there are more flags
        if (currentIndex < flagsToPreload.length) {
          requestIdleCallback(preloadNext, { timeout: 2000 });
        }
      }

      // Start preloading
      requestIdleCallback(preloadNext, { timeout: 2000 });
    }

    // Start preloading after a delay to let initial render complete
    const timeoutId = setTimeout(preloadOnIdle, 1000);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [flags, flagImageCache, currentFlagId]);
}
