# OrangeCat Development Guide for Cursor AI

## 🎯 Context

You're assisting with OrangeCat, a Bitcoin crowdfunding platform. Follow controlled Git workflow and suggest Git actions at appropriate times.

---

## 🏗️ Project Architecture

```
orangecat/
├── src/
│   ├── app/              # Next.js 15 App Router
│   ├── components/       # React components
│   ├── services/         # Business logic
│   ├── lib/              # Utilities
│   └── types/            # TypeScript types
├── supabase/
│   └── migrations/       # Database migrations
└── .ai-guides/           # AI assistant guides
```

**Key Tech:**

- Next.js 15.5.4 (App Router, Server Components)
- Supabase (Auth, Database, RLS)
- Vercel (Hosting, Auto-deploy)
- Bitcoin/Lightning Network

---

## 🌳 Git Workflow

### Branches:

- `main` → Production (auto-deploys to Vercel)
- `develop` → Daily development
- `feature/*` → Specific features

### Current Branch Strategy:

```bash
# Check current branch
git branch --show-current

# Should typically be on 'develop' or 'feature/*'
# NEVER work directly on 'main'
```

---

## 🤖 Cursor-Specific Behavior

### When User Asks for Code:

1. **Implement the feature**
2. **Suggest commit** when done
3. **Show what changed**
4. **Explain the implementation**

### Example:

```typescript
// User: "Add dark mode toggle"

// 1. Implement
export function DarkModeToggle() {
  // ... your implementation
}

// 2. Suggest
"Dark mode toggle implemented! Should I **commit** this?
Changed files: src/components/ui/DarkModeToggle.tsx
Commit message: feat: add dark mode toggle component"
```

---

## 💬 Proactive Suggestions

### ✅ Suggest Commit After:

- Implementing a feature component
- Fixing a bug
- Refactoring a module
- Adding tests
- Updating documentation

**Template:**

> "Feature/fix complete! Should I **commit**?
> Files changed: {list files}
> Commit message: `{type}: {description}`"

### ⬆️ Suggest Push After:

- Multiple commits (2-5)
- Session ending
- Feature complete
- Want preview deployment

**Template:**

> "You have {N} commits on `{branch}`. Push to GitHub?
> This will create a preview at: `orangecat-git-{branch}.vercel.app`
> (Does NOT deploy to production)"

### 🚀 Suggest Deploy After:

- Feature fully tested
- Build passing
- User satisfied with preview
- No breaking changes

**Template:**

> "Feature tested and working! Deploy to production?
> This will merge to `main` and go live at orangecat.fun
> Run checks:
> ✅ Build passing
> ✅ Tests passing
> ✅ No TypeScript errors"

---

## 📋 Git Commands

### Commit:

```bash
git add .
git commit -m "type: description"
```

### Push (Creates Preview):

```bash
git push origin feature/branch-name
# Preview: orangecat-git-feature-branch-name.vercel.app
```

### Deploy (Production):

```bash
# Only when user explicitly approves
git checkout develop && git merge feature/branch-name
git checkout main && git merge develop && git push origin main
```

---

## 🚨 Critical Rules

### ❌ NEVER:

- Auto-commit without suggesting
- Push to `main` without approval
- Deploy without asking first
- Ignore build/test failures
- Use generic commit messages

### ✅ ALWAYS:

- Suggest actions in chat
- Show what files changed
- Preview commit messages
- Run `npm run build` before deploy
- Explain what each action does

---

## 📦 Commit Convention

**Format:** `type: description`

**Types:**

- `feat:` New feature
- `fix:` Bug fix
- `perf:` Performance improvement
- `refactor:` Code restructuring
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

**Examples:**

- `feat: add wallet management to profile editor`
- `fix: resolve timeline N+1 query issue`
- `perf: optimize community feed with database VIEW`

---

## 🔧 Common Commands

### Development:

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build (must pass before deploy)
npm run lint         # Run ESLint
npm run type-check   # TypeScript validation
```

### Database:

```bash
# Local Supabase
npx supabase status
npx supabase db reset

# Migrations
# 1. Create: supabase/migrations/{timestamp}_{name}.sql
# 2. Apply locally: psql -h 127.0.0.1 -p 54322 ...
# 3. Apply production: Supabase Dashboard SQL Editor
```

---

## 🎯 Inline Code Assistance

### When Autocompleting Code:

- Follow existing patterns in the file
- Match the project's TypeScript style
- Use existing utilities from `src/lib/`
- Follow React Server Component patterns
- Respect Supabase RLS patterns

### When Explaining Code:

- Reference line numbers
- Explain architectural decisions
- Mention related files
- Suggest improvements when relevant

---

## 🌐 Deployment URLs

- **Production:** https://orangecat.fun
- **Preview:** `https://orangecat-git-{branch}.vercel.app`
- **Local Dev:** http://localhost:3000

---

## 📊 Feature Areas

### Timeline System:

- Location: `src/services/timeline/`
- Uses enriched VIEW for performance
- Cross-posting enabled (reputation system)
- Actor/Subject/Target pattern

### Authentication:

- Supabase Auth + RLS
- Profile-based access control
- Location: `src/lib/supabase/`

### Wallet System:

- Multi-wallet per profile
- Bitcoin address validation
- Location: `src/components/wallet/`

### Profile System:

- Modern editor with wizard
- Location fields, social links
- Location: `src/components/profile/`

---

## 🎓 Educational Mode

User is learning development. When suggesting:

- Explain Git concepts simply
- Show command outputs
- Mention why we're doing this
- Be patient with questions

---

## 💡 Quick Reference

| User Action        | Your Response          | Command           |
| ------------------ | ---------------------- | ----------------- |
| Implements feature | Suggest commit         | `git commit`      |
| Multiple commits   | Suggest push           | `git push`        |
| "Deploy this"      | Verify → merge to main | `git merge`       |
| "Show changes"     | `git diff`             | Show file changes |
| "Undo last commit" | `git reset HEAD~1`     | Soft reset        |

---

## 🔍 Code Style

### TypeScript:

- Strict mode enabled
- Explicit return types on functions
- Use type imports: `import type { ... }`
- Avoid `any`, use proper types

### React:

- Server Components by default
- 'use client' only when necessary
- Async components for data fetching
- Props interfaces exported

### Naming:

- Components: PascalCase
- Files: kebab-case or PascalCase (match component)
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE

---

Last Updated: 2025-11-13
Project: OrangeCat v1.0
