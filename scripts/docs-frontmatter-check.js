#!/usr/bin/env node
/*
  docs-frontmatter-check.js
  Ensures active docs have frontmatter with required fields.
*/

const { glob } = require('glob');
const fs = require('fs');

function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const fm = text.slice(3, end).trim();
  const body = text.slice(end + 4);
  const obj = {};
  fm.split(/\r?\n/).forEach(line => {
    const m = line.match(/^([a-zA-Z0-9_\-]+):\s*(.*)$/);
    if (m) obj[m[1]] = m[2];
  });
  return { data: obj, body };
}

async function main() {
  const files = await glob('docs/**/*.md', { ignore: [
    'docs/archives/**',
    '**/node_modules/**',
  ] });

  const required = ['created_date', 'last_modified_date', 'last_modified_summary'];
  const failures = [];

  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const fm = parseFrontmatter(text);
    if (!fm) {
      failures.push({ file, reason: 'Missing frontmatter' });
      continue;
    }
    for (const key of required) {
      if (!fm.data[key]) {
        failures.push({ file, reason: `Missing field: ${key}` });
      }
    }
  }

  if (failures.length) {
    console.log('Frontmatter issues detected:');
    failures.slice(0, 100).forEach(f => console.log(`- ${f.file}: ${f.reason}`));
    process.exitCode = 1;
  } else {
    console.log('All active docs have required frontmatter.');
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

