# PROFILE CREATION & PROFILE PAGE SYSTEM - COMPREHENSIVE ANALYSIS

## EXECUTIVE SUMMARY

The profile system consists of:
1. **ProfileWizard** - A 4-step wizard for profile creation (Basics → Location → Bio → Wallets)
2. **Profile Page Tabs** - Currently shows Overview, Timeline, Projects (3 tabs)
3. **Profile Editor** - ModernProfileEditor component with modal interface
4. **Wallet Management** - Integrated wallet system with categories and behavior types

**Critical Issues Found:**
- Edit Profile button doesn't open modal (broken navigation)
- WalletManager API mismatch in ProfileWizard
- Missing "Info" tab for profile information viewing
- ProfileWizard not used in app flow (only in component tests)

---

## 1. PROFILE CREATION FLOW

### Entry Points

| Route | Component | Behavior |
|-------|-----------|----------|
| `/app/(authenticated)/onboarding/page.tsx` | OnboardingRedirect | Redirects to `/projects/create` (skips profile) |
| `/app/profile/setup/page.tsx` | ProfileSetupRedirect | Redirects to `/profiles/me` |

**Issue:** Onboarding doesn't guide users through profile setup

### ProfileWizard Component (4 Steps)

**File:** `/home/user/orangecat/src/components/profile/ProfileWizard.tsx`

| Step | ID | Title | Required | Fields |
|------|----|----|----------|--------|
| 1 | `basics` | 👋 Basic Info | YES | username, name |
| 2 | `location` | 📍 Location | NO | location fields + coordinates |
| 3 | `bio` | 📖 About You | NO | bio, background, inspiration |
| 4 | `wallets` | ₿ Wallets | NO | WalletManager component |

