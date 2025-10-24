#!/usr/bin/env node

/**
 * SUPABASE CLIENT CONSOLIDATION SCRIPT
 *
 * Automatically migrates imports from old client paths to unified clients
 * Part of Priority 1: Consolidation
 *
 * Old paths → New paths:
 * - @/lib/db → @/lib/supabase/browser (browser client)
 * - @/lib/db (createServerClient) → @/lib/supabase/server
 * - @/services/supabase/client → @/lib/supabase/browser
 * - @/services/supabase/core/client → @/lib/supabase/browser
 * - @/services/supabase/server → @/lib/supabase/server
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Migration patterns
const migrations = [
  {
    name: 'lib/db browser client',
    search: /from ['"]@\/lib\/db['"]/g,
    replace: "from '@/lib/supabase/browser'",
    pattern: '@/lib/db'
  },
  {
    name: 'services/supabase/client',
    search: /from ['"]@\/services\/supabase\/client['"]/g,
    replace: "from '@/lib/supabase/browser'",
    pattern: '@/services/supabase/client'
  },
  {
    name: 'services/supabase/core/client',
    search: /from ['"]@\/services\/supabase\/core\/client['"]/g,
    replace: "from '@/lib/supabase/browser'",
    pattern: '@/services/supabase/core/client'
  },
  {
    name: 'services/supabase/server',
    search: /from ['"]@\/services\/supabase\/server['"]/g,
    replace: "from '@/lib/supabase/server'",
    pattern: '@/services/supabase/server'
  }
];

let totalFiles = 0;
let totalReplacements = 0;

console.log('🔄 Starting Supabase client consolidation...\n');

migrations.forEach(({ name, search, replace, pattern }) => {
  console.log(`📝 Migrating: ${name}`);

  // Find files with old imports
  let files;
  try {
    files = execSync(
      `find src -type f \\( -name "*.ts" -o -name "*.tsx" \\) -exec grep -l "${pattern}" {} \\;`,
      { encoding: 'utf-8' }
    )
      .split('\n')
      .filter(Boolean);
  } catch (e) {
    files = [];
  }

  if (files.length === 0) {
    console.log(`   ✓ No files found\n`);
    return;
  }

  console.log(`   Found ${files.length} files to migrate\n`);

  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(search);

    if (matches) {
      const newContent = content.replace(search, replace);
      fs.writeFileSync(file, newContent);

      const count = matches.length;
      totalReplacements += count;
      console.log(`   ✅ ${file}: ${count} replacement(s)`);
    }
  });

  totalFiles += files.length;
  console.log('');
});

console.log(`\n✨ Migration complete!`);
console.log(`📊 Summary:`);
console.log(`   - Files modified: ${totalFiles}`);
console.log(`   - Total replacements: ${totalReplacements}`);
console.log(`\n⚠️  Next steps:`);
console.log(`   1. Run: npm run type-check`);
console.log(`   2. Run: npm test`);
console.log(`   3. Review changes: git diff`);
console.log(`   4. If all looks good, commit changes\n`);
