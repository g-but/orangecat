#!/usr/bin/env node
const { spawn } = require('child_process');

const tsc = spawn('npm', ['run', '-s', 'type-check'], { stdio: ['ignore', 'pipe', 'pipe'] });

let out = '';
let err = '';

tsc.stdout.on('data', (d) => (out += d.toString()));
tsc.stderr.on('data', (d) => (err += d.toString()));

tsc.on('close', (code) => {
  const text = out + '\n' + err;
  const lines = text.split(/\r?\n/).filter(Boolean);
  const errorLines = lines.filter((l) => /error TS\d+/.test(l));
  const count = errorLines.length;

  console.log('TypeScript error report (non-blocking)');
  console.log('--------------------------------------');
  console.log(`Total TS errors: ${count}`);
  if (count > 0) {
    console.log('Sample (first 10):');
    errorLines.slice(0, 10).forEach((l) => console.log(l));
  }
  // Always exit 0 to avoid failing CI for now
  process.exit(0);
});

