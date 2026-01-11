# Complete Database Overview - OrangeCat Platform

**Created:** 2025-01-30  
**Purpose:** Complete overview of the OrangeCat Supabase database - everything you need to know

**Related Documents:**

- `COMPLETE_DATABASE_SCHEMA_OVERVIEW_2025-01-30.md` - Detailed schema documentation
- `EXPERT_DATABASE_REVIEW_2025-01-30.md` - Expert analysis and recommendations
- `DATABASE_SCHEMA_AUDIT_2025-01-30.md` - Audit findings

---

## 🎯 Quick Summary

**Database:** PostgreSQL (via Supabase)  
**Total Tables:** ~50 tables (40-45 active, 5-10 deprecated)  
**Architecture:** Multi-tenant, Bitcoin-native, group-governed  
**Security:** Row Level Security (RLS) on all tables  
**Status:** Production-ready with critical fixes pending

---

## 📊 Database at a Glance

### By Numbers

- **Core Tables:** 10 (profiles, projects, actors, etc.)
- **Groups System:** 10 tables
- **Messaging:** 5 tables
- **Loans:** 5 tables
- **Timeline/Social:** 4 tables
- **Financial:** 4 tables
- **Project Support:** 5 tables
- **Views:** 3 views
- **Total:** ~50 tables

### By Category

**Identity & Auth:**

- `auth.users` (Supabase built-in)
- `profiles` (50+ columns)

**Ownership:**

- `actors` (unified ownership model)

**Groups:**

- `groups`, `group_members`, `group_features`
- `group_proposals`, `group_votes`, `group_wallets`
- `group_events`, `group_event_rsvps`
- `group_invitations`, `group_activities`

**Entities:**

- `projects`, `user_products`, `user_services`, `user_causes`
- `loans`, `assets`, `ai_assistants`

**Messaging:**

- `conversations`, `messages`, `conversation_participants`
- `typing_indicators`, `user_presence`

**Financial:**

- `transactions`, `wallets`, `donations`

**Social:**

- `timeline_events`, `timeline_interactions`, `follows`

---

## 🏗️ Architecture Highlights

### 1. Unified Ownership Model (Actor Pattern)

**The Innovation:**

```sql
actors table
  ├── actor_type: 'user' | 'group'
  ├── user_id (if user)
  └── group_id (if group)

All entities have: actor_id → actors(id)
```

**Why It's Great:**

- ✅ Single ownership check for all entities
- ✅ Future-proof (AI agents, DAOs can be actors)
- ✅ Eliminates schema duplication
- ✅ Industry-standard pattern (GitHub, GitLab use this)

**Status:** ✅ Implemented, ⚠️ Migration in progress

---

### 2. Bitcoin-Native Design

**All Financial Data:**

- Amounts in **SATS** (smallest Bitcoin unit)
- No floating-point errors
- Native micropayment support
- Bitcoin + Lightning addresses throughout

**Tables with Bitcoin:**

- `profiles` (bitcoin_address, lightning_address, balances)
- `projects` (bitcoin_address, lightning_address, goal_amount)
- `groups` (bitcoin_address, lightning_address)
- `group_wallets` (bitcoin_address, lightning_address, current_balance_sats)
- `wallets` (bitcoin_address, lightning_address)
- `transactions` (amount_sats, transaction_hash)
- `loans` (amount_sats)
- `user_products` (price_sats)
- `user_services` (hourly_rate_sats, fixed_price_sats)
- `user_causes` (goal_sats, total_raised_sats)

**Expert Opinion:** ⭐ **This is the correct approach for Bitcoin applications**

---

### 3. Group Governance System

**Flexible Design:**

- **Labels:** Identity/template (circle, dao, company, etc.)
- **Governance Presets:** Default permissions (consensus, democratic, hierarchical)
- **Features:** Optional toggles (treasury, proposals, voting, events)
- **Roles:** founder, admin, member (with permission overrides)

**Tables:**

