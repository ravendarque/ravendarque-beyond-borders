/* eslint-disable no-console */
/**
 * Performance monitoring utilities using Web Vitals
 * Tracks Core Web Vitals (LCP, FID, CLS) and custom metrics
 * 
 * Note: Console logging is intentional for performance monitoring
 */

/**
 * Core Web Vitals metrics
 */
export interface WebVitalsMetrics {
  /** Largest Contentful Paint - Time to render largest content element */
  lcp?: number;
  /** First Input Delay - Time from first interaction to browser response */
  fid?: number;
  /** Cumulative Layout Shift - Visual stability score */
  cls?: number;
  /** First Contentful Paint - Time to first content render */
  fcp?: number;
  /** Time to First Byte - Server response time */
  ttfb?: number;
}

/**
 * Custom performance metrics for avatar rendering
 */
export interface CustomMetrics {
  /** Time to render avatar (ms) */
  renderTime?: number;
  /** Image size (bytes) */
  imageSize?: number;
  /** Canvas size (pixels) */
  canvasSize?: number;
  /** Memory usage estimate (MB) */
  memoryUsage?: number;
  /** Re-render count */
  rerenderCount?: number;
}

/**
 * Report Web Vitals metrics (development only)
 */
export function reportWebVitals() {
  // Only run in browser with Performance API
  if (typeof window === 'undefined' || !window.performance) {
    return;
  }

  // Only log in development
  if (!import.meta.env.DEV) {
    return;
  }

  // Use Performance Observer to track metrics
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      // Log paint timing
      if (entry.entryType === 'paint') {
        console.log(`[Perf] ${entry.name}: ${entry.startTime.toFixed(2)}ms`);
      }

      // Log navigation timing
      if (entry.entryType === 'navigation') {
        const nav = entry as PerformanceNavigationTiming;
        console.log(`[Perf] DOM Interactive: ${nav.domInteractive.toFixed(2)}ms`);
        console.log(`[Perf] DOM Complete: ${nav.domComplete.toFixed(2)}ms`);
        console.log(`[Perf] Load Complete: ${nav.loadEventEnd.toFixed(2)}ms`);
      }

      // Log largest contentful paint
      if (entry.entryType === 'largest-contentful-paint') {
        console.log(`[Perf] LCP: ${entry.startTime.toFixed(2)}ms`);
      }
    }
  });

  // Observe paint, navigation, and LCP
  try {
    observer.observe({ entryTypes: ['paint', 'navigation', 'largest-contentful-paint'] });
  } catch (error) {
    // Silently fail if entry types not supported
    console.warn('[Perf] Performance Observer not fully supported', error);
  }
}

/**
 * Mark performance milestone
 */
export function markPerformance(name: string) {
  if (typeof window === 'undefined' || !window.performance || !window.performance.mark) {
    return;
  }

  try {
    performance.mark(name);

    if (import.meta.env.DEV) {
      console.log(`[Perf] Mark: ${name}`);
    }
  } catch {
    // Silently fail
  }
}

/**
 * Measure performance between two marks
 */
export function measurePerformance(name: string, startMark: string, endMark?: string) {
  if (typeof window === 'undefined' || !window.performance || !window.performance.measure) {
    return;
  }

  try {
    const measure = endMark
      ? performance.measure(name, startMark, endMark)
      : performance.measure(name, startMark);

    if (import.meta.env.DEV && measure) {
      console.log(`[Perf] ${name}: ${measure.duration.toFixed(2)}ms`);
    }

    return measure?.duration;
  } catch {
    // Silently fail if marks don't exist
    return undefined;
  }
}

/**
 * Log custom metrics (development only)
 */
export function logCustomMetrics(metrics: CustomMetrics) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.group('[Perf] Custom Metrics');
  
  if (metrics.renderTime !== undefined) {
    console.log(`Render Time: ${metrics.renderTime.toFixed(2)}ms`);
  }
  
  if (metrics.imageSize !== undefined) {
    console.log(`Image Size: ${(metrics.imageSize / 1024 / 1024).toFixed(2)}MB`);
  }
  
  if (metrics.canvasSize !== undefined) {
    console.log(`Canvas Size: ${metrics.canvasSize}px`);
  }
  
  if (metrics.memoryUsage !== undefined) {
    console.log(`Memory Usage: ${metrics.memoryUsage.toFixed(2)}MB`);
  }
  
  if (metrics.rerenderCount !== undefined) {
    console.log(`Re-render Count: ${metrics.rerenderCount}`);
  }
  
  console.groupEnd();
}

/**
 * Get current memory usage (if available)
 */
export function getMemoryUsage(): number | undefined {
  if (typeof window === 'undefined') {
    return undefined;
  }

  // @ts-expect-error - performance.memory is non-standard but widely supported
  const memory = window.performance?.memory;
  
  if (memory && memory.usedJSHeapSize) {
    return memory.usedJSHeapSize / 1024 / 1024; // Convert to MB
  }

  return undefined;
}

/**
 * Performance budget thresholds
 */
export const PERFORMANCE_BUDGETS = {
  /** Largest Contentful Paint should be < 2.5s */
  LCP_BUDGET: 2500,
  /** First Input Delay should be < 100ms */
  FID_BUDGET: 100,
  /** Cumulative Layout Shift should be < 0.1 */
  CLS_BUDGET: 0.1,
  /** First Contentful Paint should be < 1.5s */
  FCP_BUDGET: 1500,
  /** Render time should be < 500ms */
  RENDER_BUDGET: 500,
  /** Bundle size should be < 200KB gzipped */
  BUNDLE_BUDGET: 200 * 1024,
} as const;

/**
 * Check if metric is within budget
 */
export function isWithinBudget(metric: number, budget: number): boolean {
  return metric <= budget;
}

/**
 * Format performance score (0-100)
 */
export function formatPerformanceScore(metric: number, budget: number): string {
  const score = Math.max(0, 100 - ((metric / budget) * 100));
  
  if (score >= 90) return '✅ Excellent';
  if (score >= 75) return '✓ Good';
  if (score >= 50) return '⚠ Needs Improvement';
  return '❌ Poor';
}
