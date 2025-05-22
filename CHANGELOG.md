# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Modular architecture with separation of concerns
- Type definitions for Profile and Dashboard
- Supabase client configuration
- Profile service with CRUD operations
- Custom authentication hook
- Reusable UI components (Button, Input, Card)
- Dashboard card component
- Configuration management for dashboard data
- Profile editing functionality with real-time updates
- Improved state management using Zustand

### Changed
- Refactored home page to use modular components
- Improved code organization and maintainability
- Enhanced type safety across the application

### Technical Debt
- Need to implement profile creation flow
- Need to add Bitcoin integration
- Need to set up protected routes
- Need to add testing infrastructure

## [Initial Setup]
- Project initialization
- Basic Next.js setup
- Supabase integration
- Basic UI components

## [1.0.0] - 2024-04-13

### Changed
- Complete rebranding to OrangeCat
- Migrated to Bitcoin Lightning Network for payments
- Updated site URL to orangecat.ch
- Improved user profile system
- Enhanced Bitcoin payment integration

### Added
- Bitcoin and Lightning Network payment support
- New profile fields for Bitcoin and Lightning addresses
- Real-time Bitcoin payment tracking
- Enhanced security features

### Removed
- Legacy payment system
- Old branding elements

## [0.1.0] - 2024-04-01

### Added
- Initial release
- Basic user authentication
- Profile creation
- Funding page system
- Created deployment documentation (DEPLOYMENT.md)
- Updated environment variables for production
- Enhanced Next.js configuration for production
- Added security headers
- Updated metadata configuration
- Added robots.txt configuration
- Added secure secret management system

### Changed
- Rebranded from Palfare to OrangeCat
- Updated all documentation to reflect new branding
- Updated site URL from palfare.com to orangecat.com
- Enhanced layout metadata
- Improved environment variable handling
- Updated image domains configuration
- Moved sensitive information to secure storage

### Fixed
- Removed experimental server actions flag
- Fixed environment variable defaults
- Enhanced security headers
- Removed exposed Bitcoin address from version control
- Secured API keys and configuration
- Resolved issues with asynchronous operations and localStorage

### Security
- Added security headers
- Implemented proper error handling
- Added security policy
- Added environment variable validation
- Secured sensitive information
- Implemented proper secret management

## [0.1.0] - Initial Setup
- Initial project setup
- Basic routing implementation
- Donation page creation
- Bitcoin integration setup

### Deprecated
- N/A

### Removed
- N/A 