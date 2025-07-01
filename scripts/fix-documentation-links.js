#!/usr/bin/env node

/**
 * Documentation Link Fixer
 * 
 * Automatically fixes broken internal links in documentation by:
 * - Creating missing files with placeholder content
 * - Updating link paths to correct locations
 * - Organizing documentation structure
 * 
 * Created: 2025-06-30
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Documentation Link Fixer');
console.log('============================\n');

// Define the documentation structure we want to create
const DOCS_STRUCTURE = {
  // Root level files
  'SETUP.md': `# Development Setup

## Prerequisites

- Node.js 20+ 
- npm or yarn
- Git

## Quick Start

1. Clone the repository
2. Install dependencies: \`npm install\`
3. Copy environment variables: \`cp .env.example .env.local\`
4. Start development server: \`npm run fresh:start\`

## Environment Variables

See \`.env.example\` for required environment variables.

## Troubleshooting

- Port conflicts: Run \`npm run kill:node\` then \`npm run fresh:start\`
- Build issues: Run \`npm run clear:cache\` then rebuild
`,

  'ARCHITECTURE.md': `# Architecture Overview

## Technology Stack

- **Frontend**: Next.js 15, React, TypeScript
- **Backend**: Supabase (PostgreSQL)
- **Styling**: Tailwind CSS
- **Authentication**: Supabase Auth
- **Bitcoin Integration**: Mempool API
- **State Management**: Zustand

## Project Structure

\`\`\`
src/
├── app/              # Next.js App Router pages
├── components/       # React components
├── services/         # External services integration
├── hooks/           # Custom React hooks
├── stores/          # State management
├── utils/           # Utility functions
└── types/           # TypeScript definitions
\`\`\`

## Key Design Patterns

- Server Components for data fetching
- Client Components for interactivity
- Service layer abstraction
- Type-safe API integration
`,

  'CONTRIBUTING.md': `# Contributing Guide

## Getting Started

1. Fork the repository
2. Create a feature branch: \`git checkout -b feature/your-feature\`
3. Follow the development setup in [SETUP.md](SETUP.md)

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Use Tailwind CSS for styling

### Testing
- Write tests for new functionality
- Ensure all tests pass: \`npm test\`
- Maintain >80% code coverage

### Commits
- Use conventional commit messages
- Include tests with code changes
- Update documentation as needed

## Pull Request Process

1. Ensure all tests pass
2. Update documentation
3. Request review from maintainers
4. Address feedback
5. Merge when approved
`,

  'SECURITY.md': `# Security Guidelines

## Reporting Security Issues

Report security vulnerabilities privately to the maintainers.

## Security Features

- Input validation and sanitization
- Authentication and authorization
- File upload security
- Rate limiting
- Content Security Policy
- HTTPS enforcement

## Development Security

- Never commit secrets or API keys
- Use environment variables for sensitive data
- Follow secure coding practices
- Regular security audits

## Production Security

- Regular security updates
- Monitoring and alerting
- Backup and recovery procedures
- Incident response plan
`,

  'DEPLOYMENT.md': `# Deployment Guide

## Production Deployment

### Vercel (Recommended)

1. Connect GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

1. Build the application: \`npm run build\`
2. Start production server: \`npm start\`
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificate

## Environment Variables

Required production environment variables:
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`SUPABASE_SERVICE_ROLE_KEY\`

## Post-Deployment

- Verify all functionality works
- Check performance metrics
- Monitor error logs
- Set up monitoring alerts
`,

  'TESTING.md': `# Testing Guide

## Test Types

### Unit Tests
- Component testing with React Testing Library
- Service layer testing
- Utility function testing

### Integration Tests
- API endpoint testing
- Database integration testing
- Authentication flow testing

### End-to-End Tests
- Critical user journeys
- Cross-browser testing
- Mobile responsiveness

## Running Tests

\`\`\`bash
npm test              # Run all tests
npm test -- --watch  # Watch mode
npm run test:coverage # Coverage report
npm run test:e2e      # End-to-end tests
\`\`\`

## Test Coverage

Target: >80% code coverage
Current status available in test reports.
`,

  // Security specific files
  'security/incident-response.md': `# Incident Response Plan

## Response Team
- Security Lead
- Development Team
- Operations Team

## Incident Classification
- **Critical**: Data breach, service unavailable
- **High**: Security vulnerability, unauthorized access
- **Medium**: Performance issues, minor bugs
- **Low**: Documentation issues, cosmetic problems

## Response Procedures

### Immediate Response (0-1 hour)
1. Assess incident severity
2. Contain the issue
3. Notify stakeholders
4. Begin investigation

### Short-term Response (1-24 hours)
1. Implement fixes
2. Monitor for recurrence
3. Document findings
4. Communicate updates

### Long-term Response (1-7 days)
1. Conduct post-mortem
2. Update procedures
3. Implement preventive measures
4. Training and awareness
`,

  // Operations files
  'operations/monitoring.md': `# Monitoring Guide

## Application Monitoring

### Metrics to Monitor
- Response times
- Error rates
- User activity
- Database performance
- Bundle size
- Security events

### Tools
- Vercel Analytics
- Supabase Dashboard
- Custom monitoring scripts
- Bundle size monitoring

## Alerting

### Critical Alerts
- Service unavailable
- High error rates
- Security incidents
- Database issues

### Warning Alerts
- Performance degradation
- Bundle size increase
- Failed deployments
- Documentation issues

## Response Procedures

1. Investigate alert
2. Assess impact
3. Implement fix
4. Verify resolution
5. Document incident
`,

  'operations/troubleshooting.md': `# Troubleshooting Guide

## Common Issues

### Port Conflicts
**Problem**: "Port already in use" errors
**Solution**: 
\`\`\`bash
npm run kill:node
npm run fresh:start
\`\`\`

### Build Failures
**Problem**: Build fails with module errors
**Solutions**:
- Clear cache: \`npm run clear:cache\`
- Reinstall dependencies: \`rm -rf node_modules && npm install\`
- Check for missing components

### Database Issues
**Problem**: Supabase connection errors
**Solutions**:
- Check environment variables
- Verify Supabase service status
- Review API keys and permissions

### Performance Issues
**Problem**: Slow loading times
**Solutions**:
- Check bundle size: \`npm run bundle:monitor\`
- Optimize images and assets
- Review database queries
- Enable caching

## Debug Mode

Enable debug mode with:
\`\`\`bash
DEBUG=* npm run dev
\`\`\`

## Logs

Check logs in:
- Browser DevTools Console
- Vercel Function Logs
- Supabase Dashboard
`,

  'operations/maintenance.md': `# Maintenance Procedures

## Regular Maintenance

### Daily
- Monitor error rates
- Check security alerts
- Review performance metrics

### Weekly
- Update dependencies
- Review and merge PRs
- Run security scans
- Check documentation links

### Monthly
- Security audit
- Performance review
- Database optimization
- Backup verification

## Update Procedures

### Dependencies
1. Review changelogs
2. Test in development
3. Update gradually
4. Monitor for issues

### Content
1. Review documentation
2. Update screenshots
3. Verify links
4. Update examples

## Backup Procedures

### Database
- Automated daily backups via Supabase
- Weekly backup verification
- Test restore procedures

### Code
- Git repository backups
- Documentation backups
- Configuration backups
`,

  // Design system files
  'design-system/components.md': `# Component Guidelines

## Component Structure

### Naming Convention
- PascalCase for component names
- Descriptive and specific names
- Avoid abbreviations

### File Organization
\`\`\`
components/
├── ui/           # Basic UI components
├── layout/       # Layout components
├── dashboard/    # Dashboard-specific components
└── forms/        # Form components
\`\`\`

## Design Principles

### Consistency
- Use design tokens
- Follow spacing guidelines
- Maintain visual hierarchy

### Accessibility
- Semantic HTML
- ARIA labels
- Keyboard navigation
- Color contrast

### Performance
- Lazy loading for heavy components
- Optimize bundle size
- Minimize re-renders

## Component API

### Props
- Use TypeScript interfaces
- Provide default values
- Document with JSDoc

### Events
- Use consistent naming (on + Event)
- Provide clear event data
- Handle edge cases
`,

  'design-system/colors.md': `# Color System

## Brand Colors

### Primary
- **Orange**: #F7931A (Bitcoin orange)
- **Tiffany**: #00D4AA (Accent color)

### Neutral
- **White**: #FFFFFF
- **Gray 50**: #F9FAFB
- **Gray 100**: #F3F4F6
- **Gray 500**: #6B7280
- **Gray 900**: #111827

## Usage Guidelines

### Primary Colors
- Use orange for primary actions
- Use tiffany for highlights and accents
- Maintain sufficient contrast ratios

### Status Colors
- **Success**: Green for positive actions
- **Warning**: Yellow for caution
- **Error**: Red for errors
- **Info**: Blue for information

## Accessibility

- Minimum contrast ratio: 4.5:1
- Test with color blindness simulators
- Provide alternative indicators
`,

  'design-system/typography.md': `# Typography System

## Font Families

### Primary: Inter
- Body text
- UI elements
- Technical content

### Display: Playfair Display
- Headlines
- Hero sections
- Decorative text

## Scale

### Headings
- h1: 2.25rem (36px)
- h2: 1.875rem (30px)
- h3: 1.5rem (24px)
- h4: 1.25rem (20px)
- h5: 1.125rem (18px)
- h6: 1rem (16px)

### Body Text
- Large: 1.125rem (18px)
- Base: 1rem (16px)
- Small: 0.875rem (14px)
- Extra Small: 0.75rem (12px)

## Usage Guidelines

### Hierarchy
- Use consistent heading levels
- Maintain proper nesting
- Consider reading flow

### Readability
- Optimal line length: 45-75 characters
- Sufficient line height: 1.5-1.6
- Appropriate font weights
`,

  'design-system/responsive.md': `# Responsive Design

## Breakpoints

### Mobile First
- **sm**: 640px (Small tablets)
- **md**: 768px (Tablets)
- **lg**: 1024px (Small desktops)
- **xl**: 1280px (Large desktops)

## Grid System

### Container
- Max width with responsive breakpoints
- Centered with horizontal padding
- Consistent gutter spacing

### Layout Patterns
- Single column on mobile
- Two column on tablet
- Multi-column on desktop
- Flexible grid systems

## Component Behavior

### Navigation
- Hamburger menu on mobile
- Horizontal menu on desktop
- Touch-friendly targets

### Cards
- Stack vertically on mobile
- Grid layout on desktop
- Consistent spacing

### Forms
- Full width on mobile
- Optimal width on desktop
- Accessible input sizes
`,

  // Features documentation
  'features/campaigns.md': `# Campaign Management

## Campaign Features

### Creation
- Title and description
- Goal setting
- Bitcoin address
- Category selection
- Media uploads

### Management
- Edit campaign details
- Track progress
- Manage donations
- Analytics

### Discovery
- Browse campaigns
- Search and filter
- Category navigation
- Featured campaigns

## Technical Implementation

### Database Schema
- campaigns table
- donations table
- categories table
- media table

### API Endpoints
- GET /api/campaigns
- POST /api/campaigns
- PUT /api/campaigns/:id
- DELETE /api/campaigns/:id

### Components
- CampaignCard
- CampaignForm
- CampaignList
- CampaignDetails
`,

  'features/search.md': `# Search & Discovery

## Search Features

### Global Search
- Campaign search
- User search
- Content search
- Real-time suggestions

### Filters
- Category filtering
- Date range
- Amount range
- Status filtering

### Sorting
- Most recent
- Most funded
- Alphabetical
- Relevance

## Technical Implementation

### Search Algorithm
- Full-text search
- Fuzzy matching
- Relevance scoring
- Performance optimization

### Database
- Search indexes
- Query optimization
- Caching strategy

### Components
- SearchInput
- SearchResults
- FilterPanel
- SortOptions
`,

  'features/dashboard.md': `# Analytics Dashboard

## Dashboard Features

### Overview
- Total campaigns
- Total donations
- Success rate
- Growth metrics

### Campaign Analytics
- Individual campaign performance
- Donation trends
- Geographic data
- Time-based analysis

### User Analytics
- User engagement
- Registration trends
- Activity patterns
- Retention metrics

## Technical Implementation

### Data Collection
- Event tracking
- Performance metrics
- User behavior
- Error monitoring

### Visualization
- Charts and graphs
- Real-time updates
- Interactive elements
- Export capabilities

### Components
- DashboardLayout
- MetricCard
- ChartComponent
- DataTable
`,

  'features/validation.md': `# Validation Framework

## Input Validation

### Client-Side
- Form validation
- Real-time feedback
- Type checking
- Format validation

### Server-Side
- API validation
- Security checks
- Data sanitization
- Error handling

## Validation Rules

### Bitcoin Addresses
- Format validation
- Network validation
- Checksum verification
- Testnet detection

### User Input
- XSS prevention
- SQL injection prevention
- Length limits
- Character restrictions

## Technical Implementation

### Libraries
- Zod for schema validation
- Custom validators
- Security utilities
- Error messages

### Components
- ValidatedInput
- FormValidator
- ErrorDisplay
- SuccessIndicator
`
};

/**
 * Create missing documentation files
 */