**Key Code:**
- Lines 67-104: STEPS constant
- Lines 499-504: WalletManager integration (BROKEN - see Issue #1)

### Wallet Creation During Profile Setup

**Current Implementation:**
```typescript
// ProfileWizard.tsx, lines 436-507
- Shows bitcoin_address and lightning_address form fields
- Includes WalletManager component
- NO automatic wallet creation

// API: /api/wallets/route.ts lines 215-237
- behavior_type defaults to "general" ✅
- category defaults to "general" ✅
- category_icon defaults to "💰" ✅
- profile_id properly associated ✅
```

**Issue #1: CRITICAL - WalletManager API Mismatch**
- ProfileWizard calls: `<WalletManager profileId={userId} onWalletUpdate={...} />`
- WalletManager expects: `wallets`, `entityType`, `entityId`, callbacks, `isOwner`
- **Result:** Wallet step will crash or not work

---

## 2. PROFILE PAGE STRUCTURE

### Current Tabs (3)

**File:** `/home/user/orangecat/src/components/profile/PublicProfileClient.tsx` (lines 132-153)

```typescript
const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <User className="w-4 h-4" />,
    content: <ProfileOverviewTab profile={profile} stats={stats} />,
  },
  {
    id: 'timeline',
    label: 'Timeline',
    icon: <MessageSquare className="w-4 h-4" />,
    content: <ProfileTimelineTab profile={profile} isOwnProfile={isOwnProfile} />,
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: <Target className="w-4 h-4" />,
    badge: stats?.projectCount,
    content: <ProfileProjectsTab profile={profile} isOwnProfile={isOwnProfile} />,
  },
];
```

### Tab Details

#### Overview Tab
**File:** `/home/user/orangecat/src/components/profile/ProfileOverviewTab.tsx`
- Bio section
- Stats: Project count, Total raised (in BTC)
- Contact information: Website, Bitcoin address, Lightning address, Join date

#### Timeline Tab
**File:** `/home/user/orangecat/src/components/profile/ProfileTimelineTab.tsx`
- Posts on profile timeline
- TimelineComposer for creating new posts
- TimelineView for displaying posts
- Filters drafts for public display

#### Projects Tab
**File:** `/home/user/orangecat/src/components/profile/ProfileProjectsTab.tsx`
- Fetches from `/api/profiles/[profile.id]/projects`
- Shows project status badges
- Project count badge on tab

### Missing Tab: Info

**Issue #2: HIGH - Missing Info Tab**

**Should include:**
- Full name / Display name
- Username (@handle)
- Bio (summary)
- Background / Professional experience
- Inspiration statement
- Location with coordinates
- Website URL
- Contact methods
- Account age / Join date
- Wallet addresses or link to wallets

**Current Workaround:**
- Overview tab shows some info
- Users must edit in modal to see/change full details
- No dedicated info viewing section

---

## 3. WALLET INTEGRATION

### Wallet Data Structure

**File:** `/home/user/orangecat/src/types/wallet.ts`

**Wallet Types:**
```typescript
type WalletType = 'address' | 'xpub';
type WalletBehaviorType = 'general' | 'recurring_budget' | 'one_time_goal';
type WalletCategory = 'general' | 'rent' | 'food' | 'medical' | 'education' | 
                      'emergency' | 'transportation' | 'utilities' | 'projects' |
                      'legal' | 'entertainment' | 'custom';
```

**Categories:**
```
💰 General (default)
🏠 Rent & Housing
🍔 Food & Groceries
💊 Medical & Healthcare
🎓 Education
🚨 Emergency Fund
🚗 Transportation
💡 Utilities
🚀 Projects & Initiatives
⚖️ Legal & Advocacy
🎭 Entertainment & Arts
📦 Other
```

### Wallet Creation in Profile Wizard

**Problem:** WalletManager interface changed but ProfileWizard not updated

**Current Call:**
```typescript
// ProfileWizard.tsx line 499
<WalletManager
  profileId={userId}
  onWalletUpdate={() => {}}
/>
```

**Expected Signature:**
```typescript
interface WalletManagerProps {
  wallets: Wallet[];
  entityType: 'profile' | 'project';
  entityId: string;
  onAdd?: (wallet: WalletFormData) => Promise<void>;
  onUpdate?: (walletId: string, data: Partial<WalletFormData>) => Promise<void>;
  onDelete?: (walletId: string) => Promise<void>;
  onRefresh?: (walletId: string) => Promise<void>;
  maxWallets?: number;
  isOwner?: boolean;
}
```

### Wallet Storage in Profile Editor

**File:** `/home/user/orangecat/src/components/profile/ModernProfileEditor.tsx` (lines 237-331)

```typescript
// Lines 237-247: Fetch wallets
useEffect(() => {
  if (profile.id) {
    fetch(`/api/wallets?profile_id=${profile.id}`)
      .then(res => res.json())
      .then(data => setWallets(data.wallets || []))
  }
}, [profile.id]);

// Lines 250-270: Add wallet
const handleAddWallet = async (data: WalletFormData) => {
  const res = await fetch('/api/wallets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, profile_id: profile.id }),
  });
  // profile_id properly passed ✅
}
```

### Wallet API Defaults

**File:** `/home/user/orangecat/src/app/api/wallets/route.ts` (lines 215-237)

```typescript
const { data: wallet, error } = await supabase
  .from('wallets')
  .insert({
    profile_id: body.profile_id || null,
    project_id: body.project_id || null,
    label: sanitized.label,
    description: sanitized.description || null,
    address_or_xpub: sanitized.address_or_xpub,
    wallet_type: walletType,
    category: sanitized.category,
    category_icon: sanitized.category_icon || '💰',  // LINE 226: DEFAULT
    behavior_type: body.behavior_type || 'general',   // LINE 227: DEFAULT
    // ... other fields
    is_primary: body.is_primary !== undefined ? body.is_primary : isFirstWallet,
    balance_btc: 0,
  })
```

**Defaults Summary:**
- ✅ behavior_type = "general"
- ✅ category_icon = "💰"
- ✅ profile_id properly saved
- ✅ is_primary set for first wallet

---

## 4. PROFILE EDITOR & SETTINGS

### ModernProfileEditor Component

**File:** `/home/user/orangecat/src/components/profile/ModernProfileEditor.tsx`

**Two Modes:**

1. **Regular Edit Mode** (default, lines 369-500+)
   - Modal dialog
   - Image uploads (avatar, banner)
   - Form fields: Name, Bio, Location
   - Hidden location fields (country, city, zip, coordinates)
   - Wallet management separate

2. **Wizard Mode** (if useWizard=true, lines 357-366)
   - Calls ProfileWizard component
   - 4-step process

**Form Structure:**
```typescript
- Images section (avatar + banner)
- Name field
- Bio textarea
- Location autocomplete
- Wallet management
- ProfileTabs (Basic Info, Payment, Social)
```

### ProfileTabs (Editor Tabs)

**File:** `/home/user/orangecat/src/components/profile/ProfileTabs.tsx`

```typescript
<Tabs defaultValue="basic">
  <TabsList>
    <TabsTrigger value="basic">👤 Basic Info</TabsTrigger>
    <TabsTrigger value="payment">₿ Payment</TabsTrigger>
    <TabsTrigger value="social">🌐 Social</TabsTrigger>
  </TabsList>
  
  <TabsContent value="basic">
    - UsernameField
    - DisplayNameField
    - BioField
  </TabsContent>
  
  <TabsContent value="payment">
    - BitcoinAddressField
    - LightningAddressField
  </TabsContent>
  
  <TabsContent value="social">
    - WebsiteField
    - Coming soon: Twitter, GitHub
  </TabsContent>
</Tabs>
```

---

## 5. NAVIGATION & UX FLOW

### URL Structure

| URL | Component | Purpose |
|-----|-----------|---------|
| `/profiles/[username]` | PublicProfileClient | View profile |
| `/profiles/me` | PublicProfileClient | Own profile (redirects to username) |
| `/profile` | Redirect to `/profiles/me` | Legacy route |
| `/profile/[username]` | Redirect to `/profiles/[username]` | Legacy route |
| `/profile/setup` | Redirect to `/profiles/me` | Legacy route |

### Edit Profile Flow - BROKEN

**Issue #3: CRITICAL - Edit Modal Not Opening**

**Current Flow:**
```
User clicks "Edit Profile" button
  ↓
Links to /profiles/me (same page)
  ↓
User sees profile again
  ↓
NO WAY TO EDIT ❌
```

**Code:**
```typescript
// PublicProfileClient.tsx lines 208-217
{isOwnProfile && (
  <Link href="/profiles/me">
    <Button>
      <Edit className="w-4 h-4 mr-2" />
      Edit Profile
    </Button>
  </Link>
)}
```

**Expected Flow:**
```
User clicks "Edit Profile"
  ↓
Modal opens with ModernProfileEditor
  ↓
User edits and saves
  ↓
Modal closes, profile updates ✅
```

### Alternative: UnifiedProfileLayout

**File:** `/home/user/orangecat/src/components/profile/UnifiedProfileLayout.tsx`

**Features:**
- Alternative profile layout
- Supports view and edit modes (props: mode='view'|'edit')
- Better architecture than PublicProfileClient
- NOT currently used in app routes
- Shows profile, wallets, projects in one component

**Status:** Exists but unused

---

## 6. CRITICAL ISSUES SUMMARY

### Issue #1: WalletManager API Mismatch
**Severity:** CRITICAL
**File:** `/home/user/orangecat/src/components/profile/ProfileWizard.tsx:499`
**Problem:** ProfileWizard passes wrong props to WalletManager
```typescript
// Current (WRONG):
<WalletManager profileId={userId} onWalletUpdate={() => {}} />

// Expected:
<WalletManager
  wallets={wallets}
  entityType="profile"
  entityId={userId}
  onAdd={handleAddWallet}
  onUpdate={handleUpdateWallet}
  onDelete={handleDeleteWallet}
  isOwner={true}
/>
```

### Issue #2: Edit Profile Modal Not Opening
**Severity:** CRITICAL
**File:** `/home/user/orangecat/src/components/profile/PublicProfileClient.tsx:208`
**Problem:** Edit button just links to same page
**Impact:** Users cannot edit their profiles!

### Issue #3: Missing Info Tab
**Severity:** HIGH
**Current:** Only Overview, Timeline, Projects tabs
**Missing:** Info/Settings tab for profile details
**Impact:** Users can't view/edit structured profile info

### Issue #4: ProfileWizard Not Used
**Severity:** HIGH
**File:** `/home/user/orangecat/src/components/profile/ProfileWizard.tsx`
**Used In:** Only ModernProfileEditor (if useWizard=true)
**Not Called From:** Any app routes
**Impact:** Users don't go through setup wizard

### Issue #5: Component Duplication
**Severity:** MEDIUM
**Components:**
- ModernProfileEditor (for editing)
- UnifiedProfileLayout (alternative layout)
- PublicProfileClient (current layout)
**Problem:** Unclear which should be used, duplication

---

## 7. WALLET DEFAULTS - CORRECT

**All defaults working as intended:**

✅ `behavior_type` = "general" (line 227 in api/wallets/route.ts)
✅ `category` = "general" (via sanitization)
✅ `category_icon` = "💰" (line 226)
✅ `profile_id` properly associated
✅ `is_primary` set for first wallet

No issues with wallet defaults - only with ProfileWizard integration.

---

## 8. RECOMMENDED TAB STRUCTURE

### Option A: Add Info Tab (Minimal)
```
1. Overview (bio + stats)
2. Info (profile details) ← NEW
3. Timeline (posts)
4. Projects (with count badge)
```

### Option B: Reorganized (Better UX)
```
1. Overview (bio, stats, contact)
2. Info (all profile details)
3. Activity (timeline)
4. Projects (with count badge)
```

### Info Tab Should Show
```typescript
<ProfileInfoTab profile={profile} />

Content:
- Name / Username
- Location (with map?)
- Bio & Background
- Inspiration statement
- Website
- Wallet addresses
- Contact info
- Account age
- Stats (projects, followers, etc.)
```

---

## 9. IMPLEMENTATION CHECKLIST

### P0 - CRITICAL (Blocks Users)
- [ ] Fix Edit Profile button to open modal
- [ ] Fix WalletManager integration in ProfileWizard
- [ ] Test complete profile creation flow

### P1 - HIGH (Feature Complete)
- [ ] Add ProfileInfoTab component
- [ ] Add Info tab to tabs array
- [ ] Choose: Keep PublicProfileClient or migrate to UnifiedProfileLayout
- [ ] Remove or integrate ProfileWizard

### P2 - MEDIUM (Polish)
- [ ] Improve wallet creation UX in wizard
- [ ] Add wallet display in Info tab
- [ ] Profile completion progress indicator

---

## 10. FILE REFERENCE GUIDE

| Component | File | Key Lines | Purpose |
|-----------|------|-----------|---------|
| ProfileWizard | `/components/profile/ProfileWizard.tsx` | 67-104, 499-504 | 4-step wizard |
| ModernProfileEditor | `/components/profile/ModernProfileEditor.tsx` | 357-366, 369-500 | Edit modal |
| PublicProfileClient | `/components/profile/PublicProfileClient.tsx` | 132-153, 208-217 | Profile view |
| ProfileViewTabs | `/components/profile/ProfileViewTabs.tsx` | 28-112 | Tab container |
| ProfileOverviewTab | `/components/profile/ProfileOverviewTab.tsx` | 21-120 | Overview content |
| ProfileTimelineTab | `/components/profile/ProfileTimelineTab.tsx` | 22-62 | Timeline content |
| ProfileProjectsTab | `/components/profile/ProfileProjectsTab.tsx` | 23-80 | Projects content |
| WalletManager | `/components/wallets/WalletManager.tsx` | 9-19, 21-102 | Wallet CRUD |
| Wallets API | `/app/api/wallets/route.ts` | 75-264 | Wallet endpoint |
| Profile API | `/app/api/profile/route.ts` | 104-164 | Profile update |
| Wallet Types | `/types/wallet.ts` | 33-97, 131 | Type definitions |

---

## 11. KEY CODE SNIPPETS

### Fix for Issue #1: WalletManager Mismatch

Replace in ProfileWizard.tsx (line 499):
```typescript
// BEFORE (broken):
<WalletManager
  profileId={userId}
  onWalletUpdate={() => {
    // Refresh wallet data if needed
  }}
/>

// AFTER (correct):
{/* Fetch wallets for profile */}
{wallets && (
  <WalletManager
    wallets={wallets}
    entityType="profile"
    entityId={userId}
    onAdd={handleAddWallet}
    onUpdate={handleUpdateWallet}
    onDelete={handleDeleteWallet}
    onRefresh={handleRefreshWallet}
    isOwner={true}
    maxWallets={10}
  />
)}
```

### Fix for Issue #2: Edit Modal

Replace in PublicProfileClient.tsx (line 208):
```typescript
// BEFORE (broken):
{isOwnProfile && (
  <Link href="/profiles/me">
    <Button>
      <Edit className="w-4 h-4 mr-2" />
      Edit Profile
    </Button>
  </Link>
)}

// AFTER (correct):
{isOwnProfile && (
  <Button
    onClick={() => onModeChange?.('edit')} // Pass from parent
    className="bg-white/90 backdrop-blur-sm hover:bg-white shadow-lg"
  >
    <Edit className="w-4 h-4 mr-2" />
    Edit Profile
  </Button>
)}
```

### Add Info Tab

Add to PublicProfileClient.tsx (line 153):
```typescript
// AFTER projects tab:
{
  id: 'info',
  label: 'Info',
  icon: <Info className="w-4 h-4" />,
  content: <ProfileInfoTab profile={profile} />,
},
```

---

## 12. SUMMARY TABLE

| Aspect | Status | Notes |
|--------|--------|-------|
| Profile wizard | ✅ Component exists | Not used in app flow |
| Wallet creation | ✅ API works | ProfileWizard integration broken |
| Defaults | ✅ Correct | behavior_type="general", icon="💰" |
| Wallet storage | ✅ Works | profile_id properly associated |
| Profile editing | ❌ BROKEN | Edit button doesn't open modal |
| Info tab | ❌ Missing | Should display profile details |
| Tab system | ✅ Works | Only 3 tabs, should be 4+ |
| Navigation | ❌ BROKEN | No edit modal mechanism |
| Components | ✅ Duplicate | Need consolidation |

---

**Generated:** 2025-01-17
**Repository:** /home/user/orangecat
**Branch:** claude/fix-duplicate-reposts-01D6cep5ugGX2T6NCvHRopWR
