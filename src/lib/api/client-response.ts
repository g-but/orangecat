/**
 * Browser-side unwrap for the standard API envelope
 * ({ success, data } | { success: false, error: { code, message } }).
 * SSOT for extracting the server's real error message — hand-rolled copies
 * of this logic kept drifting (one read `body.message`, which never exists,
 * and silently replaced every real error with a generic fallback).
 */
export async function unwrapApiResponse<T>(res: Response, fallback: string): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    const err = json?.error;
    const message = (typeof err === 'string' ? err : err?.message) || fallback;
    throw new Error(message);
  }
  return json.data as T;
}
