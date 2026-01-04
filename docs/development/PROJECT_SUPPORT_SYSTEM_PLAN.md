# Project Support System Enhancement Plan

**Created:** 2025-01-30  
**Purpose:** Add non-monetary support options to projects (signatures, messages, reactions)  
**Status:** Planning → Implementation

---

## 🎯 Problem Statement

**Current State:**
- Projects only accept Bitcoin donations
- Many users don't have Bitcoin or aren't comfortable transacting
- **Barrier to entry:** "I want to support but don't have Bitcoin"
- **Missing engagement:** No way to show emotional support, encouragement, signatures

**User Need:**
- "I want to support this project but don't have Bitcoin"
- "I want to leave a message of encouragement"
- "I want to sign my name to show I support this"
- "I want to send love/hearts/reactions"

**Goal:**
- **Primary:** Bitcoin donations (core purpose)
- **Secondary:** Non-monetary support (signatures, messages, reactions, hearts)
- **UX:** Make it easy and welcoming for everyone to participate

---

## ✅ Solution: Multi-Modal Support System

### Support Types

1. **Bitcoin Donation** (Primary)
   - Direct Bitcoin contribution
   - Lightning payment
   - Tracked in `project_contributions` table

2. **Signature/Endorsement** (New)
   - User signs their name to show support
   - Public endorsement
   - "I support this project" message

3. **Support Message** (New)
   - Leave a message of encouragement
   - "Much love!", "Congratulations!", "Keep going!"
   - Public or anonymous option

4. **Reactions** (New)
   - Heart ❤️
   - Thumbs up 👍
   - Fire 🔥
   - Rocket 🚀
   - Custom emoji reactions

5. **Wall of Support** (New)
   - Visual display of all supporters
   - Shows signatures, messages, reactions
   - Creates community feeling

---

## 🎨 User Experience Flow

### Scenario 1: User Wants to Support (No Bitcoin)

**Current Flow (Frustrating):**
1. User sees project they love
2. Clicks "Support" button
3. **Only option:** "Donate Bitcoin"
4. User doesn't have Bitcoin → **Leaves without supporting**

**New Flow (Welcoming):**
1. User sees project they love
2. Clicks "Support" button
3. **Multiple options appear:**
   - 💰 "Donate Bitcoin" (primary, highlighted)
   - ✍️ "Sign My Name" (quick, no cost)
   - 💬 "Leave a Message" (encouragement)
   - ❤️ "Send Love" (heart reaction)
4. User clicks "Sign My Name"
5. **Simple form:** Name (optional), Message (optional), Public/Anonymous
6. User submits → **Success!** "Thank you for your support!"
7. User's signature appears on "Wall of Support"

**Result:** User feels included, project gets support, community grows

---

### Scenario 2: User Wants to Leave Encouragement

**Flow:**
1. User sees project making progress
2. Clicks "Support" → "Leave a Message"
3. **Form:**
   - Message: "Much love! Keep going! 🚀"
   - Name: (optional, defaults to username)
   - Public/Anonymous toggle
4. User submits
5. Message appears on project's "Wall of Support"
6. Project creator gets notification

**Result:** Emotional support, encouragement, community building

---

### Scenario 3: User Wants to React

**Flow:**
1. User sees project
2. Clicks ❤️ button (or reaction picker)
3. **Quick action:** Heart added instantly
4. Reaction count updates
5. User's reaction appears in their activity

**Result:** Quick engagement, low friction, emotional connection

---

## 🏗️ Technical Architecture

### Database Schema

```sql
-- Support types enum
CREATE TYPE support_type AS ENUM (
  'bitcoin_donation',
  'signature',
  'message',
  'reaction'
);

-- Project support table
CREATE TABLE project_support (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Support type
  support_type support_type NOT NULL,
  
  -- Bitcoin donation (if type = 'bitcoin_donation')
  amount_sats bigint,
  transaction_hash text,
  lightning_invoice text,
  
  -- Signature/Message (if type = 'signature' or 'message')
  display_name text, -- User's name or custom name
  message text,
  is_anonymous boolean DEFAULT false,
  
  -- Reaction (if type = 'reaction')
  reaction_emoji text, -- '❤️', '👍', '🔥', '🚀'
  
  -- Metadata
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Constraints
  CONSTRAINT valid_bitcoin_donation CHECK (
    support_type != 'bitcoin_donation' OR (amount_sats IS NOT NULL AND amount_sats > 0)
  ),
  CONSTRAINT valid_signature CHECK (
    support_type != 'signature' OR display_name IS NOT NULL
  ),
  CONSTRAINT valid_message CHECK (
    support_type != 'message' OR message IS NOT NULL
  ),
  CONSTRAINT valid_reaction CHECK (
    support_type != 'reaction' OR reaction_emoji IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_project_support_project_id ON project_support(project_id);
CREATE INDEX idx_project_support_user_id ON project_support(user_id);
CREATE INDEX idx_project_support_type ON project_support(support_type);
CREATE INDEX idx_project_support_created_at ON project_support(created_at DESC);

-- Aggregated support stats (for quick queries)
CREATE TABLE project_support_stats (
  project_id uuid PRIMARY KEY REFERENCES projects(id) ON DELETE CASCADE,
  total_bitcoin_sats bigint DEFAULT 0,
  total_signatures integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  total_reactions integer DEFAULT 0,
  total_supporters integer DEFAULT 0, -- Unique users who supported
  last_support_at timestamp with time zone,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### API Endpoints

```typescript
// POST /api/projects/[id]/support
interface SupportProjectRequest {
  support_type: 'bitcoin_donation' | 'signature' | 'message' | 'reaction';
  
