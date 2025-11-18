# Branch Cleanup Plan
**Date:** 2025-11-18
**Purpose:** Clean up stale branches and establish trunk-based workflow

## Executive Summary

**Current State:**
- 40 total remote branches
- 19 claude/* branches (AI agent work)
- 11 snyk-* branches (security updates)
- 2 feature branches
- Branches `main` and `develop` have diverged

**Recommendation:** Clean up merged branches, review unmerged work, decide on develop branch.

---

## Safe to Delete (Merged to Main)

These branches are fully merged and can be safely deleted:

### Claude/AI Branches (3 merged)
```bash
git push origin --delete claude/project-overview-01BjVfeF6f53KhR1Cs1BSBUb
git push origin --delete claude/review-repo-structure-01V4fuwxvBexSepm3N3G3JDp
git push origin --delete claude/update-to-latest-version-01424MrcxQ4AhkXxSLSsp4Rk
```

**Impact:** None - work is already in main
**Risk:** Zero

---

## Review Required (Unmerged Branches)

### High Priority: Active Development

#### Claude Branches (16 unmerged)
These may contain work in progress or abandoned experiments:

**Likely abandoned (review commits, then delete):**
```bash
claude/cleanup-branch-mess-01Uhu4yXW2Vq8yn3kxi1yD8E
claude/review-code-quality-0118UY9vfKV9pmqQnbXRDDRk
claude/review-dashboard-versions-01XcnMrCwTNDptjwhssXXUgb
claude/review-previous-chat-01CV8FBYzDqm1SUAFYd3cNZ6
```

**Potentially valuable features (review before deciding):**
```bash
claude/consolidated-features-01424MrcxQ4AhkXxSLSsp4Rk
claude/deploy-all-features-01424MrcxQ4AhkXxSLSsp4Rk
claude/enhance-project-profiles-01MBnVLBg8fu79S93QTjkdLU
claude/fix-duplicate-reposts-01D6cep5ugGX2T6NCvHRopWR
claude/fix-mobile-homepage-01JNGt9Z64UzusUWJtP5r1od
claude/improve-public-profiles-01VTmu8wjCUfn9DoU4dHhsiS
claude/multi-wallet-support-01R3eUprm1e4pHxYYshQYr23
```

**Deployment-related (likely superseded):**
```bash
claude/final-deployment-01424MrcxQ4AhkXxSLSsp4Rk
claude/fix-broken-imports-01424MrcxQ4AhkXxSLSsp4Rk
claude/fix-bundle-analyzer-01424MrcxQ4AhkXxSLSsp4Rk
claude/merge-all-features-01QVsnwmpon4mQVih5s3grVX
claude/merge-latest-to-main-01424MrcxQ4AhkXxSLSsp4Rk
```

#### Snyk Security Branches (11 unmerged)
Security update branches - may contain important fixes:

```bash
snyk-fix-ae24144aafd638776d33e74cf1767cfa
snyk-upgrade-240e11b4c9bbdb9ad8a699c0b7bd9f5a
snyk-upgrade-36df888a6c0363d373404de360278171
snyk-upgrade-40f3ce3b989aa17dd85ea22094288df4
snyk-upgrade-5e75792783fc1c31b634f112c084928b
snyk-upgrade-614ae2e96c832c3994a219ac747acb4b
snyk-upgrade-6f86f0b249a41d93957fdfd87930f0ee
snyk-upgrade-7456b2d996e8cbdcc1a1e2de4e28b906
snyk-upgrade-986051084ee0444e2efafaf31f249f56
snyk-upgrade-af3922917670d63afac929cc3cf98674
snyk-upgrade-de140901ab21f401ab90a280a5834430
```

**Action Required:**
1. Check if security fixes are already in main
2. If unique fixes exist, create consolidated security PR
3. Delete all snyk-* branches after consolidation

---

## Critical Decision: Develop Branch

**Status:** ⚠️ `develop` and `main` have DIVERGED

**Analysis:**
```bash
# Commits in develop NOT in main (9 commits):
- feat(timeline): reliable likes/comments persistence, share modal
- perf(posting): Optimize mobile composer performance
- feat(posting): Implement offline posting with queue
- chore(wip): Bundle feature work
- chore(build): Configure bundle analyzer
- feat(posting): Progressive disclosure for mobile composer
- feat: Mobile-first posting Sprint 1
- Fix profile bootstrapping
- docs: AI assistant workflow guides

# Commits in main NOT in develop (5 commits):
- 🚀 Deploy ALL Unified Features to Production (#46)
- 🚀 FINAL: Deploy ALL Features + Critical Auth Fix (#42)
- fix: Update broken imports after code cleanup (#40)
- fix: Make bundle analyzer optional for Vercel deployment
- 🚀 Deploy all latest features to production
```

**Recommendation:** **DO NOT archive develop yet**

### Option 1: Merge develop → main (Recommended if features are ready)
```bash
# Review develop branch features
git checkout develop
npm install
npm run build
npm run test

# If tests pass and features are ready:
git checkout main
git merge develop
git push origin main
```

### Option 2: Cherry-pick valuable commits
```bash
# If only some commits are production-ready:
git cherry-pick <commit-hash>
```

### Option 3: Keep develop for now
- Continue using develop for experimental features
- Transition to trunk-based gradually
- Merge develop → main when features are stable

---

## Feature Branches

### feat/bitcoin-balance-mvp
**Status:** Unmerged
**Action:** Review commits, decide merge vs delete

### feature/restore-slim-profiles
**Status:** Unmerged
**Action:** Check if this is needed or if work is complete

---

## Execution Plan

### Phase 1: Immediate (This Week)
1. ✅ Delete 3 merged claude branches
2. Review and delete obviously stale claude/* branches (reviews, cleanup attempts)
3. Consolidate or delete snyk-* branches after checking security status

### Phase 2: Strategic (Next Week)
1. **Decide on develop branch:**
   - Test features in develop
   - Merge to main if ready, OR
   - Document develop as "experimental" branch
2. Review valuable claude/* feature branches
3. Merge or close feat/* branches

### Phase 3: Maintenance (Ongoing)
1. Enforce 3-day max branch lifetime
2. Auto-delete merged branches (GitHub setting)
3. Monthly review of stale branches

---

## Commands Reference

### Delete Merged Branches (Safe)
```bash
# Delete locally and remotely
git branch -d <branch-name>
git push origin --delete <branch-name>

# Bulk delete merged branches
git branch -r --merged origin/main | grep -E "claude/|snyk-" | sed 's|origin/||' | xargs -I {} git push origin --delete {}
```

### Check Branch Status
```bash
# See what's unique in a branch
git log origin/main..<branch-name> --oneline

# Check if branch is fully merged
git branch -r --merged origin/main | grep <branch-name>
```

### Review Branch Contents
```bash
# Checkout and test
git checkout <branch-name>
git log --oneline -10
git diff origin/main...HEAD
```

---

## Risk Assessment

| Action | Risk Level | Mitigation |
|--------|-----------|------------|
| Delete merged branches | 🟢 Low | Can restore from reflog within 30 days |
| Delete unmerged claude/* | 🟡 Medium | Review commits first, keep notes |
| Delete snyk-* branches | 🟡 Medium | Check security advisories first |
| Archive develop | 🔴 High | Has unmerged features - DO NOT DO YET |
| Delete feat/* branches | 🟡 Medium | Check with team/review commits |

---

## Success Criteria

After cleanup, we should have:
- ✅ Only `main` as long-lived branch (develop TBD)
- ✅ <5 active short-lived branches at any time
- ✅ All merged branches deleted
- ✅ Clear ownership of remaining branches
- ✅ Branch protection rules in place

---

## Next Steps

1. **User approval needed for:**
   - Deleting merged claude branches (safe)
   - Decision on develop branch (critical)
   - Approach for snyk branches (review needed)

2. **After approval:**
   - Execute deletions
   - Document decisions
   - Set up branch protection
   - Enable auto-delete on merge

---

**Questions? Issues?**
Review this plan before executing. Can always restore deleted branches from reflog within 30 days if needed.
