created_date: 2025-11-20
last_modified_date: 2025-12-07
last_modified_summary: "Repost modal now mirrors X: comment-first with attached source card."

# TimelineComposer UI/UX Analysis

**Approach:** First Principles

## ✅ Recent Update (2025-12-07)

- Repost modal mirrors X quote flow: comment-first layout with your avatar, 280-char counter, and attached source card beneath.
- Simple repost remains one click; quote button aligns with main post CTA styling for clarity.

## ✅ Recent Update (2025-12-06)

- Timeline surface now mirrors X: single centered column with border rails, sticky header, and lightweight white background.
- Composer matches X affordances: larger line height, always-visible formatting/visibility controls, round icon buttons, and compact bottom bar.
- Post cards drop heavy cards/shadows in favor of flat row dividers and hover states to keep focus on content.

## 🔍 Issues Identified

### **1. Unclear Input Area**

**Problem:** "What's on your mind?" placeholder doesn't clearly indicate where to type

**Why it's unclear:**

```
Current UI:
┌─────────────────────────────────────┐
│ [Avatar] What's on your mind?       │  ← Looks like a heading, not an input
│                                     │
│          (no visual cue of textbox) │
└─────────────────────────────────────┘
```

**Root Cause Analysis:**

```typescript
// Line 147-159: textarea with NO visible border
className="w-full border-0 resize-none text-lg
placeholder-gray-500 focus:outline-none bg-transparent"
```

**Issues:**

- `border-0` = No border
- `bg-transparent` = Blends into card background
- `placeholder-gray-500` = Weak visual indicator
- Users can't tell it's an input field until they click

---

### **2. No Visual Affordance**

**Principle:** Affordances are visual clues that indicate what actions are possible

**Current State:**

- Looks like read-only text
- No box, underline, or background
- Nothing screams "type here"

**Expected Affordances for Input:**

- Border or outline
- Background color different from surroundings
- Cursor change on hover
- Visual depth (shadow/inset)

---

### **3. Weak Hierarchy**

**Current Visual Hierarchy:**

```
Same visual weight:
- Avatar
- Placeholder text
- Buttons
- Character count

Result: Everything competes for attention
```

**Better Hierarchy:**

```
1. Input area (primary - where user acts)
2. Action button (secondary - what happens next)
3. Options (tertiary - additional controls)
4. Metadata (quaternary - supporting info)
```

---

## 🎯 Engineering Issues

### **1. Accessibility Problems**

```typescript
// Line 147: Missing accessibility attributes
<textarea
  value={postComposer.content}
  onChange={...}
  placeholder={placeholder || defaultPlaceholder}
  // ❌ Missing:
  // - aria-label for screen readers
  // - id for label association
  // - aria-describedby for hints
  // - role (implicit, but could be explicit)
/>
```

**Impact:** Screen reader users don't get clear context

---

### **2. Inconsistent State Communication**

**Posting State:**

```typescript
// Line 158: Input disabled during posting
disabled={postComposer.isPosting}

// But visual feedback is only on button (line 265-269)
{postComposer.isPosting ? "Posting..." : buttonText}
```

**Problem:** Input area doesn't visually change when posting starts

---

### **3. No Empty State Guidance**

**When composer first loads:**

- No hint about what to write
- No examples or prompts
- Just bare "What's on your mind?"

**Better approach:**

- Context-aware placeholders
- Rotating examples
- Helpful hints

---

## 💡 Solutions (First Principles)

### **Principle 1: Make Inputs Look Like Inputs**

**Current Problem:**

```css
border-0  // ❌ No border
bg-transparent  // ❌ Invisible background
```

**Solution:**

```css
border border-gray-200  // ✅ Visible boundary
bg-white  // ✅ Distinct from card
hover:border-orange-300  // ✅ Interactive feedback
focus:ring-2 focus:ring-orange-500  // ✅ Focus state
```

---

