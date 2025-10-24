---
created_date: 2025-09-25
last_modified_date: 2025-09-25
last_modified_summary: Created comprehensive codebase organization guide reflecting the cleaned up project structure
---

# 📁 Codebase Organization

## Overview

This document describes the organization and structure of the OrangeCat codebase after a comprehensive cleanup and reorganization. The structure follows industry best practices for maintainability, scalability, and developer experience.

---

## 🏗️ Project Root Structure

```
orangecat/
├── 📁 src/                    # Main source code
├── 📁 scripts/                # Organized utility scripts
│   ├── 📁 db/                # Database operations
│   ├── 📁 deployment/        # Deployment utilities
│   ├── 📁 dev/               # Development tools
│   ├── 📁 test/              # Testing utilities
│   └── 📁 maintenance/       # Cleanup and optimization
├── 📁 tests/                 # All test files (unified structure)
├── 📁 docs/                  # Comprehensive documentation
├── 📁 public/                # Static assets
├── 📁 supabase/              # Supabase configuration
├── 📁 __mocks__/             # Jest mocks for testing
├── 📁 coverage/              # Test coverage reports
└── 📄 Standard config files  # package.json, tsconfig.json, etc.
```

---

## 📁 Source Code Structure (src/)

### Core Architecture

```
src/
├── 📁 app/                   # Next.js 13+ App Router
│   ├── 📁 api/              # API routes (Next.js)
│   ├── 📁 (authenticated)/  # Protected routes
│   └── 📁 auth/             # Authentication pages
├── 📁 components/           # React components
│   ├── 📁 auth/            # Authentication components
│   ├── 📁 bitcoin/         # Bitcoin-related components
│   ├── 📁 dashboard/       # Dashboard components
│   ├── 📁 funding/         # Funding components
│   ├── 📁 layout/          # Layout components
│   ├── 📁 ui/              # Reusable UI components
│   └── 📁 __tests__/       # Component tests
├── 📁 services/            # Business logic services
│   ├── 📁 profile/         # Profile management
│   ├── 📁 supabase/        # Supabase services
│   ├── 📁 bitcoin/         # Bitcoin services
│   ├── 📁 projects/       # Campaign services
│   └── 📁 __tests__/       # Service tests
├── 📁 hooks/              # Custom React hooks
│   └── 📁 __tests__/       # Hook tests
├── 📁 lib/                # Utility libraries
├── 📁 stores/             # State management (Zustand)
│   └── 📁 __tests__/       # Store tests
├── 📁 utils/              # Utility functions
│   └── 📁 __tests__/       # Utility tests
├── 📁 types/              # TypeScript type definitions
├── 📁 config/             # Configuration files
├── 📁 middleware/         # Next.js middleware
└── 📄 profileService.ts   # Re-export for clean imports
```

### Architecture Principles

1. **Feature-Based Organization**: Components and services are organized by business domain
2. **Separation of Concerns**: Clear separation between UI, business logic, and utilities
3. **Testing Colocation**: Tests are located alongside the code they test
4. **Clean Imports**: Use of path aliases (@/) for clean, consistent imports

---

## 📁 Scripts Organization

The scripts directory is organized by purpose for easy maintenance:

### Database Scripts (scripts/db/)
- Schema management and migrations
- Profile creation and management
- Data validation and cleanup
- Supabase configuration

### Deployment Scripts (scripts/deployment/)
- Production deployment utilities
- Environment setup
- Deployment verification
- Monitoring and validation

### Development Scripts (scripts/dev/)
- Development server management
- API key management
- Environment synchronization
- Development utilities

### Testing Scripts (scripts/test/)
- Test execution utilities
- Test data generation
- Test environment setup

### Maintenance Scripts (scripts/maintenance/)
- Bundle analysis and optimization
- Console log cleanup
- Performance monitoring
- Code quality checks

---

## 📁 Testing Structure

All tests are unified under the `tests/` directory:

```
tests/
├── 📁 auth/              # Authentication tests
├── 📁 security/          # Security tests
├── 📁 e2e/              # End-to-end tests
├── 📁 setup/            # Test setup utilities
├── 📄 setup.ts          # Global test setup
├── 📄 teardown.ts       # Global test teardown
└── 📄 utils.ts          # Test utilities
```

### Test Categories
- **Unit Tests**: Located in `__tests__/` subdirectories within each feature
- **Integration Tests**: Located alongside the code they test
- **E2E Tests**: In `tests/e2e/` directory
- **Security Tests**: In `tests/security/` directory

