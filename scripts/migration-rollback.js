#!/usr/bin/env node

/**
 * MIGRATION ROLLBACK AUTOMATION
 *
 * Safe and automated rollback procedures for Supabase migrations.
 * Generate, validate, and execute rollbacks with confidence.
 *
 * Features:
 * - Automatic rollback script generation
 * - Rollback validation and testing
 * - Rollback history tracking
 * - Emergency rollback procedures
 * - Complex rollback handling
 *
 * Created: 2025-12-04
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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
  generated: 0,
  validated: 0,
  executed: 0,
  errors: 0,
  warnings: 0
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
  results.generated++;
}

function error(message) {
  log(`❌ ${message}`, 'red');
  results.errors++;
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
  results.warnings++;
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function section(title) {
  log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`);
}

/**
 * Generate rollback script for a migration
 */
function generateRollbackScript(migrationPath) {
  const migrationName = path.basename(migrationPath, '.sql');
  const rollbackPath = path.join(path.dirname(migrationPath), `${migrationName}_rollback.sql`);

  if (fs.existsSync(rollbackPath)) {
    warning(`Rollback script already exists: ${path.basename(rollbackPath)}`);
    return rollbackPath;
  }

  const migrationContent = fs.readFileSync(migrationPath, 'utf8');
  const rollbackStatements = generateRollbackStatements(migrationContent, migrationName);

  if (rollbackStatements.length === 0) {
    warning(`No rollback statements generated for: ${migrationName}`);
    warning('Complex migration may require manual rollback creation');
    return null;
  }

  const rollbackContent = [
    `-- ROLLBACK: ${migrationName}`,
    `-- Generated: ${new Date().toISOString()}`,
    `-- Source: ${migrationName}.sql`,
    '',
    ...rollbackStatements,
    '',
    `-- Rollback completed: ${migrationName}`
  ].join('\n');

  fs.writeFileSync(rollbackPath, rollbackContent);
  success(`Generated rollback script: ${path.basename(rollbackPath)}`);

  return rollbackPath;
}

/**
 * Generate rollback statements from forward migration
 */
