# Profile System Fix Plan

## Issues Found

### 1. **CRITICAL: Missing "Info" Tab** ❌
**Current tabs**: Overview, Timeline, Projects (3 tabs)
**Expected**: Overview, Info, Timeline, Projects (4 tabs)

**Problem**: Profile information (location, bio, background, inspiration, website, addresses) has no dedicated viewing tab.

**Current state**:
- Overview tab shows: Bio summary, stats, quick contact
- No structured Info tab for detailed profile information

### 2. **CRITICAL: WalletManager Props Mismatch in ProfileWizard** 🐛
**File**: `/src/components/profile/ProfileWizard.tsx:499-504`

**Current code** (BROKEN):
```tsx
<WalletManager
  profileId={userId}
  onWalletUpdate={() => {
    // Refresh wallet data if needed
  }}
/>
```

**Expected props** (from WalletManager interface):
```tsx
<WalletManager
  wallets={Wallet[]}          // ❌ MISSING
  entityType="profile"         // ❌ MISSING
  entityId={userId}            // ❌ WRONG NAME (profileId)
  onAdd={async (data) => {}}   // ❌ MISSING
  onUpdate={async (id, data) => {}}  // ❌ MISSING
  onDelete={async (id) => {}}  // ❌ MISSING
  onRefresh={async (id) => {}} // ❌ MISSING
  maxWallets={10}              // ❌ MISSING
  isOwner={true}               // ❌ MISSING
/>
```

### 3. **Issue: Edit Profile Button Not Working**
**File**: `/src/components/profile/PublicProfileClient.tsx:208`

Current: Just links to `/profiles/me` (same page, no modal)
Expected: Opens edit modal or redirects to edit page

## Recommended Solutions

### Solution 1: Add "Info" Tab

**Location**: `/src/components/profile/PublicProfileClient.tsx:133-153`

**Add new tab after Overview**:
```tsx
const tabs = [
  {
    id: 'overview',
    label: 'Overview',
    icon: <User className="w-4 h-4" />,
    content: <ProfileOverviewTab profile={profile} stats={stats} />,
  },
  {
    id: 'info',               // NEW TAB
    label: 'Info',
    icon: <Info className="w-4 h-4" />,
    content: <ProfileInfoTab profile={profile} isOwnProfile={isOwnProfile} />,
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

**Create new component**: `/src/components/profile/ProfileInfoTab.tsx`

### Solution 2: Fix WalletManager in ProfileWizard

**Location**: `/src/components/profile/ProfileWizard.tsx:498-505`

**Replace broken implementation with**:
```tsx
const [wallets, setWallets] = useState<Wallet[]>([]);

// Load wallets
useEffect(() => {
  if (userId) {
    loadWallets();
  }
}, [userId]);

const loadWallets = async () => {
  const response = await fetch(`/api/wallets?profile_id=${userId}`);
  const data = await response.json();
  setWallets(data.wallets || []);
};

const handleAddWallet = async (data: WalletFormData) => {
  const response = await fetch('/api/wallets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...data,
      entity_type: 'profile',
      entity_id: userId,
    }),
  });
  const result = await response.json();
  setWallets(prev => [...prev, result.wallet]);
};

const handleUpdateWallet = async (walletId: string, data: Partial<WalletFormData>) => {
  const response = await fetch(`/api/wallets/${walletId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  setWallets(prev => prev.map(w => (w.id === walletId ? result.wallet : w)));
};

// ... similar for onDelete, onRefresh

return (
  <WalletManager
    wallets={wallets}
    entityType="profile"
    entityId={userId}
    onAdd={handleAddWallet}
    onUpdate={handleUpdateWallet}
    onDelete={handleDeleteWallet}
    onRefresh={handleRefreshWallet}
    maxWallets={10}
    isOwner={true}
  />
);
```

### Solution 3: Improve Tab Organization

**Recommended structure**:

```
OVERVIEW Tab
├─ Profile summary
├─ Quick stats (projects, followers, etc.)
├─ Recent activity preview
└─ Primary wallet/donation info

INFO Tab (NEW)
├─ Personal Details
│   ├─ Name, Username
│   ├─ Location (city, country)
│   ├─ Member since date
│   └─ Bio
├─ Background & Story
│   ├─ Background text
│   └─ Inspiration statement
├─ Contact & Links
│   ├─ Website
│   ├─ Social links
│   └─ Email (if public)
└─ Payment Addresses
    ├─ Bitcoin address
    └─ Lightning address

TIMELINE Tab
└─ User's posts and activity

PROJECTS Tab
└─ User's crowdfunding projects
```

## Implementation Priority

1. **HIGH** - Fix WalletManager props in ProfileWizard
2. **HIGH** - Create ProfileInfoTab component
3. **MEDIUM** - Add Info tab to profile page
4. **LOW** - Improve edit profile UX

## Files to Modify

1. `/src/components/profile/ProfileWizard.tsx` - Fix WalletManager integration
2. `/src/components/profile/PublicProfileClient.tsx` - Add Info tab
3. `/src/components/profile/ProfileInfoTab.tsx` - NEW FILE (create)
4. `/src/components/profile/PublicProfileClient.tsx:13` - Add Info icon import

## Testing Checklist

- [ ] Wallet added in profile wizard appears in "My Wallets"
- [ ] Wallet category defaults to "general"
- [ ] Info tab displays all profile information
- [ ] Info tab is editable for own profile
- [ ] Tab navigation works smoothly
- [ ] All data loads correctly in each tab
