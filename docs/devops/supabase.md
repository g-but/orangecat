# Supabase Connectivity

Environment
- Required (all environments):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Optional (server-side admin only):
  - `SUPABASE_SERVICE_ROLE_KEY` (do not expose publicly)

Runtime Clients
- Browser: `src/services/supabase/client.ts` (uses anon key, lazy validates env).
- Server: `src/services/supabase/server.ts` (SSR client using anon key + cookies for session handling).
- Admin: `src/services/supabase/admin.ts` (service-role client; falls back to a dummy that throws if missing to avoid unsafe usage).

Health Check
- `GET /api/health` checks Supabase availability:
  - Tries admin client if `SUPABASE_SERVICE_ROLE_KEY` is present.
  - Falls back to SSR anon client if admin is absent.
  - Performs a minimal `profiles` query with `head: true`.

CLI-Free Local Diagnostics
- Run `npm run diag:supabase` to verify env + connectivity and head-only selects on key tables (`profiles`, `organizations`, `funding_pages`).
- Uses `.env.local` (if present) and prefers `SUPABASE_SERVICE_ROLE_KEY` when available.

Write Test (optional)
- Run `npm run diag:supabase:write` to perform a safe end-to-end write test:
  - Creates a temporary auth user via Admin API (service-role required)
  - Ensures a profile exists (trigger or fallback insert)
  - Inserts a temporary `funding_pages` row (if owner column detected), then deletes it
  - Cleans up by deleting the temporary auth user (cascades to profile)
- No existing data is modified; temporary records are removed at the end.

Local Development
1. Start Supabase locally (Supabase CLI) or use hosted project.
2. Set `.env.local` with the required keys (see `.env.example`).
3. Run `npm run dev` (or `npm run fresh:start`).
4. Verify via `curl http://localhost:3000/api/health`.

Production
- Configure envs in Vercel Project settings (Production/Preview):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (required)
  - `SUPABASE_SERVICE_ROLE_KEY` (optional; only if admin operations are required at runtime)
- CI workflow uses GitHub Secrets for Vercel credentials only.

Troubleshooting
- Missing envs cause a runtime error on first Supabase client usage; `/api/health` will show `supabase` as `down`.
- Verify the domain in `NEXT_PUBLIC_SUPABASE_URL` and that keys match the target environment (dev/staging/prod).