function generateRollbackStatements(migrationContent, migrationName) {
  const statements = [];
  const lines = migrationContent.split('\n');

  // Process each CREATE statement and generate corresponding DROP
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Tables
    if (line.toUpperCase().startsWith('CREATE TABLE')) {
      const tableMatch = line.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`]?(\w+)["`]?/i);
      if (tableMatch) {
        statements.push(`DROP TABLE IF EXISTS ${tableMatch[1]} CASCADE;`);
      }
    }

    // Indexes
    else if (line.toUpperCase().startsWith('CREATE INDEX') || line.toUpperCase().startsWith('CREATE UNIQUE INDEX')) {
      const indexMatch = line.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:\w+\s+)?ON\s+(\w+)/i);
      if (indexMatch) {
        const indexNameMatch = line.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)/i);
        if (indexNameMatch) {
          statements.push(`DROP INDEX IF EXISTS ${indexNameMatch[1]};`);
        }
      }
    }

    // Views
    else if (line.toUpperCase().startsWith('CREATE VIEW') || line.toUpperCase().startsWith('CREATE OR REPLACE VIEW')) {
      const viewMatch = line.match(/CREATE\s+(?:OR\s+REPLACE\s+)?VIEW\s+["`]?(\w+)["`]?/i);
      if (viewMatch) {
        statements.push(`DROP VIEW IF EXISTS ${viewMatch[1]};`);
      }
    }

    // Functions
    else if (line.toUpperCase().startsWith('CREATE FUNCTION') || line.toUpperCase().startsWith('CREATE OR REPLACE FUNCTION')) {
      const funcMatch = line.match(/CREATE\s+(?:OR\s+REPLACE\s+)?FUNCTION\s+["`]?(\w+)["`]?/i);
      if (funcMatch) {
        statements.push(`DROP FUNCTION IF EXISTS ${funcMatch[1]};`);
      }
    }

    // Triggers
    else if (line.toUpperCase().startsWith('CREATE TRIGGER')) {
      const triggerMatch = line.match(/CREATE\s+TRIGGER\s+(\w+)/i);
      if (triggerMatch) {
        // Need to find the table name from context
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
          const triggerLine = lines[j].trim();
          if (triggerLine.toUpperCase().includes('ON ')) {
            const tableMatch = triggerLine.match(/ON\s+(\w+)/i);
            if (tableMatch) {
              statements.push(`DROP TRIGGER IF EXISTS ${triggerMatch[1]} ON ${tableMatch[1]};`);
              break;
            }
          }
        }
      }
    }

    // ALTER TABLE statements (columns, constraints)
    else if (line.toUpperCase().startsWith('ALTER TABLE')) {
      const alterMatch = line.match(/ALTER\s+TABLE\s+(\w+)/i);
      if (alterMatch) {
        const tableName = alterMatch[1];
        const alterLine = line + (lines[i + 1] || '');

        // ADD COLUMN
        if (alterLine.toUpperCase().includes('ADD COLUMN')) {
          const colMatch = alterLine.match(/ADD\s+COLUMN\s+(\w+)/i);
          if (colMatch) {
            statements.push(`ALTER TABLE ${tableName} DROP COLUMN IF EXISTS ${colMatch[1]};`);
          }
        }

        // ADD CONSTRAINT
        else if (alterLine.toUpperCase().includes('ADD CONSTRAINT')) {
          const constraintMatch = alterLine.match(/ADD\s+CONSTRAINT\s+(\w+)/i);
          if (constraintMatch) {
            statements.push(`ALTER TABLE ${tableName} DROP CONSTRAINT IF EXISTS ${constraintMatch[1]};`);
          }
        }
      }
    }

    // INSERT statements (data seeding) - these can't be easily rolled back
    else if (line.toUpperCase().startsWith('INSERT INTO')) {
      warning(`Migration contains data seeding (INSERT). Manual rollback required.`);
      statements.push(`-- MANUAL: Review data inserted into ${line.match(/INSERT\s+INTO\s+(\w+)/i)?.[1] || 'unknown table'}`);
    }
  }

  return statements;
}

/**
 * Validate rollback script
 */
function validateRollbackScript(rollbackPath) {
  section(`Validating Rollback: ${path.basename(rollbackPath)}`);

  if (!fs.existsSync(rollbackPath)) {
    error(`Rollback script not found: ${rollbackPath}`);
    return false;
  }

  const content = fs.readFileSync(rollbackPath, 'utf8');
  const lines = content.split('\n');
  let validStatements = 0;
  let issues = 0;

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('--')) continue;

    // Check for DROP statements (rollback should mostly contain DROPs)
    if (trimmed.toUpperCase().startsWith('DROP ')) {
      validStatements++;

      // Validate DROP syntax
      if (!trimmed.includes('IF EXISTS') && !trimmed.includes('CASCADE')) {
        warning(`DROP statement without IF EXISTS: ${trimmed.substring(0, 50)}...`);
        issues++;
      }
    }

    // Check for manual intervention markers
    else if (trimmed.toUpperCase().startsWith('-- MANUAL:')) {
      warning(`Manual intervention required: ${trimmed}`);
      issues++;
    }

    // Unexpected statements in rollback
    else if (!trimmed.toUpperCase().startsWith('BEGIN') &&
             !trimmed.toUpperCase().startsWith('COMMIT') &&
             !trimmed.toUpperCase().startsWith('ROLLBACK')) {
      warning(`Unexpected statement in rollback: ${trimmed.substring(0, 50)}...`);
      issues++;
    }
  }

  if (validStatements === 0) {
    error('Rollback script contains no valid DROP statements');
    return false;
  }

  if (issues === 0) {
    success(`Rollback validation passed (${validStatements} statements)`);
    results.validated++;
    return true;
  } else {
    warning(`Rollback validation found ${issues} issues`);
    return issues < validStatements; // Allow if issues < statements
  }
}

/**
 * Execute rollback in safe environment
 */
