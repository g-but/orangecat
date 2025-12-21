#!/usr/bin/env node
/**
 * Repo Cleanup Script
 *
 * Deletes binary artifacts, screenshots, logs, and archive docs that bloat the repo.
 * Safe to run locally; skips paths that don't exist.
 */

const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const targets = [
  '.playwright-mcp',
  'test-results',
  'logs',
  'demo-screenshots',
  'test-screenshots',
  'screenshots',
  // Archived docs (fully redundant)
  path.join('docs', 'archive'),
];

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  const stat = fs.lstatSync(p);
  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(p)) {
      rmrf(path.join(p, entry));
    }
    try { fs.rmdirSync(p); } catch {}
  } else {
    try { fs.unlinkSync(p); } catch {}
  }
}

for (const t of targets) {
  rmrf(path.join(ROOT, t));
}

console.log('Cleanup complete.');

