# Documentation

This directory contains all project documentation organized by category.

## Structure

- `ARCHITECTURE.md` - System architecture and technical decisions
- `DEVELOPMENT.md` - Development setup and workflow
- `SECURITY.md` - Security practices and guidelines
- `DEPLOYMENT.md` - Deployment procedures and configuration
- `CONTRIBUTING.md` - Guidelines for contributors
- `CODE_OF_CONDUCT.md` - Community guidelines

## Documentation Best Practices

1. Keep documentation up to date with code changes
2. Use clear, concise language
3. Include code examples where helpful
4. Document all environment variables
5. Keep security-sensitive information out of documentation

## Updating Documentation

When making significant changes to the codebase:

1. Update relevant documentation files
2. Ensure all new features are documented
3. Remove outdated information
4. Update version numbers and dates

## OrangeCat Documentation

Welcome to the OrangeCat documentation. This guide will help you understand the project structure, components, and features.

## Table of Contents

1. [Project Structure](STRUCTURE.md)
2. [Environment Setup](ENVIRONMENT.md)
3. [Deployment Guide](DEPLOYMENT.md)
4. [Contributing Guidelines](CONTRIBUTING.md)
5. [Architecture Overview](ARCHITECTURE.md)
6. [Security Guidelines](SECURITY.md)

## Features

### Core Features
- [Authentication System](auth_system.md)
- [User Dashboard](features/dashboard.md)
- [Bitcoin Integration](features/bitcoin.md)
- [User Profiles](features/profiles.md)
- [Transparency System](features/transparency.md)

### Dashboard Features
- Real-time funding statistics
- Active pages overview
- Funding trends and analytics
- User profile management
- Transaction history

## Components

### Layout Components
- [Header](components/layout/Header.tsx)
- [Dashboard Layout](components/dashboard/DashboardLayout.tsx)
- [Dashboard Content](components/dashboard/DashboardContent.tsx)

### Authentication Components
- [Auth Form](components/auth/AuthForm.tsx)
- [Auth Provider](contexts/AuthContext.tsx)

### UI Components
- [Loading Spinner](components/Loading.tsx)
- [Card](components/ui/Card.tsx)
- [Button](components/ui/Button.tsx)

## Design System

### Colors
- Primary: Tiffany Blue (#0ABAB5)
- Secondary: Complementary colors
- Background: Light gray (#F9FAFB)
- Text: Dark gray (#1F2937)

### Typography
- Headings: Inter
- Body: System font stack
- Code: Fira Code

### Components
- Consistent spacing (8px grid)
- Responsive layouts
- Accessible design patterns

## Development

### Local Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables
4. Start development server: `npm run dev`

### Testing
- Jest for unit tests
- React Testing Library for component tests
- Cypress for end-to-end tests

### Deployment
- Vercel for hosting
- Automatic deployments from main branch
- Preview deployments for pull requests

## Security

### Authentication
- Supabase Auth for user management
- JWT-based session handling
- Secure password policies

### Data Protection
- Row-level security in Supabase
- Encrypted sensitive data
- Regular security audits

## Documentation Navigation

### Quick Links
- [Design System](./design-system/README.md) - Colors, typography, and component guidelines
- [Components](./components/README.md) - Detailed component documentation
- [Features](./features/README.md) - Feature documentation and implementation details

### Documentation Structure
```
docs/
├── design-system/     # Design guidelines and system documentation
├── components/        # Component documentation
└── features/         # Feature documentation
```

## How to Use This Documentation

1. **For Designers**
   - Start with the [Design System](./design-system/README.md)
   - Review component guidelines
   - Understand color usage and typography

2. **For Developers**
   - Begin with [Components](./components/README.md)
   - Review feature implementations
   - Check component relationships

3. **For New Team Members**
   - Read the [Getting Started Guide](./getting-started.md)
   - Review the [Architecture Overview](./architecture.md)
   - Understand the [Development Workflow](./development-workflow.md)

## Documentation Updates

This documentation is a living document. When making changes:
1. Update the relevant documentation file
2. Update the table of contents if needed
3. Ensure all links are working
4. Add any new sections to the navigation

## Contributing to Documentation

When adding new documentation:
1. Place it in the appropriate directory
2. Update the main README.md with links
3. Ensure proper formatting and clarity
4. Add examples where necessary 