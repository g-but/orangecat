#!/usr/bin/env node

/**
 * TIMELINE SOCIAL FEATURES TEST SCRIPT
 *
 * Tests the timeline social interaction features:
 * - Likes (toggleLike method)
 * - Dislikes (toggleDislike method) - NEW for scam detection
 * - Comments (addComment method)
 * - Shares (shareEvent method)
 *
 * Created: 2025-12-04
 */

const fs = require('fs');
const path = require('path');

// ANSI color codes
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bright: '\x1b[1m'
};

// Test results
const results = {
  passed: 0,
  failed: 0,
  details: []
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
  results.passed++;
}

function error(message) {
  log(`❌ ${message}`, 'red');
  results.failed++;
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function section(title) {
  log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

async function testDatabaseConnection() {
  section('Database Connection Test');

  try {
    // Try to connect to local Supabase
    const { createClient } = require('@supabase/supabase-js');

    // Check if .env.local exists
    const envPath = path.join(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
      error('Missing .env.local file');
      return false;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const supabaseUrl = envContent.match(/SUPABASE_URL=(.+)/)?.[1]?.trim();
    const supabaseKey = envContent.match(/SUPABASE_ANON_KEY=(.+)/)?.[1]?.trim();

    if (!supabaseUrl || !supabaseKey) {
      error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env.local');
      return false;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection by querying timeline_events table
    const { data, error: queryError } = await supabase
      .from('timeline_events')
      .select('id')
      .limit(1);

    if (queryError) {
      error(`Database query failed: ${queryError.message}`);
      return false;
    }

    success('Database connection successful');
    return { supabase, supabaseUrl, supabaseKey };

  } catch (err) {
    error(`Database connection failed: ${err.message}`);
    return false;
  }
}

async function testTableExistence(supabase) {
  section('Table Existence Test');

  const tables = ['timeline_likes', 'timeline_dislikes', 'timeline_comments', 'timeline_shares'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        // Table doesn't exist
        error(`Table '${table}' does not exist`);
      } else {
        success(`Table '${table}' exists`);
      }
    } catch (err) {
      error(`Error checking table '${table}': ${err.message}`);
    }
  }
}

async function testDatabaseFunctions(supabase) {
  section('Database Function Test');

  const functions = [
    'like_timeline_event',
    'unlike_timeline_event',
    'dislike_timeline_event',
    'undislike_timeline_event',
    'share_timeline_event',
    'add_timeline_comment',
    'get_enriched_timeline_feed'
  ];

  for (const func of functions) {
    try {
      // Try to call the function with invalid params to test if it exists
      const { error } = await supabase.rpc(func, { p_event_id: 'invalid-uuid' });

      if (error && error.message.includes('function') && error.message.includes('does not exist')) {
        error(`Database function '${func}' does not exist`);
      } else {
        success(`Database function '${func}' exists`);
      }
    } catch (err) {
      error(`Error testing function '${func}': ${err.message}`);
    }
  }
}

async function testServiceMethods() {
  section('Service Layer Test');

  try {
    // Check if the timeline service file exists and has the methods
    const servicePath = './src/services/timeline/index.ts';
    const content = fs.readFileSync(servicePath, 'utf8');

    // Check if methods exist in the source code
    const methods = ['toggleLike', 'toggleDislike', 'addComment', 'shareEvent'];

    for (const method of methods) {
      if (content.includes(`async ${method}(`)) {
        success(`Service method '${method}' exists in source`);
      } else {
        error(`Service method '${method}' missing from source`);
      }
    }

  } catch (err) {
    error(`Service layer test failed: ${err.message}`);
  }
}

async function testComponentIntegration() {
  section('Component Integration Test');

  try {
    const componentPath = './src/components/timeline/TimelineComponent.tsx';
    const content = fs.readFileSync(componentPath, 'utf8');

    // Check for dislike button
    if (content.includes('handleDislike')) {
      success('Component has handleDislike function');
    } else {
      error('Component missing handleDislike function');
    }

    if (content.includes('ThumbsDown')) {
      success('Component imports ThumbsDown icon');
    } else {
      error('Component missing ThumbsDown icon import');
    }

    if (content.includes('isDisliking')) {
      success('Component has isDisliking state');
    } else {
      error('Component missing isDisliking state');
    }

    // Check for dislike button in UI
    if (content.includes('onClick={handleDislike}')) {
      success('Component has dislike button in UI');
    } else {
      error('Component missing dislike button in UI');
    }

  } catch (err) {
    error(`Component integration test failed: ${err.message}`);
  }
}

async function testTypeDefinitions() {
  section('Type Definition Test');

  try {
    const typesPath = './src/types/timeline.ts';
    const content = fs.readFileSync(typesPath, 'utf8');

    if (content.includes('userDisliked?: boolean')) {
      success('Type definition includes userDisliked field');
    } else {
      error('Type definition missing userDisliked field');
    }

    if (content.includes('dislikesCount?: number')) {
      success('Type definition includes dislikesCount field');
    } else {
      error('Type definition missing dislikesCount field');
    }

  } catch (err) {
    error(`Type definition test failed: ${err.message}`);
  }
}

function generateReport() {
  section('Test Report');

  const total = results.passed + results.failed;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;

  log(`\n📊 TEST SUMMARY:`);
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`📈 Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : 'red');

  if (results.failed === 0) {
    log(`\n🎉 ALL TESTS PASSED!`, 'green');
    log(`Timeline social features are ready for testing!`, 'green');
  } else {
    log(`\n⚠️  SOME TESTS FAILED`, 'yellow');
    log(`Please address the failed tests before proceeding.`, 'yellow');
  }

  return results.failed === 0;
}

async function main() {
  log(`${colors.bright}${colors.magenta}`);
  log(`╔══════════════════════════════════════════════════════════════╗`);
  log(`║                                                              ║`);
  log(`║        🧡 TIMELINE SOCIAL FEATURES TEST SUITE 🧡            ║`);
  log(`║                                                              ║`);
  log(`╚══════════════════════════════════════════════════════════════╝`);
  log(`${colors.reset}`);

  info('Testing timeline social features implementation...');

  try {
    const dbConnection = await testDatabaseConnection();

    if (dbConnection) {
      await testTableExistence(dbConnection.supabase);
      await testDatabaseFunctions(dbConnection.supabase);
    } else {
      log('\n⚠️  Skipping database tests due to connection failure', 'yellow');
    }

    await testServiceMethods();
    await testComponentIntegration();
    await testTypeDefinitions();

    const success = generateReport();
    process.exit(success ? 0 : 1);

  } catch (err) {
    error(`Test suite failed: ${err.message}`);
    process.exit(1);
  }
}

// Run the tests
if (require.main === module) {
  main();
}

module.exports = {
  testDatabaseConnection,
  testTableExistence,
  testDatabaseFunctions,
  testServiceMethods,
  testComponentIntegration,
  testTypeDefinitions,
  generateReport
};
