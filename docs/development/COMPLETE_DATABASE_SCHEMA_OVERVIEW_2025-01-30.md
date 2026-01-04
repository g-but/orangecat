# Complete Database Schema Overview - January 30, 2025

**Created:** 2025-01-30  
**Purpose:** Comprehensive documentation of the entire OrangeCat Supabase database schema

**Audience:** Backend engineers, database administrators, system architects

---

## 🎯 Executive Summary

**Database Type:** PostgreSQL (via Supabase)  
**Total Tables:** ~50+ tables  
**Architecture:** Multi-tenant, Bitcoin-native, group-governed platform  
**Key Features:** Unified ownership model (Actor), Row Level Security (RLS), real-time capabilities

---

## 📊 Database Architecture Overview

### Core Design Principles

1. **Unified Ownership Model (Actor Pattern)**
   - Users and groups are both "actors" who can own entities
   - Enables flexible ownership without schema duplication
   - Future-proof for AI agents, DAOs, etc.

2. **Bitcoin-Native**
   - All financial amounts in SATS (smallest Bitcoin unit)
   - Bitcoin and Lightning addresses throughout
   - Transaction tracking and transparency

3. **Group Governance**
   - Flexible governance presets (consensus, democratic, hierarchical)
   - Optional features per group (treasury, proposals, voting, events)
   - Role-based permissions with overrides

4. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Policies enforce data access at database level
   - Public/private visibility controls

---

## 🗄️ Complete Table Inventory

### 1. CORE IDENTITY & AUTHENTICATION

#### `auth.users` (Supabase Built-in)
**Purpose:** User authentication and basic account info  
**Managed by:** Supabase Auth service  
**Key Columns:**
- `id` (uuid, PK)
- `email`
- `created_at`
- `last_sign_in_at`
- `email_confirmed_at`

#### `profiles`
**Purpose:** Extended user profile information  
**Rows:** ~50 columns  
**Key Columns:**
- `id` (uuid, PK, FK → auth.users.id)
- `username` (unique)
- `name` (display name - **NOTE: May be `display_name` in production**)
- `email`, `bio`, `avatar_url`, `banner_url`
- `bitcoin_address`, `lightning_address`
- `bitcoin_balance`, `lightning_balance`
- `verification_status`, `is_verified`
- `follower_count`, `following_count`
- `total_raised`, `total_donated`
- `preferences` (jsonb), `privacy_settings` (jsonb)
- `created_at`, `updated_at`

**Relationships:**
- One-to-one with `auth.users`
- One-to-many with `projects`, `user_products`, `user_services`, `user_causes`
- Many-to-many with `follows` (self-referential)

---

### 2. UNIFIED OWNERSHIP MODEL

#### `actors`
**Purpose:** Unified ownership abstraction - users and groups are both "actors"  
**Key Columns:**
- `id` (uuid, PK)
- `actor_type` ('user' | 'group')
- `user_id` (FK → auth.users, nullable)
- `group_id` (FK → groups, nullable)
- `display_name`, `avatar_url`, `slug`
- `created_at`, `updated_at`

**Constraints:**
- `actor_type = 'user'` → `user_id IS NOT NULL AND group_id IS NULL`
- `actor_type = 'group'` → `group_id IS NOT NULL AND user_id IS NULL`

**Usage:**
- Entity tables have `actor_id` column referencing this table
- Enables unified ownership checks
- Supports future actor types (AI agents, etc.)

---

### 3. GROUPS SYSTEM (Unified Organizations/Circles)

#### `groups`
**Purpose:** Unified groups system (replaces organizations/circles)  
**Key Columns:**
- `id` (uuid, PK)
- `name`, `slug` (unique), `description`
- `label` ('circle', 'family', 'dao', 'company', 'nonprofit', 'cooperative', 'guild', 'network_state')
- `tags` (text[])
- `avatar_url`, `banner_url`
- `is_public` (boolean)
- `visibility` ('public' | 'members_only' | 'private')
- `bitcoin_address`, `lightning_address`
- `governance_preset` ('consensus' | 'democratic' | 'hierarchical')
- `voting_threshold` (integer, nullable)
- `created_by` (FK → auth.users)
- `created_at`, `updated_at`

