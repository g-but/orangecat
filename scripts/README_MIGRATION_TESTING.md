# 🧪 Migration Testing Environment

**Safe migration testing for safer deployments!**

Comprehensive testing environment for Supabase migrations with isolated databases, data integrity validation, and performance analysis.

> Important: OrangeCat uses remote-only Supabase. Do not run `supabase start` or any local DB. This document describes a legacy local testing approach and is kept for historical context only.

## 🚀 Quick Start (Legacy)

### 1. Setup Testing Environment

```bash
node scripts/migration-testing-env.js setup
```

### 2. Start Supabase Local (do not use in OrangeCat)

```bash
npx supabase start
```

### 3. Test a Migration (legacy flow)

```bash
node scripts/migration-testing-env.js supabase/migrations/20251113000001_timeline_social_features.sql
```

### 4. List Available Migrations

```bash
node scripts/migration-testing-env.js list
```

## ✅ What It Tests

### Database Safety

- **Isolated Testing** - Tests run in isolated database environment
- **Automatic Backup** - Creates backup before testing
- **Auto Cleanup** - Restores original state after testing
- **No Production Impact** - Zero risk to production data

### Migration Validation

- **SQL Syntax** - Validates using the SQL validator
- **Schema Changes** - Tracks added/removed tables and columns
- **Data Integrity** - Validates referential integrity
- **Performance Impact** - Analyzes query performance changes

### Production Readiness

- **Rollback Safety** - Tests rollback procedures
- **RLS Policies** - Validates security policies
- **Index Performance** - Checks query optimization
- **Function Dependencies** - Validates function relationships

## 📊 Example Test Output

```
🧪 MIGRATION TESTING ENVIRONMENT 🧪
   Safe Testing for Safer Deployments

Testing migration: 20251113000001_timeline_social_features.sql

=== Creating Database Backup ===
✅ Database backup created: pre_migration_backup_1733328000000.sql

=== Applying Test Migration: 20251113000001_timeline_social_features.sql ===
✅ Migration applied successfully: 20251113000001_timeline_social_features.sql

=== Data Integrity Validation ===
✅ Timeline Events Exist: 42
✅ Users Table Exists: 15
✅ No Orphaned Records: 0

=== Performance Analysis ===
✅ Timeline Feed Query: 45.2ms (Good)

=== Cleanup ===
✅ Test environment cleaned up

📊 MIGRATION TEST RESULTS:
Migration: 20251113000001_timeline_social_features.sql
Duration: 12.3s
✅ Passed: 8
❌ Failed: 0
⚠️ Warnings: 2
📈 Success Rate: 80.0%

🎉 MIGRATION TEST PASSED!
Migration is safe for production deployment.
```

## 🏗️ Architecture

### Test Environment Structure

```
migration-testing/
├── backups/           # Database backups
├── reports/           # Test reports
└── .gitignore        # Ignore test artifacts
```

### Testing Workflow

1. **Validate SQL** - Run syntax validation
2. **Create Backup** - Backup current database state
3. **Apply Migration** - Test migration in isolation
4. **Verify Integrity** - Check data consistency
5. **Analyze Performance** - Measure query performance
6. **Restore State** - Clean up test environment
7. **Generate Report** - Comprehensive test results

## 🎯 Key Features

### Automatic Backup & Restore

```bash
# Creates timestamped backup
pre_migration_backup_1733328000000.sql

# Automatically restores after testing
# No manual cleanup needed
```

### Data Integrity Checks

- Orphaned records detection
- Foreign key validation
- Table existence verification
- Row count consistency

### Performance Analysis

- Query execution time measurement
- EXPLAIN plan analysis
- Index effectiveness validation
- Bottleneck identification

### Schema Comparison

- Added/removed tables tracking
- Column changes detection
- Index modifications
- Constraint validation

## 🔧 Integration

### Pre-deployment Checklist

```bash
# 1. Validate SQL syntax
node scripts/validate-migration-sql.js migration.sql

# 2. Test in isolated environment
node scripts/migration-testing-env.js migration.sql

# 3. Verify in staging (if available)
# Deploy to staging environment

# 4. Production deployment
npx supabase db push
```

### CI/CD Pipeline Integration

```yaml
# .github/workflows/migration-testing.yml
name: Migration Testing
on: [pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Setup Supabase
        run: npm install -g supabase

      - name: Setup test database
        run: |
          createdb -h localhost -U postgres test_db
          psql -h localhost -U postgres -d test_db -f init.sql

      - name: Run migration tests
        run: node scripts/migration-testing-env.js supabase/migrations/*.sql
```

## 🚨 Error Handling

### Common Issues & Solutions

#### Database Not Running

```
⚠️ Supabase local database is not running
ℹ️ Start it with: npx supabase db start
```

**Solution:**

```bash
npx supabase start  # Start all services
# OR
npx supabase db start  # Start database only
```

#### Migration Validation Failed

```
❌ Migration validation failed. Not applying to test database.
```

**Solution:**

- Fix SQL syntax errors
- Check function parameter orders
- Validate CREATE INDEX expressions
- Review RLS policies

#### Performance Issues Detected

```
❌ Timeline Feed Query: 1250.5ms (Slow - needs optimization)
```

**Solution:**

- Add missing indexes
- Optimize query structure
- Review table relationships
- Consider query caching

## 📋 Testing Checklist

### Before Migration Testing

- [ ] Supabase local is running
- [ ] Test environment is set up
- [ ] Migration file exists and is readable
- [ ] SQL validation passes
- [ ] Backup directory has sufficient space

### During Migration Testing

- [ ] Backup creation succeeds
- [ ] Migration applies without errors
- [ ] Data integrity checks pass
- [ ] Performance is acceptable
- [ ] Schema changes are expected

### After Migration Testing

- [ ] Database is restored to original state
- [ ] Test artifacts are cleaned up
- [ ] Test report is generated
- [ ] Results are reviewed by team

## 🎯 Best Practices

### Migration Development

1. **Write migrations incrementally** - Small, focused changes
2. **Test each migration** - Don't batch untested migrations
3. **Validate before commit** - Catch issues early
4. **Document changes** - Explain what and why

### Testing Strategy

1. **Test in isolation** - Each migration independently
2. **Verify rollback** - Ensure safe rollback procedures
3. **Check performance** - Monitor query performance impact
4. **Validate security** - Confirm RLS policies work

### Deployment Safety

1. **Backup production** - Always before deploying
2. **Deploy during low traffic** - Minimize user impact
3. **Monitor after deployment** - Watch for issues
4. **Have rollback plan** - Be prepared to revert

## 📁 Files

- `scripts/migration-testing-env.js` - Main testing script
- `scripts/validate-migration-sql.js` - SQL validation
- `migration-testing/backups/` - Database backups
- `migration-testing/reports/` - Test reports
- `supabase/migrations/*.sql` - Migration files

## 🚀 Advanced Usage

### Custom Test Scenarios

```javascript
// In migration-testing-env.js
function runCustomTests(migrationPath) {
  // Add custom validation logic
  // Test specific business rules
  // Validate complex relationships
}
```

### Performance Baselines

```javascript
// Define acceptable performance thresholds
const PERFORMANCE_THRESHOLDS = {
  timeline_feed: 100, // ms
  user_search: 50, // ms
  data_aggregation: 200, // ms
};
```

### Integration Testing

```bash
# Test migration with application code
npm run test:e2e -- --migration=20251113000001_timeline_social_features.sql
```

---

**Remember:** Test migrations thoroughly to prevent production disasters! 🛡️


