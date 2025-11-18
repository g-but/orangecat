# Financial Architecture & Patterns Analysis
## OrangeCat Bitcoin Crowdfunding Platform

**Analysis Date:** November 17, 2025  
**Thoroughness Level:** Very Thorough (Database Migrations, API Routes, Types, Services, Components)

---

## EXECUTIVE SUMMARY

The codebase implements a **sophisticated, Bitcoin-native financial system** with the following characteristics:

- **5 Core Tables:** Profiles, Organizations, Projects, Transactions, Wallets
- **Multi-Entity Transactions:** Any entity (profile, org, project) can donate to any other entity
- **Wallet Management:** Support for single addresses and xpub-based wallets with multi-wallet functionality
- **Behavioral Wallets:** General, recurring budgets, and one-time savings goals
- **Transparent Tracking:** Comprehensive audit trails, transaction histories, and social proof
- **Budget & Savings Features:** Recently added (Nov 2025) for expense and savings management

---

## 1. EXISTING FINANCIAL DATA MODELS

### 1.1 Core Tables Structure

#### **TRANSACTIONS TABLE** (/src/types/database.ts, Lines 142-227)
Universal payment system supporting donations between any entities.

**Key Fields:**
```typescript
{
  id: UUID (primary key)
  
  // Amount & Currency
  amount_sats: BIGINT (NOT NULL, positive)
  currency: ENUM('SATS', 'BTC')
  
  // Source Entity (flexible)
  from_entity_type: ENUM('profile' | 'organization' | 'project')
  from_entity_id: UUID
  
  // Destination Entity (flexible)
  to_entity_type: ENUM('profile' | 'organization' | 'project')
  to_entity_id: UUID
  
  // Payment Method
  payment_method: ENUM('bitcoin' | 'lightning' | 'on-chain' | 'off-chain')
  transaction_hash?: TEXT (Bitcoin transaction hash)
  lightning_payment_hash?: TEXT
  payment_proof?: TEXT
  
  // Status Tracking
  status: ENUM('pending' | 'processing' | 'confirmed' | 'failed' | 'cancelled')
  fee_sats: BIGINT (transaction fee)
  exchange_rate?: DECIMAL (BTC/SATS rate at tx time)
  
  // Transparency & Privacy
  anonymous: BOOLEAN (default: false)
  message?: TEXT (optional message from sender)
  purpose?: TEXT (categorization: "donation", "grant", etc)
  tags?: TEXT[] (custom tags)
  public_visibility: BOOLEAN (default: true)
  
  // Audit & Verification
  audit_trail: JSONB (detailed transaction history)
  verification_status: ENUM('unverified' | 'pending' | 'verified' | 'disputed')
  
  // Timestamps
  initiated_at: TIMESTAMP
  confirmed_at?: TIMESTAMP
  settled_at?: TIMESTAMP
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

**Location:** `/home/user/orangecat/supabase/migrations/20251221_enhance_multi_entity_donations.sql`

#### **WALLETS TABLE** (/supabase/migrations/20251112000000_create_wallets_system.sql)
Multi-purpose wallet system for profiles and projects with categorization and balance tracking.

**Structure:**
```sql
CREATE TABLE wallets (
  -- Core wallet info
  id UUID PRIMARY KEY
  profile_id UUID (owner: profile)
  project_id UUID (owner: project)
  label TEXT NOT NULL (user-friendly name: "Rent", "Food", "Medical")
  description TEXT
  
  -- Bitcoin address/xpub
  address_or_xpub TEXT NOT NULL (single address OR xpub/ypub/zpub)
  wallet_type ENUM('address' | 'xpub')
  
  -- Categorization
  category ENUM('general', 'rent', 'food', 'medical', 'education', 'emergency', 'custom')
  category_icon TEXT (emoji: 💰, 🏠, 🍔, etc)
  
  -- Balance tracking
  balance_btc NUMERIC(20,8) DEFAULT 0
  balance_updated_at TIMESTAMP
  
  -- Display settings
  is_active BOOLEAN DEFAULT true
  display_order INT DEFAULT 0
  is_primary BOOLEAN DEFAULT false
  
  created_at TIMESTAMP
  updated_at TIMESTAMP
  
  -- Constraint: max 10 active wallets per owner
  CHECK (COUNT(*) <= 10)
)
```

**Indexes for Performance:**
- `idx_wallets_profile` - Queries by profile owner
- `idx_wallets_project` - Queries by project owner
- `idx_wallets_active` - Filter active wallets

#### **WALLET_ADDRESSES TABLE** (for xpub derivation)
Stores derived addresses from extended public keys.

```sql
CREATE TABLE wallet_addresses (
  id UUID PRIMARY KEY
  wallet_id UUID REFERENCES wallets (ON DELETE CASCADE)
  address TEXT NOT NULL
  derivation_index INT (child index: 0, 1, 2, ...)
  balance_btc NUMERIC(20,8) DEFAULT 0
  tx_count INT DEFAULT 0
  last_tx_at TIMESTAMP
  discovered_at TIMESTAMP
  
  CONSTRAINT unique_wallet_address UNIQUE(wallet_id, address)
)
```

**Helper Functions:**
- `get_wallet_total_balance(wallet_uuid)` - Sum balance for address or xpub
- `get_entity_total_balance(entity_type, entity_uuid)` - Total balance for profile/project

### 1.2 Behavioral Wallet Tables (Recurring Budgets & Savings Goals)

Added in `/supabase/migrations/20251117000000_add_wallet_behavior_types.sql`

#### **Wallets Enhanced Columns**
```sql
-- Wallet behavior type
behavior_type ENUM('general' | 'recurring_budget' | 'one_time_goal')