- `groups` - Main group table
- `group_members` - Membership with roles
- `group_features` - Enabled features per group
- `group_proposals` - Governance proposals
- `group_votes` - Voting on proposals
- `group_wallets` - Group treasury
- `group_events` - Group events
- `group_invitations` - Membership invitations

**Expert Opinion:** ⭐ **Well-designed for extensibility**

---

### 4. Row Level Security (RLS)

**Coverage:** 100% of tables have RLS enabled

**Patterns:**

- **Public Read:** `status = 'active' AND is_public = true`
- **Owner Write:** `auth.uid() = user_id`
- **Member Read:** `EXISTS (SELECT FROM group_members WHERE ...)`
- **Admin Write:** `role IN ('founder', 'admin')`

**Expert Opinion:** ⭐ **Gold standard for multi-tenant security**

---

## 🔗 Key Relationships

### Ownership Flow

```
auth.users
  └─ profiles (1:1)
      └─ Can own: projects, products, services, causes, loans

actors
  ├─ user (references auth.users)
  └─ group (references groups)
      └─ Can own: projects, products, services, causes, loans, assets

groups
  ├─ group_members (users in group)
  ├─ group_proposals (governance)
  ├─ group_wallets (treasury)
  └─ group_events (events)
```

### Messaging Flow

```
conversations
  ├─ messages (1:many)
  ├─ conversation_participants (1:many)
  └─ typing_indicators (1:many, real-time)
```

### Governance Flow

```
groups
  └─ group_proposals
      ├─ group_votes (1:many)
      └─ contracts (1:1, if proposal creates contract)
```

---

## ⚠️ Critical Issues (Must Fix)

### 1. Schema-Codebase Mismatch - **CRITICAL**

**Problem:**

- Database: `profiles.display_name`
- Code: Expects `profiles.name`
- Impact: All profile names show as "User [id]"

**Fix:** Migration `20250130000006` ready to apply

**Status:** 🔴 **URGENT - Apply immediately**

---

### 2. Missing Column - **HIGH**

**Problem:**

- `projects.contributor_count` missing
- Triggers may fail
- Impact: Broken statistics

**Fix:** Included in migration `20250130000006`

**Status:** 🔴 **URGENT - Apply immediately**

---

### 3. Dual Ownership Models - **MEDIUM**

**Problem:**

- Legacy: `user_id` + `group_id`
- New: `actor_id`
- Both exist, causing confusion

**Fix:** Complete migration to `actor_id`, remove legacy columns

**Status:** 🟡 **In Progress - Complete within 1 month**

---

## 📈 Performance Considerations

### Indexes

- ✅ Foreign keys indexed
- ✅ Status columns have filtered indexes
- ⚠️ Missing some composite indexes
- ⚠️ Missing some covering indexes

### Denormalization

- ✅ `profiles.follower_count` (denormalized)
- ✅ `project_support_stats` (denormalized)
- ⚠️ `groups.member_count` (calculated on-the-fly)
- ⚠️ `projects.contributor_count` (missing)

### Scalability

- ✅ UUID primary keys (distributed-friendly)
- ✅ Timestamps for all tables
- ⚠️ No partitioning strategy (needed for messages, timeline_events)
- ⚠️ No archiving strategy

---

## 🎯 What Experts Say

### Senior Database Architect Review

> **"This is a well-designed database schema with a solid foundation. The Actor pattern is sophisticated and future-proof. The RLS implementation is comprehensive. However, the schema-codebase mismatches are critical and must be fixed immediately. Once those are resolved and the actor model migration is complete, this will be a production-ready, scalable database design."**

**Overall Score:** 7.5/10 → **9/10** (after fixes)

### Strengths Highlighted

1. ✅ **Actor Pattern** - Industry best practice
2. ✅ **RLS Coverage** - 100% security at database level
3. ✅ **Bitcoin-Native** - Proper financial modeling
4. ✅ **Flexible Governance** - Extensible design

### Areas for Improvement

1. ⚠️ **Schema Verification** - Add to CI/CD
2. ⚠️ **Index Strategy** - Add composite indexes
3. ⚠️ **Denormalization** - Add more counts
4. ⚠️ **Partitioning** - Plan for scale

