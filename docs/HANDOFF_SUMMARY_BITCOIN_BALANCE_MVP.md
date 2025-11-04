# Handoff Summary: Bitcoin Balance MVP Implementation

**Date**: 2025-11-04
**Branch**: `feat/bitcoin-balance-mvp`
**Rollback Point**: `snapshot-pre-balance-mvp-2025-11-04` (commit: `b4a0b18`)
**Status**: ✅ **FULLY IMPLEMENTED & READY FOR TESTING**

---

## 🎯 What Was Built

A complete Bitcoin-first fundraising system with:

- **Real-time blockchain balance** fetching from mempool.space
- **Dynamic goal tracking** (goal can be achieved via donations OR BTC price increase)
- **3-image media gallery** with Supabase Storage
- **GoFundMe-style project page** with summary rail
- **Presigned upload flow** (client → storage, no proxy)

---

## 📂 Files Changed (11 files, +1169 lines)

### Documentation

```
docs/architecture/adr/2025-11-04-bitcoin-balance-mvp.md     [NEW] - Architecture Decision Record
docs/architecture/SUPABASE_STORAGE_POLICIES.sql             [NEW] - Storage bucket setup SQL
```

### Database

```
supabase/migrations/20251104_bitcoin_balance_mvp.sql        [NEW] - Idempotent migration (303 lines)
```

### Backend Services

```
src/services/blockchain.ts                                  [NEW] - Mempool.space API client
src/lib/projectGoal.ts                                      [NEW] - Amount raised computation
src/types/project.ts                                        [NEW] - TypeScript types with mappers
```

### API Endpoints

```
src/app/api/projects/[id]/refresh-balance/route.ts          [NEW] - Manual balance refresh (5-min cooldown)
src/app/api/projects/[id]/media/upload-url/route.ts         [NEW] - Presigned upload URL generator
src/app/api/projects/[id]/media/route.ts                    [NEW] - Media metadata CRUD
```

### Frontend Components

```
src/components/project/ProjectSummaryRail.tsx               [NEW] - Live balance, progress, refresh button
src/components/project/ProjectMediaGallery.tsx              [NEW] - 3-image gallery with lightbox
src/app/projects/[id]/page.tsx                              [MODIFIED] - Two-column layout integration
```

---

## 🗄️ Database Changes (Applied to Supabase)

### New Columns on `public.projects`

```sql
bitcoin_balance_btc          NUMERIC(20,8) DEFAULT 0 NOT NULL   -- From blockchain
bitcoin_balance_updated_at   TIMESTAMPTZ                        -- Last refresh timestamp
website_url                  TEXT                               -- Optional project website
cover_image_url              TEXT                               -- Optional cover image
```

### New Table: `public.project_media`

```sql
CREATE TABLE public.project_media (
  id UUID PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,                    -- Only path stored (derive URL at read-time)
  position INT NOT NULL,                         -- 0-2 (max 3 images)
  alt_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_project_media_position UNIQUE(project_id, position),
  CONSTRAINT check_position_range CHECK (position BETWEEN 0 AND 2)
);
```

### Indexes Added

- `idx_projects_user_id` - Lookup by owner
- `idx_projects_bitcoin_address` (partial) - Blockchain queries
- `idx_projects_balance_updated` (partial) - Rate limiting
- `idx_projects_status` - Filter by status
- `idx_projects_created_at DESC` - Recent projects
- `idx_project_media_project` - Gallery lookups

### RLS Policies (Idempotent)

**Projects:**

- Public can SELECT active projects
- Owner can SELECT/INSERT/UPDATE/DELETE own projects

**Media:**

- Anyone can SELECT (public read)
- Owner can INSERT/UPDATE/DELETE own project media

---

## 🔧 Key Technical Decisions

### 1. Currency Handling

- **DB column name**: Kept as `currency` (no rename yet)
- **Code mapping**: `currency → goal_currency` via TypeScript mapper
- **Default**: Removed SATS default, no new default set
- **Validation**: In application layer only

### 2. Media Storage

