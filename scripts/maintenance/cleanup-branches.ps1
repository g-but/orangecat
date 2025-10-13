# Disable paging for git commands
$env:GIT_PAGER = 'cat'

Write-Host "🚀 Starting branch cleanup..." -ForegroundColor Green

# Switch to main branch
Write-Host "Switching to main branch..." -ForegroundColor Yellow
git checkout main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to switch to main branch" -ForegroundColor Red
    exit 1
}

# Pull latest changes
Write-Host "Pulling latest changes..." -ForegroundColor Yellow
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to pull latest changes" -ForegroundColor Red
    exit 1
}

# Merge backup/modular-architecture
Write-Host "Merging backup/modular-architecture..." -ForegroundColor Yellow
git merge backup/modular-architecture
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to merge backup/modular-architecture" -ForegroundColor Red
    exit 1
}

# Push changes
Write-Host "Pushing changes to main..." -ForegroundColor Yellow
git push origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to push changes" -ForegroundColor Red
    exit 1
}

# Delete branches
$branchesToDelete = @(
    'feature/kpi-tracking',
    'feature/real-btc-donation',
    'backup/modular-architecture'
)

foreach ($branch in $branchesToDelete) {
    Write-Host "Deleting branch $branch..." -ForegroundColor Yellow
    
    # Delete local branch
    git branch -D $branch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Could not delete local branch $branch" -ForegroundColor Yellow
    }
    
    # Delete remote branch
    git push origin --delete $branch
    if ($LASTEXITCODE -ne 0) {
        Write-Host "⚠️ Could not delete remote branch $branch" -ForegroundColor Yellow
    }
    
    Write-Host "✅ Deleted $branch" -ForegroundColor Green
}

Write-Host "✨ Branch cleanup complete!" -ForegroundColor Green 