-- For recurring budgets
budget_amount NUMERIC(20,8) CHECK (> 0)
budget_currency ENUM('USD', 'EUR', 'BTC', 'SATS', 'CHF')
budget_period ENUM('daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom')
budget_period_start_day INT (1-31)
budget_reset_day INT (1-31)
current_period_start TIMESTAMP
current_period_end TIMESTAMP
current_period_spent NUMERIC(20,8) DEFAULT 0
alert_threshold_percent INT (1-100, default 80)
alert_sent_at TIMESTAMP

-- For one-time goals
goal_amount NUMERIC(20,8) (amount to save for)
goal_currency TEXT
goal_deadline TIMESTAMP
goal_status ENUM('active' | 'paused' | 'reached' | 'purchased' | 'cancelled' | 'archived')
goal_reached_at TIMESTAMP
goal_purchased_at TIMESTAMP
purchase_notes TEXT
milestone_25_reached_at TIMESTAMP
milestone_50_reached_at TIMESTAMP
milestone_75_reached_at TIMESTAMP
milestone_100_reached_at TIMESTAMP

-- Social features
is_public_goal BOOLEAN DEFAULT false
allow_contributions BOOLEAN DEFAULT false
contribution_count INT DEFAULT 0

-- Analytics
last_transaction_at TIMESTAMP
transaction_count INT DEFAULT 0
total_received NUMERIC(20,8) DEFAULT 0
total_spent NUMERIC(20,8) DEFAULT 0
```

#### **BUDGET_PERIODS TABLE**
Historical tracking of budget periods for recurring budget wallets.

```sql
CREATE TABLE budget_periods (
  id UUID PRIMARY KEY
  wallet_id UUID NOT NULL REFERENCES wallets (ON DELETE CASCADE)
  
  -- Period info
  period_start TIMESTAMP NOT NULL
  period_end TIMESTAMP NOT NULL
  period_type ENUM('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly', 'custom')
  
  -- Budget tracking
  budget_amount NUMERIC(20,8) NOT NULL CHECK (> 0)
  budget_currency TEXT NOT NULL
  amount_spent NUMERIC(20,8) NOT NULL DEFAULT 0 CHECK (>= 0)
  
  -- Stats
  transaction_count INT DEFAULT 0
  average_transaction NUMERIC(20,8)
  largest_transaction NUMERIC(20,8)
  
  -- Status
  status ENUM('active' | 'completed' | 'rolled_over' | 'cancelled')
  completion_rate NUMERIC(5,2) CHECK (0-100)
  
  created_at TIMESTAMP NOT NULL DEFAULT now()
  completed_at TIMESTAMP
  
  CONSTRAINT valid_period CHECK (period_end > period_start)
  CONSTRAINT unique_wallet_period UNIQUE(wallet_id, period_start)
)
```

**Key Functions:**
- `initialize_wallet_period()` - Creates initial budget period on wallet creation
- `reset_expired_budget_periods()` - Auto-reset budgets (call via cron)

#### **GOAL_MILESTONES TABLE**
Celebration tracking for savings goal progress (25%, 50%, 75%, 100%).

```sql
CREATE TABLE goal_milestones (
  id UUID PRIMARY KEY
  wallet_id UUID NOT NULL REFERENCES wallets (ON DELETE CASCADE)
  
  -- Milestone info
  milestone_percent INT NOT NULL CHECK (> 0 AND <= 100)
  milestone_amount NUMERIC(20,8) NOT NULL CHECK (> 0)
  
  -- Achievement
  reached_at TIMESTAMP
  was_celebrated BOOLEAN DEFAULT false
  shared_publicly BOOLEAN DEFAULT false
  
  -- Context
  transaction_id UUID
  notes TEXT
  
  created_at TIMESTAMP NOT NULL DEFAULT now()
  
  CONSTRAINT unique_wallet_milestone UNIQUE(wallet_id, milestone_percent)
)
```

**Function:** `check_goal_milestones()` - Automatically creates milestone records when balances cross thresholds

#### **WALLET_CONTRIBUTIONS TABLE**
Tracking contributions from others toward public savings goals.

```sql
CREATE TABLE wallet_contributions (
  id UUID PRIMARY KEY
  wallet_id UUID NOT NULL REFERENCES wallets (ON DELETE CASCADE)
  
  -- Contributor info
  contributor_profile_id UUID REFERENCES profiles (ON DELETE SET NULL)
  contributor_name TEXT (for anonymous contributions)
  is_anonymous BOOLEAN DEFAULT false
  
  -- Contribution details
  amount_btc NUMERIC(20,8) NOT NULL CHECK (> 0)
  amount_usd NUMERIC(20,2) (snapshot at contribution time)
  message TEXT CHECK (length <= 500)
  
  -- Transaction tracking
  transaction_hash TEXT
  confirmed_at TIMESTAMP
  
  -- Social
  thanked BOOLEAN DEFAULT false
  public_visibility BOOLEAN DEFAULT true
  
  created_at TIMESTAMP NOT NULL DEFAULT now()
)
```

### 1.3 Project Funding Tables

#### **Projects Table** (Core Fundraising Entity)
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY
  user_id UUID NOT NULL (creator reference)
  title TEXT NOT NULL
  description TEXT
  
  -- Funding
  goal_amount NUMERIC (optional target)
  currency TEXT DEFAULT 'SATS'
  funding_purpose TEXT (what funds are for)
  raised_amount NUMERIC (accumulated donations)
  
  -- Bitcoin support
  bitcoin_address TEXT
  lightning_address TEXT
  
  -- Metadata
  category TEXT
  tags TEXT[]
  status ENUM('active' | 'completed' | 'paused' | 'archived')
  
  -- Social proof
  supporters_count INT DEFAULT 0 (cached, updated by trigger)
  last_donation_at TIMESTAMP
  
  created_at TIMESTAMP
  updated_at TIMESTAMP
)
```