  // Bitcoin donation
  amount_sats?: number;
  lightning_invoice?: string;
  
  // Signature/Message
  display_name?: string;
  message?: string;
  is_anonymous?: boolean;
  
  // Reaction
  reaction_emoji?: string;
}

// GET /api/projects/[id]/support
// Returns list of all support (paginated)
interface ProjectSupportResponse {
  supports: ProjectSupport[];
  stats: {
    total_bitcoin_sats: number;
    total_signatures: number;
    total_messages: number;
    total_reactions: number;
    total_supporters: number;
  };
}
```

### Components

```typescript
// src/components/projects/ProjectSupportButton.tsx
// Main support button with modal/dropdown

// src/components/projects/SupportModal.tsx
// Modal with support type selection and forms

// src/components/projects/WallOfSupport.tsx
// Visual display of all supporters (signatures, messages, reactions)

// src/components/projects/SupportStats.tsx
// Display support statistics (donations, signatures, messages, reactions)

// src/components/projects/ReactionPicker.tsx
// Quick reaction picker (hearts, thumbs up, etc.)
```

---

## 📋 Implementation Plan

### Phase 1: Database & Types ✅ (COMPLETE)
1. ✅ Create migration for `project_support` table
2. ✅ Create migration for `project_support_stats` table
3. ✅ Add TypeScript types
4. ✅ Create Zod schemas for validation

### Phase 2: API Endpoints ✅ (COMPLETE)
1. ✅ Create `/api/projects/[id]/support` POST endpoint
2. ✅ Create `/api/projects/[id]/support` GET endpoint
3. ✅ Create `/api/projects/[id]/support/[supportId]` DELETE endpoint
4. ✅ Add support stats aggregation (via database trigger)

### Phase 3: Components ✅ (COMPLETE)
1. ✅ Create `ProjectSupportButton` component
2. ✅ Create `SupportModal` component with tabs for all support types
3. ✅ Create `ReactionPicker` component
4. ✅ Create `SupportStats` component
5. ✅ Create `WallOfSupport` component
6. ✅ Integrate components into project pages

### Phase 2: API Endpoints (2-3 hours)
1. Create `/api/projects/[id]/support` POST endpoint
2. Create `/api/projects/[id]/support` GET endpoint
3. Add support stats aggregation
4. Add RLS policies

### Phase 3: Components (3-4 hours)
1. Create `ProjectSupportButton` component
2. Create `SupportModal` with type selection
3. Create `WallOfSupport` component
4. Create `SupportStats` component
5. Create `ReactionPicker` component

### Phase 4: Integration (2-3 hours)
1. Add support button to project detail page
2. Add Wall of Support to project page
3. Add support stats to project cards
4. Add notifications for project creators

### Phase 5: UX Polish (1-2 hours)
1. Add animations
2. Add empty states
3. Add loading states
4. Add success messages
5. Test all flows

**Total Estimated:** 9-14 hours

---

## 🎯 Success Criteria

### Technical
- ✅ Database schema supports all support types
- ✅ API endpoints handle all support types
- ✅ Components are modular and reusable
- ✅ RLS policies secure data access

### User Experience
- ✅ Users can support projects without Bitcoin
- ✅ Support flow is welcoming and inclusive
- ✅ Wall of Support creates community feeling
- ✅ Reactions are quick and frictionless

### Metrics
- ✅ Support engagement increases (signatures + messages + reactions)
- ✅ Project creator satisfaction increases
- ✅ Community feeling strengthens

---

## 🚨 Considerations

### Privacy
- Users can choose anonymous support
- Display names are optional
- Messages can be moderated

### Moderation
- Consider moderation for messages
- Spam prevention
- Rate limiting

### Notifications
- Project creators get notified of all support types
- Users get confirmation of their support

### Analytics
- Track support type distribution
- Track engagement rates
- Track conversion (signature → donation)

---

## 💡 Future Enhancements

1. **Support Levels:**
   - Bronze supporter (signature)
   - Silver supporter (message)
   - Gold supporter (donation)
   - Platinum supporter (recurring donation)

2. **Support Badges:**
   - Show supporter badges on profiles
   - "Top Supporter" badges

3. **Support Goals:**
   - "Get 100 signatures"
   - "Get 50 messages of encouragement"

4. **Social Sharing:**
   - Share support on social media
   - "I just supported [project]!"

---

**Status:** ✅ **PLAN READY**

This will make projects more inclusive and welcoming, allowing everyone to participate regardless of Bitcoin ownership.

