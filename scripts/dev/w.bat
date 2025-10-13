@echo off
REM 🚀 OrangeCat One-Button Deploy Script (Windows)
REM Usage: w [commit message]

setlocal enabledelayedexpansion

echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║                    🚀 ORANGECAT DEPLOY                      ║
echo ║                  One-Button Git + Deploy                     ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

REM Check if we're in a git repository
git rev-parse --git-dir >nul 2>&1
if errorlevel 1 (
    echo ❌ Error: Not in a git repository
    exit /b 1
)

REM Check for GitHub CLI
gh --version >nul 2>&1
if errorlevel 1 (
    echo ⚠️  GitHub CLI not found. Installing...
    winget install GitHub.cli
    if errorlevel 1 (
        echo ❌ Please install GitHub CLI: https://cli.github.com/
        exit /b 1
    )
)

REM Get commit message from argument or use default
if "%~1"=="" (
    for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set mydate=%%c-%%a-%%b
    for /f "tokens=1-2 delims=/:" %%a in ('time /t') do set mytime=%%a:%%b
    set "COMMIT_MSG=🚀 Deploy: !mydate! !mytime!"
) else (
    set "COMMIT_MSG=%~1"
)

echo 📋 Commit message: !COMMIT_MSG!

REM Check git status and commit if needed
git diff --quiet
if errorlevel 1 (
    echo 📝 Changes detected. Adding and committing...
    git add .
    git commit -m "!COMMIT_MSG!"
    echo ✅ Changes committed
) else (
    echo ℹ️  No changes to commit
)

REM Push to GitHub
echo 📤 Pushing to GitHub...
git push origin main
if errorlevel 1 (
    echo ❌ Failed to push to GitHub
    exit /b 1
)
echo ✅ Pushed to GitHub

REM Trigger deployment
echo 🚀 Triggering deployment...
gh workflow run one-button-deploy.yml --field environment=production --field skip_tests=false --field force_deploy=false
if errorlevel 1 (
    echo ❌ Failed to trigger deployment
    echo 💡 Alternative: Push will auto-deploy via GitHub Actions
    exit /b 1
)

echo ✅ Deployment triggered successfully!

REM Open monitoring
echo 🔍 Opening deployment monitoring...
timeout /t 3 /nobreak >nul
start "" "https://github.com/g-but/orangecat/actions"

echo.
echo 🎉 DEPLOYMENT IN PROGRESS!
echo.
echo 📊 Monitor: https://github.com/g-but/orangecat/actions
echo 🌐 Production: https://orangecat.ch
echo 🏥 Health: https://orangecat.ch/api/health
echo.
echo ⏱️  Timeline: 6-9 minutes
echo 📱 You'll be notified when complete
echo.

pause 