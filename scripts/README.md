# Scripts Directory

This directory contains all automation scripts organized by purpose.

## Directory Structure

- **`analysis/`** - Bundle analysis, documentation checking, and optimization tools
- **`auth-fix/`** - Scripts to fix authentication and RLS policy issues
- **`db/`** - Database operations, migrations, and schema management
  - Migration scripts moved from root: `apply-migration.js`, `apply-*-migration.js`
  - Old schema files archived in `db/archive/`
- **`deployment/`** - Deployment, production setup, and monitoring scripts
- **`dev/`** - Development helpers, local setup, and debugging tools
- **`diagnostics/`** - Health checks and system diagnostics
- **`maintenance/`** - Cleanup, optimization, and maintenance scripts
- **`monitoring/`** - Performance monitoring and bundle size tracking
- **`oauth/`** - OAuth provider setup and configuration
- **`profile-fix/`** - Scripts to fix profile-related issues
- **`schema-fix/`** - Database schema fixes and migrations
- **`storage/`** - Supabase storage bucket setup and management
- **`test/`** - Testing utilities and validation scripts
  - Test/debug scripts moved from root: `test-*.js`, `check-*.js`, `debug-*.js`

## Usage

Most scripts can be run with:
```bash
node scripts/{category}/script-name.js
```

For deployment scripts:
```bash
bash scripts/deployment/script-name.sh
```

## Important Scripts

- `scripts/dev/dev-start.js` - Main development server starter
- `scripts/deployment/one-button-deploy.js` - Production deployment
- `scripts/db/apply-migrations.ts` - Database migrations
- `scripts/maintenance/cleanup-console-logs.ts` - Remove console.log statements