**Relationships:**
- One-to-many: `group_members`, `group_features`, `group_proposals`, `group_wallets`, `group_events`
- Many-to-many: Users via `group_members`

#### `group_members`
**Purpose:** Group membership with roles  
**Key Columns:**
- `id` (uuid, PK)
- `group_id` (FK → groups)
- `user_id` (FK → auth.users)
- `role` ('founder' | 'admin' | 'member')
- `permission_overrides` (jsonb, nullable)
- `invited_by` (FK → auth.users, nullable)
- `joined_at` (timestamptz)

**Constraints:**
- UNIQUE(group_id, user_id)

#### `group_features`
**Purpose:** Optional features enabled per group  
**Key Columns:**
- `id` (uuid, PK)
- `group_id` (FK → groups)
- `feature_key` ('treasury' | 'proposals' | 'voting' | 'events' | 'marketplace' | 'shared_wallet')
- `enabled` (boolean)
- `config` (jsonb)
- `enabled_at`, `enabled_by`

**Constraints:**
- UNIQUE(group_id, feature_key)

#### `group_proposals`
**Purpose:** Group governance proposals  
**Key Columns:**
- `id` (uuid, PK)
- `group_id` (FK → groups)
- `proposer_id` (FK → auth.users)
- `title`, `description`
- `proposal_type` ('general' | 'treasury' | 'membership' | 'governance')
- `status` ('draft' | 'active' | 'passed' | 'failed' | 'executed' | 'cancelled')
- `voting_threshold` (integer, nullable)
- `action_type` (text, nullable)
- `action_data` (jsonb)
- `voting_starts_at`, `voting_ends_at`, `executed_at`
- `is_public` (boolean) - For job postings
- `created_at`, `updated_at`

**Relationships:**
- One-to-many: `group_votes`
- One-to-one: `contracts` (via proposal_id)

#### `group_votes`
**Purpose:** Votes on group proposals  
**Key Columns:**
- `id` (uuid, PK)
- `proposal_id` (FK → group_proposals)
- `voter_id` (FK → auth.users)
- `vote` ('yes' | 'no' | 'abstain')
- `voting_power` (decimal(20,8), default 1.0)
- `voted_at` (timestamptz)

**Constraints:**
- UNIQUE(proposal_id, voter_id)

#### `group_wallets`
**Purpose:** Group treasury/shared wallets  
**Key Columns:**
- `id` (uuid, PK)
- `group_id` (FK → groups)
- `name`, `description`
- `purpose` ('general' | 'projects' | 'investment' | 'community' | 'emergency' | 'savings' | 'other')
- `bitcoin_address`, `lightning_address`
- `current_balance_sats` (bigint, default 0)
- `is_active` (boolean)
- `required_signatures` (integer, default 1)
- `created_by` (FK → auth.users)
- `created_at`, `updated_at`

#### `group_events`
**Purpose:** Group events (meetings, celebrations, assemblies)  
**Key Columns:**
- `id` (uuid, PK)
- `group_id` (FK → groups)
- `creator_id` (FK → auth.users)
- `title`, `description`
- `event_type` ('general' | 'meeting' | 'celebration' | 'assembly')
- `location_type` ('online' | 'in_person' | 'hybrid')
- `location_details` (text)
- `starts_at`, `ends_at` (timestamptz)
- `timezone` (text, default 'UTC')
- `max_attendees` (integer, nullable)
- `is_public` (boolean)
- `requires_rsvp` (boolean)
- `created_at`, `updated_at`

**Relationships:**
- One-to-many: `group_event_rsvps`

#### `group_event_rsvps`
**Purpose:** RSVPs for group events  
**Key Columns:**
- `id` (uuid, PK)
- `event_id` (FK → group_events)
- `user_id` (FK → auth.users)
- `status` ('going' | 'maybe' | 'not_going')
- `created_at`, `updated_at`

