#!/usr/bin/env node
// Simple guard against god files: warns/fails on overly long TS/TSX files
const { glob } = require('glob')
const fs = require('fs')

const MAX_LINES = parseInt(process.env.MAX_FILE_LINES || '500', 10)
const patterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
]
const ignore = [
  'node_modules/**',
  '.next/**',
  'dist/**',
  'build/**',
  'coverage/**',
  'cypress/**',
]

;(async () => {
  const files = (await glob(patterns, { ignore }))
  const offenders = []
  for (const f of files) {
    const content = fs.readFileSync(f, 'utf8')
    const lines = content.split('\n').length
    if (lines > MAX_LINES) {
      offenders.push({ file: f, lines })
    }
  }
  if (offenders.length) {
    console.error(`\nFound ${offenders.length} long file(s) over ${MAX_LINES} lines:`)
    for (const o of offenders) {
      console.error(` - ${o.file} (${o.lines} lines)`) 
    }
    console.error('\nConsider splitting into smaller modules/components.')
    process.exit(1)
  } else {
    console.log('✅ No long TS/TSX files over limit.')
  }
})().catch((e) => {
  console.error('check-long-files failed:', e)
  process.exit(1)
})
