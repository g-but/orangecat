#!/usr/bin/env node
/*
  docs-slop-scan.js
  Scans for sloppy placeholder phrases outside of allowed directories (archives/tests)
*/

const { glob } = require('glob');
const fs = require('fs');

const PHRASES = [/coming soon/i, /tbd/i, /todo/i, /wip/i, /work in progress/i, /placeholder/i, /lorem ipsum/i, /beta only/i];

async function main() {
  const patterns = [
    'docs/**/*.md',
    'src/**/*.{ts,tsx,md}',
    'app/**/*.{ts,tsx,md}',
  ];

  const files = (await Promise.all(patterns.map(p => glob(p, { ignore: [
    '**/node_modules/**',
    '**/.next/**',
    '**/__tests__/**',
    'docs/archives/**',
    '.claude/**',
  ] })))).flat();

  let violations = [];
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split(/\r?\n/);
    lines.forEach((line, idx) => {
      PHRASES.forEach(rx => {
        if (rx.test(line)) {
          violations.push({ file, line: idx + 1, text: line.trim() });
        }
      });
    });
  }

  if (violations.length) {
    console.log('Slop phrases found (outside archives/tests):');
    violations.slice(0, 100).forEach(v => console.log(`- ${v.file}:${v.line} ${v.text}`));
    process.exitCode = 1;
  } else {
    console.log('No slop phrases found.');
  }
}

main().catch(err => {
  console.error(err);
  process.exitCode = 1;
});