**Constraints:**
- UNIQUE(event_id, user_id)

#### `group_invitations`
**Purpose:** Group membership invitations  
**Key Columns:**
- `id` (uuid, PK)
- `group_id` (FK → groups)
- `user_id` (FK → auth.users, nullable) - Direct invitation
- `email` (text, nullable) - Email invitation
- `token` (text, unique, nullable) - Shareable link
- `role` ('admin' | 'member')
- `message` (text, nullable)
- `status` ('pending' | 'accepted' | 'declined' | 'expired' | 'revoked')
- `invited_by` (FK → auth.users)
- `expires_at` (timestamptz, default +7 days)
- `responded_at` (timestamptz, nullable)
- `created_at` (timestamptz)

**Constraints:**
- Exactly one of: user_id, email, or token must be set

#### `group_activities`
**Purpose:** Activity log for group actions  
**Key Columns:**
- `id` (uuid, PK)
- `group_id` (FK → groups)
- `user_id` (FK → auth.users)
- `activity_type` (text)
- `description` (text)
- `metadata` (jsonb)
- `created_at` (timestamptz)

---

### 4. ENTITY TABLES (User-Creatable Content)

#### `projects`
**Purpose:** Crowdfunding projects/campaigns  
**Key Columns:**
- `id` (uuid, PK)
- `user_id` (FK → auth.users) - **Legacy, use actor_id**
- `actor_id` (FK → actors, nullable) - **Preferred**
- `group_id` (FK → groups, nullable) - **Legacy, use actor_id**
- `title`, `description`
- `category`, `tags` (text[])
- `cover_image_url`, `website_url`
- `funding_purpose` (text)
- `goal_amount` (numeric)
- `raised_amount` (numeric)
- `contributor_count` (integer) - **May be missing in production**
- `currency` ('BTC' | 'SATS' | 'USD' | etc.)
- `bitcoin_address`, `lightning_address`
- `bitcoin_balance_btc` (numeric)
- `bitcoin_balance_updated_at` (timestamptz)
- `status` ('draft' | 'active' | 'completed' | 'cancelled')
- `created_at`, `updated_at`

**Relationships:**
- One-to-many: `project_media`, `project_support`, `project_updates`
- Many-to-many: Users via `project_favorites`

#### `user_products`
**Purpose:** Products for sale (physical/digital)  
**Key Columns:**
- `id` (uuid, PK)
- `user_id` (FK → auth.users) - **Legacy**
- `actor_id` (FK → actors, nullable) - **Preferred**
- `group_id` (FK → groups, nullable) - **Legacy**
- `title`, `description`
- `price_sats` (bigint)
- `currency` ('SATS' | 'BTC')
- `product_type` ('physical' | 'digital' | 'service')
- `images` (text[])
- `thumbnail_url`
- `inventory_count` (integer, -1 = unlimited)
- `fulfillment_type` ('manual' | 'automatic' | 'digital')
- `category`, `tags` (text[])
- `status` ('draft' | 'active' | 'paused' | 'sold_out')
- `is_featured` (boolean)
- `created_at`, `updated_at`

#### `user_services`
**Purpose:** Services offered by users  
**Key Columns:**
- `id` (uuid, PK)
- `user_id` (FK → auth.users) - **Legacy**
- `actor_id` (FK → actors, nullable) - **Preferred**
- `group_id` (FK → groups, nullable) - **Legacy**
- `title`, `description`
- `category` (text, NOT NULL)
- `hourly_rate_sats` (bigint, nullable)
- `fixed_price_sats` (bigint, nullable)
- `currency` ('SATS' | 'BTC')
- `duration_minutes` (integer, nullable)
- `availability_schedule` (jsonb)
- `service_location_type` ('remote' | 'onsite' | 'both')
- `service_area` (text)
- `images` (text[]), `portfolio_links` (text[])
- `status` ('draft' | 'active' | 'paused' | 'unavailable')
- `created_at`, `updated_at`

