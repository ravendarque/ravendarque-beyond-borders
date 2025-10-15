import { useRef, useEffect } from 'react';

/**
 * A custom hook that manages a cache of flag ImageBitmaps
 * This prevents re-fetching flag images when switching between modes
 * @returns A Map that persists across renders
 */
export function useFlagImageCache() {
  const cache = useRef<Map<string, ImageBitmap>>(new Map());

  // Cleanup: close all cached ImageBitmaps on unmount to free memory
  useEffect(() => {
    const currentCache = cache.current;
    return () => {
      currentCache.forEach((bitmap) => {
        try {
          bitmap.close();
        } catch {
          // Ignore errors closing bitmaps
        }
      });
      currentCache.clear();
    };
  }, []);

  return cache.current;
}
