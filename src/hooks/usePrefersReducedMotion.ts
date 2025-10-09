import { useEffect, useState } from 'react';

/**
 * Hook to detect if the user prefers reduced motion
 * 
 * @returns {boolean} True if the user prefers reduced motion
 * 
 * @example
 * ```tsx
 * const prefersReducedMotion = usePrefersReducedMotion();
 * 
 * if (prefersReducedMotion) {
 *   // Disable or reduce animations
 * }
 * ```
 */
export function usePrefersReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check if matchMedia is supported
    if (!window.matchMedia) {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    // Set initial value
    setPrefersReducedMotion(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}
