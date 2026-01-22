# OrangeCat Development Guide for Claude Code

**Last Updated:** 2026-01-20
**Version:** 5.2 - Agentic & Tool-Driven Development

---

## ⚠️ CRITICAL: Project Location

**Project Path**: `/home/g/dev/orangecat`

**User's projects folder**: `/home/g/dev/`

When user says "orangecat" - ALWAYS go to `/home/g/dev/orangecat`. Do NOT search elsewhere.

**Quick start**:

```bash
cd /home/g/dev/orangecat
npm run dev -- -p 3020  # Runs on port 3020 to avoid conflicts
```

---

> **🎯 Mission**: Maximize Claude's agentic power through automated workflows, intelligent tool usage, and self-correcting systems.

## 📚 Essential Documents (Read These First)

**Quick Lookup**:

- **`.claude/QUICK_REFERENCE.md`** ⚡ One-page lookup for common operations
- **`.claude/CREDENTIALS.md`** 🔐 Where credentials are & how to access tools
- **`.claude/RULES.md`** 🛡️ CRITICAL: .env.local protection rules

**Detailed Guides**:

- **`.claude/rules/`** 📖 All best practices (6 modular files)
- **`docs/guides/ai/COMMON.md`** 🤝 Shared patterns with other agents

**⚡ Pro Tip**: Start every session by scanning QUICK_REFERENCE.md for instant context.

---

## 🤖 Core Mechanics: The 4-Step Agentic Loop

### Your Operating System

Every task follows this loop:

```
1. Receive Task → Parse user intent, identify requirements
2. Gather Context → Use tools (grep, read_file, list_dir) to understand
3. Formulate Plan → Think through approach, use Planning mode for complexity
4. Take Action → Execute with tools, verify, self-correct via hooks
```

### Critical Principles

**🔧 Tool Chaining**: Combine multiple tools in sequence

```bash
# Example flow
grep "ENTITY_REGISTRY" → read matched files → analyze patterns → edit file → run post-hook
```

**📖 Always Inspect First**: NEVER edit files blindly

```typescript
// ✅ Good workflow
1. read_file to understand structure
2. grep to find related code
3. Formulate changes
4. Apply edits
5. Verify with hooks

// ❌ Bad workflow
1. Assume structure
2. Edit directly
3. Hope it works
```

**🔄 Self-Correction**: Use post-hooks to catch errors immediately

- Type errors → Fix automatically
- Lint errors → Auto-fix and report
- Test failures → Analyze and retry

---

## 🗂️ Project Context & Structure

### Tech Stack

- **Frontend**: Next.js 15 (App Router), React Server Components, TypeScript 5.8, TailwindCSS 3.3
- **Backend**: Next.js API Routes, Supabase (PostgreSQL + Auth + RLS)
- **Bitcoin**: Native Lightning Network integration, sats-only pricing
- **Deployment**: Vercel (Production + Preview)

### Core Principles (ALWAYS Enforce)

1. **DRY**: Don't Repeat Yourself - extract shared logic
2. **SSOT**: Single Source of Truth - `src/config/entity-registry.ts`
3. **Separation of Concerns**: domain/ → business logic, api/ → HTTP, components/ → UI
4. **Type Safety**: TypeScript + Zod validation everywhere
5. **Modularity**: Configuration over code
6. **UI/UX Quality**: No demos - everything must be production-ready (see checklist below)

### Critical Files (Memorize These)

- **Entity SSOT**: `src/config/entity-registry.ts`
- **Validation**: `src/lib/validation.ts`
- **Engineering Principles**: `docs/development/ENGINEERING_PRINCIPLES.md`
- **Design System**: `docs/design-system/README.md`
- **Environment**: `.env.local` (credentials stored here)

---

## 🛠️ Tool Integration & Automation

### 1. Supabase (Database & Auth)

#### Credentials Location

**CRITICAL**: All Supabase credentials are in `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

#### Remote-Only Setup

- **NO local Supabase** for development
- Always use remote instance
- See `docs/operations/REMOTE_ONLY_SUPABASE.md`

#### Tool Usage

```typescript
// Always use MCP Supabase tools when available
mcp_supabase_list_tables(); // List all tables
mcp_supabase_execute_sql(); // Run queries
mcp_supabase_apply_migration(); // Create migrations
mcp_supabase_get_advisors(); // Check for issues
```

#### Common Operations

```bash
# Check database structure
Use mcp_supabase_list_tables to see all tables

