/**
 * App OAuth provider ids → Supabase/GoTrue provider keys.
 *
 * Server-safe SSOT (no 'use client') so both the login UI and the
 * /api/auth/oauth-providers route derive providers from the same map.
 * NOTE: "X" is still `twitter` upstream in GoTrue/supabase-js.
 */
export const OAUTH_TO_SUPABASE = {
  google: 'google',
  github: 'github',
  facebook: 'facebook',
  apple: 'apple',
  x: 'twitter',
  // LinkedIn uses GoTrue's OIDC provider key (`linkedin_oidc`); the legacy
  // `linkedin` provider was removed upstream.
  linkedin: 'linkedin_oidc',
} as const;

/** App-level OAuth provider id — derived from the map (SSOT). */
export type OAuthProvider = keyof typeof OAUTH_TO_SUPABASE;

/** GoTrue/supabase-js provider key — derived from the map (SSOT), so adding a
 *  provider above extends every consumer's type instead of a hardcoded union. */
export type SupabaseOAuthProvider = (typeof OAUTH_TO_SUPABASE)[OAuthProvider];

export const OAUTH_PROVIDER_IDS = Object.keys(OAUTH_TO_SUPABASE) as OAuthProvider[];

export function isOAuthProvider(value: string): value is OAuthProvider {
  return value in OAUTH_TO_SUPABASE;
}
