# OrangeCat Workflow Guide for AI Agents

## 🎯 Mission

Help build OrangeCat (Bitcoin crowdfunding platform) following professional Git workflow while keeping user in control.

---

## 🏗️ Project Overview

**Stack:**

- Next.js 15.5.4 (App Router)
- Supabase (PostgreSQL + Auth)
- Vercel (Hosting)
- Bitcoin integration

**Purpose:** Transparent crowdfunding platform using Bitcoin

---

## 🌳 Git Workflow

### Branch Structure:

```
main        → Production (auto-deploys to Vercel)
develop     → Daily development (creates previews)
feature/*   → Specific features (creates previews)
```

### Key Principle:

**Only `main` branch deploys to production. Everything else creates preview deployments.**

---

## 🤖 Your Behavior: Proactive Suggestions

### When to Suggest COMMIT:

- ✅ Completed logical unit of work
- ✅ Bug fixed
- ✅ Feature component done
- ✅ Before breaks

**Say:** "Feature working! Should I commit? (saves locally)"

### When to Suggest PUSH:

- ✅ End of session
- ✅ Multiple commits (2-5)
- ✅ Want preview deployment
- ✅ Backup to GitHub needed

**Say:** "3 commits ready. Should I push? (creates preview, no production deploy)"

### When to Suggest DEPLOY:

- ✅ Feature tested
- ✅ Build passing
- ✅ User satisfied
- ✅ No breaking changes

**Say:** "Feature complete and tested. Deploy to production? (goes live on Vercel)"

---

## 📋 Commands Pattern

### Daily Work:

```bash
git checkout develop
git checkout -b feature/feature-name
# ... work ...
git add .
git commit -m "feat: descriptive message"
git push origin feature/feature-name  # Creates preview
```

### Deploy to Production:

```bash
git checkout develop
git merge feature/feature-name
git checkout main
git merge develop
git push origin main  # 🚀 Auto-deploys via Vercel
```

---

## 🚨 Rules

### ❌ NEVER:

- Push to `main` without explicit user approval
- Deploy without asking first
- Create vague commit messages
- Skip build/test before deploy suggestions

### ✅ ALWAYS:

- Suggest actions proactively
- Explain what each command does
- Show preview URLs
- Test before suggesting production deploy
- Use conventional commit format

---

## 💬 User Commands

| Command                | Action          | Result           |
| ---------------------- | --------------- | ---------------- |
| "Commit this"          | `git commit`    | Local save       |
| "Push this"            | `git push`      | GitHub + preview |
| "Deploy to production" | Merge to `main` | Live deployment  |
| "Create preview"       | Push branch     | Preview URL      |

---

## 📦 Deployment Info

- **Production URL:** orangecat.fun
- **Preview Format:** `orangecat-git-{branch-name}.vercel.app`
- **Database:** Supabase (local dev + production)
- **CI/CD:** GitHub Actions (tests on push)

---

## 🎓 Educational Mode

User is learning:

- Explain Git concepts simply
- Show why we follow this workflow
- Be patient with workflow questions
- Teach best practices

---

## 🔧 Tech Commands

### Build:

```bash
npm run build  # Must pass before deploy
```

### Test:

```bash
npm test
npm run type-check
```

### Database:

```bash
# Local (port 54322)
PGPASSWORD=postgres psql -h 127.0.0.1 -p 54322 -U postgres

# Production (via Supabase Dashboard SQL Editor)
```

---

Last Updated: 2025-11-13
