#!/usr/bin/env node

const { execSync } = require('child_process');

async function cleanupBranches() {
  try {
    // REMOVED: console.log statement

    // Switch to main branch
    // REMOVED: console.log statement
    execSync('git checkout main', { stdio: 'inherit' });

    // Pull latest changes
    // REMOVED: console.log statement
    execSync('git pull origin main', { stdio: 'inherit' });

    // Merge backup/modular-architecture
    // REMOVED: console.log statement
    execSync('git merge backup/modular-architecture', { stdio: 'inherit' });

    // Push changes
    // REMOVED: console.log statement
    execSync('git push origin main', { stdio: 'inherit' });

    // Delete feature branches
    const branchesToDelete = [
      'feature/kpi-tracking',
      'feature/real-btc-donation',
      'backup/modular-architecture'
    ];

    for (const branch of branchesToDelete) {
      // REMOVED: console.log statement
      try {
        // Delete local branch
        execSync(`git branch -D ${branch}`, { stdio: 'inherit' });
        // Delete remote branch
        execSync(`git push origin --delete ${branch}`, { stdio: 'inherit' });
        if (process.env.NODE_ENV === 'development') console.log(`✅ Deleted ${branch}`);
      } catch (error) {
        // REMOVED: console.log statement
      }
    }

    // REMOVED: console.log statement
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

cleanupBranches(); 