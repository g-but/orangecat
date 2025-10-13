#!/usr/bin/env node

/**
 * ORANGECAT PRODUCTION VALIDATION
 * Complete validation before deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// REMOVED: console.log statement

// REMOVED: console.log statement
// REMOVED: console.log statement
try {
  const consoleCheck = execSync('grep -r "console\\." src/ --include="*.tsx" --include="*.ts" | grep -v "__tests__" | grep -v SafeConsole', { encoding: 'utf8' });
  if (consoleCheck) {
    // REMOVED: console.log statement
    // REMOVED: console.log statement
    process.exit(1);
  }
} catch (error) {
  if (process.env.NODE_ENV === 'development') console.log('✅ No problematic console statements found');
}

// 2. TypeScript check
// REMOVED: console.log statement
try {
  execSync('npx tsc --noEmit', { stdio: 'inherit' });
  if (process.env.NODE_ENV === 'development') console.log('✅ TypeScript validation passed');
} catch (error) {
  // REMOVED: console.log statement
  process.exit(1);
}

// 3. Test suite
// REMOVED: console.log statement
try {
  execSync('npm test -- --watchAll=false --coverage', { stdio: 'inherit' });
  if (process.env.NODE_ENV === 'development') console.log('✅ All tests passed');
} catch (error) {
  // REMOVED: console.log statement
  process.exit(1);
}

// 4. Build check
// REMOVED: console.log statement
try {
  execSync('npm run build', { stdio: 'inherit' });
  if (process.env.NODE_ENV === 'development') console.log('✅ Production build successful');
} catch (error) {
  // REMOVED: console.log statement
  process.exit(1);
}

// REMOVED: console.log statement