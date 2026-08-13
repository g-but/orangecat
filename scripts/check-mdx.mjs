#!/usr/bin/env node
// Compiles every content/**/*.mdx with the same MDX compiler the build uses.
// Exists because a raw `<token>` in frontmatter/body parses as an unclosed JSX
// tag and fails the standalone build on main only (PR CI skips the build) —
// see the 2026-08-13 red-main incident with your-pay-link-already-works.mdx.
import { compile } from '@mdx-js/mdx';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function mdxFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return mdxFiles(p);
    return name.endsWith('.mdx') ? [p] : [];
  });
}

const files = mdxFiles('content');
let failed = 0;
for (const file of files) {
  try {
    await compile(readFileSync(file, 'utf8'));
  } catch (e) {
    failed++;
    console.error(`✗ ${file}: ${e.message}`);
  }
}
if (failed) {
  console.error(`${failed}/${files.length} MDX file(s) fail to compile`);
  process.exit(1);
}
console.log(`✓ ${files.length} MDX files compile clean`);
