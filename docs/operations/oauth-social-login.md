# OAuth Social Login — enabling providers

**Audience:** whoever operates the self-hosted Supabase on `bitbaum`.
**TL;DR:** the login buttons are entirely config-driven. A provider's button
appears **only** when GoTrue has it enabled _and_ its credentials actually work
(the app probes each provider's `/authorize` and hides broken ones). Adding a
provider is zero app-code — configure it on the box and the button appears.

## How it works (so you know where to look)

- **App SSOT:** `src/app/auth/oauth-provider-map.ts` maps our ids → GoTrue keys.
  Supported today: `google`, `github`, `x` (`twitter`), `linkedin`
  (`linkedin_oidc`), `facebook`, `apple`.
- **Which buttons render:** `GET /api/auth/oauth-providers` reads
  `${SUPABASE_URL}/auth/v1/settings` for flagged-enabled providers, then probes
  each one's `/auth/v1/authorize` and keeps only those that really redirect to
  the external IdP (a provider flagged on with broken credentials bounces back
  to the site root and is hidden). Result cached 5 min.
- **Consequence:** a button that's missing means "not enabled, or enabled with
  broken/missing credentials." Check the endpoint to see the live truth:
  ```bash
  curl -s https://orangecat.ch/api/auth/oauth-providers   # {"data":{"providers":[...]}}
  ```

## Current state (2026-07-28)

| Provider    | GoTrue flag | Works (probe)                                          | Button shows                                 |
| ----------- | ----------- | ------------------------------------------------------ | -------------------------------------------- |
| google      | on          | ✅ yes                                                 | ✅                                           |
| github      | on          | ✅ yes                                                 | ✅                                           |
| x (twitter) | on          | ❌ no — bounces to site root (bad/missing credentials) | ❌ hidden                                    |
| linkedin    | off         | —                                                      | ❌ (configure to enable)                     |
| facebook    | off         | —                                                      | ❌ (configure to enable)                     |
| apple       | off         | —                                                      | intentionally not offered (paid dev program) |

So **google + github already work**; **x needs its credentials fixed**;
**linkedin + facebook need configuring**.

## Enabling / fixing a provider

For each provider you want:

### 1. Register an OAuth app with the provider (free except Apple)

Set the **authorized redirect URI** to the GoTrue callback:

```
https://supabase.orangecat.ch/auth/v1/callback
```

- **Google:** console.cloud.google.com → APIs & Services → Credentials → OAuth client ID (Web). Also add your OAuth consent screen.
- **GitHub:** github.com/settings/developers → New OAuth App. "Authorization callback URL" = the URI above.
- **X:** developer.x.com → Project/App → User authentication settings → enable OAuth 2.0, set the callback URI above. (This is the one currently broken — most likely a missing/rotated client secret or a callback-URI mismatch.)
- **LinkedIn:** linkedin.com/developers → create an app → **Products → "Sign In with LinkedIn using OpenID Connect"** (this is why the GoTrue key is `linkedin_oidc`), then Auth tab → add the redirect URL above.
- **Facebook:** developers.facebook.com → create an app → Facebook Login → Valid OAuth Redirect URIs = the URI above.

### 2. Give the credentials to GoTrue on the box

GoTrue reads them from env (`/opt/orangecat` compose / the GoTrue service env).
Set per provider (names follow GoTrue's `GOTRUE_EXTERNAL_<P>_*` convention):

```bash
GOTRUE_EXTERNAL_LINKEDIN_OIDC_ENABLED=true
GOTRUE_EXTERNAL_LINKEDIN_OIDC_CLIENT_ID=...
GOTRUE_EXTERNAL_LINKEDIN_OIDC_SECRET=...
GOTRUE_EXTERNAL_LINKEDIN_OIDC_REDIRECT_URI=https://supabase.orangecat.ch/auth/v1/callback

GOTRUE_EXTERNAL_FACEBOOK_ENABLED=true
GOTRUE_EXTERNAL_FACEBOOK_CLIENT_ID=...
GOTRUE_EXTERNAL_FACEBOOK_SECRET=...
GOTRUE_EXTERNAL_FACEBOOK_REDIRECT_URI=https://supabase.orangecat.ch/auth/v1/callback

# X is already enabled but broken — re-set its secret + confirm the callback:
GOTRUE_EXTERNAL_TWITTER_CLIENT_ID=...
GOTRUE_EXTERNAL_TWITTER_SECRET=...
GOTRUE_EXTERNAL_TWITTER_REDIRECT_URI=https://supabase.orangecat.ch/auth/v1/callback
```

Restart GoTrue (`docker compose up -d gotrue` / `restart`).

### 3. Verify

```bash
# GoTrue now flags it:
curl -s https://supabase.orangecat.ch/auth/v1/settings -H "apikey: <ANON_KEY>" | jq .external
# The app now shows it (probe passes). Cache is 5 min — wait or redeploy the web app:
curl -s https://orangecat.ch/api/auth/oauth-providers | jq .data.providers
```

When the provider appears in that last list, its button renders on `/auth`
automatically — no app deploy needed for the button itself.

## Note: the "buttons appear a beat late" effect

On a cold cache the probe does live redirects to each IdP, so the "Or continue
with" row can pop in ~1s after the page. It's cached 5 min after the first hit,
so in practice only the very first visitor after a deploy/cache-expiry sees it.
If it ever needs to feel instant, warm the cache on deploy (hit
`/api/auth/oauth-providers` in the post-deploy smoke).