**Constraints:**
- `hourly_rate_sats IS NOT NULL OR fixed_price_sats IS NOT NULL`

#### `user_causes`
**Purpose:** Charitable causes  
**Key Columns:**
- `id` (uuid, PK)
- `user_id` (FK → auth.users) - **Legacy**
- `actor_id` (FK → actors, nullable) - **Preferred**
- `group_id` (FK → groups, nullable) - **Legacy**
- `title`, `description`
- `cause_category` (text, NOT NULL)
- `goal_sats` (bigint, nullable)
- `currency` ('SATS' | 'BTC')
- `bitcoin_address`, `lightning_address`
- `distribution_rules` (jsonb)
- `beneficiaries` (jsonb, default '[]')
- `status` ('draft' | 'active' | 'completed' | 'paused')
- `total_raised_sats` (bigint, default 0)
- `total_distributed_sats` (bigint, default 0)
- `created_at`, `updated_at`

#### `loans`
**Purpose:** Peer-to-peer loans  
**Key Columns:**
- `id` (uuid, PK)
- `user_id` (FK → auth.users) - **Legacy**
- `actor_id` (FK → actors, nullable) - **Preferred**
- `title`, `description`
- `amount_sats` (bigint)
- `currency` ('SATS' | 'BTC')
- `purpose` (text, NOT NULL)
- `collateral` (jsonb)
- `repayment_terms` (jsonb)
- `status` ('draft' | 'active' | 'completed' | 'defaulted')
- `created_at`, `updated_at`

**Relationships:**
- One-to-many: `loan_offers`, `loan_payments`
- Many-to-one: `loan_categories`

#### `loan_offers`
**Purpose:** Refinancing offers for loans  
**Key Columns:**
- `id` (uuid, PK)
- `loan_id` (FK → loans)
- `offerer_id` (FK → auth.users)
- `offer_type` (text)
- `offer_amount` (bigint)
- `interest_rate` (numeric)
- `term_months` (integer)
- `terms` (text)
- `status` ('pending' | 'accepted' | 'rejected')
- `created_at`, `updated_at`

#### `loan_payments`
**Purpose:** Loan payment records  
**Key Columns:**
- `id` (uuid, PK)
- `loan_id` (FK → loans)
- `payer_id` (FK → auth.users)
- `amount_sats` (bigint)
- `status` ('pending' | 'completed' | 'failed')
- `processed_at` (timestamptz, nullable)
- `created_at` (timestamptz)

#### `loan_categories`
**Purpose:** Loan categorization  
**Key Columns:**
- `id` (uuid, PK)
- `name` (text)
- `description` (text)
- `icon` (text)
- `is_active` (boolean)

#### `assets`
**Purpose:** Digital/physical assets  
**Key Columns:**
- `id` (uuid, PK)
- `actor_id` (FK → actors, nullable)
- `owner_id` (FK → auth.users) - **Legacy**
- `type` (text)
- `name`, `description`
- `value_sats` (bigint)
- `status` (text)
- `created_at`, `updated_at`

#### `ai_assistants`
**Purpose:** AI assistant services  
**Key Columns:**
- `id` (uuid, PK)
- `actor_id` (FK → actors, nullable)
- `user_id` (FK → auth.users) - **Legacy**
- `name`, `description`
- `config` (jsonb)
- `status` (text)
- `created_at`, `updated_at`

---

### 5. MESSAGING SYSTEM

#### `conversations`
**Purpose:** Chat conversations (direct or group)  
**Key Columns:**
- `id` (uuid, PK)
- `conversation_type` ('direct' | 'group')
- `is_group` (boolean)
- `title` (text, nullable)
- `description` (text, nullable)
- `created_by` (FK → auth.users, nullable)
- `last_message_at` (timestamptz)
- `last_message_preview` (text, nullable)
- `last_message_sender_id` (FK → auth.users, nullable)
- `created_at`, `updated_at`

**Relationships:**
- One-to-many: `messages`, `conversation_participants`

