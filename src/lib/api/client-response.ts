/**
 * Browser-side unwrap for the standard API envelope
 * ({ success, data } | { success: false, error: { code, message } }).
 * SSOT for extracting the server's real error message — hand-rolled copies
 * of this logic kept drifting (one read `body.message`, which never exists,
 * and silently replaced every real error with a generic fallback).
 */
/**
 * Error carrying the API's machine-readable `error.code` alongside its message.
 *
 * Without this the code is discarded at the throw and every caller is left with
 * prose again — which is how UIs end up rendering raw service strings they
 * cannot act on.
 */
export class ApiResponseError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export async function unwrapApiResponse<T>(res: Response, fallback: string): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = json?.error;
    const message = (typeof err === 'string' ? err : err?.message) || fallback;
    const code =
      typeof err === 'object' && err !== null ? (err as { code?: string }).code : undefined;
    throw new ApiResponseError(message, code);
  }
  return json.data as T;
}
