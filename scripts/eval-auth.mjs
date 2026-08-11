/**
 * Shared auth for eval scripts that probe the deployed app as a signed-in user
 * (eval-cat, eval-voice-routing, eval-wallet-routing). Extracted once three
 * copies existed.
 *
 * The trick both helpers encode: the app authenticates via the @supabase/ssr
 * cookie, so a plain fetch can act as a user by signing in against GoTrue REST
 * and forging that cookie — name `sb-<host-label>-auth-token`, value
 * `base64-<base64url(session JSON)>`, chunked into `.0`,`.1`,… pieces at 3180
 * chars (MAX_CHUNK_SIZE in @supabase/ssr).
 *
 * Plain params, no env reads: each eval script owns its own env conventions
 * (CAT_EVAL_*, VOICE_EVAL_*, …) and passes the resolved values in.
 */

/** Sign in via GoTrue REST. Returns the session JSON ({ access_token, user, … }). */
export async function signInWithPassword({ supabaseUrl, anonKey, email, password }) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { apikey: anonKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`GoTrue sign-in failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

/** Forge the @supabase/ssr auth cookie for a GoTrue session. */
export function buildAuthCookie(supabaseUrl, session) {
  const name = `sb-${new URL(supabaseUrl).hostname.split('.')[0]}-auth-token`;
  const value = `base64-${Buffer.from(JSON.stringify(session)).toString('base64url')}`;
  const MAX = 3180;
  if (value.length <= MAX) {
    return `${name}=${value}`;
  }
  const parts = [];
  for (let i = 0; i * MAX < value.length; i++) {
    parts.push(`${name}.${i}=${value.slice(i * MAX, (i + 1) * MAX)}`);
  }
  return parts.join('; ');
}
