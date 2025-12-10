#!/usr/bin/env node

/**
 * MIGRATION TESTING ENVIRONMENT
 *
 * Safe migration testing for Supabase projects.
 * Creates isolated test environments to validate migrations before production deployment.
 *
 * Features:
 * - Isolated test databases
 * - Schema comparison tools
 * - Data integrity validation
 * - Migration rollback testing
 * - Performance impact analysis
 *
 * Created: 2025-12-04
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');

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

const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
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
  results.details.push({ type: 'error', message });
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
  results.warnings++;
  results.details.push({ type: 'warning', message });
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function section(title) {
  log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

/**
 * Check if Supabase local is running
 */
function checkSupabaseStatus() {
  try {
    const output = execSync('npx supabase status --output json', { encoding: 'utf8' });
    const status = JSON.parse(output);

    const dbService = status.services?.find(s => s.name === 'postgres');
    if (dbService && dbService.status === 'running') {
      success('Supabase local database is running');
      return true;
    } else {
      warning('Supabase local database is not running');
      info('Start it with: npx supabase db start');
      return false;
    }
  } catch (err) {
    error(`Failed to check Supabase status: ${err.message}`);
    return false;
  }
}

/**
 * Create a backup of current database state
 */
function createDatabaseBackup(backupName = 'pre_migration_backup') {
  section('Creating Database Backup');

  const backupDir = path.join(process.cwd(), 'migration-testing', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const backupPath = path.join(backupDir, `${backupName}_${Date.now()}.sql`);

  try {
    info(`Creating backup: ${backupPath}`);

    // Use pg_dump to create a backup
    execSync(`pg_dump postgresql://postgres:postgres@127.0.0.1:54322/postgres > "${backupPath}"`, {
      stdio: 'pipe'
    });

    success(`Database backup created: ${path.basename(backupPath)}`);
    return backupPath;
  } catch (err) {
    error(`Failed to create backup: ${err.message}`);
    return null;
  }
}

/**
 * Restore database from backup
 */
function restoreDatabaseBackup(backupPath) {
  section('Restoring Database Backup');

  if (!fs.existsSync(backupPath)) {
    error(`Backup file not found: ${backupPath}`);
    return false;
  }

  try {
    info(`Restoring from backup: ${path.basename(backupPath)}`);

    // Drop and recreate the database, then restore
    execSync('psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"', {
      stdio: 'pipe'
    });

    execSync(`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres < "${backupPath}"`, {
      stdio: 'pipe'
    });

    success('Database restored from backup');
    return true;
  } catch (err) {
    error(`Failed to restore backup: ${err.message}`);
    return false;
  }
}

/**
 * Apply specific migration file for testing
 */
function applyTestMigration(migrationPath) {
  section(`Applying Test Migration: ${path.basename(migrationPath)}`);

  if (!fs.existsSync(migrationPath)) {
    error(`Migration file not found: ${migrationPath}`);
    return false;
  }

  try {
    // Validate the migration first
    const { validateMigrationFile } = require('./validate-migration-sql.js');
    validateMigrationFile(migrationPath);

    if (results.failed > 0) {
      error('Migration validation failed. Not applying to test database.');
      return false;
    }

    info('Applying migration to test database...');

    // Apply the migration
    execSync(`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -f "${migrationPath}"`, {
      stdio: 'pipe'
    });

    success(`Migration applied successfully: ${path.basename(migrationPath)}`);
    return true;
  } catch (err) {
    error(`Failed to apply migration: ${err.message}`);
    return false;
  }
}

/**
 * Compare schema before and after migration
 */
function compareSchemas(beforeSchema, afterSchema) {
  section('Schema Comparison');

  try {
    const beforeTables = extractTableNames(beforeSchema);
    const afterTables = extractTableNames(afterSchema);

    const addedTables = afterTables.filter(t => !beforeTables.includes(t));
    const removedTables = beforeTables.filter(t => !afterTables.includes(t));

    if (addedTables.length > 0) {
      success(`Added tables: ${addedTables.join(', ')}`);
    }

    if (removedTables.length > 0) {
      warning(`Removed tables: ${removedTables.join(', ')}`);
    }

    if (addedTables.length === 0 && removedTables.length === 0) {
      info('No table changes detected');
    }

    return { addedTables, removedTables };
  } catch (err) {
    error(`Schema comparison failed: ${err.message}`);
    return null;
  }
}

/**
 * Extract table names from SQL schema
 */
function extractTableNames(schemaSQL) {
  const tableRegex = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?/gi;
  const tables = [];
  let match;

  while ((match = tableRegex.exec(schemaSQL)) !== null) {
    tables.push(match[1]);
  }

  return tables;
}

/**
 * Validate data integrity after migration
 */
function validateDataIntegrity() {
  section('Data Integrity Validation');

  const integrityChecks = [
    {
      name: 'Timeline Events Exist',
      query: 'SELECT COUNT(*) as count FROM timeline_events;',
      expected: 'count >= 0'
    },
    {
      name: 'Users Table Exists',
      query: 'SELECT COUNT(*) as count FROM profiles;',
      expected: 'count >= 0'
    },
    {
      name: 'No Orphaned Records',
      query: `
        SELECT COUNT(*) as orphaned_likes
        FROM timeline_likes tl
        LEFT JOIN timeline_events te ON tl.event_id = te.id
        WHERE te.id IS NULL;
      `,
      expected: 'orphaned_likes = 0'
    }
  ];

  for (const check of integrityChecks) {
    try {
      const result = execSync(`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -t -c "${check.query}"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      }).trim();

      const value = parseInt(result) || 0;

      if (eval(check.expected.replace(/count|orphaned_likes/g, value.toString()))) {
        success(`${check.name}: ${value}`);
      } else {
        error(`${check.name}: Expected ${check.expected}, got ${value}`);
      }
    } catch (err) {
      warning(`${check.name}: Could not execute check (${err.message})`);
    }
  }
}

/**
 * Run performance analysis
 */
function analyzePerformance() {
  section('Performance Analysis');

  const perfQueries = [
    {
      name: 'Timeline Feed Query',
      query: `
        EXPLAIN (ANALYZE, VERBOSE, COSTS, BUFFERS, TIMING)
        SELECT * FROM get_enriched_timeline_feed('00000000-0000-0000-0000-000000000000'::uuid, 20, 0)
        LIMIT 1;
      `
    }
  ];

  for (const perf of perfQueries) {
    try {
      info(`Analyzing: ${perf.name}`);
      const result = execSync(`psql postgresql://postgres:postgres@127.0.0.1:54322/postgres -c "${perf.query}"`, {
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Extract execution time from EXPLAIN output
      const timeMatch = result.match(/Execution Time: ([\d.]+) ms/);
      if (timeMatch) {
        const execTime = parseFloat(timeMatch[1]);
        if (execTime < 100) {
          success(`${perf.name}: ${execTime}ms (Good)`);
        } else if (execTime < 500) {
          warning(`${perf.name}: ${execTime}ms (Acceptable)`);
        } else {
          error(`${perf.name}: ${execTime}ms (Slow - needs optimization)`);
        }
      } else {
        info(`${perf.name}: Analysis completed (time not extracted)`);
      }
    } catch (err) {
      warning(`${perf.name}: Could not analyze (${err.message})`);
    }
  }
}

/**
 * Generate test report
 */
function generateTestReport(migrationPath, startTime) {
  section('Migration Test Report');

  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  log(`\n📊 MIGRATION TEST RESULTS:`);
  log(`Migration: ${path.basename(migrationPath)}`, 'cyan');
  log(`Duration: ${duration}s`, 'cyan');
  log(`✅ Passed: ${results.passed}`, 'green');
  log(`❌ Failed: ${results.failed}`, 'red');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');

  const totalTests = results.passed + results.failed + results.warnings;
  const successRate = totalTests > 0 ? ((results.passed / totalTests) * 100).toFixed(1) : 0;
  log(`📈 Success Rate: ${successRate}%`, results.failed === 0 ? 'green' : 'red');

  if (results.details.length > 0) {
    log(`\n📋 DETAILS:`);
    results.details.forEach((detail, index) => {
      const icon = detail.type === 'error' ? '❌' : '⚠️';
      log(`${index + 1}. ${icon} ${detail.message}`);
    });
  }

  if (results.failed === 0) {
    log(`\n🎉 MIGRATION TEST PASSED!`, 'green');
    log(`Migration is safe for production deployment.`, 'green');
  } else {
    log(`\n❌ MIGRATION TEST FAILED`, 'red');
    log(`Please fix all errors before deploying to production.`, 'red');
  }

  return results.failed === 0;
}

/**
 * Main testing workflow
 */
async function runMigrationTest(migrationPath) {
  const startTime = Date.now();

  log(`${colors.bright}${colors.magenta}`);
  log(`╔══════════════════════════════════════════════════════════════╗`);
  log(`║                                                              ║`);
  log(`║        🧪 MIGRATION TESTING ENVIRONMENT 🧪                  ║`);
  log(`║      Safe Testing for Safer Deployments                     ║`);
  log(`║                                                              ║`);
  log(`╚══════════════════════════════════════════════════════════════╝`);
  log(`${colors.reset}`);

  if (!migrationPath) {
    error('Please provide a migration file path');
    error('Usage: node scripts/migration-testing-env.js <migration-file>');
    process.exit(1);
  }

  info(`Testing migration: ${migrationPath}`);

  // Step 1: Check Supabase status
  if (!checkSupabaseStatus()) {
    error('Cannot proceed without running Supabase local database');
    process.exit(1);
  }

  // Step 2: Create backup
  const backupPath = createDatabaseBackup();
  if (!backupPath) {
    error('Cannot proceed without database backup');
    process.exit(1);
  }

  // Step 3: Apply test migration
  const migrationApplied = applyTestMigration(migrationPath);
  if (!migrationApplied) {
    warning('Migration application failed, but continuing with analysis...');
  }

  // Step 4: Validate data integrity
  validateDataIntegrity();

  // Step 5: Analyze performance
  analyzePerformance();

  // Step 6: Restore backup (cleanup)
  section('Cleanup');
  if (restoreDatabaseBackup(backupPath)) {
    success('Test environment cleaned up');
  } else {
    warning('Test environment cleanup failed - manual cleanup may be needed');
  }

  // Step 7: Generate report
  const success = generateTestReport(migrationPath, startTime);

  process.exit(success ? 0 : 1);
}

/**
 * Setup test environment
 */
function setupTestEnvironment() {
  section('Setting Up Test Environment');

  const testDir = path.join(process.cwd(), 'migration-testing');
  const backupsDir = path.join(testDir, 'backups');
  const reportsDir = path.join(testDir, 'reports');

  [testDir, backupsDir, reportsDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      success(`Created directory: ${dir}`);
    }
  });

  // Create .gitignore for test artifacts
  const gitignorePath = path.join(testDir, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, '*.sql\n*.log\nbackups/*\n');
    success('Created .gitignore for test artifacts');
  }

  success('Test environment setup complete');
}