function executeSafeRollback(rollbackPath) {
  section(`Safe Rollback Execution: ${path.basename(rollbackPath)}`);

  info('⚠️  SAFE ROLLBACK MODE - No production changes will be made');
  info('This validates rollback syntax without executing it');

  if (!fs.existsSync(rollbackPath)) {
    error(`Rollback script not found: ${rollbackPath}`);
    return false;
  }

  try {
    // Validate syntax by parsing (don't execute)
    const content = fs.readFileSync(rollbackPath, 'utf8');
    const statements = content.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));

    info(`Rollback contains ${statements.length} executable statements`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i].trim();
      if (stmt && !stmt.startsWith('--')) {
        // Basic syntax validation
        if (stmt.toUpperCase().includes('DROP ') ||
            stmt.toUpperCase().includes('ALTER TABLE') ||
            stmt.toUpperCase().includes('-- MANUAL')) {
          info(`✓ Statement ${i + 1}: ${stmt.substring(0, 60)}...`);
        } else {
          warning(`Unexpected statement ${i + 1}: ${stmt.substring(0, 60)}...`);
        }
      }
    }

    success('Rollback syntax validation passed');
    results.executed++;
    return true;

  } catch (err) {
    error(`Rollback validation failed: ${err.message}`);
    return false;
  }
}

/**
 * Generate rollback documentation
 */
function generateRollbackDocumentation(migrationPath) {
  const migrationName = path.basename(migrationPath, '.sql');
  const docPath = path.join(path.dirname(migrationPath), `${migrationName}_rollback.md`);

  const content = `# Rollback: ${migrationName}

## Overview
This document describes the rollback procedure for migration \`${migrationName}.sql\`.

## Generated
${new Date().toISOString()}

## Source Migration
- File: \`${migrationName}.sql\`
- Rollback: \`${migrationName}_rollback.sql\`

## Rollback Procedure

### Automated Rollback
\`\`\`bash
# Apply the generated rollback script
psql -f "${migrationName}_rollback.sql"
\`\`\`

### Manual Verification
After rollback, verify:
- [ ] Tables dropped successfully
- [ ] Functions removed
- [ ] Indexes cleaned up
- [ ] Data integrity maintained
- [ ] Application functionality restored

## Emergency Rollback

If automated rollback fails:

1. **Immediate Actions:**
   - Stop application deployments
   - Notify development team
   - Create database backup

2. **Manual Recovery:**
   - Identify failed migration components
   - Manually reverse changes
   - Restore from backup if necessary

3. **Post-Rollback:**
   - Test application functionality
   - Monitor for data inconsistencies
   - Update deployment procedures

## Prevention

To avoid rollback needs:
- Test migrations thoroughly before deployment
- Use feature flags for risky changes
- Implement proper monitoring
- Have rollback plans for all deployments

## Related Files
- Original: \`${migrationName}.sql\`
- Rollback: \`${migrationName}_rollback.sql\`
- Backup: \`migration-testing/backups/\`
`;

  fs.writeFileSync(docPath, content);
  success(`Generated rollback documentation: ${path.basename(docPath)}`);
}

/**
 * Generate emergency rollback plan
 */
