/**
 * Retry Utilities
 * 
 * Provides retry logic with exponential backoff for handling transient failures.
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxAttempts?: number;
  
  /** Initial delay in milliseconds (default: 500) */
  initialDelay?: number;
  
  /** Maximum delay in milliseconds (default: 5000) */
  maxDelay?: number;
  
  /** Backoff multiplier (default: 2 for exponential backoff) */
  backoffMultiplier?: number;
  
  /** Optional callback for retry attempts */
  onRetry?: (attempt: number, error: Error) => void;
  
  /** Function to determine if error is retryable (default: all errors retryable) */
  isRetryable?: (error: Error) => boolean;
}

export interface RetryState {
  attempt: number;
  maxAttempts: number;
  nextDelay: number;
}

/**
 * Retry a promise-returning function with exponential backoff
 * 
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   () => fetch('/api/data'),
 *   { maxAttempts: 3, onRetry: (attempt) => console.log(`Retry ${attempt}`) }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 500,
    maxDelay = 5000,
    backoffMultiplier = 2,
    onRetry,
    isRetryable = () => true,
  } = options;

  let lastError: Error | null = null;
  let currentDelay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry this error
      if (!isRetryable(lastError)) {
        throw lastError;
      }

      // Don't retry if this was the last attempt
      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Wait before retrying
      await sleep(currentDelay);

      // Increase delay for next attempt (exponential backoff)
      currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Retry failed with no error');
}

/**
 * Create a function that tracks retry state for UI updates
 * 
 * @example
 * ```typescript
 * const { execute, state } = createRetryableOperation(
 *   () => fetch('/api/data')
 * );
 * 
 * // UI can watch state for progress updates
 * console.log(`Attempt ${state.attempt} of ${state.maxAttempts}`);
 * ```
 */
export function createRetryableOperation<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
) {
  const state: RetryState = {
    attempt: 0,
    maxAttempts: options.maxAttempts || 3,
    nextDelay: options.initialDelay || 500,
  };

  const execute = async (): Promise<T> => {
    return retryWithBackoff(fn, {
      ...options,
      onRetry: (attempt, error) => {
        state.attempt = attempt;
        const multiplier = options.backoffMultiplier || 2;
        const maxDelay = options.maxDelay || 5000;
        state.nextDelay = Math.min(
          (options.initialDelay || 500) * Math.pow(multiplier, attempt),
          maxDelay
        );
        if (options.onRetry) {
          options.onRetry(attempt, error);
        }
      },
    });
  };

  return { execute, state };
}

/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Determine if a fetch error is likely transient and worth retrying
 */
export function isNetworkErrorRetryable(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Retryable conditions
  const retryablePatterns = [
    'network',
    'timeout',
    'fetch',
    'failed to fetch',
    'networkerror',
    'aborted',
  ];

  return retryablePatterns.some((pattern) => message.includes(pattern));
}

/**
 * Retry specifically for fetch requests with sensible defaults
 */
export async function retryFetch(
  url: string,
  init?: RequestInit,
  options?: Omit<RetryOptions, 'isRetryable'>
): Promise<Response> {
  return retryWithBackoff(
    async () => {
      const response = await fetch(url, init);
      
      // Retry on 5xx server errors and 429 (rate limit)
      if (response.status >= 500 || response.status === 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return response;
    },
    {
      ...options,
      isRetryable: isNetworkErrorRetryable,
    }
  );
}