#### `messages`
**Purpose:** Individual messages in conversations  
**Key Columns:**
- `id` (uuid, PK)
- `conversation_id` (FK → conversations)
- `sender_id` (FK → auth.users)
- `content` (text, NOT NULL)
- `message_type` ('text' | 'image' | 'file')
- `metadata` (jsonb)
- `is_deleted` (boolean, default false)
- `edited_at` (timestamptz, nullable)
- `created_at`, `updated_at`

#### `conversation_participants`
**Purpose:** Users participating in conversations  
**Key Columns:**
- `id` (uuid, PK)
- `conversation_id` (FK → conversations)
- `user_id` (FK → auth.users)
- `role` ('admin' | 'member')
- `joined_at` (timestamptz)
- `last_read_at` (timestamptz, nullable)
- `is_active` (boolean)

**Constraints:**
- UNIQUE(conversation_id, user_id)

#### `typing_indicators`
**Purpose:** Real-time typing status  
**Key Columns:**
- `id` (uuid, PK)
- `conversation_id` (FK → conversations)
- `user_id` (FK → auth.users)
- `started_at` (timestamptz)
- `expires_at` (timestamptz, default +10 seconds)

**Constraints:**
- UNIQUE(conversation_id, user_id)

#### `user_presence`
**Purpose:** Online/offline status  
**Key Columns:**
- `user_id` (uuid, PK, FK → auth.users)
- `status` ('online' | 'away' | 'offline')
- `last_seen_at` (timestamptz)
- `updated_at` (timestamptz)

---

### 6. TIMELINE & SOCIAL

#### `timeline_events`
**Purpose:** Social timeline posts and events  
**Key Columns:**
- `id` (uuid, PK)
- `user_id` (FK → auth.users) - **Legacy, may have actor_id**
- `event_type` ('post' | 'comment' | 'like' | 'follow' | 'project_created' | 'donation')
- `content` (text)
- `metadata` (jsonb)
- `visibility` ('public' | 'followers' | 'private')
- `parent_id` (FK → timeline_events, nullable)
- `project_id` (uuid, nullable)
- `created_at`, `updated_at`

**Relationships:**
- Self-referential: `parent_id` for comments/replies
- One-to-many: `timeline_interactions`

#### `timeline_interactions`
**Purpose:** Likes, dislikes, reposts on timeline events  
**Key Columns:**
- `id` (uuid, PK)
- `user_id` (FK → auth.users)
- `event_id` (FK → timeline_events)
- `interaction_type` ('like' | 'dislike' | 'repost' | 'quote')
- `created_at` (timestamptz)

**Constraints:**
- UNIQUE(user_id, event_id, interaction_type)

#### `follows` / `user_follows`
**Purpose:** User following relationships  
**Key Columns:**
- `follower_id` (FK → auth.users)
- `following_id` (FK → auth.users)
- `created_at` (timestamptz)

**Constraints:**
- UNIQUE(follower_id, following_id)
- CHECK(follower_id != following_id)

---

### 7. FINANCIAL & TRANSACTIONS

#### `transactions`
**Purpose:** All Bitcoin/Lightning transactions  
**Key Columns:**
- `id` (uuid, PK)
- `from_user_id` (FK → auth.users, nullable)
- `to_user_id` (FK → auth.users, nullable)
- `to_project_id` (FK → projects, nullable)
- `amount_sats` (bigint)
- `currency` ('SATS' | 'BTC')
- `transaction_type` (text)
- `status` ('pending' | 'completed' | 'failed')
- `transaction_hash` (text, nullable)
- `lightning_invoice` (text, nullable)
- `metadata` (jsonb)
- `created_at` (timestamptz)

#### `wallets`
**Purpose:** User wallets (Bitcoin addresses)  
**Key Columns:**
- `id` (uuid, PK)
- `profile_id` (FK → profiles)
- `project_id` (FK → projects, nullable)
- `name`, `description`
- `bitcoin_address`, `lightning_address`
- `is_active` (boolean)
- `is_primary` (boolean)
- `created_at`, `updated_at`