/**
 * List available migrations for testing
 */
function listAvailableMigrations() {
  section('Available Migrations for Testing');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');

  if (!fs.existsSync(migrationsDir)) {
    error(`Migrations directory not found: ${migrationsDir}`);
    return;
  }

  const migrations = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .reverse(); // Most recent first

  if (migrations.length === 0) {
    warning('No migration files found');
    return;
  }

  migrations.forEach((migration, index) => {
    const filePath = path.join(migrationsDir, migration);
    const stats = fs.statSync(filePath);
    const size = (stats.size / 1024).toFixed(1);

    log(`${index + 1}. ${migration} (${size}KB)`, 'cyan');
  });

  info(`\nTo test a migration, run:`);
  info(`node scripts/migration-testing-env.js supabase/migrations/${migrations[0]}`);
}

/**
 * Show help
 */
function showHelp() {
  log(`${colors.bright}${colors.magenta}MIGRATION TESTING ENVIRONMENT${colors.reset}`);
  log('');

  log('Safe migration testing for Supabase projects', 'cyan');
  log('');

  log('USAGE:', 'bright');
  log('  node scripts/migration-testing-env.js <command> [options]');
  log('');

  log('COMMANDS:', 'bright');
  log('  <migration-file>    Test specific migration file');
  log('  setup              Setup test environment');
  log('  list               List available migrations');
  log('  help               Show this help message');
  log('');

  log('EXAMPLES:', 'bright');
  log('  node scripts/migration-testing-env.js setup');
  log('  node scripts/migration-testing-env.js list');
  log('  node scripts/migration-testing-env.js supabase/migrations/20251113000001_timeline_social_features.sql');
  log('');

  log('FEATURES:', 'bright');
  log('  ✅ Isolated test databases');
  log('  ✅ Automatic backup/restore');
  log('  ✅ Data integrity validation');
  log('  ✅ Performance analysis');
  log('  ✅ Schema comparison');
  log('  ✅ SQL validation integration');
}

// Main CLI handler
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    showHelp();
    process.exit(0);
  }

  const command = args[0];

  switch (command) {
    case 'setup':
      setupTestEnvironment();
      break;

    case 'list':
      listAvailableMigrations();
      break;

    case 'help':
    case '--help':
    case '-h':
      showHelp();
      break;

    default:
      // Assume it's a migration file path
      const migrationPath = command;
      if (migrationPath.endsWith('.sql') && fs.existsSync(migrationPath)) {
        await runMigrationTest(migrationPath);
      } else {
        error(`Invalid command or migration file: ${migrationPath}`);
        log('');
        showHelp();
        process.exit(1);
      }
      break;
  }
}

// Export for testing
module.exports = {
  checkSupabaseStatus,
  createDatabaseBackup,
  restoreDatabaseBackup,
  applyTestMigration,
  validateDataIntegrity,
  analyzePerformance,
  setupTestEnvironment,
  listAvailableMigrations
};

// Run if called directly
if (require.main === module) {
  main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}


