- **Strategy**: Presigned uploads (client → Supabase Storage)
- **Path format**: `project-media/{project_id}/{uuid}.ext` (enforced)
- **Stored in DB**: Only `storage_path` (URL derived at read-time)
- **Access**: Public read, owner write/delete
- **Limit**: Max 3 images per project

### 3. Balance Refresh

- **Trigger**: Manual only (POST to `/api/projects/[id]/refresh-balance`)
- **Rate limit**: 5-minute cooldown via `bitcoin_balance_updated_at`
- **Idempotency**: 1-second guard (return cached if just updated)
- **Source**: mempool.space API (free, no auth)

### 4. Backward Compatibility

- **Legacy field**: `raised_amount` kept for fallback
- **Display logic**: Use BTC balance if present, else `raised_amount`
- **No breaking changes**: All migrations additive only

---

## 📊 Data Flow

### Amount Raised Computation

```typescript
// Single source of truth: BTC balance from blockchain
bitcoin_balance_btc (from mempool.space)
  ↓
  × current exchange rate (from CoinGecko, 1-min cache)
  ↓
amount_raised_in_goal_currency (computed in real-time)
  ↓
  compared to goal_amount
  ↓
progress % = (amount_raised / goal_amount) × 100
```

### Media Upload Flow

```
1. Client: POST /api/projects/[id]/media/upload-url
   → Validates ownership, count < 3, file extension
   → Returns: { upload_url, path, token }

2. Client: PUT to upload_url (presigned, direct to storage)
   → Uploads file to Supabase Storage
   → No server involvement

3. Client: POST /api/projects/[id]/media
   → Body: { path, alt_text }
   → Creates metadata row
   → Auto-assigns position (0-2)
```

---

## 🧪 Testing Checklist

### Migration

- [x] Migration executed successfully
- [ ] Verify columns exist: `\d projects`
- [ ] Verify RLS enabled: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename IN ('projects', 'project_media')`
- [ ] Verify policies: `SELECT tablename, policyname FROM pg_policies WHERE tablename IN ('projects', 'project_media')`

### Backend

- [ ] Test refresh with no bitcoin_address (should 400)
- [ ] Test refresh with valid address (should update balance)
- [ ] Test refresh spam (should rate-limit after 5 min)
- [ ] Test concurrent refresh (should return 202 cached)
- [ ] Test media upload with invalid extension (should reject)
- [ ] Test uploading 4th image (should reject)

### Frontend

- [ ] Project page shows new two-column layout
- [ ] Summary rail displays BTC balance
- [ ] Progress bar updates correctly
- [ ] Refresh button works (owner only)
- [ ] Media gallery shows up to 3 images
- [ ] Legacy projects (no BTC address) still work

---

## 🚀 Deployment Status

### Git

- **Current branch**: `feat/bitcoin-balance-mvp`
- **Commits**:
  - `359ebe1` - feat(gallery+rail): UI components
  - `9541e1a` - feat(balance-mvp): migration + APIs
  - `b4a0b18` - chore(snapshot): rollback point ⭐
- **Remote**: Pushed to `origin/feat/bitcoin-balance-mvp`

### Supabase (Dev)

- ✅ Migration applied
- ✅ RLS enabled
- ✅ Storage bucket `project-media` created
- ✅ Storage policies applied

### Vercel

- ⏳ Not deployed yet (branch only)

---

## 📋 Next Steps

### Immediate (Testing Phase)

1. **Manual testing** with Bitcoin testnet address
2. **Upload test images** (verify presigned flow)
3. **Test rate limiting** (rapid refresh clicks)
4. **Test RLS** (try accessing others' projects)

### Before Merging to Main

1. **Deploy to staging** environment
2. **Monitor for errors** (check logs)
3. **User acceptance testing**
4. **Performance check** (mempool.space response times)

### Future Enhancements (Deferred)

- [ ] Historical balance snapshots (`project_balance_history` table)
- [ ] Goal achievement events (`project_goal_events` table)
- [ ] "Then vs now" donation values
- [ ] Automatic refresh (Vercel cron job)
- [ ] Additional currencies (JPY, CNY, INR)
- [ ] Private media (signed GET URLs)

---

## 🔄 How to Rollback

If anything breaks:

```bash
# Check current status
git status

