# Profile & Dashboard Architecture

**Date:** 2025-11-20
**Principle:** First Principles - Single Source of Truth

## 🏗️ Architecture Overview

### Two Complementary Views

```
Dashboard (Left Sidebar)          Public Profile (/profiles/[username])
─────────────────────────         ──────────────────────────────────────
Management & Editing  ←────────→  Viewing & Interaction
Private Access                    Public Access (with auth for interactions)
```

## 📋 Tab Structure & Mapping

### **Public Profile Tabs** (View & Interact)

Order matches user requirements:

| #   | Tab          | Purpose                       | Icon          | Features                             |
| --- | ------------ | ----------------------------- | ------------- | ------------------------------------ |
| 1   | **Overview** | Quick profile summary & stats | User          | Bio preview, stats, recent activity  |
| 2   | **Info**     | Detailed information          | Info          | Bio, website, location, social links |
| 3   | **Timeline** | Updates & posts               | MessageSquare | Read posts, write on wall, comment   |
| 4   | **Projects** | User's projects               | Target        | Browse projects, support             |
| 5   | **People**   | Connections                   | Users         | Followers, following                 |
| 6   | **Wallets**  | Bitcoin wallets               | Wallet        | View wallet addresses                |

### **Dashboard Sidebar** (Manage & Edit)

Corresponds to public profile tabs:

| #   | Dashboard Item  | Maps To Profile Tab | Route                 | Purpose              |
| --- | --------------- | ------------------- | --------------------- | -------------------- |
| 1   | **Dashboard**   | Overview            | `/dashboard`          | Management hub       |
| 2   | **My Info**     | Info                | `/dashboard/info`     | Edit profile details |
| 3   | _(Community)_   | Timeline            | `/community`          | Post to community    |
| 4   | **My Projects** | Projects            | `/dashboard/projects` | Manage projects      |
| 5   | **My People**   | People              | `/dashboard/people`   | Manage connections   |
| 6   | **My Wallets**  | Wallets             | `/dashboard/wallets`  | Manage wallets       |

## 🔄 Data Flow Architecture

### Profile Data (Single Source of Truth)

```typescript
// Auth Store (Zustand) - SINGLE SOURCE OF TRUTH
{
  user: User | null,
  session: Session | null,
  profile: Profile | null  // ← Authoritative profile data
}

// Flow:
1. User authenticates
2. AuthProvider calls fetchProfile()
3. Auth Store fetches from /api/profile
4. ALL components read from store
```

### Components Architecture

```
/profiles/[username]/page.tsx (Server)
├─ Fetches profile server-side (SSR)
├─ Fetches projects, stats
└─ Passes to PublicProfileClient

PublicProfileClient.tsx (Client)
├─ Handles interactivity (follow, share)
├─ Defines 6 tabs
└─ Renders ProfileViewTabs

Tab Components (Modular)
├─ ProfileOverviewTab     - Summary view
├─ ProfileInfoTab         - Details (read/edit based on isOwnProfile)
├─ ProfileTimelineTab     - Timeline feed + composer
├─ ProfileProjectsTab     - Projects list
├─ ProfilePeopleTab       - Connections
└─ ProfileWalletsTab      - Wallet addresses
```

## 🎯 Design Principles

### 1. **DRY (Don't Repeat Yourself)**

- Tab components reused across public profile and dashboard
- TimelineView component reused in multiple contexts
- Same Profile type across all components

### 2. **Single Source of Truth**

- Auth Store holds profile data
- Components read from store, never fetch independently
- Updates flow through store

### 3. **Separation of Concerns**

```
Layer 1: Routes (/profiles/[username])
└─ Job: SSR, SEO, initial data fetch

Layer 2: Client Container (PublicProfileClient)
└─ Job: Interactivity, tab management, follow/unfollow

Layer 3: Tab Components (ProfileTimelineTab, etc.)
└─ Job: Display specific content type

Layer 4: Shared Components (TimelineView, TimelineComposer)
└─ Job: Reusable UI patterns
```

### 4. **Progressive Enhancement**

- Server renders initial profile data
- Client adds interactivity
- Tabs lazy load content
- Suspense boundaries for loading states

## 📊 Tab Behavior Matrix

| Tab          | View Mode          | Own Profile Mode  | Visitor Mode              |
| ------------ | ------------------ | ----------------- | ------------------------- |
| **Overview** | Stats, bio preview | Edit button shown | Follow button shown       |
| **Info**     | Display details    | Inline editing    | Read-only                 |
| **Timeline** | Show posts         | Post + interact   | Post + interact (if auth) |
| **Projects** | List projects      | Manage link shown | Support options shown     |
| **People**   | List connections   | Manage options    | Follow options            |
| **Wallets**  | Show addresses     | Edit link shown   | QR codes for sending      |

## 🔐 Access Control

### Public Profile Access

- **Unauthenticated:** Can view all tabs (read-only)
- **Authenticated (not owner):** Can interact (post, comment, follow)
- **Authenticated (owner):** Can view + edit

### Dashboard Access

- **Requires authentication**
- Owner-only access
- Full edit permissions

## 📝 Data Sources

### Profile Tab Data Sources

```typescript
// Overview Tab
- profile.* (from auth store or SSR)
- stats (calculated server-side)
- recent_activity (from timeline_events)

// Info Tab
- profile.bio
- profile.website
- profile.location
- profile.* (all profile fields)

// Timeline Tab
- timeline_events WHERE subject_id = profile.id
- timeline_comments
- timeline_likes

// Projects Tab
- projects WHERE user_id = profile.id AND status != 'draft'

// People Tab
- follows WHERE following_id = profile.id (followers)
- follows WHERE follower_id = profile.id (following)

// Wallets Tab
- wallets WHERE profile_id = profile.id
```

## 🚀 Performance Optimizations

### Applied Optimizations

1. ✅ Auth Store as single source (eliminates duplicate fetches)
2. ✅ Request deduplication in fetchProfile()
3. ✅ Optional project_count in API (faster auth)
4. ✅ Server-side rendering for initial load
5. ✅ Lazy loading tabs (ProfileViewTabs)

### Future Optimizations

- [ ] Cache timeline data with SWR
- [ ] Virtualize long lists (projects, people)
- [ ] Prefetch tab content on hover
- [ ] Optimize image loading (next/image)

## 🧭 Navigation Consistency

### From Dashboard to Public Profile

```
/dashboard → "View My Profile" button → /profiles/me
```

### From Public Profile to Dashboard

```
/profiles/me → Each tab has "Edit" button → /dashboard/[section]
```

### Tab Name Consistency

- Dashboard: "My X" (possessive)
- Public Profile: "X" (general)
- Same underlying content, different perspective

---

**Key Insight:** Dashboard is for **management**, Public Profile is for **presentation**. Both views of the same data, optimized for different purposes.
