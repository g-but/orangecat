#!/usr/bin/env node
/**
 * Safe ENV merge:
 * - Reads .env.local (if exists) and .env.vercel (pulled from Vercel)
 * - Preserves existing keys in .env.local
 * - Adds missing keys from .env.vercel
 * - Explicitly preserves sensitive tokens like VERCEL_TOKEN
 * - Creates a backup: .env.local.backup
 */

const fs = require('fs');
const path = require('path');

const LOCAL = path.join(process.cwd(), '.env.local');
const VERCEL = path.join(process.cwd(), '.env.vercel');
const BACKUP = path.join(process.cwd(), '.env.local.backup');

function parseEnv(text) {
  const out = {};
  text.split(/\r?\n/).forEach(line => {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (m) {
      let val = m[2];
      // remove optional surrounding quotes
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      out[m[1]] = val;
    }
  });
  return out;
}

function serializeEnv(obj) {
  return (
    Object.entries(obj)
      .map(([k, v]) => `${k}=${JSON.stringify(String(v))}`)
      .join('\n') + '\n'
  );
}

function readFileSafe(p) {
  try {
    return fs.readFileSync(p, 'utf8');
  } catch {
    return '';
  }
}

function main() {
  const localText = readFileSafe(LOCAL);
  const vercelText = readFileSafe(VERCEL);

  if (!vercelText) {
    console.error('No .env.vercel found. Run: vercel env pull .env.vercel');
    process.exit(1);
  }

  const local = parseEnv(localText);
  const pulled = parseEnv(vercelText);

  // Preserve local keys (including tokens) and add any missing from pulled
  const merged = { ...pulled, ...local };

  // Backup existing local file
  if (localText) {
    fs.writeFileSync(BACKUP, localText, 'utf8');
    console.log(`💾 Backup created: ${BACKUP}`);
  }

  fs.writeFileSync(LOCAL, serializeEnv(merged), 'utf8');
  console.log('✅ Merged .env.vercel into .env.local (preserving existing keys).');
}

main();
