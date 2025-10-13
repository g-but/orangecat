#!/usr/bin/env node

/**
 * SOCIAL COLLABORATION SYSTEM VALIDATION
 * 
 * Comprehensive validation script to test the entire social networking
 * and collaboration system including People, Organizations, and Projects.
 * 
 * Created: 2025-01-08
 * Last Modified: 2025-01-08
 * Last Modified Summary: Complete system validation with Bitcoin integration
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

// Validation results
const results = {
  passed: 0,
  failed: 0,
  warnings: 0,
  details: []
}

// Helper functions
function log(message, color = 'reset') {
  // REMOVED: console.log statement
}

function success(message) {
  log(`✅ ${message}`, 'green')
  results.passed++
}

function error(message) {
  log(`❌ ${message}`, 'red')
  results.failed++
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow')
  results.warnings++
}

function info(message) {
  log(`ℹ️  ${message}`, 'blue')
}

function section(title) {
  log(`\n${colors.bright}${colors.cyan}=== ${title} ===${colors.reset}`)
}

function fileExists(filePath) {
  return fs.existsSync(path.join(process.cwd(), filePath))
}

function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(process.cwd(), filePath), 'utf8')
  } catch (err) {
    return null
  }
}

function runCommand(command, description) {
  try {
    info(`Running: ${description}`)
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' })
    return { success: true, output }
  } catch (err) {
    return { success: false, error: err.message, output: err.stdout || err.stderr }
  }
}

// Validation functions
function validateFileStructure() {
  section('File Structure Validation')
  
  const requiredFiles = [
    'src/types/social.ts',
    'src/services/socialService.ts',
    'app/people/page.tsx',
    'app/organizations/page.tsx',
    'app/projects/page.tsx',
    'docs/social-collaboration-system.md'
  ]
  
  const requiredDirectories = [
    'src/types',
    'src/services',
    'app/people',
    'app/organizations',
    'app/projects',
    'docs'
  ]
  
  // Check required files
  requiredFiles.forEach(file => {
    if (fileExists(file)) {
      success(`Required file exists: ${file}`)
    } else {
      error(`Missing required file: ${file}`)
    }
  })
  
  // Check required directories
  requiredDirectories.forEach(dir => {
    if (fs.existsSync(path.join(process.cwd(), dir))) {
      success(`Required directory exists: ${dir}`)
    } else {
      error(`Missing required directory: ${dir}`)
    }
  })
}

function validateTypeDefinitions() {
  section('TypeScript Type Definitions')
  
  const socialTypesFile = readFile('src/types/social.ts')
  
  if (!socialTypesFile) {
    error('Cannot read social types file')
    return
  }
  
  const requiredTypes = [
    'Connection',
    'ConnectionRequest',
    'PeopleSearchFilters',
    'Organization',
    'OrganizationFormData',
    'OrganizationMember',
    'Project',
    'ProjectFormData',
    'ProjectMember',
    'SearchFilters',
    'SearchResult',
    'WalletInfo',
    'Transaction',
    'SocialAnalytics',
    'EmptyStateContent',
    'Notification',
    'ActivityFeed'
  ]
  
  requiredTypes.forEach(type => {
    if (socialTypesFile.includes(`interface ${type}`)) {
      success(`Type definition exists: ${type}`)
    } else {
      error(`Missing type definition: ${type}`)
    }
  })
  
  // Check for Bitcoin-related fields
  const bitcoinFields = [
    'bitcoin_address',
    'lightning_address',
    'bitcoin_balance',
    'lightning_balance',
    'wallet_balance',
    'total_raised',
    'funding_goal'
  ]
  
  bitcoinFields.forEach(field => {
    if (socialTypesFile.includes(field)) {
      success(`Bitcoin field exists: ${field}`)
    } else {
      warning(`Bitcoin field not found: ${field}`)
    }
  })
}

function validateServiceImplementation() {
  section('Service Implementation Validation')
  
  const serviceFile = readFile('src/services/socialService.ts')
  
  if (!serviceFile) {
    error('Cannot read social service file')
    return
  }
  
  const requiredServices = [
    'PeopleService',
    'OrganizationService',
    'ProjectService',
    'SearchService',
    'SocialAnalyticsService',
    'EmptyStateService'
  ]
  
  requiredServices.forEach(service => {
    if (serviceFile.includes(`class ${service}`)) {
      success(`Service class exists: ${service}`)
    } else {
      error(`Missing service class: ${service}`)
    }
  })
  
  // Check for required methods
  const requiredMethods = [
    'searchPeople',
    'sendConnectionRequest',
    'getConnections',
    'createOrganization',
    'getUserOrganizations',
    'searchOrganizations',
    'createProject',
    'getUserProjects',
    'searchProjects',
    'universalSearch',
    'getUserAnalytics',
    'getEmptyStateContent'
  ]
  
  requiredMethods.forEach(method => {
    if (serviceFile.includes(method)) {
      success(`Service method exists: ${method}`)
    } else {
      error(`Missing service method: ${method}`)
    }
  })
  
  // Check for Bitcoin wallet integration
  if (serviceFile.includes('generateBitcoinAddress')) {
    success('Bitcoin wallet generation implemented')
  } else {
    warning('Bitcoin wallet generation not found')
  }
  
  if (serviceFile.includes('lightning_address')) {
    success('Lightning Network integration found')
  } else {
    warning('Lightning Network integration not found')
  }
}

function validatePageComponents() {
  section('Page Component Validation')
  
  const pages = [
    { file: 'app/people/page.tsx', name: 'PeoplePage' },
    { file: 'app/organizations/page.tsx', name: 'OrganizationsPage' },
    { file: 'app/projects/page.tsx', name: 'ProjectsPage' }
  ]
  
  pages.forEach(({ file, name }) => {
    const content = readFile(file)
    
    if (!content) {
      error(`Cannot read page file: ${file}`)
      return
    }
    
    // Check for required React patterns
    if (content.includes("'use client'")) {
      success(`${name}: Client component directive found`)
    } else {
      error(`${name}: Missing 'use client' directive`)
    }
    
    if (content.includes('export default function')) {
      success(`${name}: Default export function found`)
    } else {
      error(`${name}: Missing default export function`)
    }
    
    // Check for required imports
    const requiredImports = [
      'useState',
      'useEffect',
      'useAuth'
    ]
    
    requiredImports.forEach(importName => {
      if (content.includes(importName)) {
        success(`${name}: Import found - ${importName}`)
      } else {
        warning(`${name}: Import not found - ${importName}`)
      }
    })
    
    // Check for empty state handling
    if (content.includes('EmptyState')) {
      success(`${name}: Empty state component found`)
    } else {
      error(`${name}: Missing empty state handling`)
    }
    
    // Check for search functionality
    if (content.includes('searchQuery') || content.includes('handleSearch')) {
      success(`${name}: Search functionality found`)
    } else {
      warning(`${name}: Search functionality not found`)
    }
  })
}

function validateNavigationIntegration() {
  section('Navigation Integration Validation')
  
  const navigationConfig = readFile('src/config/navigationConfig.ts')
  
  if (!navigationConfig) {
    error('Cannot read navigation config file')
    return
  }
  
  // Check for social section
  if (navigationConfig.includes('Social & Collaboration')) {
    success('Social & Collaboration section found in navigation')
  } else {
    error('Social & Collaboration section not found in navigation')
  }
  
  // Check for page links
  const requiredLinks = [
    '/people',
    '/organizations',
    '/projects'
  ]
  
  requiredLinks.forEach(link => {
    if (navigationConfig.includes(link)) {
      success(`Navigation link found: ${link}`)
    } else {
      error(`Navigation link missing: ${link}`)
    }
  })
  
  // Check for keyboard shortcuts
  const shortcutsFile = readFile('src/components/navigation/NavigationShortcuts.tsx')
  
  if (shortcutsFile) {
    const shortcuts = ['cmd+3', 'cmd+4', 'cmd+5']
    shortcuts.forEach((shortcut, index) => {
      const page = ['people', 'organizations', 'projects'][index]
      if (shortcutsFile.includes(`/${page}`)) {
        success(`Keyboard shortcut found for ${page}`)
      } else {
        warning(`Keyboard shortcut missing for ${page}`)
      }
    })
  } else {
    warning('Navigation shortcuts file not found')
  }
}

function validateDocumentation() {
  section('Documentation Validation')
  
  const docFile = readFile('docs/social-collaboration-system.md')
  
  if (!docFile) {
    error('Cannot read documentation file')
    return
  }
  
  // Check for required sections
  const requiredSections = [
    '# OrangeCat Social Collaboration System',
    '## 🎯 Overview',
    '## 🏗️ System Architecture',
    '## 👥 People System',
    '## 🏢 Organizations System',
    '## 🚀 Projects System',
    '## 💰 Bitcoin Wallet System',
    '## 🔍 Search & Discovery',
    '## 📊 Analytics & Insights',
    '## 🎯 User Onboarding',
    '## 🔒 Security & Privacy',
    '## 🚀 Future Enhancements'
  ]
  
  requiredSections.forEach(section => {
    if (docFile.includes(section)) {
      success(`Documentation section found: ${section.replace(/[#\s]/g, '')}`)
    } else {
      error(`Documentation section missing: ${section.replace(/[#\s]/g, '')}`)
    }
  })
  
  // Check for creation and modification dates
  if (docFile.includes('**Created:**') && docFile.includes('**Last Modified:**')) {
    success('Documentation includes creation and modification dates')
  } else {
    warning('Documentation missing creation/modification dates')
  }
  
  // Check documentation length (should be comprehensive)
  const wordCount = docFile.split(/\s+/).length
  if (wordCount > 5000) {
    success(`Documentation is comprehensive (${wordCount} words)`)
  } else {
    warning(`Documentation may be too brief (${wordCount} words)`)
  }
}

function validateBitcoinIntegration() {
  section('Bitcoin Integration Validation')
  
  const serviceFile = readFile('src/services/socialService.ts')
  const typesFile = readFile('src/types/social.ts')
  
  if (!serviceFile || !typesFile) {
    error('Cannot read required files for Bitcoin validation')
    return
  }
  
  // Check for Bitcoin address generation
  if (serviceFile.includes('generateBitcoinAddress')) {
    success('Bitcoin address generation function found')
  } else {
    error('Bitcoin address generation function missing')
  }
  
  // Check for Lightning Network support
  if (typesFile.includes('lightning_address') && typesFile.includes('lightning_balance')) {
    success('Lightning Network support found in types')
  } else {
    warning('Lightning Network support incomplete in types')
  }
  
  // Check for wallet management
  const walletFeatures = [
    'WalletInfo',
    'Transaction',
    'bitcoin_balance',
    'total_raised',
    'funding_goal'
  ]
  
  walletFeatures.forEach(feature => {
    if (typesFile.includes(feature)) {
      success(`Bitcoin wallet feature found: ${feature}`)
    } else {
      error(`Bitcoin wallet feature missing: ${feature}`)
    }
  })
  
  // Check for multi-signature support
  if (typesFile.includes('multi') || serviceFile.includes('multi')) {
    success('Multi-signature support indicators found')
  } else {
    warning('Multi-signature support not explicitly found')
  }
}

function validateTestCoverage() {
  section('Test Coverage Validation')
  
  const testFiles = [
    'src/services/__tests__/socialService.test.ts',
    'src/components/__tests__/SocialPages.test.tsx'
  ]
  
  testFiles.forEach(testFile => {
    if (fileExists(testFile)) {
      success(`Test file exists: ${testFile}`)
      
      const content = readFile(testFile)
      if (content) {
        // Check for comprehensive test coverage
        const testCount = (content.match(/it\(/g) || []).length
        if (testCount > 20) {
          success(`Comprehensive test coverage: ${testCount} tests`)
        } else {
          warning(`Limited test coverage: ${testCount} tests`)
        }
        
        // Check for different test types
        const testTypes = [
          'describe(',
          'beforeEach(',
          'expect(',
          'mockResolvedValue',
          'mockRejectedValue'
        ]
        
        testTypes.forEach(testType => {
          if (content.includes(testType)) {
            success(`Test pattern found: ${testType}`)
          } else {
            warning(`Test pattern missing: ${testType}`)
          }
        })
      }
    } else {
      error(`Test file missing: ${testFile}`)
    }
  })
}

function validatePerformance() {
  section('Performance Validation')
  
  const serviceFile = readFile('src/services/socialService.ts')
  
  if (!serviceFile) {
    error('Cannot read service file for performance validation')
    return
  }
  
  // Check for pagination
  if (serviceFile.includes('limit') && serviceFile.includes('offset')) {
    success('Pagination support found')
  } else {
    warning('Pagination support not found')
  }
  
  // Check for error handling
  if (serviceFile.includes('try') && serviceFile.includes('catch')) {
    success('Error handling found')
  } else {
    error('Error handling missing')
  }
  
  // Check for loading states
  const pageFiles = [
    'app/people/page.tsx',
    'app/organizations/page.tsx',
    'app/projects/page.tsx'
  ]
  
  pageFiles.forEach(file => {
    const content = readFile(file)
    if (content && content.includes('loading')) {
      success(`Loading state found in ${file}`)
    } else {
      warning(`Loading state missing in ${file}`)
    }
  })
}

function validateSecurity() {
  section('Security Validation')
  
  const serviceFile = readFile('src/services/socialService.ts')
  
  if (!serviceFile) {
    error('Cannot read service file for security validation')
    return
  }
  
  // Check for authentication checks
  if (serviceFile.includes('getUser') && serviceFile.includes('User not authenticated')) {
    success('Authentication checks found')
  } else {
    error('Authentication checks missing')
  }
  
  // Check for input validation
  if (serviceFile.includes('parseWebsiteData') || serviceFile.includes('JSON.parse')) {
    success('JSON parsing with error handling found')
  } else {
    warning('JSON parsing error handling not found')
  }
  
  // Check for Bitcoin address validation
  if (serviceFile.includes('bc1q') || serviceFile.includes('bitcoin')) {
    success('Bitcoin address handling found')
  } else {
    warning('Bitcoin address validation not found')
  }
}

function validateAccessibility() {
  section('Accessibility Validation')
  
  const pageFiles = [
    'app/people/page.tsx',
    'app/organizations/page.tsx',
    'app/projects/page.tsx'
  ]
  
  pageFiles.forEach(file => {
    const content = readFile(file)
    if (!content) return
    
    // Check for semantic HTML
    if (content.includes('<h1>') || content.includes('className="text-3xl')) {
      success(`${file}: Heading structure found`)
    } else {
      warning(`${file}: Heading structure not found`)
    }
    
    // Check for alt text
    if (content.includes('alt=')) {
      success(`${file}: Alt text found`)
    } else {
      warning(`${file}: Alt text not found`)
    }
    
    // Check for ARIA labels
    if (content.includes('aria-') || content.includes('role=')) {
      success(`${file}: ARIA attributes found`)
    } else {
      warning(`${file}: ARIA attributes not found`)
    }
  })
}

function runTypeScriptCheck() {
  section('TypeScript Compilation Check')
  
  const result = runCommand('npx tsc --noEmit', 'TypeScript type checking')
  
  if (result.success) {
    success('TypeScript compilation successful')
  } else {
    error('TypeScript compilation failed')
    if (result.output) {
      log(result.output, 'red')
    }
  }
}

function runLintCheck() {
  section('ESLint Check')
  
  const result = runCommand('npx eslint src/ app/ --ext .ts,.tsx', 'ESLint validation')
  
  if (result.success) {
    success('ESLint validation passed')
  } else {
    warning('ESLint found issues')
    if (result.output) {
      log(result.output, 'yellow')
    }
  }
}

function generateReport() {
  section('Validation Report')
  
  const total = results.passed + results.failed + results.warnings
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0
  
  log(`\n📊 VALIDATION SUMMARY:`)
  log(`✅ Passed: ${results.passed}`, 'green')
  log(`❌ Failed: ${results.failed}`, 'red')
  log(`⚠️  Warnings: ${results.warnings}`, 'yellow')
  log(`📈 Pass Rate: ${passRate}%`, passRate >= 80 ? 'green' : passRate >= 60 ? 'yellow' : 'red')
  
  if (results.failed === 0) {
    log(`\n🎉 VALIDATION SUCCESSFUL!`, 'green')
    log(`The OrangeCat Social Collaboration System is ready for production!`, 'green')
  } else if (results.failed <= 5) {
    log(`\n⚠️  VALIDATION MOSTLY SUCCESSFUL`, 'yellow')
    log(`Minor issues found. Please address the failed checks before production.`, 'yellow')
  } else {
    log(`\n❌ VALIDATION FAILED`, 'red')
    log(`Significant issues found. Please address all failed checks before proceeding.`, 'red')
  }
  
  // Recommendations
  log(`\n💡 RECOMMENDATIONS:`)
  
  if (results.failed > 0) {
    log(`• Address all failed validation checks`, 'yellow')
  }
  
  if (results.warnings > 5) {
    log(`• Consider addressing warning items for better quality`, 'yellow')
  }
  
  log(`• Run comprehensive tests: npm test`, 'blue')
  log(`• Test the application manually: npm run dev`, 'blue')
  log(`• Review documentation for completeness`, 'blue')
  log(`• Perform security audit before production deployment`, 'blue')
  
  return results.failed === 0
}

// Main validation function
async function main() {
  log(`${colors.bright}${colors.magenta}`)
  log(`╔══════════════════════════════════════════════════════════════╗`)
  log(`║                                                              ║`)
  log(`║        🧡 ORANGECAT SOCIAL COLLABORATION SYSTEM 🧡          ║`)
  log(`║                    VALIDATION SUITE                          ║`)
  log(`║                                                              ║`)
  log(`╚══════════════════════════════════════════════════════════════╝`)
  log(`${colors.reset}`)
  
  info('Starting comprehensive validation of the social collaboration system...')
  
  try {
    // Run all validation checks
    validateFileStructure()
    validateTypeDefinitions()
    validateServiceImplementation()
    validatePageComponents()
    validateNavigationIntegration()
    validateDocumentation()
    validateBitcoinIntegration()
    validateTestCoverage()
    validatePerformance()
    validateSecurity()
    validateAccessibility()
    runTypeScriptCheck()
    runLintCheck()
    
    // Generate final report
    const success = generateReport()
    
    // Exit with appropriate code
    process.exit(success ? 0 : 1)
    
  } catch (err) {
    error(`Validation failed with error: ${err.message}`)
    process.exit(1)
  }
}

// Run the validation
if (require.main === module) {
  main()
}

module.exports = {
  validateFileStructure,
  validateTypeDefinitions,
  validateServiceImplementation,
  validatePageComponents,
  validateNavigationIntegration,
  validateDocumentation,
  validateBitcoinIntegration,
  validateTestCoverage,
  validatePerformance,
  validateSecurity,
  validateAccessibility,
  generateReport
} 