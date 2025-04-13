#!/usr/bin/env node

const { execSync } = require('child_process');

async function cleanupBranches() {
  try {
    console.log('🚀 Starting branch cleanup...');

    // Switch to main branch
    console.log('Switching to main branch...');
    execSync('git checkout main', { stdio: 'inherit' });

    // Pull latest changes
    console.log('Pulling latest changes...');
    execSync('git pull origin main', { stdio: 'inherit' });

    // Merge backup/modular-architecture
    console.log('Merging backup/modular-architecture...');
    execSync('git merge backup/modular-architecture', { stdio: 'inherit' });

    // Push changes
    console.log('Pushing changes to main...');
    execSync('git push origin main', { stdio: 'inherit' });

    // Delete feature branches
    const branchesToDelete = [
      'feature/kpi-tracking',
      'feature/real-btc-donation',
      'backup/modular-architecture'
    ];

    for (const branch of branchesToDelete) {
      console.log(`Deleting branch ${branch}...`);
      try {
        // Delete local branch
        execSync(`git branch -D ${branch}`, { stdio: 'inherit' });
        // Delete remote branch
        execSync(`git push origin --delete ${branch}`, { stdio: 'inherit' });
        console.log(`✅ Deleted ${branch}`);
      } catch (error) {
        console.log(`⚠️ Could not delete ${branch}: ${error.message}`);
      }
    }

    console.log('✨ Branch cleanup complete!');
  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
    process.exit(1);
  }
}

cleanupBranches(); 