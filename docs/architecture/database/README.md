# 🗄️ Database Architecture Documentation

**Overall Rating: 8.7/10** ⭐⭐⭐⭐⭐ | **Status: Production Ready** ✅

> Last Updated: October 17, 2025
> Database: Supabase PostgreSQL
> Version: Production v1.0

## 📋 Quick Navigation

### 🚀 Getting Started
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Essential commands & links (start here!)
- **[IMPROVEMENTS_SUMMARY.md](./IMPROVEMENTS_SUMMARY.md)** - What we built & how to deploy
- **[DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)** - Step-by-step deployment instructions

### Core Documentation
- **[Schema Overview](./schema-overview.md)** - High-level architecture and design patterns
- **[Analysis & Rating](./analysis-rating.md)** - Comprehensive 8.7/10 analysis
- **[Improvements Roadmap](./improvements-roadmap.md)** - Planned enhancements & timeline

### Tables Reference
- **[profiles](./tables/profiles.md)** - User profiles with Bitcoin features (40+ fields)
- **[funding_pages](./tables/funding_pages.md)** - Crowdfunding campaigns
- **[transactions](./tables/transactions.md)** - Bitcoin transaction tracking
- **[organizations](./tables/organizations.md)** - Multi-user entities with governance
- **[memberships](./tables/memberships.md)** - Organization membership management
- **[profile_associations](./tables/profile_associations.md)** - Polymorphic relationships (⭐ Exceptional)
- **[follows](./tables/follows.md)** - Social following system
- **[notifications](./tables/notifications.md)** - User notification system
- **[organization_application_questions](./tables/organization_application_questions.md)** - Dynamic forms
- **[transparency_scores](./tables/transparency_scores.md)** - Trust & transparency metrics

### Analysis & Roadmap
- **[Architecture Analysis & Rating](./analysis-rating.md)** - Comprehensive 8.7/10 analysis
- **[Improvements Roadmap](./improvements-roadmap.md)** - Planned enhancements

## 🎯 Database at a Glance

### Statistics
- **10 Tables** - Covering profiles, campaigns, payments, organizations, social features
- **6 Functions** - Automated business logic (user creation, counters, analytics)
- **24 RLS Policies** - Comprehensive security coverage
- **20+ Indexes** - Strategic performance optimization
- **5 Custom ENUMs** - Type-safe status management

### Key Features

#### 1. Bitcoin-Native Architecture (9/10)
- ✅ Precise decimal handling: `numeric(20,8)` for satoshi precision
- ✅ Multiple payment methods: On-chain + Lightning Network
- ✅ Address validation with regex patterns
- ✅ Lightning addresses, node IDs, payment preferences
- ✅ Organization treasury management
- ✅ Revenue sharing via `reward_percentage`

#### 2. Polymorphic Associations (10/10)
- ✅ Flexible entity relationships in single table
- ✅ Temporal relationships (starts_at, ends_at)
- ✅ Version tracking for change history
- ✅ Multi-level visibility controls
- ✅ Complete audit trail

#### 3. Security First (8.5/10)
- ✅ RLS enabled on all tables
- ✅ Principle of least privilege
- ✅ Role-based access for organizations
- ✅ SECURITY DEFINER functions for controlled escalation

#### 4. Performance Optimized (8/10)
- ✅ GIN trigram indexes for fuzzy search
- ✅ Partial indexes for hot queries
- ✅ Denormalized counters with triggers
- ✅ Composite indexes for complex queries

## 🚀 Quick Start

### Accessing the Database
```bash
# Using Supabase CLI
supabase db pull

# Connect to production
psql $DATABASE_URL
```

### Environment Variables
```bash
NEXT_PUBLIC_SUPABASE_URL=https://ohkueislstxomdjavyhs.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### Common Queries
```sql
-- Get profile with associations
SELECT p.*,
  (SELECT COUNT(*) FROM follows WHERE following_id = p.id) as follower_count,
  (SELECT COUNT(*) FROM follows WHERE follower_id = p.id) as following_count
FROM profiles p
WHERE p.username = 'orangecat';

-- Get active campaigns
SELECT * FROM funding_pages
WHERE status = 'active'
ORDER BY created_at DESC;

-- Check transaction status
SELECT * FROM transactions
WHERE status IN ('pending', 'processing');
```

## 📊 Design Patterns Used

1. **Polymorphic Associations** - Flexible entity relationships
2. **Soft Deletes** - status = 'deleted' vs hard delete
3. **Denormalized Counters** - With trigger maintenance
4. **Temporal Data** - Time-bound relationships
5. **Version Tracking** - Association versioning
6. **Audit Trails** - created_by, last_modified_by
7. **JSONB for Extensibility** - Schema evolution
8. **Partial Indexing** - Performance + storage optimization
9. **Check Constraints** - Business rules at DB level
10. **Security Definer Functions** - Controlled privilege escalation

## ⚠️ Important Notes

### Current Limitations
- Transactions table not partitioned (will need this as volume grows)
- No dedicated audit log table (recommended for compliance)
- Missing index on `transactions.status` (being added)

### Planned Improvements
See [Improvements Roadmap](./improvements-roadmap.md) for:
- Table partitioning strategy
- Audit logging implementation
- Materialized views for analytics
- Archival strategy for old data

## 🔗 Related Documentation

- [Database Schema (Legacy)](../database-schema.md) - Original simplified docs
- [Association System Design](../association-system-masterpiece-design.md) - Deep dive into polymorphic associations
- [Supabase Schema Guide](../SUPABASE_SCHEMA_GUIDE.md) - Setup and migration guide
- [API Documentation](../../api/README.md) - API endpoints using these tables

## 🛠️ Maintenance

### Regular Tasks
- **Weekly**: Review slow query logs
- **Monthly**: Check index usage statistics
- **Quarterly**: Analyze table bloat and vacuum
- **As needed**: Update RLS policies for new features

### Monitoring
```sql
-- Check table sizes
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan ASC;
```

---

**Status**: Production Ready | **Rating**: 8.7/10 | **Last Audit**: October 17, 2025
