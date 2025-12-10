# Rollback: 20251119100001_migrate_wallet_data_v2

## Overview
This document describes the rollback procedure for migration `20251119100001_migrate_wallet_data_v2.sql`.

## Generated
2025-12-04T12:37:00.485Z

## Source Migration
- File: `20251119100001_migrate_wallet_data_v2.sql`
- Rollback: `20251119100001_migrate_wallet_data_v2_rollback.sql`

## Rollback Procedure

### Automated Rollback
```bash
# Apply the generated rollback script
psql -f "20251119100001_migrate_wallet_data_v2_rollback.sql"
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
- Original: `20251119100001_migrate_wallet_data_v2.sql`
- Rollback: `20251119100001_migrate_wallet_data_v2_rollback.sql`
- Backup: `migration-testing/backups/`
