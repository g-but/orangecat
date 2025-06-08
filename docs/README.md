---
created_date: 2025-06-05
last_modified_date: 2025-06-05
last_modified_summary: Added documentation standards including creation and modification dates
---

# 📚 OrangeCat Documentation
## Complete Guide for New Engineers

> **Welcome to OrangeCat** - A modern Bitcoin fundraising platform built with Next.js, TypeScript, and Supabase.

---

## 🚀 Quick Start (New Engineers)

**👋 First time here?** Follow this path:

1. **[🛠️ Development Setup](SETUP.md)** - Get your dev environment running
2. **[🏗️ Architecture Overview](ARCHITECTURE.md)** - Understand the system design
3. **[📖 Contributing Guide](CONTRIBUTING.md)** - How to contribute code
4. **[🔐 Security Guidelines](SECURITY.md)** - Security best practices

---

## 📋 Table of Contents

### 🏗️ **System & Architecture**
- [🏗️ Architecture Overview](ARCHITECTURE.md) - System design and technical decisions
- [🗄️ Database Schema](database-schema.md) - Complete database structure
- [🔧 API Reference](api/README.md) - REST API documentation
- [🔐 Authentication System](auth_system.md) - Auth flow and security

### 🛠️ **Development**
- [🛠️ Development Setup](SETUP.md) - Local environment setup
- [🚀 Deployment Guide](DEPLOYMENT.md) - Production deployment
- [📖 Contributing Guidelines](CONTRIBUTING.md) - How to contribute
- [🧪 Testing Guide](TESTING.md) - Testing strategies and setup

### 🎨 **Design & UI**
- [🎨 Design System](design-system/README.md) - Colors, typography, components
- [🧩 Component Library](components/README.md) - Reusable UI components
- [📱 Responsive Design](design-system/responsive.md) - Mobile-first approach

### ⚡ **Features**
- [👤 User Profiles](features/profile.md) - Profile management system
- [💰 Campaign Management](features/campaigns.md) - Fundraising campaigns
- [🔍 Search & Discovery](features/search.md) - Search algorithms
- [📊 Analytics Dashboard](features/dashboard.md) - Real-time analytics

### 🔐 **Security**
- [🔐 Security Guidelines](SECURITY.md) - Security best practices
- [🛡️ Security Audit](../SECURITY_AUDIT_REPORT.md) - Latest security audit
- [🚨 Incident Response](security/incident-response.md) - Security incidents

### 📊 **Operational**
- [📊 Monitoring](operations/monitoring.md) - Application monitoring
- [🐛 Troubleshooting](operations/troubleshooting.md) - Common issues
- [🔄 Maintenance](operations/maintenance.md) - Regular maintenance tasks

---

## 🎯 Documentation Philosophy

Our documentation follows these principles:

1. **📖 Clarity First** - Clear, concise language for all skill levels
2. **🎯 Task-Oriented** - Organized by what you want to accomplish
3. **🔄 Living Documentation** - Kept up-to-date with code changes
4. **🌍 Accessible** - Available to everyone, regardless of background

---

## 🏗️ Project Overview

**OrangeCat** is a Bitcoin fundraising platform that enables transparent, secure crowdfunding with Bitcoin payments. Built with modern web technologies and security-first principles.

### **🎯 Core Features**
- **Bitcoin Integration** - Native Bitcoin and Lightning Network support
- **Transparent Funding** - Real-time funding tracking and transparency
- **User Profiles** - Comprehensive profile management
- **Campaign Management** - Create and manage fundraising campaigns
- **Security-First** - Enterprise-grade security and validation

### **🛠️ Tech Stack**
- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **Authentication**: Supabase Auth with JWT
- **Payments**: Bitcoin and Lightning Network integration
- **Deployment**: Vercel (Frontend), Supabase (Database)

---

## 📁 Documentation Structure

```
docs/
├── README.md                    # This file - main entry point
├── SETUP.md                     # Development environment setup
├── ARCHITECTURE.md              # System architecture overview
├── CONTRIBUTING.md              # Contribution guidelines
├── SECURITY.md                  # Security guidelines
├── DEPLOYMENT.md               # Deployment procedures
├── TESTING.md                  # Testing strategies
│
├── api/                        # API Documentation
│   ├── README.md              # API overview
│   ├── auth.md                # Authentication endpoints
│   ├── profiles.md            # Profile management
│   └── campaigns.md           # Campaign endpoints
│
├── design-system/             # Design System
│   ├── README.md              # Design system overview
│   ├── colors.md              # Color palette
│   ├── typography.md          # Typography scale
│   └── components.md          # Component guidelines
│
├── features/                  # Feature Documentation
│   ├── README.md              # Features overview
│   ├── profile.md             # Profile system
│   ├── campaigns.md           # Campaign management
│   ├── search.md              # Search functionality
│   └── dashboard.md           # Analytics dashboard
│
├── security/                  # Security Documentation
│   ├── README.md              # Security overview
│   ├── authentication.md     # Auth security
│   ├── validation.md          # Input validation
│   └── incident-response.md   # Incident procedures
│
└── operations/                # Operational Documentation
    ├── README.md              # Operations overview
    ├── monitoring.md          # Application monitoring
    ├── troubleshooting.md     # Common issues
    └── maintenance.md         # Maintenance procedures
```

