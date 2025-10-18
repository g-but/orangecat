# 🌿 OrangeCat Git Workflow Guide

**Complete guide to the Git workflow, branching strategy, and collaboration patterns for OrangeCat development.**

## 🎯 Git Workflow Philosophy

**"Git is a tool for collaboration"** - Use Git to enable effective teamwork, not just version control.

## 📊 Branching Strategy

### **Branch Types**

| Branch Type | Purpose | Naming Convention | Merge Target |
|-------------|---------|-------------------|--------------|
| **main** | Production-ready code | `main` | - |
| **develop** | Integration branch | `develop` | `main` |
| **feature/** | New features | `feature/feature-name` | `develop` |
| **bugfix/** | Bug fixes | `bugfix/issue-description` | `develop` |
| **hotfix/** | Production fixes | `hotfix/critical-issue` | `main` |
| **release/** | Release preparation | `release/v1.2.3` | `main` |

### **Branch Naming Conventions**
```bash
# ✅ Good naming
feature/user-authentication
feature/bitcoin-wallet-integration
bugfix/profile-loading-error
hotfix/security-vulnerability
release/v2.1.0

# ❌ Bad naming
feature/new-stuff
bugfix/fix
hotfix/urgent
```

## 🚀 Feature Development Workflow

### **1. Create Feature Branch**
```bash
# Start from the latest develop branch
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/user-profile-enhancement

# Verify branch
git branch --show-current
# Output: feature/user-profile-enhancement
```

### **2. Develop Feature**
```bash
# Make changes
git add .
git commit -m "feat: add profile avatar upload functionality

- Add avatar upload component
- Implement image validation
- Add resize and compression
- Update user profile types"

# Push branch
git push -u origin feature/user-profile-enhancement
```

### **3. Create Pull Request**
- **Title**: Clear, descriptive title
- **Description**: What, why, and how
- **Testing**: Mention tests added/updated
- **Breaking changes**: Clearly documented
- **Screenshots**: For UI changes

### **4. Code Review**
- **Reviewer**: Assigned team member
- **Timeline**: Review within 24 hours
- **Feedback**: Specific, actionable comments
- **Approval**: LGTM or requests for changes

### **5. Merge to Develop**
```bash
# After PR approval
git checkout develop
git merge feature/user-profile-enhancement
git push origin develop

# Clean up feature branch
git branch -d feature/user-profile-enhancement
git push origin --delete feature/user-profile-enhancement
```

## 🔧 Commit Message Standards

### **Commit Message Format**
```bash
type(scope): description

[optional body]

[optional footer]
```

### **Commit Types**
| Type | Description | Example |
|------|-------------|---------|
| **feat** | New feature | `feat: add user profile editing` |
| **fix** | Bug fix | `fix: resolve profile loading error` |
| **docs** | Documentation | `docs: update API documentation` |
| **style** | Code style | `style: fix indentation issues` |
| **refactor** | Code refactoring | `refactor: extract ProfileService` |
| **test** | Test additions | `test: add profile validation tests` |
| **chore** | Maintenance | `chore: update dependencies` |

### **Commit Message Examples**
```bash
# ✅ Good commits
feat: add Bitcoin address validation to profile
fix: resolve memory leak in wallet connection
docs: update deployment guide with new environment variables
test: add comprehensive profile editing tests
refactor: extract authentication logic into service

# ❌ Bad commits
"update stuff"
"fix bug"
"add feature"
```

## 🔀 Pull Request Guidelines

### **PR Title Format**
```bash
# ✅ Good titles
feat: add user profile avatar upload
fix: resolve profile loading performance issue
docs: update API documentation for wallet endpoints

# ❌ Bad titles
"Update"
"Bug fix"
"New feature"
```

### **PR Description Template**
```markdown
## Description
[Clear description of what this PR does]

## Changes
- [Specific change 1]
- [Specific change 2]
- [Specific change 3]

## Testing
- [How this was tested]
- [Test commands run]
- [Manual testing performed]

## Screenshots
[If UI changes, include before/after screenshots]

## Breaking Changes
[If any, document clearly]

## Related Issues
[Link to related GitHub issues]
```

### **PR Review Checklist**
- [ ] **Code quality** - Follows standards, no lint errors
- [ ] **Tests** - All tests pass, coverage maintained
- [ ] **Documentation** - Updated for new features
- [ ] **Security** - No security vulnerabilities introduced
- [ ] **Performance** - No performance regressions

## 🏗️ Release Workflow

### **Release Branch Strategy**
```bash
# Create release branch from main
git checkout main
git checkout -b release/v2.1.0

# Merge develop into release
git merge develop

# Create release PR for final testing
# Deploy to staging for validation
# Merge to main when ready
```

### **Version Management**
- **Semantic versioning**: MAJOR.MINOR.PATCH
- **Tags**: `git tag v2.1.0 && git push --tags`
- **Release notes**: Auto-generated from commit messages

## 🔧 Git Best Practices

### **Daily Workflow**
```bash
# Start of day
git checkout develop
git pull origin develop

# Work on feature
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: implement feature"
git push

# End of day
git checkout develop
git merge feature/my-feature
git push origin develop
git branch -d feature/my-feature
```

### **Conflict Resolution**
```bash
# When conflicts occur
git status  # See conflicted files
git diff    # See specific conflicts

# Choose resolution strategy
git checkout --theirs path/to/file  # Accept incoming changes
git checkout --ours path/to/file    # Keep current changes

# Or manual resolution
# Edit files to resolve conflicts
git add path/to/resolved/file
git commit
```

### **Code Review Workflow**
```bash
# Create PR
git push -u origin feature/my-feature

# Address review feedback
git add .
git commit -m "fix: address review feedback

- Update variable names for clarity
- Add error handling for edge cases
- Improve test coverage"

git push
```

## 📊 Git Analytics

### **Repository Health Metrics**
- **Branch count**: Should be reasonable (not hundreds)
- **Merge frequency**: Regular merges to main
- **PR size**: Smaller PRs are better
- **Review time**: Quick turnaround on reviews

### **Individual Metrics**
- **Commit frequency**: Regular, meaningful commits
- **PR quality**: Well-tested, documented changes
- **Review responsiveness**: Timely responses to feedback
- **Code quality**: Follows standards, passes tests

## 🔧 Git Configuration

### **Global Git Config**
```bash
# Set up user information
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"

# Set up default editor
git config --global core.editor "code --wait"

# Enable helpful features
git config --global help.autocorrect 1
git config --global push.default simple
```

### **Repository-Specific Config**
```bash
# In repository root
git config core.autocrlf input  # For cross-platform compatibility
git config branch.develop.mergeoptions "--no-ff"  # Always create merge commit
```

## 🚨 Common Git Issues & Solutions

### **Merge Conflicts**
```bash
# Strategy 1: Use merge tool
git mergetool

# Strategy 2: Manual resolution
git checkout --theirs conflicted-file  # Accept incoming
git checkout --ours conflicted-file    # Keep local

# Strategy 3: Abort and rebase
git merge --abort
git pull --rebase origin develop
```

### **Lost Commits**
```bash
# Find lost commits
git reflog

# Recover lost commit
git cherry-pick <commit-hash>
```

### **Large Repository**
```bash
# Clean up large files
git gc --aggressive --prune=now

# Remove large files from history
git filter-branch --tree-filter 'rm -f large-file' HEAD
```

## 📚 Git Resources

### **Official Documentation**
- **[Git Documentation](https://git-scm.com/doc)** - Official Git docs
- **[GitHub Guides](https://guides.github.com/)** - GitHub-specific guides
- **[Pro Git Book](https://git-scm.com/book)** - Comprehensive Git book

### **Tools & Extensions**
- **GitHub Desktop** - GUI for Git operations
- **GitKraken** - Advanced Git GUI
- **Git Lens** - VS Code extension for Git
- **Git Flow** - Git extensions for workflow

### **Advanced Patterns**
- **Git Flow** - Feature branch workflow
- **GitHub Flow** - Simplified workflow for continuous deployment
- **Trunk-based Development** - Main branch development

## 🆘 Getting Git Help

### **Common Issues**
- **Merge conflicts**: Use `git mergetool` or resolve manually
- **Lost work**: Check `git reflog` for lost commits
- **Large repository**: Use `git gc` to optimize
- **Authentication**: Set up SSH keys or personal access tokens

### **Learning Resources**
- **Interactive Git Tutorial** - Learn Git interactively
- **Git Cheatsheet** - Quick reference for common commands
- **Team Git Workflow** - Best practices for team collaboration

---

**Last Updated:** October 17, 2025
**Git Workflow Philosophy:** "Git enables collaboration - use it to build better software together"
