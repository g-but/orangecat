# OrangeCat Development Workflow Guide for Claude

## 🎯 Core Principle

Work on branches → Suggest when to commit/push/deploy → Merge to `main` = instant production

---

## 📚 Git Terms (Simple)

- **Commit** = Save snapshot locally (like clicking "Save")
- **Stage** = Choose files for next commit (`git add`)
- **Push** = Upload to GitHub (cloud backup)
- **Branch** = Parallel version of code (draft vs published)
- **Merge** = Combine branches (accepting draft into final)

---

## 🌳 Branch Structure

```
main (production) ← Only touch when deploying to production
  ↓
develop (daily work) ← Default branch for all work
  ↓
feature/* ← Specific features/fixes
```

### Branch Rules:

- **main**: Production code, auto-deploys to Vercel on push
- **develop**: Daily development work, creates preview deployments
- **feature/**: For specific features, creates preview deployments

---

## 🤖 Your Role: Proactive Suggestions

### ✅ Suggest COMMIT when:

- Fixed a bug
- Completed a feature component
- Made significant progress worth saving
- Before taking a break
- After refactoring

**Example Response:**

> "Great! The wallet integration is working. Should I **commit** these changes? (Just saves locally, no deploy)"

### ⬆️ Suggest PUSH when:

- End of work session
- Feature is complete and tested locally
- Multiple commits accumulated (2-5)
- Want to create preview deployment
- Before switching tasks

**Example Response:**

> "We've made 3 commits on wallet features. Should I **push** to GitHub? (Creates preview deployment, no production deploy)"

### 🚀 Suggest DEPLOY when:

- Feature fully tested and working
- Build passing successfully
- No breaking changes detected
- User seems satisfied with preview
- Major milestone completed

**Example Response:**

> "The timeline optimization is complete, tested, and building successfully. Ready to **deploy to production**? (This will merge to `main` and go live on Vercel)"

---

## 🎬 Standard Workflow

### Starting New Work:

```bash
# Always start from develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/descriptive-name
```

### During Development:

```bash
# When suggesting commit
git add .
git commit -m "type: descriptive message"

# When suggesting push (creates preview)
git push origin feature/descriptive-name
# ✅ Preview: orangecat-git-feature-descriptive-name.vercel.app
# ❌ Does NOT deploy to production
```

### Deploying to Production:

```bash
# Only when user explicitly approves

# 1. Merge to develop first
git checkout develop
git merge feature/descriptive-name
git push origin develop

# 2. Then deploy to production
git checkout main
git merge develop
git push origin main
# 🚀 Vercel auto-deploys to production
```

---

## 📋 Commit Message Convention

Use conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `perf:` - Performance improvement
- `refactor:` - Code refactoring
- `docs:` - Documentation
- `test:` - Tests
- `chore:` - Maintenance

**Examples:**

- `feat: add dark mode toggle to settings`
- `fix: resolve authentication timeout issue`
- `perf: optimize timeline query with database VIEW`

---

## 🚨 Important Rules

### ❌ NEVER:

- Push to `main` without user approval
- Deploy without suggesting first
- Commit without explaining what changed
- Skip testing before suggesting deployment
- Create commits with vague messages

### ✅ ALWAYS:

- Suggest actions proactively
- Explain what each action does
- Show preview URLs when pushing branches
- Run build/tests before suggesting deploy
- Ask if user wants to test preview before production

---

## 💬 User Commands to Recognize

| User Says              | You Do                     | Branch         |
| ---------------------- | -------------------------- | -------------- |
| "Commit this"          | Git commit                 | Current        |
| "Push this"            | Git push (creates preview) | Current        |
| "Deploy to production" | Merge to main (live)       | develop → main |
| "Create preview"       | Push branch for preview    | Current        |
| "Start fresh branch"   | Create new feature branch  | From develop   |

---

## 🔄 Example Session Flow

**User:** "Add a dark mode toggle"

**Claude:** _Creates `feature/dark-mode` branch, implements toggle_

> "Dark mode toggle implemented and working! Should I **commit** this? (Local save only)"

**User:** "Yes"

**Claude:** _Commits with message `feat: add dark mode toggle component`_

**User:** "Add it to settings too"

**Claude:** _Updates settings page_

> "Settings page updated with dark mode! Should I **commit** again?"

**User:** "Yes and test"

**Claude:** _Commits, runs build_

> "Build successful! We have 2 commits on `feature/dark-mode`. Should I **push** to create a preview deployment?"

**User:** "Yes"

**Claude:** _Pushes to GitHub_

> "Pushed to GitHub! Preview deployment available at: `orangecat-git-feature-dark-mode.vercel.app`
>
> Want to test the preview, or ready to **deploy to production**?"

**User:** "Deploy to production"

**Claude:** _Merges develop → main_

> "Deploying to production! Vercel is building... Should be live in ~2 minutes at orangecat.fun"

---

## 🛠️ Technical Details

### Vercel Configuration:

- **Production**: Only deploys from `main` branch
- **Preview**: Deploys from all other branches
- **Auto-deploy**: Enabled for `main` branch

### GitHub Integration:

- **Protected branches**: `main` (optional, not currently enforced)
- **CI/CD**: GitHub Actions runs tests on all pushes
- **Hooks**: Pre-commit hooks run linting/formatting

### Database:

- **Local**: Supabase local instance (port 54322)
- **Production**: Supabase hosted (ohkueislstxomdjavyhs)
- **Migrations**: Apply to local first, then production manually

---

## 📊 Current Project State

- **Main branch**: Production code
- **Develop branch**: Active development
- **Tech stack**: Next.js 15.5.4, Supabase, Vercel
- **Auto-deploy**: Enabled on `main` only

---

## 🎓 Learning Mode

The user is learning development workflows. Be educational:

- Explain what each command does
- Show why we're doing things this way
- Mention best practices when relevant
- Be patient with questions about Git/deployment

---

Last Updated: 2025-11-13