#### **PROJECT_UPDATES TABLE** (Activity Timeline)
```sql
CREATE TABLE project_updates (
  id UUID PRIMARY KEY
  project_id UUID NOT NULL REFERENCES projects (ON DELETE CASCADE)
  
  type VARCHAR(20) CHECK (IN ('update', 'donation', 'milestone'))
  title VARCHAR(255) NOT NULL
  content TEXT
  amount_btc NUMERIC(16, 8) (for donation type)
  
  created_at TIMESTAMP DEFAULT NOW()
  updated_at TIMESTAMP DEFAULT NOW()
)
```

**Index:** `idx_project_updates_created_at DESC` - For activity feed sorting

#### **PROJECT_SUPPORTERS TABLE** (Social Proof)
Anonymized tracking of unique supporters.

```sql
CREATE TABLE project_supporters (
  id UUID PRIMARY KEY
  project_id UUID NOT NULL REFERENCES projects (ON DELETE CASCADE)
  supporter_hash VARCHAR(64) NOT NULL (hash of bitcoin address or user_id)
  
  first_donation_at TIMESTAMP DEFAULT NOW()
  last_donation_at TIMESTAMP DEFAULT NOW()
  total_donated_btc NUMERIC(16, 8) DEFAULT 0
  donation_count INT DEFAULT 1
  
  created_at TIMESTAMP DEFAULT NOW()
  updated_at TIMESTAMP DEFAULT NOW()
  
  UNIQUE(project_id, supporter_hash)
)
```

**Trigger:** `update_project_supporters_count()` - Auto-updates project.supporters_count on changes

---

## 2. CURRENT FINANCIAL FEATURES IMPLEMENTED

### 2.1 Transaction Management

**API Route:** `/home/user/orangecat/src/app/api/transactions/route.ts`

**POST /api/transactions - Create Transaction**
- Multi-entity donations (profile→profile, profile→project, project→profile, etc.)
- Validation: Zod schema validation for all inputs
- Permissions: User can only create transactions from their own entity
- Target validation: Project must be active, profile must exist
- Anti-spam: Max amount check (21M BTC cap)
- Returns: Created transaction record with all metadata

**GET /api/transactions - Query Transactions**
- Filter by entity type and ID
- Public vs. private visibility
- Pagination support (limit/offset)
- Permission-based filtering

### 2.2 Wallet Management

**API Route:** `/home/user/orangecat/src/app/api/wallets/route.ts`

**POST /api/wallets - Create Wallet**
- Ownership validation (profile or project)
- Input sanitization and validation
- Bitcoin address/xpub detection
- Duplicate address prevention
- Wallet type detection (address vs. xpub)
- Category and icon validation (whitelist)
- Primary wallet assignment
- Max 10 wallets per owner enforcement
- Behavior type support (general, recurring_budget, one_time_goal)

