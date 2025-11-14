# 📚 OrangeCat Documentation

**Welcome to the OrangeCat Bitcoin Crowdfunding Platform documentation!**

This is your centralized knowledge base for understanding, developing, deploying, and maintaining the OrangeCat platform.

---

## 🚀 Quick Start

### For New Developers

1. **[Developer Guide](./getting-started/developer-guide.md)** - Complete setup and first steps
2. **[Development Setup](./development/SETUP.md)** - Environment configuration
3. **[Contributing Guide](./contributing/CONTRIBUTING.md)** - How to contribute effectively

### For Users

- **[API Reference](./api/README.md)** - API documentation for integrations
- **[Features Guide](./features/README.md)** - Platform features overview

---

## 📂 Documentation Structure

```
docs/
├── getting-started/     # 🚀 Onboarding & setup
├── architecture/        # 🏗️ System design & architecture
├── development/         # 💻 Development guides & workflows
├── workflows/           # 🔄 Proven operational workflows
├── features/            # ✨ Feature documentation
├── operations/          # 🔧 Operations & maintenance
├── deployment/          # 🚢 Deployment guides
├── security/            # 🔒 Security practices
├── testing/             # 🧪 Testing guides
├── changelog/           # 📝 Release notes
└── standards/           # 📏 Standards & conventions
```

---

## 📖 Key Documentation

### **Architecture & Design**

- **[System Architecture](./architecture/ARCHITECTURE.md)** - High-level system design
- **[Database Schema](./architecture/database/README.md)** - Database design and relationships
- **[Services Architecture](./architecture/services-architecture.md)** - Service layer design
- **[Component Architecture](./components/component-architecture.md)** - UI component patterns

### **Development**

- **[Best Practices](./development/BEST_PRACTICES.md)** - Development guidelines
- **[Code Review Guide](./development/code-review.md)** - Code review process
- **[Technical Debt](./development/technical-debt.md)** - Current technical debt items
- **[Dashboard Analysis](./development/dashboard-analysis.md)** - Dashboard page analysis
- **[Hooks Guide](./development/hooks-guide.md)** - Custom React hooks
- **[Utils Guide](./development/utils-guide.md)** - Utility functions
- **[Types Guide](./development/types-guide.md)** - TypeScript types

### **Workflows**

- **[Supabase Migration Workflow](./workflows/SUPABASE_MIGRATION_WORKFLOW.md)** - Complete migration guide
- **[Migration Quick Reference](./workflows/MIGRATION_QUICK_REFERENCE.md)** - Fast lookup for common tasks
- **[Migration Lessons Learned](./workflows/MIGRATION_LESSONS_LEARNED.md)** - What we learned from failures

### **Database**

- **[Database Schema](./architecture/database/DB_SCHEMA.md)** - Complete schema reference
- **[Migrations Guide](./supabase/migrations-guide.md)** - Database migration workflow
- **[Schema Quick Reference](./architecture/database/QUICK_REFERENCE.md)** - Quick lookup
- **[Database Improvements](./operations/database-improvements.md)** - Recent improvements

### **Operations**

- **[Deployment Guide](./operations/DEPLOYMENT.md)** - Production deployment
- **[Environment Setup](./operations/ENVIRONMENT.md)** - Environment variables
- **[Troubleshooting](./operations/troubleshooting.md)** - Common issues
- **[Port Management](./operations/PORT_MANAGEMENT_README.md)** - Development ports

### **Security**

- **[Security Overview](./security/README.md)** - Security principles
- **[Auth System](./security/auth_system.md)** - Authentication implementation
- **[Security Audit](./security/audit-report.md)** - Latest security audit

### **Testing**

- **[Test Guide](./testing/test-guide.md)** - Testing strategy
- **[Test Coverage](./testing/comprehensive-test-coverage-report.md)** - Coverage report
- **[User Journeys](./testing/USER_JOURNEY_VERIFICATION.md)** - E2E test scenarios

---

## 🎯 Common Tasks

### Development

- **Setting up local environment**: See [Development Setup](./development/SETUP.md)
- **Running migrations**: See [Migration Workflow](./workflows/SUPABASE_MIGRATION_WORKFLOW.md) or [Quick Reference](./workflows/MIGRATION_QUICK_REFERENCE.md)
- **Creating components**: See [Component Architecture](./components/component-architecture.md)
- **Writing tests**: See [Test Guide](./testing/test-guide.md)

### Deployment

- **Deploy to production**: See [Deployment Guide](./operations/DEPLOYMENT.md)
- **Set up monitoring**: See [Observability](./devops/observability.md)
- **Configure CI/CD**: See [CI/CD Guide](./devops/ci-cd.md)

### Debugging

- **Performance issues**: See [Performance Debugging](./development/performance-debugging.md)
- **Database issues**: See [Troubleshooting](./operations/troubleshooting.md)
- **Error handling**: See [Error Handling](./development/error-handling.md)

---

## 📋 Standards & Best Practices

### Code Standards

- **[Documentation Standards](./standards/documentation_standards.md)** - How to write docs
- **[Datetime Standards](./standards/datetime_standards.md)** - Date/time handling
- **[Color System](./development/color-system-guide.md)** - Design system colors

### Templates

- **[Component Template](./templates/component.md)** - Component boilerplate
- **[API Endpoint Template](./templates/api-endpoint.md)** - API endpoint structure
- **[ADR Template](./templates/adr.md)** - Architecture decision records
- **[Documentation Template](./templates/documentation_template.md)** - Doc structure

---

## 🔍 Finding Information

### **Search Documentation**

Use your IDE's search (Ctrl+Shift+F) to search across all documentation files.

### **Recently Updated**

- **[Supabase Migration Workflow](./workflows/SUPABASE_MIGRATION_WORKFLOW.md)** - 2025-11-14 ⭐ NEW
- **[Migration Quick Reference](./workflows/MIGRATION_QUICK_REFERENCE.md)** - 2025-11-14 ⭐ NEW
- **[Migration Lessons Learned](./workflows/MIGRATION_LESSONS_LEARNED.md)** - 2025-11-14 ⭐ NEW
- **[Technical Debt](./development/technical-debt.md)** - 2025-11-03
- **[Dashboard Analysis](./development/dashboard-analysis.md)** - 2025-11-03

---

## 📞 Getting Help

### **Team Resources**

- **GitHub Issues** - Report bugs and request features
- **Pull Requests** - All code changes require review
- **Architecture Decisions** - Document in `docs/architecture/`

### **External Documentation**

- **[Next.js Docs](https://nextjs.org/docs)** - React framework
- **[Supabase Docs](https://supabase.com/docs)** - Database and auth
- **[Tailwind CSS](https://tailwindcss.com/docs)** - Styling framework
- **[Zustand](https://docs.pmnd.rs/zustand)** - State management

---

## 🎯 Documentation Principles

This documentation follows these principles:

- ✅ **Always Current** - Updated with every major change
- ✅ **Actionable** - Step-by-step instructions
- ✅ **Contextual** - Explains why, not just how
- ✅ **Searchable** - Clear structure and keywords
- ✅ **Reviewed** - Regular reviews and updates
- ✅ **No Duplication** - Single source of truth

---

## 📝 Contributing to Docs

When contributing documentation:

1. Follow the [Documentation Standards](./standards/documentation_standards.md)
2. Use the appropriate [template](./templates/)
3. Keep docs in the correct directory
4. Update this index if adding new sections
5. Test all code examples
6. Get docs reviewed with code PRs

---

**Last Updated:** 2025-11-14
**Version:** 2.1.0
**Maintainers:** Development Team
