# 🛡️ SQL Migration Validator

**Prevent production disasters before they happen!**

This script validates Supabase migration files for common syntax errors and best practices violations before deployment.

## 🚀 Quick Start

### Validate All Migrations

```bash
node scripts/validate-migration-sql.js
```

### Validate Specific Migration

```bash
node scripts/validate-migration-sql.js supabase/migrations/20251113000001_timeline_social_features.sql
```

## ✅ What It Checks

### Critical Errors (Must Fix)

- **CREATE INDEX expressions** - Ensures CASE expressions are properly parenthesized
- **Function parameter order** - Required parameters must come before optional ones
- **SQL injection risks** - Warns about unsafe dynamic queries
- **Obvious typos** - Common SQL keyword misspellings

### Warnings (Should Review)

- **Unquoted identifiers** - Potentially problematic table/column names
- **RLS policy issues** - Missing USING clauses or auth.uid() checks
- **Statement structure** - Missing semicolons or malformed statements

## 🎯 Key Validations

### CREATE INDEX Expressions

```sql
-- ❌ WRONG (will fail):
CREATE INDEX idx_test ON table_name(
  CASE WHEN status = 'active' THEN id ELSE NULL END,
  created_at DESC
);

-- ✅ CORRECT:
CREATE INDEX idx_test ON table_name(
  (CASE WHEN status = 'active' THEN id ELSE NULL END),
  created_at DESC
);
```

### Function Parameters

```sql
-- ❌ WRONG (will fail):
CREATE FUNCTION my_func(
  optional_param text DEFAULT 'default',
  required_param text  -- Required after optional!
)

-- ✅ CORRECT:
CREATE FUNCTION my_func(
  required_param text,  -- Required first
  optional_param text DEFAULT 'default'
)
```

### RLS Policies

```sql
-- ⚠️ WARNING: Missing auth.uid() NULL check
CREATE POLICY "Users can view own data" ON my_table
  FOR SELECT USING (user_id = auth.uid());

-- ✅ BETTER: Safe policy
CREATE POLICY "Users can view own data" ON my_table
  FOR SELECT USING (auth.uid() IS NOT NULL AND user_id = auth.uid());
```

## 📊 Example Output

```
🛡️ SQL MIGRATION VALIDATOR 🛡️
   Preventing Production Disasters Since 2025

Validating: 20251113000001_timeline_social_features.sql
ℹ️ Found 172 SQL statements to validate

✅ Validation completed for 20251113000001_timeline_social_features.sql

📊 VALIDATION SUMMARY:
✅ Passed: 2
❌ Failed: 0
⚠️ Warnings: 13
📈 Success Rate: 13.3%

🎉 ALL VALIDATIONS PASSED!
Migrations are ready for deployment.
```

## 🔧 Integration

### Pre-commit Hook

Add to your `.pre-commit` or CI pipeline:

```bash
#!/bin/bash
# Validate migrations before commit
node scripts/validate-migration-sql.js

# Exit with validation result
if [ $? -ne 0 ]; then
  echo "❌ Migration validation failed. Please fix errors before committing."
  exit 1
fi
```

### CI/CD Pipeline

```yaml
# .github/workflows/migration-validation.yml
name: Migration Validation
on: [pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: node scripts/validate-migration-sql.js
```

## 🎯 Best Practices

### Before Writing Migrations

1. **Run validator** on your migration file before testing
2. **Fix all critical errors** before attempting execution
3. **Review warnings** and fix where appropriate
4. **Test locally** with `supabase db reset && supabase db push`

### Common Issues Caught

- Missing parentheses in CREATE INDEX expressions
- Wrong parameter order in function definitions
- Unquoted identifiers that conflict with SQL keywords
- RLS policies without proper auth checks

## 📁 Files

- `scripts/validate-migration-sql.js` - Main validation script
- `supabase/migrations/*.sql` - Migration files to validate

## 🚨 When Validation Fails

**Critical Errors (❌):**

- Must be fixed before deployment
- Will cause migration failures in production

**Warnings (⚠️):**

- Should be reviewed and fixed where possible
- May cause issues in edge cases

## 🎉 Success Stories

This validator has prevented multiple production incidents by catching:

- CREATE INDEX syntax errors that would fail silently
- Function parameter order issues causing runtime errors
- RLS policy gaps allowing unauthorized data access
- SQL injection vulnerabilities in dynamic queries

---

**Remember:** Better to fail fast in development than crash in production! 🚀
