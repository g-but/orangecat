/**
 * Utility functions for implementing retry logic with exponential backoff
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  jitter?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  retryCondition?: (error: any) => boolean;
}

/**
 * Default retry condition - retries on network errors and 5xx status codes
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isRetryableError(error: any): boolean {
  // Network errors
  if (!error) {
    return false;
  }
  if (
    error.name === 'NetworkError' ||
    error.message?.includes('network') ||
    error.message?.includes('fetch')
  ) {
    return true;
  }

  // HTTP status codes
  const status = error?.response?.status || error?.status;
  if (typeof status === 'number') {
    // Retry on server errors (5xx) and rate limiting (429)
    if (status >= 500 || status === 429) {
      return true;
    }
    // Don't retry on client errors (4xx) except rate limiting
    if (status >= 400 && status < 500 && status !== 429) {
      return false;
    }
  }

  // Timeout errors
  if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
    return true;
  }

  // Default to retry for unknown errors
  return true;
}

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt: number, options: RetryOptions): number {
  const { baseDelay = 1000, maxDelay = 30000, backoffFactor = 2, jitter = true } = options;

  const delay = Math.min(baseDelay * Math.pow(backoffFactor, attempt - 1), maxDelay);

  if (jitter) {
    // Add random jitter up to 25% of the delay
    const jitterAmount = delay * 0.25 * Math.random();
    return delay + jitterAmount;
  }

  return delay;
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { maxAttempts = 3, retryCondition = isRetryableError } = options;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // If this is the last attempt, don't retry
      if (attempt === maxAttempts) {
        break;
      }

      // Check if we should retry this error
      if (!retryCondition(error)) {
        break;
      }

      // Calculate delay and wait
      const delay = calculateDelay(attempt, options);
      await sleep(delay);
    }
  }

  throw lastError;
}

/**
 * Retry specifically for API calls with better error classification
 */
export async function withApiRetry<T>(
  fn: () => Promise<T>,
  options: Omit<RetryOptions, 'retryCondition'> = {}
): Promise<T> {
  return withRetry(fn, {
    ...options,
    retryCondition: error => {
      // More sophisticated error classification for API calls
      if (!error) {
        return false;
      }

      // HTTP status codes
      const status = error?.response?.status || error?.status;
      if (typeof status === 'number') {
        // Retry on server errors, rate limiting, and network issues
        if (status >= 500 || status === 429 || status === 0) {
          return true;
        }
        // Don't retry on authentication/authorization errors
        if (status === 401 || status === 403) {
          return false;
        }
        // Don't retry on client errors (except rate limiting)
        if (status >= 400 && status < 500 && status !== 429) {
          return false;
        }
      }

      // Network errors
      if (error.name === 'NetworkError' || error.code === 'NETWORK_ERROR') {
        return true;
      }

      // Timeout errors
      if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
        return true;
      }

      // Fetch errors
      if (error.message?.includes('fetch')) {
        return true;
      }

      return false;
    },
  });
}



