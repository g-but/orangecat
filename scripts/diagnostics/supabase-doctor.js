#!/usr/bin/env node

// Supabase Doctor: aggregates environment checks + connectivity
// Usage:
//   npm run supabase:doctor              # read-only diagnostics
//   npm run supabase:doctor -- --write   # include safe write test (requires service-role)

const { spawnSync } = require('child_process');

function run(cmd, args) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  return r.status || 0;
}

let status = 0;

// 1) Connectivity / env diag
status = run('node', ['scripts/diagnostics/check-supabase.js']) || status;

// 2) Optional write test
if (process.argv.includes('--write') || process.argv.includes('-w')) {
  status = run('node', ['scripts/diagnostics/write-test-supabase.js']) || status;
}

process.exit(status);
