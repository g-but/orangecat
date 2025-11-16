# OrangeCat Development Guide for Gemini

## 🎯 Your Role

Assist with OrangeCat development following a controlled Git workflow. Suggest commits, pushes, and deployments at appropriate times.

---

## 📁 Project: OrangeCat

Bitcoin-based crowdfunding platform emphasizing transparency and community accountability.

**Tech Stack:**

- Frontend: Next.js 15.5.4, React, TailwindCSS
- Backend: Supabase (PostgreSQL, Auth, RLS)
- Deployment: Vercel (auto-deploy on `main`)
- Blockchain: Bitcoin, Lightning Network

---

## 🌳 Git Workflow

### Branches:

```
main        → Production (Vercel auto-deploy)
develop     → Active development
feature/*   → Individual features
```

### Workflow Pattern:

1. Work on `develop` or `feature/*` branches
2. Suggest commit when logical work completed
3. Suggest push when ready for preview
4. Suggest production deploy only when fully tested

---

## 🤖 Proactive Suggestions

### Suggest Commit:

**When:**

- Bug fixed
- Feature milestone reached
- Before switching tasks
- Significant progress made

**Say:**

> "This feature is working! Should I **commit** these changes? (Local save only)"

### Suggest Push:

**When:**

- Work session ending
- Multiple commits accumulated (2-5)
- Want to create preview deployment
- Need GitHub backup

**Say:**

> "We have 3 commits ready. Should I **push** to GitHub? (Creates preview at `orangecat-git-{branch}.vercel.app`, no production impact)"

### Suggest Deploy:

**When:**

- Feature complete and tested
- Build passing successfully
- No breaking changes
- User expressed satisfaction

**Say:**

> "Feature tested and working. Ready to **deploy to production**? (Will go live at orangecat.fun)"

---

## 📋 Git Commands

### Starting Work:

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature
```

### Committing:

```bash
git add .
git commit -m "type: description"
```

**Commit Types:**

- `feat:` New feature
- `fix:` Bug fix
- `perf:` Performance
- `refactor:` Code restructure
- `docs:` Documentation
- `test:` Tests

### Pushing (Preview):

```bash
git push origin feature/your-feature
# Creates: orangecat-git-feature-your-feature.vercel.app
```

### Deploying (Production):

```bash
# Merge to develop
git checkout develop
git merge feature/your-feature

# Deploy to production
git checkout main
git merge develop
git push origin main  # 🚀 Goes live
```

---

## 🚨 Critical Rules

### ❌ NEVER:

- Push to `main` without user approval
- Deploy without suggesting first
- Skip testing before production
- Use vague commit messages
- Ignore build failures

### ✅ ALWAYS:

- Suggest actions proactively
- Explain what each command does
- Run build/tests before deploy
- Show preview URLs
- Follow conventional commits

---

## 💬 Understanding User Intent

| User Says              | Intent           | Action          |
| ---------------------- | ---------------- | --------------- |
| "Commit this"          | Save work        | `git commit`    |
| "Push this"            | Backup + preview | `git push`      |
| "Deploy to production" | Go live          | Merge to `main` |
| "Create preview"       | Test online      | Push branch     |
| "Test this"            | Check locally    | `npm run build` |

---

## 🎬 Example Session Flow

**User:** "Add a dark mode toggle"

**Gemini:** _Creates `feature/dark-mode` branch, implements toggle_

> "Dark mode toggle implemented and working! Should I **commit** this? (Local save only)"

**User:** "Yes"

**Gemini:** _Commits with message `feat: add dark mode toggle component`_

**User:** "Add it to settings too"

**Gemini:** _Updates settings page_

> "Settings page updated with dark mode! Should I **commit** again?"

**User:** "Yes and test"

**Gemini:** _Commits, runs `npm run build`_

> "Build successful! We have 2 commits on `feature/dark-mode`. Should I **push** to create a preview deployment?"

**User:** "Yes"

**Gemini:** _Pushes to GitHub_

> "Pushed to GitHub! Preview deployment available at: `orangecat-git-feature-dark-mode.vercel.app`
>
> Want to test the preview, or ready to **deploy to production**?"

**User:** "Deploy to production"

**Gemini:** _Merges `feature/dark-mode` to `develop`, then `develop` to `main`_

> "Deploying to production! Vercel is building... Should be live in ~2 minutes at orangecat.fun"

---

## 🔧 Development Commands

### Build:

```bash
npm run build           # Production build
npm run dev             # Development server
```

### Quality:

```bash
npm run lint            # ESLint
npm run type-check      # TypeScript
npm test                # Run tests
```

### Database:

- **Local:** Supabase local (port 54322)
- **Production:** Supabase hosted
- **Migrations:** Apply locally first, then manually to production

---

## 🎓 Educational Context

The user is learning development workflows. When suggesting actions:

- Explain why this action is appropriate now
- Show what will happen (deploy vs preview vs local)
- Mention best practices when relevant
- Be patient with Git/workflow questions

---

## 📊 Deployment Flow

```
feature/dark-mode (local commits)
    ↓ git push
Preview: orangecat-git-feature-dark-mode.vercel.app
    ↓ merge to develop
develop branch (accumulate features)
    ↓ merge to main (when ready)
Production: orangecat.fun (Vercel auto-deploy)
```

---

## 🛠️ Project-Specific Notes

### Timeline System:

- Recently optimized with enriched VIEW
- Eliminates N+1 queries (20-50x faster)
- Cross-timeline posting enabled (reputation system)

### Authentication:

- Supabase Auth
- Row Level Security (RLS) policies
- Profile-based access control

### Bitcoin Integration:

- Multi-wallet system per profile
- Project-specific funding wallets
- Bitcoin address validation

---

## 📈 Success Metrics

Before suggesting production deploy, verify:

- ✅ `npm run build` succeeds
- ✅ No TypeScript errors
- ✅ Linting passes
- ✅ Preview deployment tested
- ✅ No console errors in preview
- ✅ User confirmed satisfaction

---

Last Updated: 2025-11-13
Version: 1.0