### **Principle 2: Visual Hierarchy Through Contrast**

**Current:** Everything same visual weight
**Solution:** Layer information by importance

```
Layer 1 (Primary):   Input box - high contrast, clear boundary
Layer 2 (Secondary): Post button - bright, actionable
Layer 3 (Tertiary):  Visibility toggle - subdued
Layer 4 (Support):   Character count - minimal
```

---

### **Principle 3: Progressive Disclosure**

**Current:** All options visible always
**Better:** Show options as needed

```
Empty state:
- Large, clear input
- Simple "Share" button

With content:
- Input filled
- Options expand (visibility, projects)
- Character count becomes prominent

During posting:
- Loading state
- Options disabled
```

---

## 🛠️ Specific Changes Needed

### **1. Input Styling** (Lines 147-159)

**Before:**

```typescript
className="w-full border-0 resize-none text-lg
placeholder-gray-500 focus:outline-none bg-transparent"
```

**After:**

```typescript
className="w-full resize-none text-lg
placeholder-gray-400
bg-white/50
border border-gray-200
rounded-lg
px-4 py-3
hover:border-orange-300
focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent
transition-all"
```

**Why:**

- `bg-white/50` = Subtle background, clearly an input
- `border border-gray-200` = Visible boundary
- `rounded-lg` = Distinct shape
- `px-4 py-3` = Comfortable padding
- `hover:border-orange-300` = Interactive feedback
- `focus:ring-2` = Clear focus state

---

### **2. Better Placeholder** (Lines 81-86)

**Before:**

```typescript
const defaultPlaceholder = useMemo(
  () =>
    postingToOwnTimeline
      ? "What's on your mind?" // ❌ Generic, unhelpful
      : `Write on ${targetName}...`,
  [postingToOwnTimeline, targetName]
);
```

**After:**

```typescript
const defaultPlaceholder = useMemo(() => {
  if (!postingToOwnTimeline) {
    return `Write on ${targetName}'s timeline...`;
  }
  // Context-aware suggestions
  const suggestions = [
    'Share an update about your project...',
    'What are you working on?',
    'Share your thoughts...',
  ];
  return suggestions[0]; // Could rotate randomly
}, [postingToOwnTimeline, targetName]);
```

---

### **3. Add Accessibility** (Line 147)

**Before:**

```typescript
<textarea
  value={postComposer.content}
  onChange={...}
  placeholder={placeholder || defaultPlaceholder}
/>
```

**After:**

```typescript
<textarea
  id="timeline-composer-input"
  aria-label="Write your post"
  aria-describedby="composer-hint composer-char-count"
  value={postComposer.content}
  onChange={...}
  placeholder={placeholder || defaultPlaceholder}
  data-posting={postComposer.isPosting}
/>
```

---

### **4. Visual Loading State**

**Add to textarea className:**

```typescript
className={cn(
  "w-full resize-none ...",
  postComposer.isPosting && "opacity-50 cursor-wait"
)}
```

---

## 📊 User Flow Analysis

### **Current Flow (Problems):**

```
1. User sees card
   ❌ Can't tell where to type

2. User hovers around
   ❌ No hover state to guide them