**GET /api/wallets - List Wallets**
- Filter by profile_id or project_id
- Return active wallets only
- Ordered by display_order then creation date

**PUT /api/wallets/{id} - Update Wallet**
- Update balance, metadata, behavior parameters
- Trigger milestone checks for goals
- Auto-reset expired budget periods

### 2.3 Wallet Transfers

**API Route:** `/home/user/orangecat/src/app/api/wallets/transfer/route.ts`

**POST /api/wallets/transfer - Internal Wallet-to-Wallet Transfer**
- Transfer funds between user's own wallets
- Validates ownership of both wallets
- Checks sufficient balance
- Creates transaction record (marked as internal_transfer)
- Updates wallet balances atomically via RPC function
- Private transfers (not publicly visible)

### 2.4 Bitcoin Balance Synchronization

**Service:** `/home/user/orangecat/src/services/blockchain.ts`

**fetchBitcoinBalance(address)**
- Fetches balance from mempool.space public API
- Returns: `{ balance_btc: number, tx_count: number, updated_at: string }`
- Caching: 5-minute revalidation (ISR)
- Supports any Bitcoin address format

**API Route:** `/api/wallets/{id}/refresh` - Manual balance refresh

### 2.5 Fundraising Features

**Service:** `/home/user/orangecat/src/services/supabase/fundraising.ts`

**getUserFundraisingStats(userId)**
- Total projects, total raised (in sats), total supporters, active projects
- Aggregates across all user projects
- Counts unique donors from transaction records

**getUserFundraisingActivity(userId, limit)**
- Recent transactions (donations)
- Project creation activities
- Formatted with time-ago strings

### 2.6 Donation Tracking (via Transactions)

**Tracked Data:**
- Donor entity (who sent funds)
- Amount in satoshis
- Payment method (bitcoin/lightning)
- Timestamp and status
- Optional message and purpose
- Visibility settings
- Verification status

**Social Proof:**
- `project_supporters` table tracks unique supporters
- `project_updates` table logs donations as activities
- Supporters count cached on project for performance
- Last donation timestamp for "trending" sorting

---

## 3. DATABASE SCHEMA FOR FINANCE

### 3.1 Complete Financial Tables List

| Table | Purpose | Type | Rows |
|-------|---------|------|------|
| **transactions** | All financial movements | Core | ~1M (many donations) |
| **wallets** | User/project wallet containers | Core | ~10K (10 per entity max) |
| **wallet_addresses** | Derived xpub addresses | Core | ~100K (tracking xpub derivations) |
| **budget_periods** | Historical budget tracking | Analytics | ~10K (monthly for recurring) |
| **goal_milestones** | Savings goal progress | Analytics | ~4K (4 milestones per goal) |
| **wallet_contributions** | Contributions to public goals | Social | ~100K (if goals are public) |
| **projects** | Fundraising entities | Core | ~1K |
| **project_updates** | Activity feed | Analytics | ~5K |
| **project_supporters** | Unique donor tracking | Social | ~50K |
| **profiles** | User accounts | Core | ~500 |
| **organizations** | Group entities | Core | ~100 |

**Total Financial Entities:** ~11 core tables

### 3.2 Transaction Flow Schema

```
┌─────────────────────┐
│   Any Entity        │
│  (Profile/Org/Proj) │
└──────────┬──────────┘
           │
           │ initiates
           ▼
┌─────────────────────────────────┐
│   TRANSACTIONS                  │
│  - amount_sats                  │
│  - from_entity_*                │
│  - to_entity_*                  │
│  - payment_method               │
│  - status                       │
│  - audit_trail                  │
│  - public_visibility            │
└──────────┬──────────────────────┘
           │
           │ funds
           ▼
┌─────────────────────┐
│   Any Entity        │
│  (Profile/Org/Proj) │
└─────────────────────┘
           │
           │ owns
           ▼
┌─────────────────────┐
│   WALLETS           │
│  - balance_btc      │
│  - behavior_type    │
│  - category         │
└─────────────────────┘
```

### 3.3 Wallet Management Hierarchy

```
Profile/Project
    │
    ├─── Wallet 1 (General)
    │    └─── Wallet Address (if xpub)
    │         ├─── Wallet Address (if xpub)
    │         └─── Wallet Address (if xpub)
    │
    ├─── Wallet 2 (Recurring Budget)
    │    └─── Budget Periods (historical tracking)
    │         ├─── Period 1 (completed)
    │         ├─── Period 2 (completed)
    │         └─── Period 3 (active)
    │
    └─── Wallet 3 (One-Time Goal)
         ├─── Goal Milestones (25%, 50%, 75%, 100%)
         └─── Wallet Contributions (if public)
              ├─── Contribution 1
              ├─── Contribution 2
              └─── Contribution 3
```

