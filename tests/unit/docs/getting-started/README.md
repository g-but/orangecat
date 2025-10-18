# 🚀 Getting Started with OrangeCat

Welcome to the OrangeCat Bitcoin Crowdfunding Platform! This guide will help you get up and running with development, deployment, and usage.

## 📋 Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **npm or yarn** - Package manager
- **Git** - Version control
- **Supabase Account** - Database and authentication

## ⚡ Quick Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd orangecat
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Set up Environment Variables
```bash
cp config/production.env.template .env.local
# Edit .env.local with your Supabase credentials
```

### 4. Set up Supabase
```bash
# Install Supabase CLI
npm install -g supabase

# Link your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db reset
```

### 5. Start Development Server
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your app!

## 🔧 Development Workflow

### Code Structure
```
src/
├── app/           # Next.js App Router pages
├── components/    # Reusable UI components
├── services/      # Business logic and API calls
├── types/         # TypeScript type definitions
├── utils/         # Utility functions
└── lib/          # Core libraries and configurations
```

### Key Commands
```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server

# Testing
npm test             # Run all tests
npm run test:watch   # Watch mode
npm run test:coverage # Generate coverage report

# Database
supabase db reset    # Reset database
supabase db push     # Apply migrations
supabase studio      # Open Supabase dashboard

# Code Quality
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript checks
```

## 📚 Next Steps

- **[Development Guide](./development-guide.md)** - Detailed development workflow
- **[Testing Guide](./testing-guide.md)** - Testing strategies and patterns
- **[Deployment Guide](./deployment-guide.md)** - Production deployment
- **[API Reference](./api-reference.md)** - API documentation

## 🆘 Troubleshooting

### Common Issues

**Database connection errors:**
- Check your `.env.local` file has correct Supabase credentials
- Ensure your Supabase project is active
- Run `supabase status` to check connection

**Build errors:**
- Run `npm run type-check` to identify TypeScript issues
- Check for missing dependencies with `npm install`
- Clear `.next` folder and rebuild

**Test failures:**
- Ensure database is properly seeded
- Check test environment variables
- Run tests with `--verbose` for detailed output

## 📞 Getting Help

- **Documentation**: Browse this `/docs` directory
- **Issues**: Check existing GitHub issues
- **Discussions**: Use GitHub Discussions for questions
- **Chat**: Join our development Slack/Discord

---

**Ready to contribute?** Check out our [Contributing Guide](./contributing-guide.md)!
