# 🔐 Environment Variable Management

**Complete guide to managing environment variables safely in OrangeCat development.**

## 🚨 The Problem

Traditional `.env` files are fragile:
- Easy to accidentally overwrite with `cp` commands
- No automatic backups
- Manual token management
- Risk of committing secrets to git

## ✅ The Solution

OrangeCat now uses a **comprehensive environment management system** that prevents credential loss and provides secure authentication flows.

## 🛠️ System Components

### 1. **direnv** - Automatic Environment Loading

**direnv** automatically loads environment variables when you enter the project directory.

**Installation:**
```bash
./scripts/setup-env.sh  # Installs and configures direnv
```

**How it works:**
- Variables load automatically when `cd` into the project
- No more manual `source .env.local`
- Environment is isolated to the project directory

### 2. **Interactive OAuth Login**

Secure authentication without storing tokens in plain text.

**GitHub Login:**
```bash
node scripts/auth/github-login.js
```
- Uses GitHub's Device Flow OAuth
- No password/token exposure
- Automatic token storage in `.env.local`

**Vercel Login:**
```bash
node scripts/auth/vercel-login.js
```
- Uses Vercel CLI authentication
- Automatic token generation and storage

### 3. **Environment Manager**

Comprehensive tool for environment management.

```bash
node scripts/utils/env-manager.js --help
```

**Commands:**
- `setup` - Create initial `.env.local`
- `backup` - Create backup before changes
- `validate` - Check required variables
- `restore` - Restore from backup
- `list` - Show available backups

### 4. **Automatic Backups**

**Before any change:**
```bash
# Automatic backup created
.env-backups/.env.local.2025-12-02T10-30-45.backup
```

**Manual backup:**
```bash
node scripts/utils/env-manager.js backup
```

**Restore from backup:**
```bash
node scripts/utils/env-manager.js restore
```

## 🚀 Quick Start

### First Time Setup

```bash
# 1. Run the automated setup
./scripts/setup-env.sh

# 2. Authenticate with services
node scripts/auth/github-login.js
node scripts/auth/vercel-login.js

# 3. Validate setup
node scripts/utils/env-manager.js validate

# 4. Start developing
npm run dev
```

### Daily Development

```bash
# Just cd into the project - environment loads automatically!
cd orangecat
npm run dev  # Variables are already loaded
```

## 🔧 Manual Management

### Editing Environment Variables

**Safe method:**
```bash
# Use direnv's built-in editor
direnv edit .
```

**Alternative:**
```bash
# Manual edit with automatic backup
node scripts/utils/env-manager.js backup
nano .env.local  # Edit file
node scripts/utils/env-manager.js validate
```

### Checking Status

```bash
# Validate all required variables are set
node scripts/utils/env-manager.js validate

# List all backups
node scripts/utils/env-manager.js list

# Show help
node scripts/utils/env-manager.js help
```

## 🛡️ Safety Features

### 1. **Automatic Backups**
- Created before any environment changes
- Timestamped and hashed for uniqueness
- Stored in `.env-backups/` (gitignored)

### 2. **Validation**
- Checks all required variables are set
- Warns about missing optional variables
- Prevents deployment with invalid config

### 3. **No Git Commits**
- `.env.local` is gitignored
- `.env-backups/` is gitignored
- `.envrc` is tracked (safe, contains no secrets)

### 4. **OAuth Security**
- No plaintext tokens in scripts
- Device Flow authentication
- Tokens stored securely in environment

## 🔄 Migration from Old System

If you have an existing `.env.local`:

```bash
# 1. Create backup of current file
node scripts/utils/env-manager.js backup

# 2. Run setup (creates new structure)
./scripts/setup-env.sh

# 3. Manually copy your tokens from backup to new .env.local
# 4. Validate
node scripts/utils/env-manager.js validate
```

## 🐛 Troubleshooting

### Environment Not Loading

```bash
# Check direnv status
direnv status

# Reload environment
direnv reload

# Check if hook is installed
echo $DIRENV_DIR
```

### Missing Variables

```bash
# Validate current setup
node scripts/utils/env-manager.js validate

# Check .env.local exists
ls -la .env.local

# Check .envrc is allowed
direnv allow .
```

### Authentication Issues

```bash
# Re-run GitHub login
node scripts/auth/github-login.js

# Re-run Vercel login
node scripts/auth/vercel-login.js

# Check tokens are set
grep -E "(GITHUB_TOKEN|VERCEL_TOKEN)" .env.local
```

## 📋 File Structure

```
orangecat/
├── .envrc                    # direnv configuration (tracked)
├── .env.local               # Your environment variables (gitignored)
├── .env-backups/            # Automatic backups (gitignored)
│   └── .env.local.TIMESTAMP.backup
├── scripts/
│   ├── setup-env.sh         # Automated setup script
│   ├── auth/                # OAuth login scripts
│   │   ├── github-login.js
│   │   └── vercel-login.js
│   └── utils/
│       └── env-manager.js   # Environment management tool
└── docs/
    └── development/
        └── environment-management.md  # This file
```

## 🎯 Best Practices

### 1. **Never Edit .envrc Directly**
```bash
# ❌ Wrong
nano .envrc

# ✅ Correct
direnv edit .
```

### 2. **Always Backup Before Manual Changes**
```bash
# Before editing .env.local manually
node scripts/utils/env-manager.js backup
nano .env.local
```

### 3. **Use OAuth Authentication**
```bash
# ❌ Manual token entry
echo "GITHUB_TOKEN=ghp_..." >> .env.local

# ✅ Secure OAuth flow
node scripts/auth/github-login.js
```

### 4. **Validate After Changes**
```bash
# Always validate after making changes
node scripts/utils/env-manager.js validate
```

## 📞 Getting Help

If you encounter issues:

1. **Check the troubleshooting section above**
2. **Run validation:** `node scripts/utils/env-manager.js validate`
3. **Check backups:** `node scripts/utils/env-manager.js list`
4. **Restore if needed:** `node scripts/utils/env-manager.js restore`

---

**Last Updated:** December 2, 2025
**System Version:** v2.0 (OAuth + direnv)
**Safety Level:** 🔒 Maximum (Zero credential loss risk)














