#### `wallet_ownerships`
**Purpose:** Multi-signature wallet ownership  
**Key Columns:**
- `id` (uuid, PK)
- `wallet_id` (FK → wallets)
- `user_id` (FK → auth.users)
- `role` (text)
- `created_at` (timestamptz)

#### `donations`
**Purpose:** Donation records  
**Key Columns:**
- `id` (uuid, PK)
- `donor_id` (FK → auth.users)
- `recipient_type` ('project' | 'user' | 'cause' | 'organization')
- `recipient_id` (uuid)
- `amount_sats` (bigint)
- `currency` ('SATS' | 'BTC')
- `message` (text, nullable)
- `is_anonymous` (boolean)
- `status` ('pending' | 'completed' | 'failed')
- `transaction_hash` (text, nullable)
- `created_at` (timestamptz)

---

### 8. PROJECT SUPPORT SYSTEM

#### `project_support`
**Purpose:** Non-monetary support for projects  
**Key Columns:**
- `id` (uuid, PK)
- `project_id` (FK → projects)
- `user_id` (FK → profiles, nullable)
- `support_type` ('bitcoin_donation' | 'signature' | 'message' | 'reaction')
- `amount_sats` (bigint, nullable) - For donations
- `transaction_hash`, `lightning_invoice` (nullable)
- `display_name` (text, nullable) - For signatures
- `message` (text, nullable) - For messages
- `is_anonymous` (boolean)
- `reaction_emoji` (text, nullable) - For reactions
- `created_at`, `updated_at`

#### `project_support_stats`
**Purpose:** Aggregated support statistics  
**Key Columns:**
- `project_id` (uuid, PK, FK → projects)
- `total_bitcoin_sats` (bigint, default 0)
- `total_signatures` (integer, default 0)
- `total_messages` (integer, default 0)
- `total_reactions` (integer, default 0)
- `total_supporters` (integer, default 0)
- `last_support_at` (timestamptz, nullable)
- `updated_at` (timestamptz)

#### `project_media`
**Purpose:** Media files for projects  
**Key Columns:**
- `id` (uuid, PK)
- `project_id` (FK → projects)
- `media_type` (text)
- `url` (text)
- `created_at` (timestamptz)

#### `project_updates`
**Purpose:** Project update posts  
**Key Columns:**
- `id` (uuid, PK)
- `project_id` (FK → projects)
- `user_id` (FK → auth.users)
- `title`, `content`
- `created_at`, `updated_at`

#### `project_favorites`
**Purpose:** User favorites/bookmarks  
**Key Columns:**
- `id` (uuid, PK)
- `project_id` (FK → projects)
- `user_id` (FK → auth.users)
- `created_at` (timestamptz)

**Constraints:**
- UNIQUE(project_id, user_id)

---

### 9. CONTRACTS SYSTEM

#### `contracts`
**Purpose:** Formal agreements between actors  
**Key Columns:**
- `id` (uuid, PK)
- `party_a_actor_id` (FK → actors)
- `party_b_actor_id` (FK → actors)
- `contract_type` ('employment' | 'service' | 'rental' | 'partnership' | 'membership')
- `terms` (jsonb)
- `status` ('draft' | 'proposed' | 'active' | 'completed' | 'terminated' | 'cancelled')
- `proposal_id` (FK → group_proposals, nullable)
- `created_by` (FK → auth.users)
- `activated_at`, `completed_at`, `terminated_at` (timestamptz, nullable)
- `created_at`, `updated_at`

---

### 10. VIEWS & MATERIALIZED VIEWS

#### `message_details` (View)
**Purpose:** Messages with sender profile info  
**Columns:** All message columns + sender profile fields

#### `conversation_details` (View)
**Purpose:** Conversations with participant count  
**Columns:** All conversation columns + participant_count

#### `timeline_event_stats` (View)
**Purpose:** Aggregated interaction stats for timeline events  
**Columns:** event_id, like_count, dislike_count, share_count, comment_count