---

## 📁 Documentation Structure

Comprehensive documentation organized by purpose:

```
docs/
├── 📄 README.md                 # Main documentation entry point
├── 📁 architecture/            # System architecture
├── 📁 development/             # Development guides
├── 📁 operations/              # Deployment and operations
├── 📁 security/                # Security documentation
├── 📁 design-system/           # UI/UX design system
├── 📁 components/              # Component documentation
├── 📁 features/                # Feature documentation
├── 📁 api/                     # API documentation
└── 📁 templates/               # Documentation templates
```

---

## 📁 Configuration Files

### Consolidated Configuration
- **jest.config.js**: Advanced Jest configuration with coverage thresholds
- **jest.setup.ts**: Comprehensive test environment setup
- **tsconfig.json**: TypeScript configuration with path mapping
- **next.config.js**: Next.js configuration
- **tailwind.config.ts**: Tailwind CSS configuration

### Configuration Principles
1. **Single Source of Truth**: No duplicate configuration files
2. **Environment-Specific**: Proper separation of dev/prod configs
3. **Type Safety**: Full TypeScript support for configuration
4. **Performance**: Optimized for development and production

---

## 🧹 Code Quality Standards

### Import Strategy
- Use path aliases (`@/`) for all internal imports
- Avoid relative imports (`../../../`) when possible
- Group imports by type (external, internal, relative)
- Use index files for clean public APIs

### File Organization
- One component per file (except for tightly coupled components)
- Single responsibility principle for all modules
- Consistent naming conventions (kebab-case for files, PascalCase for components)
- Proper TypeScript typing throughout

### Code Style
- ESLint + Prettier for consistent formatting
- TypeScript strict mode enabled
- No `any` types (except in rare, well-documented cases)
- Comprehensive error handling

---

## 🚀 Development Workflow

### Getting Started
1. **Setup**: Follow the [Development Setup](../../SETUP.md) guide
2. **Environment**: Copy `config/production.env.template` to `.env.local`
3. **Dependencies**: Run `npm install`
4. **Development**: Use `npm run dev` for development server

### Code Organization Guidelines
1. **New Features**: Create feature branch with descriptive name
2. **File Placement**: Follow the established directory structure
3. **Tests**: Write tests alongside new code
4. **Documentation**: Update relevant documentation
5. **Reviews**: Follow the contributing guidelines

### Best Practices
- Keep files under 400 lines when possible
- Use feature flags for experimental features
- Implement proper error boundaries
- Follow accessibility guidelines
- Maintain performance budgets

---

## 🔍 Finding Files

### Quick Navigation
- **Components**: `src/components/[feature]/`
- **Services**: `src/services/[domain]/`
- **Types**: `src/types/[domain].ts`
- **Tests**: `src/[module]/__tests__/` or `tests/[category]/`
- **Documentation**: `docs/[category]/[topic].md`

### Search Strategy
1. Use IDE search for exact file names
2. Check feature directories for related functionality
3. Look in `docs/` for documentation
4. Search by component/service name in the appropriate directory

---

## 📝 Maintenance Guidelines

### Keeping Organized
1. **Regular Cleanup**: Remove unused files and dependencies
2. **Update Documentation**: Keep docs in sync with code changes
3. **Review Structure**: Periodically review and optimize organization
4. **Archive Old Files**: Move deprecated code to appropriate locations

### Adding New Code
1. Follow the established directory structure
2. Add tests for new functionality
3. Update relevant documentation
4. Use consistent naming conventions
5. Follow the project's coding standards

---

## 🎯 Benefits of This Structure

### For Developers
- **Easy Navigation**: Clear, logical file organization
- **Fast Onboarding**: Well-documented structure and guidelines
- **Consistent Patterns**: Standardized approach across the codebase
- **Quality Assurance**: Comprehensive testing and documentation

### For Maintenance
- **Scalability**: Structure supports growth and new features
- **Debugging**: Easy to locate and fix issues
- **Refactoring**: Clear boundaries for code changes
- **Team Collaboration**: Consistent structure across team members

### For Production
- **Reliability**: Comprehensive testing and validation
- **Performance**: Optimized build and runtime configuration
- **Security**: Security-first approach with proper isolation
- **Deployability**: Clean deployment pipeline with proper environments

---

**📚 Next Steps**: Review the [Contributing Guide](../../../CONTRIBUTING.md) for detailed development workflows and the [Architecture Overview](architecture/ARCHITECTURE.md) for system design details.






