#!/usr/bin/env node

// Simple .env.local backup utility (never commits backups)

const fs = require('fs');
const path = require('path');

const src = path.join(process.cwd(), '.env.local');
if (!fs.existsSync(src)) {
  console.error('❌ .env.local not found — nothing to back up');
  process.exit(1);
}

const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const dst = path.join(process.cwd(), `.env.local.backup.${stamp}.safe`);
fs.copyFileSync(src, dst);
console.log(`✅ Backed up .env.local to ${path.basename(dst)}`);