# Query data
Use mcp_supabase_execute_sql with:
SELECT * FROM user_products WHERE actor_id = 'xxx';

# Create migration
Use mcp_supabase_apply_migration with:
name: "add_warranty_field"
query: "ALTER TABLE user_products ADD COLUMN warranty_period INTEGER;"
```

### 2. Vercel (Deployment)

#### Environment Variables

**Stored in**: Vercel Dashboard + `.env.local`

- Use `mcp_vercel_*` tools if available
- Check deployment status after changes
- Preview URLs auto-generated for PRs

#### Deployment Workflow

```bash
# Automatic deploys
main branch → Production (orangecat.app)
feature/* → Preview URL (check PR comments)

# Manual verification
1. Push to feature branch
2. Check Vercel deployment status
3. Test preview URL
4. Merge to main when ready
```

### 3. GitHub Integration

#### PR Workflow

```bash
# Create feature branch
git checkout -b feature/add-warranty-field

# Make changes, commit
git commit -m "feat: add warranty field to products"

# Push and create PR
git push origin feature/add-warranty-field

# GitHub Actions will:
- Run type checks
- Run linters
- Run tests
- Deploy preview
```

#### Code Review Automation

- GitHub Actions run on every PR
- Claude can review code via MCP GitHub tools
- Check `.github/workflows/` for CI config

### 4. Browser Automation (MCP)

#### Available Tools

```javascript
// Navigate to page
mcp_cursor - ide - browser_browser_navigate({ url: 'http://localhost:3001/dashboard' });

// Take snapshot (better than screenshot)
mcp_cursor - ide - browser_browser_snapshot();

// Interact with elements
mcp_cursor -
  ide -
  browser_browser_click({
    element: 'Create Product button',
    ref: 'button[data-testid="create-product"]',
  });

mcp_cursor -
  ide -
  browser_browser_type({
    element: 'Title input',
    ref: 'input[name="title"]',
    text: 'Test Product',
  });
```

#### Testing Flow Example

```javascript
// 1. Navigate
await navigate({ url: 'http://localhost:3001/dashboard/store' });

// 2. Snapshot to see elements
const snapshot = await snapshot();

// 3. Click create button
await click({ element: 'Create button', ref: 'a[href="/dashboard/store/create"]' });

// 4. Fill form
await type({ element: 'Title', ref: 'input[name="title"]', text: 'Premium Coffee' });
await type({ element: 'Price', ref: 'input[name="price_sats"]', text: '100000' });

// 5. Submit
await click({ element: 'Submit button', ref: 'button[type="submit"]' });

// 6. Verify success
await wait_for({ text: 'Product created successfully' });
```

### 5. Context7 (Documentation)

#### Usage

```bash
# Get up-to-date docs for any library
mcp_context7_resolve-library-id({ libraryName: 'next.js', query: 'user question' })
mcp_context7_query-docs({ libraryId: '/vercel/next.js', query: 'how to use server actions' })
```

#### When to Use

- User asks about specific library/framework
- Need current documentation (not training data)
- Verify API usage patterns

---

## 🚨 Panic Buttons & Error Recovery

### Stop (Esc)

**When**: Action goes off-track
**Action**: Interrupt immediately, reset context

### Correction (Esc + Memory with #)

**When**: Mistake needs to be taught
**Action**:

```
# Never modify migration files without explicit approval
# Always use ENTITY_REGISTRY for entity metadata
# Test changes with browser automation before committing
```

### Rewind (Double Esc)

**When**: Bad context pollutes conversation
**Action**: Erase last exchange, start fresh

### Compact (/compact)

**When**: Conversation gets long, need to summarize
**Action**: Compress history to key points

---

## 🛡️ Automated Guardrails (Hooks)

### Pre-Edit Hooks

**Purpose**: Prevent destructive changes before they happen

**Location**: `.claude/hooks/pre-edit.sh`

**Checks**:

- Block sensitive file edits (.env, credentials)
- Verify entity registry usage
- Check for duplicate functionality
- Warn about migration file changes

### Post-Edit Hooks

**Purpose**: Self-correction after changes

**Location**: `.claude/hooks/post-edit.sh`

**Actions**:

1. Run type checker → Feed errors back for fixing
2. Run linter → Auto-fix issues
3. Run affected tests → Report failures
4. Check for magic strings → Flag violations

**Self-Correction Loop**:

```
Edit file → Post-hook runs → Errors detected → Claude reads stderr → Claude fixes → Verify
```

### Anti-Bloat Hook

**Purpose**: Prevent code duplication

**Location**: `.claude/hooks/anti-bloat.sh`

**Checks**:

- File already exists with similar name?
- Duplicate code patterns detected?
- Entity can use existing generic component?

---

## ⚡ Custom Commands (God Mode)

### `/audit`

**Purpose**: Comprehensive project health check
**Location**: `.claude/commands/audit.sh`
**Runs**:

- npm audit (security)
- Type coverage check
- Unused exports detection
- Database advisors check

### `/test-entity <type>`

**Purpose**: E2E test for entity type
**Example**: `/test-entity product`
**Runs**: Browser automation flow for entity

### `/db-check`

**Purpose**: Verify database health
**Runs**:

- List tables
- Check migrations
- Run security advisors
- Check performance advisors

### `/deploy-check`

**Purpose**: Pre-deployment verification
**Runs**:

- Type check
- Lint
- Tests
- Build verification

---

## 🧠 Context Engineering

### Project Initialization

**First command in new session**:

```bash
/init
```

**This maps**:

- Project structure
- Key files
- Entity registry
- Available tools

### 3-Layer Memory System

1. **Project-level**: `.claude/CLAUDE.md` (this file)
   - Shared by all developers
   - Version controlled

2. **Local-level**: `.claude/settings.local.json`
   - Personal preferences
   - Git-ignored
   - Machine-specific

3. **Global-level**: `~/.claude/CLAUDE.md`
   - Cross-project rules
   - Machine-global settings

### Laser-Focused References

**Use `@file` for specific context**:

```
@src/config/entity-registry.ts What entities are registered?
@src/lib/validation.ts Show me the product schema
```

**Benefits**:

- More accurate responses
- Token efficiency
- Faster processing

### Screenshot Support

**Paste UI screenshots** (Ctrl+V / Cmd+V):

- Visual debugging
- UI design review
- Error state analysis

### Context Window Optimization

**Token Budget**: 200K input tokens

**Strategies to Stay Efficient**:

1. **Use grep before read_file**:

   ```bash
   # ✅ Find exactly what you need first
   grep "ENTITY_REGISTRY" -r src/
   # Then read only relevant files
   ```

2. **Read file ranges, not whole files**:

   ```bash
   # ✅ Read specific sections
   read_file(file, offset=100, limit=50)
   # ❌ Don't read 2000-line files entirely
   ```

3. **Reference, don't duplicate**:

   ```
   # ✅ "See ENTITY_REGISTRY at line 45 for product config"
   # ❌ Don't paste entire registry into response
   ```

4. **Use QUICK_REFERENCE.md**:

   ```
   # ✅ Scan at session start (500 lines)
   # Covers 80% of common operations
   # Avoids reading 6 detailed rule files (4000+ lines)
   ```

5. **Summarize, don't repeat**:

   ```
   # ✅ "Updated 3 files: entity-registry.ts (added event), validation.ts (added schema), event.ts (new file)"
   # ❌ Don't show all file contents in response
   ```

6. **Use tool results efficiently**:
   ```
   # ✅ grep shows 10 matches → read only relevant 2 files
   # ❌ Don't read all 10 files just in case
   ```

---

## 🎯 Mode Selection

### Standard Mode

**Use for**: Straightforward implementations, simple fixes
**Characteristics**: Fast, direct, assumes clear path

### Planning Mode (Shift+Tab x2)

**Use for**:

- Architecture decisions
- Complex refactors
- Multi-file changes
- Strategic thinking

**Process**:

1. Outline approach
2. Identify dependencies
3. Plan file changes
4. Estimate impact
5. Execute systematically

### Thinking Mode ("Ultra think")

**Use for**:

- Deep debugging
- Algorithm design
- Performance optimization
- Complex business logic

**Process**:

1. First principles analysis
2. Multiple approach exploration
3. Trade-off evaluation
4. Detailed implementation plan

---

## 🔄 Handoff System

### Commands

**From COMMON.md** (all agents use these):

- `h` or `handoff` → Update SESSION_HANDOFF.md
- `p` or `pickup` → Read and continue from handoff

### Purpose

Enable seamless collaboration between:

- Different AI agents (Claude, Cursor, etc.)
- Different sessions
- Different developers

### Handoff Document

**Location**: `docs/development/SESSION_HANDOFF.md`
**Contains**:

- What was accomplished
- Files modified
- Recommended next steps
- Key patterns established
- Context for continuation

---

## 📋 Modular Rules

### Core Rules (Detailed Documentation)

**Engineering Principles**: `.claude/rules/engineering-principles.md`

- DRY, SSOT, Separation of Concerns
- Entity Registry Pattern
- Anti-patterns to avoid

**Frontend Best Practices**: `.claude/rules/frontend-best-practices.md`

- Design system usage
- Progressive disclosure
- Context-aware navigation
- Accessibility standards

**Backend Best Practices**: `.claude/rules/backend-best-practices.md`

- API design patterns
- Supabase/RLS usage
- Validation with Zod
- Error handling

**Architecture Patterns**: `.claude/rules/architecture-patterns.md`

- Factory patterns
- Composition patterns
- Service layer patterns
- Schema composition

**Code Quality**: `.claude/rules/code-quality.md`

- Naming conventions
- File size limits
- Testing requirements
- Performance standards

**Domain-Specific**: `.claude/rules/domain-specific.md`

- Bitcoin integration
- Actor system
- OrangeCat terminology
- Remote-only Supabase

---

## 🎬 Example Workflow: Add New Feature

### Scenario: Add warranty field to products

```bash
# 1. Gather Context
@src/config/entity-registry.ts
@src/lib/validation.ts
grep "userProductSchema"

# 2. Planning Mode Analysis
- Need to update validation schema
- Need to create database migration
- Need to update form configuration
- Need to test E2E

# 3. Execute with Tool Chain

## 3a. Update validation
Edit src/lib/validation.ts:
  Add: warranty_period: z.number().optional()

## 3b. Create migration
Use mcp_supabase_apply_migration:
  name: "add_warranty_period"
  query: "ALTER TABLE user_products ADD COLUMN warranty_period INTEGER;"

## 3c. Update form config
Edit src/config/entity-configs/product.ts:
  Add warranty field configuration

## 3d. Post-hook runs automatically
  → Type check: ✓ Pass
  → Lint: ✓ Pass
  → Tests: ✓ Pass

# 4. Browser Automation Test
mcp_cursor-ide-browser_browser_navigate to product creation
Fill form including warranty field
Submit and verify

# 5. Commit
git commit -m "feat: add warranty period to products"

# 6. Handoff
Update SESSION_HANDOFF.md with:
- Added warranty_period field
- Migration applied
- Form updated
- E2E tested
- Ready for PR
```

---

## 🚀 Agentic Best Practices

### 1. Proactive Refactoring

**When you see legacy code**:

```
❌ Don't just add to mess
✅ Suggest refactor first
✅ Use Planning mode for approach
✅ Execute refactor
✅ Then add feature
```

### 2. Automated Verification

**After every change**:

```
✅ Post-hooks auto-run
✅ Read stderr for errors
✅ Self-correct immediately
✅ Verify with browser automation
✅ Document in handoff
```

### 3. Tool-First Thinking

**Before writing code**:

```
1. Can Supabase MCP handle this? (database)
2. Can browser automation verify? (UI)
3. Can Context7 provide docs? (libraries)
4. Can custom command automate? (common tasks)
```

### 4. Guardian Mindset

**Always enforce**:

```
✅ Entity Registry usage (no magic strings)
✅ DRY principle (extract shared logic)
✅ Type safety (Zod + TypeScript)
✅ Test coverage (unit + E2E)
✅ Documentation updates (keep in sync)
```

---

## 🎨 UI/UX Quality Checklist (CRITICAL)

**No demos, no prototypes** - every feature must be production-ready with polished UX.

### Before Every UI Change

**Check for these common issues:**

1. **Duplicate Controls**: Multiple buttons/navigation doing the same thing
   - Watch for: Wizards with navigation AND forms with their own navigation
   - Watch for: Multiple "Cancel" or "Back" buttons visible simultaneously
   - Watch for: Redundant submit buttons in nested components

2. **Broken Navigation Flows**:
   - Verify: Back button works and goes to expected location
   - Verify: Cancel buttons work at every step
   - Verify: Breadcrumbs are accurate (if present)
   - Verify: Browser back button behaves correctly

3. **Missing/Broken States**:
   - Loading states for every async operation
   - Empty states when no data exists
   - Error states with recovery actions
   - Success feedback after actions

4. **Responsive Design**:
   - Test on mobile viewport (< 768px)
   - Touch targets minimum 44x44px
   - No horizontal scrolling
   - Readable text without zooming

5. **Visual Consistency**:
   - Same spacing patterns throughout
   - Consistent button styles/sizes
   - Design system colors only (no hex codes)
   - Proper hierarchy (one primary CTA per view)

### After UI Changes

**Always verify with browser automation or manual testing:**

```javascript
// Quick sanity check flow
1. Navigate to the feature
2. Check initial render (loading → content)
3. Test primary action (click/submit)
4. Verify feedback (success/error message)
5. Check navigation works (back, cancel, etc.)
6. Test on mobile viewport
```

### Common Anti-Patterns to REJECT

```
❌ Duplicate navigation buttons (wizard + form both showing Previous/Next)
❌ Missing loading spinners on buttons during submission
❌ Forms that silently fail without error messages
❌ Dead-end screens with no way to navigate back
❌ Modals that don't close properly
❌ Inconsistent button placement (sometimes left, sometimes right)
❌ Multiple ways to do the same action that behave differently
```

---

## 📚 Quick Reference

### Essential Commands

| Command        | Purpose                       | Example              |
| -------------- | ----------------------------- | -------------------- |
| `ship`         | Complete testing & deployment | Production ready     |
| `quick-ship`   | Fast deployment               | Skip full QA         |
| `/init`        | Map project                   | Start of session     |
| `/audit`       | Health check                  | Before PR            |
| `/test-entity` | E2E test                      | After entity changes |
| `/db-check`    | DB health                     | After migrations     |
| `h`            | Handoff                       | End of session       |
| `p`            | Pickup                        | Start of session     |

### Essential Tools

| Tool                       | Purpose         | When to Use                 |
| -------------------------- | --------------- | --------------------------- |
| `mcp_supabase_*`           | Database ops    | Queries, migrations, checks |
| `mcp_cursor-ide-browser_*` | UI testing      | After UI changes            |
| `mcp_context7_*`           | Documentation   | Library questions           |
| `grep`                     | Find patterns   | Before editing              |
| `read_file`                | Understand code | Always before editing       |

### Essential Files

| File                            | Purpose     | Never Edit Without |
| ------------------------------- | ----------- | ------------------ |
| `.env.local`                    | Credentials | Backup first       |
| `src/config/entity-registry.ts` | Entity SSOT | Full understanding |
| `supabase/migrations/*`         | DB schema   | Explicit approval  |

---

## 🎯 Success Metrics

### Developer Efficiency

- Time to add new entity: < 1 hour
- Bugs caught by hooks: > 90%
- Test coverage: > 80%
- Code duplication: < 5%

### Code Quality

- Type safety: 100%
- Lint errors: 0
- Magic strings: 0
- Entity registry usage: 100%

### User Experience

- Page load: < 2s
- Error states: Always shown
- Loading states: Always shown
- Accessibility: WCAG AA compliant

---

## 📖 Additional Resources

### Documentation

- **All rules**: `.claude/rules/`
- **Hooks**: `.claude/hooks/`
- **Commands**: `.claude/commands/`
- **Engineering principles**: `docs/development/ENGINEERING_PRINCIPLES.md`
- **Design system**: `docs/design-system/README.md`
- **Common guide**: `docs/guides/ai/COMMON.md`

### External Tools

- **Supabase Dashboard**: Check `.env.local` for URL
- **Vercel Dashboard**: https://vercel.com/orangecat
- **GitHub**: https://github.com/orangecat/orangecat

---

## 🎓 Remember

1. **You are agentic**: Use tools autonomously, chain operations, self-correct
2. **You are a guardian**: Enforce principles, prevent technical debt, refactor proactively
3. **You are tool-driven**: Supabase MCP, browser automation, Context7 - use them all
4. **You are self-correcting**: Hooks catch errors, you fix them immediately
5. **You are collaborative**: Handoff system enables seamless multi-agent work

**Mission**: Build powerful, maintainable, user-friendly software through intelligent automation and principled engineering.

---

**Version**: 5.1
**Last Updated**: 2026-01-07
**Next Review**: When new tools or patterns emerge
