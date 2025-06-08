# OrangeCat - Bitcoin Fundraising Platform

A modern platform for creating and managing Bitcoin funding pages with transparency features.

**Current Status**: 🛡️ **SECURITY HARDENED** - All critical vulnerabilities fixed | 📊 **Test Coverage Needed** - Currently 4.9% (Target: 80%)

## 🚀 Quick Start (No More Port Issues!)

**IMPORTANT**: Always use these commands instead of `npm run dev` to avoid port conflicts:

### For Git Bash (Recommended):
```bash
npm run fresh:start
```

### For Windows Command Prompt:
```bash
scripts\dev.bat
```

### For VS Code Users:
1. Press `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. Select "🚀 Start Dev (Clean)"

## 📦 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run fresh:start` | **USE THIS** - Kills existing Node processes, clears cache, starts dev cleanly |
| `npm run dev:clean` | Alternative clean start using bash script |
| `npm run kill:node` | Kill all Node.js processes (frees up ports) |
| `npm run clear:cache` | Clear Next.js and npm cache |
| `npm run dev` | Standard dev (may cause port conflicts) |
| `npm test` | Run test suite (103 tests, 4.9% coverage) |
| `npm test -- --coverage` | Run tests with detailed coverage report |

## 🛡️ Security Status

✅ **SECURE** - All critical vulnerabilities have been fixed:
- ✅ File upload authorization bypass - **FIXED**
- ✅ Console.log data exposure - **FIXED** 
- ✅ Celebrity impersonation prevention - **FIXED**
- ✅ Auth state inconsistencies - **FIXED**

**Security Test Coverage**: 69 comprehensive security tests passing

## 🧪 Testing Status

📊 **Test Coverage**: 4.9% (Need 80% for production)
- **Total Tests**: 103 tests across 8 test suites
- **Security Tests**: 69 tests (excellent coverage)
- **Component Tests**: Minimal (major gap)
- **Integration Tests**: None (critical gap)

**Test Commands**:
```bash
npm test                    # Run all tests
npm test -- --coverage    # Get coverage report
npm test -- --watch       # Watch mode for development
```

## 🛠️ Troubleshooting Port Issues

If you ever get "Port XXXX is in use" errors:

### Quick Fix:
```bash
npm run kill:node
npm run fresh:start
```

### Manual Fix:
```bash
# Kill all Node processes
powershell "Stop-Process -Name node -Force -ErrorAction SilentlyContinue"

# Clear cache
rm -rf .next
npm cache clean --force

# Start fresh
npm run dev
```

## 🎯 Development Best Practices

1. **Always use `npm run fresh:start`** instead of `npm run dev`
2. **Close terminals properly** - don't just close the window while dev server is running
3. **Use VS Code tasks** for one-click development
4. **Clear cache regularly** if you experience build issues
5. **Run tests before committing** - `npm test`

## 🔧 VS Code Setup

The project includes VS Code tasks for easy development:

- **🚀 Start Dev (Clean)** - Default build task (Ctrl+Shift+P → "Tasks: Run Build Task")
- **🧹 Kill All Node Processes** - Emergency port cleanup
- **🗑️ Clear Cache** - Clear build cache
- **🧪 Run Tests** - Execute test suite

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── profile/           # Profile management pages
│   ├── funding/           # Funding page routes
│   ├── dashboard/         # Dashboard pages
│   ├── api/               # API routes
│   │   └── __tests__/     # API security tests (69 tests)
│   └── __tests__/         # Page tests
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── funding/          # Funding page components
│   ├── layout/           # Layout components
│   ├── profile/          # Profile components
│   └── ui/               # Reusable UI components
├── hooks/                # Custom React hooks
│   ├── useAuth.ts        # Authentication hook (21 tests)
│   └── __tests__/        # Hook tests
├── services/             # External services integration
│   ├── supabase/         # Supabase client and helpers
│   └── transparency.ts   # Transparency scoring service
├── stores/               # State management
│   ├── campaignStore.ts  # Campaign state (Zustand)
│   └── __tests__/        # Store tests
├── utils/                # Utility functions
│   ├── validation.ts     # Input validation (security hardened)
│   └── verification.ts   # Celebrity impersonation prevention
└── types/               # TypeScript type definitions