# Rollback to pre-implementation state
git checkout snapshot-pre-balance-mvp-2025-11-04

# Or go back to main
git checkout main

# Or revert specific commits
git revert 359ebe1  # Revert UI changes
git revert 9541e1a  # Revert backend changes
```

### Rollback Supabase Migration

```sql
-- Rollback: Drop new table and columns
DROP TABLE IF EXISTS public.project_media CASCADE;

ALTER TABLE public.projects
  DROP COLUMN IF EXISTS bitcoin_balance_btc,
  DROP COLUMN IF EXISTS bitcoin_balance_updated_at,
  DROP COLUMN IF EXISTS website_url,
  DROP COLUMN IF EXISTS cover_image_url;

-- Drop indexes
DROP INDEX IF EXISTS idx_projects_bitcoin_address;
DROP INDEX IF EXISTS idx_projects_balance_updated;
-- ... etc
```

---

## 📚 Key Files for Review

### Must Read

1. `docs/architecture/adr/2025-11-04-bitcoin-balance-mvp.md` - Why we made these decisions
2. `supabase/migrations/20251104_bitcoin_balance_mvp.sql` - Database changes
3. `src/lib/projectGoal.ts` - Core business logic (amount raised computation)

### API Contracts

4. `src/app/api/projects/[id]/refresh-balance/route.ts` - Balance refresh endpoint
5. `src/app/api/projects/[id]/media/upload-url/route.ts` - Presigned upload
6. `src/app/api/projects/[id]/media/route.ts` - Media metadata

### Frontend Integration

7. `src/components/project/ProjectSummaryRail.tsx` - Main UI component
8. `src/components/project/ProjectMediaGallery.tsx` - Gallery component
9. `src/app/projects/[id]/page.tsx` - Integration point

---

## ⚠️ Known Limitations (By Design)

1. **Manual refresh only** - No automatic background jobs (cost/simplicity)
2. **5-minute cooldown** - Can't spam refresh (prevents mempool.space rate limits)
3. **Max 3 images** - Database constraint enforced (MVP scope)
4. **Public media** - Anyone can view images (private mode deferred)
5. **No transaction history** - Only current balance (history tracking deferred)
6. **Bitcoin address optional** - Reduces onboarding friction (shows fallback UI)

---

## 🎓 For Next Claude Session

### Context to Provide

```
Branch: feat/bitcoin-balance-mvp
Last commit: 359ebe1 (feat: gallery+rail)
Rollback point: b4a0b18 (snapshot)
Migration: 20251104_bitcoin_balance_mvp.sql (APPLIED)

Key decisions:
- Keep DB column "currency", map to "goal_currency" in code
- Store only storage_path, derive URLs at read-time
- Presigned uploads (no proxy)
- Manual refresh, 5-min cooldown, 1-sec idempotency
- Public read, owner write for media
- RLS enabled on projects and project_media

Status: FULLY IMPLEMENTED, READY FOR TESTING
```

### Common Questions

**Q: Why not rename currency → goal_currency in DB?**
A: Risk mitigation. Renaming requires updating all queries. We alias in TypeScript at API boundaries. Can rename later after validation.

**Q: Why store only storage_path instead of full URL?**
A: Future-proofing. If we switch to private buckets with signed URLs, we don't need to backfill. URLs are derived at read-time.

**Q: Why manual refresh instead of cron?**
A: Cost and simplicity for MVP. Vercel cron costs money on Hobby plan. Manual refresh is sufficient for initial validation.

**Q: Why only 3 images?**
A: GoFundMe-style design + MVP scope. Database constraint ensures enforcement.

---

## 📞 Contact / Handoff

- **Feature branch**: `feat/bitcoin-balance-mvp`
- **Migration status**: ✅ Applied to dev Supabase
- **Code status**: ✅ Committed and pushed
- **Testing status**: ⏳ Awaiting manual testing
- **Deployment status**: ⏳ Not deployed to Vercel yet

**Next person**: Run manual tests (checklist above), then deploy to staging.

---

**Generated**: 2025-11-04
**Last updated**: 2025-11-04
**Version**: 1.0