---

## 🔗 Key Relationships

### Ownership Hierarchy
```
auth.users
  └─ profiles (1:1)
      ├─ projects (1:many, via user_id OR actor_id)
      ├─ user_products (1:many)
      ├─ user_services (1:many)
      ├─ user_causes (1:many)
      └─ loans (1:many)

actors
  ├─ user (references auth.users)
  └─ group (references groups)
      └─ Can own: projects, products, services, causes, loans, assets

groups
  ├─ group_members (1:many)
  ├─ group_features (1:many)
  ├─ group_proposals (1:many)
  ├─ group_wallets (1:many)
  └─ group_events (1:many)
```

### Messaging Flow
```
conversations
  ├─ messages (1:many)
  ├─ conversation_participants (1:many)
  ├─ typing_indicators (1:many)
  └─ user_presence (referenced by user_id)
```

### Governance Flow
```
groups
  └─ group_proposals
      ├─ group_votes (1:many)
      └─ contracts (1:1, via proposal_id)
```

---

## 🔒 Security Model (RLS)

### Principles
1. **All tables have RLS enabled**
2. **Public read policies** for public content
3. **Owner-only write policies** for user content
4. **Member-based policies** for group content
5. **Role-based policies** for group administration

### Common Patterns

**User-owned entities:**
```sql
-- Read: Public if status='active', owner always
-- Write: Owner only
```

**Group-owned entities:**
```sql
-- Read: Public if group.is_public, members always
-- Write: Members (with role checks for sensitive operations)
```

**Messaging:**
```sql
-- Read: Participants only
-- Write: Participants only
```

---

## 📈 Indexes & Performance

### Key Indexes
- **Foreign keys:** All FK columns indexed
- **Status columns:** Filtered indexes (WHERE status = 'active')
- **Timestamps:** DESC indexes for recent-first queries
- **Search:** GIN indexes on arrays (tags, etc.)
- **Composite:** (user_id, status), (group_id, status), etc.

### Performance Considerations
- **Partial indexes** for filtered queries
- **GIN indexes** for array/JSONB searches
- **Covering indexes** for common query patterns
- **Materialized views** for expensive aggregations (future)

---

## ⚠️ Known Issues & Technical Debt

### 1. Column Name Mismatches
- **profiles.display_name vs name**
  - Database has: `display_name`
  - Code expects: `name`
  - **Fix:** Migration `20250130000006` renames column

### 2. Missing Columns
- **projects.contributor_count**
  - Code expects it, database missing
  - **Fix:** Migration `20250130000006` adds column

### 3. Dual Ownership Models
- **Legacy:** `user_id` + `group_id` columns
- **New:** `actor_id` column
- **Status:** Transitional - both exist, prefer `actor_id`

### 4. Inconsistent Naming
- Some tables use `user_id`, others use `owner_id`
- Some use `created_by`, others use `creator_id`
- **Recommendation:** Standardize on `created_by` and `actor_id`

---

## 🎯 Database Statistics

### Table Count by Category
- **Core Identity:** 2 tables (auth.users, profiles)
- **Ownership Model:** 1 table (actors)
- **Groups System:** 10 tables
- **Entity Tables:** 8 tables
- **Messaging:** 5 tables
- **Timeline/Social:** 3 tables
- **Financial:** 4 tables
- **Project Support:** 3 tables
- **Contracts:** 1 table
- **Views:** 3 views
- **Total:** ~40+ tables

### Estimated Row Counts (Production)
- `profiles`: ~1,000-10,000
- `projects`: ~100-1,000
- `groups`: ~50-500
- `messages`: ~10,000-100,000
- `transactions`: ~1,000-10,000

---

## 🔄 Migration History

### Key Migrations
1. **20250101000000** - Complete base schema
2. **20251229000000** - Groups system
3. **20250130000004** - Actors table
4. **20250130000005** - Actor IDs on entities
5. **20251231000000** - Group events
6. **20251230000000** - Group invitations
7. **20250122000000** - Messaging schema fixes
8. **20250130000003** - Project support
9. **20251230010000** - Public proposals & contracts
10. **20250130000006** - Critical schema fixes