docs/                    # Comprehensive documentation
├── security/            # Security documentation
├── architecture/        # System architecture docs
├── forward-looking/     # TODO and roadmap
└── development/         # Development guides

config/                  # Configuration files
├── dashboard.ts        # Dashboard configuration
└── navigation.ts       # Navigation configuration

scripts/                # Development scripts
├── dev.sh             # Unix/Git Bash clean start
└── dev.bat            # Windows batch clean start
```

## 🚀 Tesla-Grade Draft System

This project includes a sophisticated draft management system with:

- **Real-time synchronization** with conflict resolution
- **Event-sourced architecture** for complete audit trail
- **Offline-first design** with automatic sync
- **Beautiful real-time UI** with status indicators

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS with centralized theme system
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (security hardened)
- **Bitcoin Integration**: Mempool API
- **State Management**: Zustand (auth & campaigns)
- **Testing**: Jest, React Testing Library
- **Security**: Multi-layer validation, celebrity impersonation prevention

## Features

### ✅ Production Ready
- User authentication and profile management
- Bitcoin funding page creation
- Real-time transaction tracking
- Transparency scoring system
- Responsive design
- **Comprehensive security system**
- Celebrity impersonation prevention
- File upload security
- Bitcoin address validation

### 🔬 Experimental
- Lightning Network integration
- Advanced analytics dashboard
- Campaign sharing system

## Recent Security Improvements

### Major Security Fixes (June 2025)
- **File Upload Security**: Fixed authorization bypass, added malicious file detection
- **Celebrity Protection**: Comprehensive impersonation prevention system
- **Authentication**: Enhanced auth state management and validation
- **Console Security**: Removed production data exposure

### Security Test Coverage
- 25 celebrity impersonation prevention tests
- 21 authentication tests  
- 9 file upload security tests
- 8 profile security tests
- 6 funding security tests

## Development Priorities

### 🚨 CRITICAL: Test Coverage (Current Focus)
**Status**: 4.9% coverage (Target: 80%)
**Priority**: Essential before production deployment
**Timeline**: 2-3 weeks

### Next Priorities (After Testing)
1. TypeScript `any` types cleanup (200+ instances)
2. Architecture refactoring (split large files)
3. Performance optimization

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
4. Start the development server:
   ```bash
   npm run fresh:start
   ```
5. Run tests to verify setup:
   ```bash
   npm test
   ```

## Development Commands

- `npm run fresh:start` - **Recommended**: Clean development start
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run comprehensive test suite
- `npm test -- --coverage` - Generate coverage report
- `npm run type-check` - TypeScript validation

## Contributing

1. Fork the repository
2. Create your feature branch
3. **Write tests** for new functionality
4. Ensure all tests pass: `npm test`
5. Commit your changes
6. Push to the branch
7. Create a Pull Request

**Note**: All PRs must include tests and maintain >80% coverage for new code.

## Security

This platform handles Bitcoin transactions and takes security seriously:

- All critical vulnerabilities have been fixed
- Comprehensive security test suite (69 tests)
- Regular security audits
- See `docs/security/` for detailed security documentation

Report security issues to: [security contact information]

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 💡 Pro Tips

- **Never run multiple `npm run dev` instances** - use `npm run fresh:start` instead
- **Use VS Code tasks** for the best development experience
- **Run tests regularly** - `npm test` catches issues early
- **Check coverage** - `npm test -- --coverage` shows what needs testing
- **Clear cache** if you experience weird build behaviors

**Happy coding! 🎉**