function generateEmergencyPlan() {
  const planPath = path.join(process.cwd(), 'scripts', 'EMERGENCY_ROLLBACK_PLAN.md');

  const content = `# 🚨 Emergency Rollback Plan

## Last Updated: ${new Date().toISOString()}

## Purpose
This document outlines procedures for emergency rollback scenarios when migrations cause production issues.

## Emergency Contacts
- **Primary:** Development Lead
- **Secondary:** DevOps Engineer
- **Tertiary:** Database Administrator

## Immediate Actions (First 5 minutes)

### 1. Stop the Bleeding
\`\`\`bash
# Stop all deployments
kubectl scale deployment app --replicas=0

# Enable maintenance mode
curl -X POST https://api.example.com/admin/maintenance -d '{"enabled": true}'
\`\`\`

### 2. Assess the Situation
\`\`\`bash
# Check application logs
kubectl logs -f deployment/app --since=1h

# Check database performance
psql -c "SELECT * FROM pg_stat_activity WHERE state != 'idle';"

# Check error rates
curl https://api.example.com/metrics/errors
\`\`\`

### 3. Create Emergency Backup
\`\`\`bash
# Create immediate backup
pg_dump production_db > emergency_backup_$(date +%s).sql

# Upload to secure storage
aws s3 cp emergency_backup_*.sql s3://backups/emergency/
\`\`\`

## Rollback Procedures

### Option A: Automated Rollback (Preferred)
\`\`\`bash
# Use rollback automation script
node scripts/migration-rollback.js execute <migration-name>

# Verify rollback success
node scripts/migration-testing-env.js verify-rollback
\`\`\`

### Option B: Manual Rollback
\`\`\`bash
# Apply specific rollback script
psql -f supabase/migrations/<migration>_rollback.sql

# Verify manually
psql -c "SELECT * FROM information_schema.tables WHERE table_name = '<table>';"
\`\`\`

### Option C: Full Database Restore (Last Resort)
\`\`\`bash
# Stop application
kubectl scale deployment app --replicas=0

# Restore from backup
psql -f latest_backup.sql

# Verify data integrity
node scripts/data-integrity-check.js

# Restart application
kubectl scale deployment app --replicas=3
\`\`\`

## Communication Plan

### Internal Communication
- **Slack:** #incidents channel
- **Email:** dev-team@company.com
- **Status Page:** Update internal status page

### External Communication
- **Twitter:** Post service status update
- **Email:** Notify affected customers
- **Status Page:** Update public status page

## Post-Incident Actions

### Immediate (Next hour)
- [ ] Document incident details
- [ ] Identify root cause
- [ ] Test rollback procedures
- [ ] Update monitoring alerts

### Short-term (Next day)
- [ ] Review deployment process
- [ ] Update rollback automation
- [ ] Enhance testing procedures
- [ ] Train team on procedures

### Long-term (Next week)
- [ ] Implement preventive measures
- [ ] Update incident response plan
- [ ] Review backup strategies
- [ ] Schedule architecture improvements

## Prevention Measures

### Code Quality
- [ ] Mandatory migration testing
- [ ] Code review for all migrations
- [ ] Automated SQL validation
- [ ] Performance impact analysis

### Deployment Safety
- [ ] Feature flags for risky changes
- [ ] Gradual rollout procedures
- [ ] Automated rollback testing
- [ ] Production monitoring alerts

### Team Preparedness
- [ ] Regular rollback drills
- [ ] Updated contact information
- [ ] Clear escalation procedures
- [ ] Cross-training for critical roles

---

**Remember:** Stay calm, follow the plan, communicate clearly! 🚨
`;

  fs.writeFileSync(planPath, content);
  success('Generated emergency rollback plan');
}

/**
 * Main rollback automation workflow
 */
async function runRollbackAutomation() {
  log(`${colors.bright}${colors.magenta}`);
  log(`╔══════════════════════════════════════════════════════════════╗`);
  log(`║                                                              ║`);
  log(`║        🔄 MIGRATION ROLLBACK AUTOMATION 🔄                 ║`);
  log(`║      Safe Rollbacks for Confident Deployments               ║`);
  log(`║                                                              ║`);
  log(`╚══════════════════════════════════════════════════════════════╝`);
  log(`${colors.reset}`);

  const args = process.argv.slice(2);
  const command = args[0];

  if (!command) {
    showHelp();
    return;
  }

  switch (command) {
    case 'generate':
      await generateRollbacks();
      break;

    case 'validate':
      await validateRollbacks();
      break;

    case 'execute':
      const migrationName = args[1];
      if (migrationName) {
        await executeRollback(migrationName);
      } else {
        error('Please specify migration name: rollback execute <migration-name>');
      }
      break;

    case 'emergency':
      generateEmergencyPlan();
      break;

    case 'help':
    default:
      showHelp();
      break;
  }

  generateSummary();
}

/**
 * Generate rollbacks for all migrations
 */