---

---

## 📋 Complete Table List (Alphabetical)

### Core Tables (10)
1. `actors` - Unified ownership model
2. `ai_assistants` - AI services
3. `assets` - Digital/physical assets
4. `auth.users` - Supabase authentication (built-in)
5. `contracts` - Formal agreements
6. `profiles` - User profiles
7. `projects` - Crowdfunding projects
8. `user_causes` - Charitable causes
9. `user_products` - Products for sale
10. `user_services` - Services offered

### Groups System (10)
11. `group_activities` - Activity logging
12. `group_events` - Group events
13. `group_event_rsvps` - Event RSVPs
14. `group_features` - Enabled features
15. `group_invitations` - Membership invitations
16. `group_members` - Group membership
17. `group_proposals` - Governance proposals
18. `group_votes` - Proposal votes
19. `group_wallets` - Group treasury
20. `groups` - Groups/organizations

### Loans System (5)
21. `loan_categories` - Loan categories
22. `loan_collateral` - Loan collateral
23. `loan_offers` - Refinancing offers
24. `loan_payments` - Payment records
25. `loans` - Peer-to-peer loans

### Messaging System (5)
26. `conversation_participants` - Chat participants
27. `conversations` - Chat conversations
28. `messages` - Individual messages
29. `typing_indicators` - Real-time typing
30. `user_presence` - Online status

### Timeline & Social (4)
31. `follows` / `user_follows` - User following
32. `timeline_events` - Social timeline
33. `timeline_interactions` - Likes/reposts
34. `timeline_comments` - Comments (if separate)

### Financial (4)
35. `donations` - Donation records
36. `transactions` - All transactions
37. `wallet_ownerships` - Multi-sig ownership
38. `wallets` - Bitcoin wallets

### Project Support (5)
39. `project_favorites` - User favorites
40. `project_media` - Media files
41. `project_support` - Support records
42. `project_support_stats` - Aggregated stats
43. `project_updates` - Update posts

### Views (3)
44. `conversation_details` - Conversations with counts
45. `message_details` - Messages with sender info
46. `timeline_event_stats` - Interaction stats

### Legacy/Deprecated (May Exist)
47. `organizations` - **DEPRECATED** (use `groups`)
48. `organization_members` - **DEPRECATED**
49. `organization_proposals` - **DEPRECATED**
50. `organization_votes` - **DEPRECATED**
51. `organization_projects` - **DEPRECATED**
52. `organization_invites` - **DEPRECATED**
53. `events` - **DEPRECATED** (use `group_events`)

**Total Active Tables:** ~40-45 (excluding deprecated)

---

## 🔄 Entity Relationship Diagram (Text)

```
auth.users (1) ──┐
                 ├── (1:1) profiles
                 │
                 ├── (1:many) projects
                 ├── (1:many) user_products
                 ├── (1:many) user_services
                 ├── (1:many) user_causes
                 ├── (1:many) loans
                 └── (1:many) messages

actors (1) ──────┐
  ├── user_id ───┘
  └── group_id ──┐
                  │
groups (1) ───────┘
  ├── (1:many) group_members
  ├── (1:many) group_features
  ├── (1:many) group_proposals
  ├── (1:many) group_wallets
  └── (1:many) group_events

group_proposals (1) ──┬── (1:many) group_votes
                      └── (1:1) contracts

projects (1) ──┬── (1:many) project_support
              ├── (1:many) project_media
              ├── (1:many) project_updates
              └── (many:many) users (via project_favorites)

conversations (1) ──┬── (1:many) messages
                    ├── (1:many) conversation_participants
                    └── (1:many) typing_indicators

loans (1) ──┬── (1:many) loan_offers
            └── (1:many) loan_payments
```

---

**Last Updated:** 2025-01-30  
**Next Review:** After migration 20250130000006 is applied
