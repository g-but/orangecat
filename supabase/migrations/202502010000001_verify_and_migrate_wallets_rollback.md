# Rollback: 202502010000001_verify_and_migrate_wallets

## Overview
This document describes the rollback procedure for migration `202502010000001_verify_and_migrate_wallets.sql`.

## Generated
2025-12-04T12:37:00.364Z

## Source Migration
- File: `202502010000001_verify_and_migrate_wallets.sql`
- Rollback: `202502010000001_verify_and_migrate_wallets_rollback.sql`

## Rollback Procedure

### Automated Rollback
```bash
# Apply the generated rollback script
psql -f "202502010000001_verify_and_migrate_wallets_rollback.sql"
```

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
- Original: `202502010000001_verify_and_migrate_wallets.sql`
- Rollback: `202502010000001_verify_and_migrate_wallets_rollback.sql`
- Backup: `migration-testing/backups/`