3. User clicks somewhere
   ✅ Cursor appears (finally understands it's an input)

4. User types
   ✅ Works fine

5. User looks for "Post" button
   ❌ Button says "Share" (inconsistent naming)
```

### **Improved Flow:**

```
1. User sees card
   ✅ Clear input box with border
   ✅ Obvious it's a text field

2. User hovers over input
   ✅ Border changes color (orange)
   ✅ Cursor changes to text cursor

3. User clicks to type
   ✅ Focus ring appears (orange glow)
   ✅ Placeholder fades smoothly

4. User types
   ✅ Character count updates
   ✅ Post button becomes active

5. User posts
   ✅ Clear "Post" button
   ✅ Loading state shows progress
```

---

## 🎨 Design Tokens Needed

```typescript
// Input States
const inputStyles = {
  default: 'border-gray-200 bg-white/50',
  hover: 'border-orange-300',
  focus: 'ring-2 ring-orange-500 border-transparent',
  disabled: 'opacity-50 cursor-not-allowed bg-gray-50',
  error: 'border-red-500 ring-2 ring-red-200',
};

// Visual Hierarchy
const hierarchy = {
  primary: 'border-2 shadow-sm', // Input
  secondary: 'shadow-md', // Button
  tertiary: 'border border-gray-200', // Options
  support: 'text-sm text-gray-500', // Metadata
};
```

---

## 🚀 Implementation Priority

1. ✅ **Critical:** Add visible border to textarea
2. ✅ **Critical:** Change placeholder to be more helpful
3. ✅ **High:** Add proper focus states
4. ✅ **High:** Add hover states
5. ✅ **Medium:** Add accessibility attributes
6. ✅ **Medium:** Improve loading states
7. **Low:** Add rotating placeholder suggestions (deferred)

---

## ✅ Implementation Completed (2025-11-20)

### Changes Applied

**1. Textarea Styling (Lines 151-167)**

```typescript
// BEFORE:
className="w-full border-0 resize-none text-lg placeholder-gray-500 focus:outline-none bg-transparent"

// AFTER:
className={`w-full resize-none text-lg placeholder-gray-400 bg-white/50 border border-gray-200 rounded-lg px-4 py-3 hover:border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${postComposer.isPosting ? 'opacity-50 cursor-wait' : ''}`}
```

**Improvements:**

- ✅ Added `bg-white/50` - subtle background makes input visible
- ✅ Added `border border-gray-200` - clear boundary
- ✅ Added `rounded-lg` - distinct shape
- ✅ Added `px-4 py-3` - comfortable padding
- ✅ Added `hover:border-orange-300` - interactive feedback
- ✅ Added `focus:ring-2 focus:ring-orange-500` - clear focus state
- ✅ Added `opacity-50 cursor-wait` when posting - visual loading state
- ✅ Added `transition-all` - smooth state changes

**2. Placeholder Text (Lines 81-90)**

```typescript
// BEFORE:
const defaultPlaceholder = useMemo(
  () =>
    postingToOwnTimeline
      ? "What's on your mind?" // ❌ Generic, unhelpful
      : `Write on ${targetName}...`,
  [postingToOwnTimeline, targetName]
);

// AFTER:
const defaultPlaceholder = useMemo(() => {
  if (!postingToOwnTimeline) {
    return `Write on ${targetName}'s timeline...`;
  }
  // Context-aware, helpful placeholder
  return 'Share an update about your project...';
}, [postingToOwnTimeline, targetName]);
```

**3. Accessibility Attributes (Lines 152-154)**

```typescript
<textarea
  id="timeline-composer-input"
  aria-label="Write your post"
  aria-describedby="composer-hint composer-char-count"
  // ... rest of props
/>
```

Added corresponding IDs:

- Line 257: `id="composer-hint"` on keyboard hint
- Line 248: `id="composer-char-count"` on character count
- Line 250: `aria-live="polite"` for screen reader updates

**4. Visual Loading State (Line 162)**

```typescript
data-posting={postComposer.isPosting}
className={`... ${postComposer.isPosting ? 'opacity-50 cursor-wait' : ''}`}
```

### Impact

**Before:**

```
User sees card → Can't tell where to type → Hovers around → Eventually clicks → Discovers input
❌ Poor affordance, confusing UX
```

**After:**

```
User sees card → Clear input box with border → Hovers → Border changes to orange → Clicks → Focus ring appears
✅ Clear affordance, intuitive UX
```

---

**Summary:** The composer now properly communicates its purpose through visual design. Input field has clear affordance with visible border, distinct background, hover states, and focus states. Accessibility improved with proper ARIA attributes for screen readers.
