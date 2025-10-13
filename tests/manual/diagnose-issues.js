/**
 * Comprehensive Diagnostic Script for OrangeCat Authentication System
 *
 * Identifies and diagnoses issues with:
 * - CSS and design loading
 * - Component rendering
 * - Server-side issues
 * - Dependency problems
 * - Configuration issues
 */

const fs = require('fs');
const path = require('path');

function diagnoseIssues() {
  console.log('🔍 Starting Comprehensive OrangeCat Diagnostic...\n');

  const issues = [];
  const warnings = [];
  const recommendations = [];

  // 1. Check package.json for dependency issues
  console.log('📦 1. Checking package.json and dependencies...');
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const nextVersion = packageJson.dependencies?.next;
    const reactVersion = packageJson.dependencies?.react;

    if (!nextVersion) {
      issues.push('❌ Next.js not found in dependencies');
    } else {
      console.log(`✅ Next.js version: ${nextVersion}`);
    }

    if (!reactVersion) {
      issues.push('❌ React not found in dependencies');
    } else {
      console.log(`✅ React version: ${reactVersion}`);
    }

    // Check for conflicting versions
    if (nextVersion && reactVersion) {
      if (nextVersion.includes('19') && reactVersion.includes('18')) {
        warnings.push('⚠️ Version mismatch: Next.js 19 with React 18 - this may cause issues');
      }
    }
  } catch (error) {
    issues.push(`❌ Error reading package.json: ${error.message}`);
  }

  // 2. Check for environment variables
  console.log('\n🔧 2. Checking environment configuration...');
  const envFiles = ['.env.local', '.env', '.env.example'];
  envFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ Environment file found: ${file}`);
    } else {
      warnings.push(`⚠️ Environment file missing: ${file}`);
    }
  });

  // 3. Check Next.js configuration
  console.log('\n⚙️ 3. Checking Next.js configuration...');
  const configFiles = ['next.config.js', 'next.config.ts', 'tailwind.config.js', 'tailwind.config.ts'];
  configFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ Config file found: ${file}`);
    } else {
      warnings.push(`⚠️ Config file missing: ${file}`);
    }
  });

  // 4. Check for build artifacts
  console.log('\n🏗️ 4. Checking build artifacts...');
  if (fs.existsSync('.next')) {
    console.log('✅ .next build directory exists');

    // Check if build is recent
    const buildTime = fs.statSync('.next').mtime;
    const hoursSinceBuild = (Date.now() - buildTime.getTime()) / (1000 * 60 * 60);

    if (hoursSinceBuild > 24) {
      warnings.push('⚠️ Build artifacts are older than 24 hours - consider rebuilding');
    } else {
      console.log('✅ Build artifacts are recent');
    }
  } else {
    issues.push('❌ .next build directory missing - application needs to be built');
  }

  // 5. Check source code structure
  console.log('\n📁 5. Checking source code structure...');
  const requiredDirs = ['src/app', 'src/components', 'src/lib'];
  requiredDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`✅ Directory exists: ${dir}`);
    } else {
      warnings.push(`⚠️ Directory missing: ${dir}`);
    }
  });

  // 6. Check for common CSS/design files
  console.log('\n🎨 6. Checking CSS and design files...');
  const styleFiles = [
    'src/app/globals.css',
    'src/styles/globals.css',
    'tailwind.config.js',
    'postcss.config.js'
  ];

  styleFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ Style file found: ${file}`);
    } else {
      warnings.push(`⚠️ Style file missing: ${file}`);
    }
  });

  // 7. Check for authentication components
  console.log('\n🔐 7. Checking authentication components...');
  const authFiles = [
    'src/app/auth/page.tsx',
    'src/components/ui/Button.tsx',
    'src/components/ui/Input.tsx',
    'src/hooks/useAuth.ts'
  ];

  authFiles.forEach(file => {
    if (fs.existsSync(file)) {
      console.log(`✅ Auth component found: ${file}`);
    } else {
      warnings.push(`⚠️ Auth component missing: ${file}`);
    }
  });

  // 8. Check for TypeScript configuration
  console.log('\n📝 8. Checking TypeScript configuration...');
  if (fs.existsSync('tsconfig.json')) {
    console.log('✅ TypeScript configuration found');
  } else {
    issues.push('❌ TypeScript configuration missing - tsconfig.json not found');
  }

  // 9. Check node_modules integrity
  console.log('\n📦 9. Checking node_modules integrity...');
  if (fs.existsSync('node_modules')) {
    console.log('✅ node_modules directory exists');

    // Check for critical dependencies
    const criticalDeps = ['next', 'react', 'react-dom', 'typescript'];
    criticalDeps.forEach(dep => {
      const depPath = `node_modules/${dep}`;
      if (fs.existsSync(depPath)) {
        console.log(`✅ Critical dependency found: ${dep}`);
      } else {
        issues.push(`❌ Critical dependency missing: ${dep}`);
      }
    });
  } else {
    issues.push('❌ node_modules directory missing - run npm install');
  }

  // 10. Check for lockfile
  console.log('\n🔒 10. Checking lockfile...');
  if (fs.existsSync('package-lock.json')) {
    console.log('✅ package-lock.json found');
  } else if (fs.existsSync('yarn.lock')) {
    console.log('✅ yarn.lock found');
  } else if (fs.existsSync('pnpm-lock.yaml')) {
    console.log('✅ pnpm-lock.yaml found');
  } else {
    warnings.push('⚠️ No lockfile found - dependency versions may not be consistent');
  }

  // Summary
  console.log('\n📊 DIAGNOSTIC SUMMARY:');
  console.log('═══════════════════════════════════');

  if (issues.length === 0) {
    console.log('🎉 No critical issues found!');
  } else {
    console.log(`❌ ${issues.length} CRITICAL ISSUES FOUND:`);
    issues.forEach((issue, index) => {
      console.log(`   ${index + 1}. ${issue}`);
    });
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️ ${warnings.length} WARNINGS:`);
    warnings.forEach((warning, index) => {
      console.log(`   ${index + 1}. ${warning}`);
    });
  }

  if (recommendations.length > 0) {
    console.log(`\n💡 RECOMMENDATIONS:`);
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`);
    });
  }

  console.log('\n🔧 SUGGESTED FIXES:');

  if (issues.some(issue => issue.includes('dependencies'))) {
    console.log('   • Run: npm install --legacy-peer-deps');
  }

  if (issues.some(issue => issue.includes('build'))) {
    console.log('   • Run: npm run build');
  }

  if (issues.some(issue => issue.includes('Next.js'))) {
    console.log('   • Check Next.js installation: npm list next');
    console.log('   • Try reinstalling Next.js: npm uninstall next && npm install next@latest --legacy-peer-deps');
  }

  if (warnings.some(warning => warning.includes('config'))) {
    console.log('   • Check configuration files for syntax errors');
  }

  if (warnings.some(warning => warning.includes('env'))) {
    console.log('   • Ensure environment variables are properly configured');
  }

  return { issues, warnings, recommendations };
}

// Run the diagnostic
const results = diagnoseIssues();

if (results.issues.length > 0) {
  console.log('\n❌ Critical issues must be resolved before the application can run properly.');
  process.exit(1);
} else {
  console.log('\n✅ No critical issues found. The application should be able to run.');
  console.log('💡 Consider addressing warnings for optimal performance.');
  process.exit(0);
}

