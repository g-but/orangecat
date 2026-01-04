# Remote-Only Supabase Policy

OrangeCat uses Supabase Cloud only. Do not run local Supabase/Postgres.

- No `supabase start`, `supabase db start`, or Docker services.
- Manage schema with remote migrations or Studio SQL only.
- CLI is allowed for remote ops: `supabase link`, `supabase db push`, `supabase db dump`.

Recommended remote-first workflow:

1) Link once
   SUPABASE_ACCESS_TOKEN=… supabase link --project-ref <ref> --workdir supabase

2) Create a migration (remote-intended)
   supabase migration new <name> --workdir supabase

3) Apply to remote
   SUPABASE_ACCESS_TOKEN=… supabase db push --workdir supabase --include-all

4) Verify
   SUPABASE_ACCESS_TOKEN=… supabase db dump --schema public --workdir supabase -f /tmp/public.sql

If CLI refuses due to history mismatches, prefer running SQL once in Studio, then align migrations in Git.