---

## 4. POTENTIAL GAPS IN FUNCTIONALITY

### 4.1 Missing / Underdeveloped Features

| Feature | Status | Gap Description |
|---------|--------|-----------------|
| **Expense Tracking** | PARTIAL | Budgets exist but no explicit expense categorization beyond wallet categories |
| **Asset Management** | NONE | No dedicated asset tracking (equipment, inventory, etc.) |
| **Recurring Payments** | PARTIAL | Budgets reset but no scheduled recurring transactions OUT |
| **Savings Goals** | IMPLEMENTED | Full support (one_time_goal wallets) |
| **Invoice/Bill System** | NONE | No payment request/invoice feature |
| **Tax Reporting** | NONE | No tax calculation or export features |
| **Multi-Currency Support** | PARTIAL | Only BTC/SATS/USD/EUR/CHF - limited fiat options |
| **Payment Scheduling** | NONE | No scheduled transactions |
| **Spending Analytics** | PARTIAL | Basic tracking only; no trend analysis |
| **Budget Alerts** | PARTIAL | `alert_threshold_percent` exists but no notification system |
| **Refunds/Reversals** | NONE | No transaction reversal mechanism |
| **Subscription Management** | NONE | No recurring payment subscriptions |
| **Split Payments** | NONE | No payment splitting between multiple wallets |

### 4.2 What IS Fully Implemented

✅ **Multi-wallet system per entity**  
✅ **One-time savings goals with milestones**  
✅ **Recurring budget tracking with auto-reset**  
✅ **Bitcoin/Lightning address support**  
✅ **Transaction audit trails**  
✅ **Public/private transaction visibility**  
✅ **Wallet balance tracking**  
✅ **xpub address derivation**  
✅ **Social proof (supporter tracking)**  
✅ **Project funding aggregation**  

---

## 5. ARCHITECTURE PATTERNS & CONSISTENCY

### 5.1 Table Ownership Pattern

**Multi-tenant support through flexible foreign keys:**
```typescript
wallet: {
  profile_id: UUID | NULL,
  project_id: UUID | NULL,
  // Constraint: exactly one must be non-null
  CHECK ((profile_id IS NOT NULL AND project_id IS NULL) 
      OR (profile_id IS NULL AND project_id IS NOT NULL))
}
```

**Consistency:** Applied to wallets table
**Alternative:** Could extend to other features for org ownership

### 5.2 Entity Type Pattern

**Flexible entity references using enum:**
```typescript
transaction: {
  from_entity_type: ENUM('profile' | 'organization' | 'project'),
  from_entity_id: UUID,
  to_entity_type: ENUM('profile' | 'organization' | 'project'),
  to_entity_id: UUID
}
```

**Benefits:**
- No need for separate FK per entity type
- Allows any entity to donate to any other
- Extensible for future entity types

**Consistency:** Applied to transactions, wallet_contributions
**Could extend to:** project_supporters (currently uses hash instead)

### 5.3 Behavior Type Pattern

**Wallets support multiple "modes" via single enum:**
```typescript
wallet: {
  behavior_type: ENUM('general' | 'recurring_budget' | 'one_time_goal'),
  // Conditional fields based on behavior_type
  budget_amount: NUMERIC | NULL,
  goal_amount: NUMERIC | NULL,
}
```

**Implementation Notes:**
- Fields are nullable (only populated for relevant types)
- Triggers auto-initialize periods/milestones
- View provides computed fields based on type

**Consistency:** Applied to wallets table
**Could extend to:** Projects (as fundraising vs. regular projects)

### 5.4 Audit Trail Pattern

**JSONB audit trail on transactions:**
```typescript
audit_trail: {
  initiator_id: string,
  initiator_type: string,
  actions: Array<{
    action: string,
    timestamp: string,
    details: any
  }>
}
```

**Consistency:** Currently transactions only
**Should extend to:** Wallet operations, project funding milestones

### 5.5 RLS (Row Level Security) Pattern

**Data isolation via RLS policies:**
```sql
-- Owners can view/edit their wallets
CREATE POLICY "wallets_select_own"
  ON public.wallets FOR SELECT
  USING (
    auth.uid() = (SELECT user_id FROM profiles WHERE id = profile_id)
    OR auth.uid() = (SELECT user_id FROM projects WHERE id = project_id)
  );

-- Public can view active project wallets
CREATE POLICY "wallets_select_public"
  ON public.wallets FOR SELECT
  USING (
    is_active = true AND (
      project_id IS NOT NULL 
      AND EXISTS (SELECT 1 FROM projects WHERE id = wallets.project_id AND status = 'active')
    )
  );
```