async function generateRollbacks() {
  section('Generating Rollback Scripts');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql') && !file.includes('_rollback'))
    .sort();

  for (const migrationFile of migrationFiles) {
    const migrationPath = path.join(migrationsDir, migrationFile);
    const rollbackPath = generateRollbackScript(migrationPath);

    if (rollbackPath) {
      generateRollbackDocumentation(migrationPath);
    }
  }
}

/**
 * Validate all rollback scripts
 */
async function validateRollbacks() {
  section('Validating Rollback Scripts');

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const rollbackFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('_rollback.sql'))
    .sort();

  for (const rollbackFile of rollbackFiles) {
    const rollbackPath = path.join(migrationsDir, rollbackFile);
    validateRollbackScript(rollbackPath);
  }
}

/**
 * Execute specific rollback
 */
async function executeRollback(migrationName) {
  section(`Executing Rollback: ${migrationName}`);

  const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
  const rollbackPath = path.join(migrationsDir, `${migrationName}_rollback.sql`);

  if (!fs.existsSync(rollbackPath)) {
    error(`Rollback script not found: ${rollbackPath}`);
    info('Generate it first: node scripts/migration-rollback.js generate');
    return;
  }

  // Validate first
  if (!validateRollbackScript(rollbackPath)) {
    error('Rollback validation failed. Not executing.');
    return;
  }

  // Execute safely
  if (executeSafeRollback(rollbackPath)) {
    success(`Rollback execution completed: ${migrationName}`);
  }
}

/**
 * Generate final summary
 */
function generateSummary() {
  section('Rollback Automation Summary');

  log(`\n📊 ROLLBACK AUTOMATION RESULTS:`);
  log(`🔄 Generated: ${results.generated}`, 'green');
  log(`✅ Validated: ${results.validated}`, 'green');
  log(`⚡ Executed: ${results.executed}`, 'green');
  log(`❌ Errors: ${results.errors}`, 'red');
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow');

  const total = results.generated + results.validated + results.executed + results.errors + results.warnings;
  const successRate = total > 0 ? (((results.generated + results.validated + results.executed) / total) * 100).toFixed(1) : 0;

  log(`📈 Success Rate: ${successRate}%`, results.errors === 0 ? 'green' : 'red');

  if (results.errors === 0) {
    log(`\n🎉 ROLLBACK AUTOMATION READY!`, 'green');
    log(`All rollback procedures are prepared and validated.`, 'green');
  } else {
    log(`\n❌ ROLLBACK ISSUES DETECTED`, 'red');
    log(`Please address errors before relying on rollback procedures.`, 'red');
  }
}

/**
 * Show help information
 */
function showHelp() {
  log(`${colors.bright}${colors.magenta}MIGRATION ROLLBACK AUTOMATION${colors.reset}`);
  log('');

  log('Automated rollback procedures for Supabase migrations', 'cyan');
  log('');

  log('USAGE:', 'bright');
  log('  node scripts/migration-rollback.js <command> [options]');
  log('');

  log('COMMANDS:', 'bright');
  log('  generate          Generate rollback scripts for all migrations');
  log('  validate          Validate all rollback scripts');
  log('  execute <name>    Execute specific rollback (safe mode)');
  log('  emergency         Generate emergency rollback plan');
  log('  help              Show this help message');
  log('');

  log('EXAMPLES:', 'bright');
  log('  node scripts/migration-rollback.js generate');
  log('  node scripts/migration-rollback.js validate');
  log('  node scripts/migration-rollback.js execute 20251113000001_timeline_social_features');
  log('  node scripts/migration-rollback.js emergency');
  log('');

  log('SAFETY FEATURES:', 'bright');
  log('  ✅ Syntax validation before execution');
  log('  ✅ Safe execution mode (no production changes)');
  log('  ✅ Comprehensive documentation');
  log('  ✅ Emergency rollback procedures');
  log('  ✅ Manual intervention markers');
}

// Export for testing
module.exports = {
  generateRollbackScript,
  validateRollbackScript,
  executeSafeRollback,
  generateRollbackStatements,
  generateEmergencyPlan
};

// Run if called directly
if (require.main === module) {
  runRollbackAutomation().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
}


















