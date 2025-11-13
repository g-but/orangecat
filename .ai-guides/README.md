# AI Assistant Guides for OrangeCat

This directory contains workflow guides for different AI coding assistants to ensure consistent development practices.

## 📁 Files

- **`claude.md`** - Guide for Anthropic's Claude (detailed, educational)
- **`agents.md`** - General guide for AI agents (concise, actionable)
- **`gemini.md`** - Guide for Google's Gemini (contextual, explanatory)
- **`cursor.md`** - Guide for Cursor AI editor (inline assistance focused)

## 🎯 Purpose

These guides ensure AI assistants:

1. **Follow controlled Git workflow** (no surprise deployments)
2. **Suggest actions proactively** (commit, push, deploy)
3. **Explain what they're doing** (educational for learning developers)
4. **Respect deployment pipeline** (branches → preview → production)

## 🌳 Workflow Summary

```
develop branch (daily work)
    ↓
feature/branch (specific features)
    ↓ push
Preview: orangecat-git-feature-branch.vercel.app
    ↓ merge to develop (accumulate)
    ↓ merge to main (when ready)
Production: orangecat.fun (auto-deploy)
```

## 🤖 AI Assistant Behavior

### Proactive Suggestions:

| Action     | When                             | Result          |
| ---------- | -------------------------------- | --------------- |
| **Commit** | Feature done, bug fixed          | Local save      |
| **Push**   | Multiple commits, end of session | Preview deploy  |
| **Deploy** | Tested, approved, ready          | Production live |

### Key Principles:

1. **Never** push to `main` without explicit approval
2. **Always** suggest before deploying to production
3. **Explain** what each Git action does
4. **Show** preview URLs when creating them
5. **Test** builds before suggesting production deploy

## 🔄 Git Commands Reference

### Daily Work:

```bash
git checkout develop
git checkout -b feature/your-feature
git add .
git commit -m "feat: your feature"
git push origin feature/your-feature
```

### Deploy to Production:

```bash
git checkout develop
git merge feature/your-feature
git checkout main
git merge develop
git push origin main  # 🚀 Goes live
```

## 📦 Commit Convention

**Format:** `type: description`

**Types:**

- `feat:` New feature
- `fix:` Bug fix
- `perf:` Performance
- `refactor:` Code restructure
- `docs:` Documentation
- `test:` Tests
- `chore:` Maintenance

## 🎓 Educational Context

The developer is learning Git workflows. AI assistants should:

- Explain concepts clearly
- Show why we follow these practices
- Be patient with questions
- Mention best practices when relevant

## 🛠️ Project Tech Stack

- **Frontend:** Next.js 15.5.4, React, TailwindCSS
- **Backend:** Supabase (PostgreSQL, Auth, RLS)
- **Deployment:** Vercel (auto-deploy from `main`)
- **Blockchain:** Bitcoin, Lightning Network

## 📊 Branch Strategy

| Branch      | Purpose            | Deploys To              |
| ----------- | ------------------ | ----------------------- |
| `main`      | Production code    | ✅ orangecat.fun (auto) |
| `develop`   | Active development | 🔍 Preview only         |
| `feature/*` | Specific features  | 🔍 Preview only         |

## 🚨 Critical Rules

### ❌ NEVER:

- Push to `main` without user approval
- Deploy without suggesting first
- Skip testing before production
- Use vague commit messages

### ✅ ALWAYS:

- Suggest actions proactively
- Explain what will happen
- Run builds/tests before deploy
- Show preview URLs
- Follow conventional commits

## 📝 How to Use These Guides

### For AI Assistants:

1. Read the guide for your platform
2. Follow the workflow patterns
3. Suggest actions at appropriate times
4. Keep user in control

### For Developers:

1. These guides help AI assistants understand the project
2. You can modify them as the workflow evolves
3. Reference them when onboarding new AI tools
4. Use them to teach Git best practices

## 🔄 Keeping Guides Updated

Update these guides when:

- Workflow changes
- New branch strategy adopted
- Deployment process changes
- New tools/services added

## 📞 Support

If an AI assistant isn't following these guidelines:

1. Reference the specific guide
2. Point out the relevant section
3. Ask them to follow the workflow
4. Report persistent issues to the developer

---

Last Updated: 2025-11-13
Created by: Claude (Anthropic)
Maintained by: OrangeCat Team