**Consistency:** Applied to wallets, wallet_addresses, budget_periods, goal_milestones, wallet_contributions

### 5.6 Performance Pattern: Cached Counts

**Denormalized counts updated by triggers:**
```sql
-- Cached on project
projects.supporters_count INT -- updated by trigger
projects.last_donation_at TIMESTAMP -- updated by trigger

-- Trigger
CREATE TRIGGER trigger_update_supporters_count
  AFTER INSERT OR UPDATE OR DELETE ON project_supporters
  EXECUTE FUNCTION update_project_supporters_count();
```

**Benefits:** O(1) query for counts instead of aggregation
**Costs:** Must maintain consistency via triggers

### 5.7 Timestamp Pattern

**Consistent UTC timestamps:**
```typescript
// All timestamps use TIMESTAMP WITH TIME ZONE (UTC)
created_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at: TIMESTAMP WITH TIME ZONE DEFAULT NOW()
balance_updated_at: TIMESTAMP WITH TIME ZONE
initiated_at: TIMESTAMP WITH TIME ZONE
confirmed_at: TIMESTAMP WITH TIME ZONE
settled_at: TIMESTAMP WITH TIME ZONE
```

**Helper Trigger:**
```sql
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION handle_updated_at();
```

---

## 6. RECOMMENDED ARCHITECTURE FOR NEW FEATURES

### 6.1 Asset Management Extension

