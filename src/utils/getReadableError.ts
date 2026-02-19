/**
 * Normalize unknown error values to a user-friendly string.
 *
 * Handles Error instances, plain strings, objects with `message`/`error`
 * properties, and falls back to JSON.stringify or String coercion.
 */
export function getReadableError(
  error: unknown,
  fallback: string = 'An unexpected error occurred'
): string {
  if (!error) {
    return fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (typeof error === 'object') {
    const maybe = error as Record<string, unknown>;
    const message = maybe.message ?? maybe.error;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
    try {
      return JSON.stringify(error);
    } catch {
      return fallback;
    }
  }
  return String(error);
}