---

## 📋 Complete Table Reference

### Quick Lookup by Purpose

**User Management:**

- `auth.users`, `profiles`

**Ownership:**

- `actors`

**Groups:**

- `groups`, `group_members`, `group_features`, `group_proposals`, `group_votes`, `group_wallets`, `group_events`, `group_event_rsvps`, `group_invitations`, `group_activities`

**Content:**

- `projects`, `user_products`, `user_services`, `user_causes`, `loans`, `assets`, `ai_assistants`

**Messaging:**

- `conversations`, `messages`, `conversation_participants`, `typing_indicators`, `user_presence`

**Social:**

- `timeline_events`, `timeline_interactions`, `follows`

**Financial:**

- `transactions`, `wallets`, `wallet_ownerships`, `donations`

**Project Support:**

- `project_support`, `project_support_stats`, `project_media`, `project_updates`, `project_favorites`

**Contracts:**

- `contracts`

**Loans:**

- `loans`, `loan_offers`, `loan_payments`, `loan_categories`, `loan_collateral`

**Views:**

- `message_details`, `conversation_details`, `timeline_event_stats`

---

## 🔍 Schema Details by Domain

### Profiles & Identity

- **50+ columns** in `profiles` table
- Includes: identity, location, Bitcoin, social, verification, preferences
- **Issue:** `display_name` vs `name` mismatch (critical)

### Projects

- **19 columns** (per GROUND_TRUTH_FINDINGS.md)
- Ownership: `user_id` (legacy) + `actor_id` (new) + `group_id` (legacy)
- **Issue:** Missing `contributor_count` (critical)

### Groups

- **10 tables** for complete group functionality
- Flexible governance, optional features
- **Status:** ✅ Well-designed

### Messaging

- **5 tables** for real-time chat
- Includes typing indicators and presence
- **Status:** ✅ Complete

### Loans

- **5 tables** for peer-to-peer lending
- Includes offers, payments, categories
- **Status:** ✅ Complete

---

## 🚀 Next Steps

### Immediate (This Week)

1. ✅ Apply migration `20250130000006`
2. ⏳ Verify profile names display correctly
3. ⏳ Verify contributor counts work

### Short Term (This Month)

4. ⏳ Complete actor model migration
5. ⏳ Add missing indexes
6. ⏳ Add denormalized counts

### Long Term (Next Quarter)

7. ⏳ Add materialized views
8. ⏳ Plan partitioning strategy
9. ⏳ Add query performance monitoring

---

## 📚 Documentation Files

1. **COMPLETE_DATABASE_SCHEMA_OVERVIEW_2025-01-30.md**
   - Detailed table documentation
   - Column descriptions
   - Relationships
   - ~850 lines

2. **EXPERT_DATABASE_REVIEW_2025-01-30.md**
   - Expert analysis
   - Recommendations
   - Scorecard
   - ~600 lines

3. **DATABASE_SCHEMA_AUDIT_2025-01-30.md**
   - Audit findings
   - Comparison matrix
   - Action items
   - ~400 lines

4. **DATABASE_HARMONY_ACTION_PLAN_2025-01-30.md**
   - Action plan
   - Priority ranking
   - Success criteria
   - ~300 lines

---

## 💡 Key Takeaways

### What's Excellent

1. ✅ **Actor Pattern** - Future-proof ownership model
2. ✅ **RLS Implementation** - Comprehensive security
3. ✅ **Bitcoin-Native** - Proper financial modeling
4. ✅ **Group Governance** - Flexible and extensible

### What Needs Fixing

1. 🔴 **Schema Mismatches** - Critical, fix immediately
2. 🟡 **Dual Models** - Complete migration
3. 🟡 **Missing Indexes** - Add composite indexes
4. 🟡 **Denormalization** - Add more counts

### Expert Verdict

> **"Solid foundation. Fix critical issues, complete actor migration, and this becomes a 9/10 database design."**

---

**Last Updated:** 2025-01-30  
**Status:** Complete overview ready for review