**Proposed Table Structure:**
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles,
  
  -- Asset info
  name TEXT NOT NULL,
  description TEXT,
  asset_type ENUM('equipment', 'inventory', 'property', 'security', 'cryptocurrency', 'custom'),
  
  -- Valuation
  purchase_price NUMERIC(20,8),
  purchase_currency TEXT,
  current_value NUMERIC(20,8),
  value_currency TEXT,
  last_valued_at TIMESTAMP,
  
  -- Ownership
  quantity INT DEFAULT 1,
  unit_type TEXT,
  
  -- Depreciation (if applicable)
  depreciation_rate NUMERIC(5,2),
  depreciation_method ENUM('straight_line', 'accelerated', 'none'),
  
  -- Metadata
  location TEXT,
  serial_number TEXT,
  notes TEXT,
  
  -- Tracking
  is_active BOOLEAN DEFAULT true,
  disposal_date TIMESTAMP,
  
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Asset transactions (buy/sell/transfer)
CREATE TABLE asset_transactions (
  id UUID PRIMARY KEY,
  asset_id UUID NOT NULL REFERENCES assets (ON DELETE CASCADE),
  
  transaction_type ENUM('purchase' | 'sale' | 'transfer' | 'depreciation' | 'adjustment'),
  quantity INT NOT NULL CHECK (> 0),
  price_per_unit NUMERIC(20,8),
  total_value NUMERIC(20,8),
  currency TEXT,
  
  from_entity_type TEXT,
  from_entity_id UUID,
  to_entity_type TEXT,
  to_entity_id UUID,
  
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Integration Points:**
- Link assets to wallets via asset_transactions
- Track funding sources from transaction records
- Integrate with project financials

### 6.2 Recurring Expenses Extension

**Proposed Enhancement (vs. current budgets):**
```sql
-- Scheduled recurring transactions
CREATE TABLE recurring_expenses (
  id UUID PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES profiles,
  
  -- Expense info
  description TEXT NOT NULL,
  amount NUMERIC(20,8) NOT NULL,
  currency TEXT NOT NULL,
  
  -- Recipient
  recipient_type ENUM('profile' | 'organization' | 'external'),
  recipient_id UUID,
  recipient_name TEXT (for external),
  recipient_address TEXT (for external),
  
  -- Schedule
  frequency ENUM('daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly'),
  start_date DATE NOT NULL,
  end_date DATE,
  next_due_date DATE,
  
  -- Status
  status ENUM('active' | 'paused' | 'completed' | 'cancelled'),
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Execution history
CREATE TABLE recurring_expense_executions (
  id UUID PRIMARY KEY,
  recurring_expense_id UUID NOT NULL REFERENCES recurring_expenses,
  
  executed_date DATE NOT NULL,
  amount NUMERIC(20,8),
  status ENUM('scheduled' | 'executed' | 'failed' | 'cancelled'),
  transaction_id UUID REFERENCES transactions,
  error_message TEXT,
  
  created_at TIMESTAMP
);
```

**Differences from Current Budgets:**
- Budgets are spending limits; recurring expenses are scheduled payments
- Could integrate with transactions for payment execution
- Complements budget_periods tracking

### 6.3 Savings Goals vs. Recurring Budgets Clarification

**Current Implementation (CORRECT):**
```
Recurring Budget:     "I can spend $500/month on groceries"
                      (limit on spending, auto-reset period)
                      
One-Time Goal:        "I want to save $5000 for a bike by Dec 25"
                      (target amount, deadline, progress milestones)
```

**No changes needed** - architecture is sound!

---

## 7. IMPLEMENTATION CONSISTENCY GUIDE

### 7.1 When Adding Financial Features

**Checklist:**

```
□ Create Zod schema in src/lib/validation.ts
  └─ Centralize validation, avoid DRY violations

□ Create API route with POST/GET/PUT
  └─ src/app/api/[feature]/route.ts
  └─ Include authentication checks
  └─ Add permission validation
  └─ Return proper HTTP status codes

□ Add database types
  └─ src/types/[feature].ts
  └─ Derive Zod types: z.infer<typeof schema>

□ Update database.ts type definitions
  └─ src/types/database.ts (if core table)

□ Create/update migration file
  └─ supabase/migrations/YYYYMMDDHHMMSS_description.sql
  └─ Include RLS policies
  └─ Add performance indexes
  └─ Include rollback statements

□ Add RLS policies
  └─ Owner can CRUD their own
  └─ Public can SELECT if public visibility
  └─ Service role for admin operations

□ Create service layer
  └─ src/services/[feature].ts
  └─ Handle business logic

□ Add tests
  └─ Test validation, permissions, edge cases
```

### 7.2 Type Definition Pattern

**Standard structure (src/types/[feature].ts):**
```typescript
// Core types from database
export interface Feature {
  id: string;
  owner_id: string;
  // ... all columns
  created_at: string;
  updated_at: string;
}

// Form input types
export interface FeatureFormData {
  field1: string;
  field2?: number;
  // ... only non-id, non-timestamp fields
}

// Insert/Update types
export type FeatureInsert = Database['public']['Tables']['features']['Insert'];
export type FeatureUpdate = Database['public']['Tables']['features']['Update'];

// Validation helper
export function validateFeatureFormData(data: FeatureFormData): ValidationResult {
  // Return { valid: boolean, error?: string, details?: Record<string, string> }
}
```

### 7.3 API Route Pattern

**Standard structure (src/app/api/[feature]/route.ts):**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/services/supabase/server';
import { featureSchema } from '@/lib/validation';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query with RLS (user's data only)
    const { data, error } = await supabase
      .from('features')
      .select('*')
      .eq('owner_id', user.id);

    if (error) throw error;
    return NextResponse.json({ data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = featureSchema.parse(await request.json());

    // Validate ownership/permissions
    // Insert with RLS (automatic owner_id = user.id via policy)
    const { data, error } = await supabase
      .from('features')
      .insert({ ...body, owner_id: user.id })
      .select();

    if (error) throw error;
    return NextResponse.json({ data }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
    }
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### 7.4 Migration Pattern

**Standard structure (supabase/migrations/YYYYMMDDHHMMSS_description.sql):**
```sql
-- Always use BEGIN/COMMIT for atomicity
BEGIN;

-- Step 1: Create tables
CREATE TABLE IF NOT EXISTS public.feature (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- ... other columns
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Step 2: Add indexes
CREATE INDEX idx_feature_owner ON public.feature(owner_id);
CREATE INDEX idx_feature_created_at ON public.feature(created_at DESC);

-- Step 3: Enable RLS
ALTER TABLE public.feature ENABLE ROW LEVEL SECURITY;

-- Step 4: Create policies
CREATE POLICY "Users can view own features"
  ON public.feature FOR SELECT
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can create features"
  ON public.feature FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Step 5: Add triggers (if needed)
CREATE TRIGGER set_feature_updated_at
  BEFORE UPDATE ON public.feature
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

COMMIT;
```

---

## 8. FINANCIAL OPERATIONS SUMMARY

### 8.1 Supported Operations

| Operation | Implementation | API Endpoint | Status |
|-----------|-----------------|--------------|--------|
| Create transaction | TransactionFormData validation | `POST /api/transactions` | ✅ Full |
| List transactions | Query by entity | `GET /api/transactions` | ✅ Full |
| Create wallet | WalletFormData validation | `POST /api/wallets` | ✅ Full |
| List wallets | Filter by owner | `GET /api/wallets` | ✅ Full |
| Update wallet | Zod validation | `PUT /api/wallets/{id}` | ✅ Full |
| Transfer funds | Inter-wallet transfer | `POST /api/wallets/transfer` | ✅ Full |
| Refresh balance | Bitcoin address lookup | `POST /api/wallets/{id}/refresh` | ✅ Full |
| Track budget | Recurring budget tracking | wallet with budget fields | ✅ Full |
| Track savings goal | One-time goal tracking | wallet with goal fields | ✅ Full |
| Milestone tracking | Auto-triggered at thresholds | goal_milestones table | ✅ Full |
| Social contributions | Public goal contributions | wallet_contributions table | ✅ Full |
| Project funding | Aggregated donations | project_supporters table | ✅ Full |

### 8.2 Permission Model

**Transaction Creation:**
- User can only create FROM their own entity
- FROM entity must be profile or owned project
- TO entity must exist and be active (if project)

**Wallet Management:**
- User can only manage wallets they own
- 10 wallet max per profile/project enforced by CHECK constraint
- Only active wallets returned in lists

**Balance Updates:**
- Only service role can update balances (RLS)
- User-facing updates via transfer endpoint

---

## 9. KEY INDICES FOR PERFORMANCE

### Critical for Fast Queries

```sql
-- Transaction lookups by entity
CREATE INDEX idx_transactions_from_entity ON transactions(from_entity_type, from_entity_id);
CREATE INDEX idx_transactions_to_entity ON transactions(to_entity_type, to_entity_id);

-- Filtering by status (very common)
CREATE INDEX idx_transactions_status ON transactions(status);

-- Time-based queries
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- Amount-based queries (for leaderboards)
CREATE INDEX idx_transactions_amount ON transactions(amount_sats DESC);

-- Wallet lookups
CREATE INDEX idx_wallets_profile ON wallets(profile_id) WHERE is_active = true;
CREATE INDEX idx_wallets_project ON wallets(project_id) WHERE is_active = true;

-- Budget period tracking
CREATE INDEX idx_budget_periods_wallet ON budget_periods(wallet_id, period_start DESC);

-- Supporter counting
CREATE INDEX idx_project_supporters_project_id ON project_supporters(project_id);
```

---

## 10. VALIDATION & DATA INTEGRITY

### 10.1 Application-Level Validation

**Zod schemas provide:**
- Type safety
- Runtime validation
- Error messages
- DRY principle compliance

**Key schemas:**
- `transactionSchema` - Multi-entity transactions
- `projectSchema` - Project creation
- `profileSchema` - User profiles
- Wallet validation functions - Address/xpub formats

### 10.2 Database Constraints

```sql
-- Amount constraints
CHECK (amount_sats > 0)
CHECK (amount_sats <= 21000000 * 100000000)  -- Max BTC supply

-- Wallet limits
CHECK ((profile_id IS NOT NULL AND project_id IS NULL) 
    OR (profile_id IS NULL AND project_id IS NOT NULL))
CHECK (COUNT(*) <= 10)  -- Max wallets per owner

-- Budget constraints
CHECK (budget_amount > 0)
CHECK (current_period_spent >= 0)
CHECK (alert_threshold_percent BETWEEN 1 AND 100)

-- Period constraints
CHECK (period_end > period_start)
UNIQUE (wallet_id, period_start)  -- One period per wallet start date
```

---

## RECOMMENDATIONS FOR FUTURE DEVELOPMENT

### Priority 1 (High Value, Low Effort)
1. Add transaction reversal/dispute mechanism
2. Implement budget alerts (email/push when threshold reached)
3. Add spending analytics dashboard
4. Create tax report export for transactions

### Priority 2 (Medium Value, Medium Effort)
1. Recurring expense scheduling (vs. budget limiting)
2. Asset management system
3. Payment request/invoice feature
4. Spending trends and analytics

### Priority 3 (Nice to Have)
1. Payment splitting between wallets
2. Budget templates/presets
3. Subscription management
4. Advanced currency conversion

### Technical Debt
1. Extend audit_trail to all financial operations
2. Create dedicated FinancialEvent table for event sourcing
3. Add encryption for sensitive wallet fields
4. Implement comprehensive financial reporting service

---

## FILES REFERENCED

**Database:**
- `/home/user/orangecat/src/types/database.ts` - Database types
- `/home/user/orangecat/src/types/wallet.ts` - Wallet types and validation
- `/home/user/orangecat/src/types/project.ts` - Project types
- `/home/user/orangecat/supabase/migrations/20251112000000_create_wallets_system.sql` - Wallets schema
- `/home/user/orangecat/supabase/migrations/20251117000000_add_wallet_behavior_types.sql` - Behavior types
- `/home/user/orangecat/supabase/migrations/20251117_add_supporters_and_updates.sql` - Social features
- `/home/user/orangecat/supabase/migrations/20251221_enhance_multi_entity_donations.sql` - Transactions

**API Routes:**
- `/home/user/orangecat/src/app/api/transactions/route.ts`
- `/home/user/orangecat/src/app/api/wallets/route.ts`
- `/home/user/orangecat/src/app/api/wallets/transfer/route.ts`

**Services:**
- `/home/user/orangecat/src/services/blockchain.ts`
- `/home/user/orangecat/src/services/supabase/fundraising.ts`

**Validation:**
- `/home/user/orangecat/src/lib/validation.ts`

