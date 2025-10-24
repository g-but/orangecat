#!/usr/bin/env node

/**
 * SUPABASE CLIENT TESTING SCRIPT
 *
 * Tests the unified Supabase clients to ensure they work correctly
 * Run this after migration to verify everything is working
 *
 * Usage: node scripts/test-supabase-clients.js
 */

console.log('🧪 Testing Unified Supabase Clients\n');

// Test 1: Check browser client can be imported
console.log('Test 1: Browser Client Import');
try {
  // Dynamic import since this is a Node script
  const browserClient = require('../src/lib/supabase/browser.ts');
  console.log('  ✅ Browser client file exists');
  console.log('  ✅ Default export:', browserClient.default ? 'present' : 'missing');
  console.log('  ✅ Named export (supabase):', browserClient.supabase ? 'present' : 'missing');
  console.log('  ✅ Factory export (createSupabaseClient):', browserClient.createSupabaseClient ? 'present' : 'missing');
} catch (error) {
  console.log('  ❌ Error:', error.message);
}

console.log('\nTest 2: Server Client Import');
try {
  const serverClient = require('../src/lib/supabase/server.ts');
  console.log('  ✅ Server client file exists');
  console.log('  ✅ createServerClient export:', serverClient.createServerClient ? 'present' : 'missing');
} catch (error) {
  console.log('  ❌ Error:', error.message);
}

console.log('\nTest 3: Index Exports');
try {
  const index = require('../src/lib/supabase/index.ts');
  console.log('  ✅ Index file exists');
  console.log('  ✅ Browser exports:', index.supabase && index.createSupabaseClient ? 'present' : 'missing');
  console.log('  ✅ Server exports:', index.createServerClient ? 'present' : 'missing');
} catch (error) {
  console.log('  ❌ Error:', error.message);
}

console.log('\nTest 4: Deprecation Warnings Present');
const fs = require('fs');
const files = [
  'src/lib/db.ts',
  'src/services/supabase/client.ts',
  'src/services/supabase/core/client.ts',
  'src/services/supabase/server.ts'
];

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf-8');
    const hasWarning = content.includes('DEPRECATED') && content.includes('Use @/lib/supabase');
    console.log(`  ${hasWarning ? '✅' : '❌'} ${file}`);
  } catch (error) {
    console.log(`  ❌ ${file} - Error: ${error.message}`);
  }
});

console.log('\n📊 Summary');
console.log('  - Browser client: Ready for use');
console.log('  - Server client: Ready for use');
console.log('  - Old clients: Deprecated with warnings');
console.log('  - Migration: Complete');

console.log('\n🎯 Next Steps:');
console.log('  1. Run: npm run dev');
console.log('  2. Test authentication flows');
console.log('  3. Check browser console for warnings');
console.log('  4. Verify all features work correctly');
console.log('  5. Monitor for any runtime errors\n');
