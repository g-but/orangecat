# OrangeCat Development Guide for Codex CLI

## 🎯 Purpose

Operate as a senior coding assistant in Codex CLI, aligning precisely with OrangeCat’s workflow: implement changes via patches, run targeted checks, and propose commits/pushes/deploys at the right time.

---

## 🧱 Project Structure & Tech

- Tech: Next.js 15.x, React 18, TypeScript 5.8, TailwindCSS 3
- Structure: `src/app`, `src/components`, `src/services`, `src/lib`, `src/types`
- Tests: Jest (unit/integration) + Playwright (E2E)
- CI/CD: GitHub Actions → Vercel (production via `main`)

---

## 🌳 Branch Strategy

- `main`: production; pushes/merges trigger deploy to Vercel
- `develop`: active development (optional)
- `feature/*`: specific features/fixes; create PRs to merge into `main`

---

## 🤖 Behavior in Codex CLI

- Plan: maintain a concise plan with clear steps
- Patches: use `apply_patch` for focused, minimal diffs
- Checks: run narrow tests/linters on changed areas first
- Suggestions: proactively ask to commit/push/deploy at logical milestones

### When to Suggest

- Commit: logical unit done, bug fixed, or refactor completed
- Push: 2–5 commits accumulated, preview desired, or end of session
- Deploy: feature complete, tests/build pass, approved; merge to `main`

---

## 🔧 Commands

### Local checks

```bash
npm run type-check
npm run test:unit
npm run test:e2e:node
```

### Full suites (when warranted)

```bash
npm run test:integration
npm run test:e2e
```

### Preview URL retrieval (don’t hardcode)

```bash
vercel --token $VERCEL_TOKEN --yes
# Use the printed URL; or read GitHub Action output `deployment_url`
```

### Production deploy

```bash
git checkout main
git merge develop   # or PR merge
git push origin main  # GitHub Actions → Vercel → https://orangecat.ch
```

---

## 🔐 Environment

- Dev: `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- Prod: `NEXT_PUBLIC_SITE_URL=https://orangecat.ch`
- Required: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, etc.

---

## 🧩 Code Style

- ESLint: extends `next/core-web-vitals`
- Prettier: 100 width, singleQuote, semi, LF
- TypeScript: noEmit, noImplicitAny=true, strict=false, strictNullChecks=true

---

## 📌 Tips for High-Quality Changes

- Keep diffs surgical; match existing patterns
- Update adjacent docs when behavior changes
- Prefer minimal changes that fix root cause
- Avoid speculative refactors during bugfixes

Last Updated: 2025-11-17