---

## 🎯 How to Use This Documentation

### **👨‍💻 For Developers**
1. Start with [Development Setup](SETUP.md)
2. Review [Architecture Overview](ARCHITECTURE.md)
3. Check [Contributing Guidelines](CONTRIBUTING.md)
4. Explore [Component Documentation](components/README.md)

### **🎨 For Designers**
1. Review [Design System](design-system/README.md)
2. Understand [Component Guidelines](design-system/components.md)
3. Check [Color Usage](design-system/colors.md)
4. Review [Typography](design-system/typography.md)

### **🔐 For Security Engineers**
1. Read [Security Guidelines](SECURITY.md)
2. Review [Security Audit Report](../SECURITY_AUDIT_REPORT.md)
3. Check [Authentication System](auth_system.md)
4. Understand [Validation Framework](features/validation.md)

### **📊 For DevOps/SRE**
1. Review [Deployment Guide](DEPLOYMENT.md)
2. Set up [Monitoring](operations/monitoring.md)
3. Understand [Troubleshooting](operations/troubleshooting.md)
4. Review [Maintenance Procedures](operations/maintenance.md)

---

## 🆘 Getting Help

### **📞 Support Channels**
- **GitHub Issues** - Bug reports and feature requests
- **Discussions** - General questions and discussions
- **Security** - security@orangecat.com for security issues

### **📚 Additional Resources**
- **[Development Roadmap](../DEVELOPMENT_TODO.md)** - Current development priorities
- **[Changelog](../CHANGELOG.md)** - Latest changes and releases
- **[FAQ](FAQ.md)** - Frequently asked questions

---

## 🔄 Keeping Documentation Updated

**📝 When making changes:**
1. Update relevant documentation files
2. Add new features to the appropriate sections
3. Remove outdated information
4. Update links and cross-references
5. Test all code examples

**🔍 Documentation Reviews:**
- **Weekly** - Check for broken links and outdated content
- **Monthly** - Review and update major sections
- **Release** - Update all release-related documentation

---

**🎉 Welcome to the team!** This documentation is here to help you succeed. If something is unclear or missing, please contribute by improving it!

# OrangeCat Documentation

This directory contains all documentation for the OrangeCat project, organized into logical categories for easy navigation and maintenance.

## Directory Structure

- `forward-looking/` - Future plans, roadmaps, and vision documents
  - ROADMAP.md - Project roadmap and implementation plan
  - TODO.md - Current tasks and priorities

- `development/` - Development guides and standards
  - BEST_PRACTICES.md - Development best practices
  - Standards and guidelines for code quality

- `operations/` - Deployment and infrastructure
  - DEPLOYMENT.md - Deployment procedures
  - ENVIRONMENT.md - Environment setup and configuration

- `security/` - Security policies and guidelines
  - SECURITY.md - Security overview and policies
  - auth_system.md - Authentication system documentation

- `design/` - Design system and UI/UX
  - DESIGN.md - Design principles and guidelines
  - UI/UX documentation and components

- `architecture/` - System architecture and technical decisions
  - ARCHITECTURE.md - Overall system architecture
  - Database schema and technical specifications
  - Technical decision records

- `api/` - API documentation
  - API endpoints and usage
  - Integration guides

- `philosophy/` - Project philosophy and principles
  - Core values and principles
  - Decision-making frameworks

- `contributing/` - Contributing guidelines
  - CONTRIBUTING.md - How to contribute
  - CODE_OF_CONDUCT.md - Community guidelines

## Documentation Standards

1. **Dates**: Each document should include:
   - Creation date
   - Last modified date
   - Summary of changes

2. **Format**: All documentation should be in Markdown format with:
   - Clear headings and structure
   - Code blocks where appropriate
   - Links to related documents
   - Tables for structured data

3. **Maintenance**:
   - Keep documentation up to date with code changes
   - Review and update quarterly
   - Remove obsolete information
   - Add new sections as needed

## Contributing to Documentation

1. Follow the established directory structure
2. Use consistent formatting
3. Update dates when making changes
4. Link to related documents
5. Keep documentation focused and concise

For more details on contributing, see [CONTRIBUTING.md](./contributing/CONTRIBUTING.md). 