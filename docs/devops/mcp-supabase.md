# Supabase MCP Server

This repository provides a small MCP server for Supabase at `mcp-servers/supabase-server.js`. It lets AI agents (and humans) safely inspect and change data via defined tools.

Requirements
- Env vars (see `.env.example`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (reads)
  - `SUPABASE_SERVICE_ROLE_KEY` (optional; enables writes when provided)

Run
```bash
npm run mcp:supabase
```

Tools
- `ping_supabase`: minimal connectivity check
- `select_rows`: select columns from a table with optional equality filters + limit
- `count_rows`: head-only count with optional filters
- `insert_row`: insert one row (requires service-role or row-level policies permitting anon)
- `update_rows`: update rows matching equality filters (requires service-role or permissive RLS)

Notes
- Writes require proper RLS or service-role key. Prefer service-role only in trusted server contexts.
- This is an operational helper for automation and debugging; production data changes should still go through app code paths or migrations.