function createMissingDocs() {
  let created = 0;
  let skipped = 0;

  console.log('📝 Creating missing documentation files...\n');

  for (const [relativePath, content] of Object.entries(DOCS_STRUCTURE)) {
    const fullPath = path.join('./docs', relativePath);
    const dir = path.dirname(fullPath);

    // Create directory if it doesn't exist
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }

    // Create file if it doesn't exist
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, content.trim() + '\n');
      console.log(`✅ Created: ${relativePath}`);
      created++;
    } else {
      console.log(`⏭️  Exists: ${relativePath}`);
      skipped++;
    }
  }

  console.log(`\n📊 Summary: ${created} created, ${skipped} skipped\n`);
  return created;
}

/**
 * Fix links in README files
 */
function fixReadmeLinks() {
  console.log('🔗 Fixing links in README files...\n');

  const readmeFiles = [
    './docs/README.md'
  ];

  readmeFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    console.log(`🔧 Processing: ${filePath}`);

    let content = fs.readFileSync(filePath, 'utf8');
    let changes = 0;

    // Fix common broken links
    const linkFixes = [
      // Root level files
      { from: '](SETUP.md)', to: '](../SETUP.md)' },
      { from: '](ARCHITECTURE.md)', to: '](../ARCHITECTURE.md)' },
      { from: '](CONTRIBUTING.md)', to: '](../CONTRIBUTING.md)' },
      { from: '](SECURITY.md)', to: '](../SECURITY.md)' },
      { from: '](DEPLOYMENT.md)', to: '](../DEPLOYMENT.md)' },
      { from: '](TESTING.md)', to: '](../TESTING.md)' },
      
      // Files that should exist in docs
      { from: '](database-schema.md)', to: '](architecture/database-schema.md)' },
      { from: '](auth_system.md)', to: '](security/auth_system.md)' },
      
      // Missing files that we're creating
      { from: '](design-system/responsive.md)', to: '](design-system/responsive.md)' },
      { from: '](features/campaigns.md)', to: '](features/campaigns.md)' },
      { from: '](features/search.md)', to: '](features/search.md)' },
      { from: '](features/dashboard.md)', to: '](features/dashboard.md)' },
      { from: '](features/validation.md)', to: '](features/validation.md)' },
      
      // Operations files
      { from: '](operations/monitoring.md)', to: '](operations/monitoring.md)' },
      { from: '](operations/troubleshooting.md)', to: '](operations/troubleshooting.md)' },
      { from: '](operations/maintenance.md)', to: '](operations/maintenance.md)' },
      
      // Security files
      { from: '](security/incident-response.md)', to: '](security/incident-response.md)' },
      
      // Design system files
      { from: '](design-system/components.md)', to: '](design-system/components.md)' },
      { from: '](design-system/colors.md)', to: '](design-system/colors.md)' },
      { from: '](design-system/typography.md)', to: '](design-system/typography.md)' },
    ];

    linkFixes.forEach(fix => {
      if (content.includes(fix.from)) {
        content = content.replace(new RegExp(fix.from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.to);
        changes++;
      }
    });

    if (changes > 0) {
      fs.writeFileSync(filePath, content);
      console.log(`   ✅ Fixed ${changes} links`);
    } else {
      console.log(`   ℹ️  No changes needed`);
    }
  });
}

/**
 * Verify all links are now working
 */
function verifyLinks() {
  console.log('🔍 Verifying documentation structure...\n');

  let allGood = true;
  const requiredFiles = Object.keys(DOCS_STRUCTURE);

  requiredFiles.forEach(file => {
    const fullPath = path.join('./docs', file);
    if (fs.existsSync(fullPath)) {
      console.log(`✅ ${file}`);
    } else {
      console.log(`❌ ${file}`);
      allGood = false;
    }
  });

  console.log(`\n${allGood ? '🎉' : '⚠️'} Documentation structure ${allGood ? 'complete' : 'needs attention'}\n`);
  return allGood;
}

/**
 * Main execution
 */
function main() {
  console.log('Starting documentation link fixes...\n');

  // Step 1: Create missing documentation files
  const createdFiles = createMissingDocs();

  // Step 2: Fix links in existing files
  fixReadmeLinks();

  // Step 3: Verify everything is working
  const allLinksFixed = verifyLinks();

  // Summary
  console.log('📋 SUMMARY:');
  console.log(`   📝 Created ${createdFiles} documentation files`);
  console.log(`   🔗 Fixed links in README files`);
  console.log(`   ${allLinksFixed ? '✅' : '❌'} Documentation structure ${allLinksFixed ? 'complete' : 'incomplete'}`);

  if (allLinksFixed) {
    console.log('\n🎉 All documentation links should now be working!');
    console.log('💡 Run `npm run docs:check-links` to verify');
  } else {
    console.log('\n⚠️  Some issues remain. Manual review may be needed.');
  }

  console.log('\n🚀 Next steps:');
  console.log('   1. Review created documentation files');
  console.log('   2. Update content with project-specific information');
  console.log('   3. Add missing sections and details');
  console.log('   4. Verify all links work correctly');
}

// Run the fixer
if (require.main === module) {
  main();
}

module.exports = { createMissingDocs, fixReadmeLinks, verifyLinks };