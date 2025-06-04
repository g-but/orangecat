# OrangeCat - Bitcoin Fundraising Platform

A modern platform for creating and managing Bitcoin funding pages with transparency features.

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

## 🔧 VS Code Setup

The project includes VS Code tasks for easy development:

- **🚀 Start Dev (Clean)** - Default build task (Ctrl+Shift+P → "Tasks: Run Build Task")
- **🧹 Kill All Node Processes** - Emergency port cleanup
- **🗑️ Clear Cache** - Clear build cache

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── profile/           # Profile management pages
│   ├── funding/           # Funding page routes
│   └── dashboard/         # Dashboard pages
├── components/            # React components
│   ├── auth/             # Authentication components
│   ├── funding/          # Funding page components
│   ├── layout/           # Layout components
│   ├── profile/          # Profile components
│   └── ui/               # Reusable UI components
├── contexts/             # React contexts
│   └── AuthContext.tsx   # Authentication context
├── hooks/               # Custom React hooks
│   ├── useProfile.ts    # Profile management hook
│   └── useBitcoinWallet.ts # Bitcoin wallet hook
├── services/            # External services integration
│   ├── supabase.ts      # Supabase client and helpers
│   └── transparency.ts  # Transparency scoring service
├── types/               # TypeScript type definitions
└── utils/              # Utility functions

config/                  # Configuration files
├── dashboard.ts        # Dashboard configuration
└── navigation.ts       # Navigation configuration

public/                 # Static assets
supabase/              # Database migrations and types

scripts/                # Development scripts
├── dev.sh             # Unix/Git Bash clean start
└── dev.bat            # Windows batch clean start

.vscode/
└── tasks.json         # VS Code development tasks
```

## 🚀 Tesla-Grade Draft System

This project includes a sophisticated draft management system with:

- **Real-time synchronization** with conflict resolution
- **Event-sourced architecture** for complete audit trail
- **Offline-first design** with automatic sync
- **Beautiful real-time UI** with status indicators

See `/docs/TeslaDraftArchitecture.md` for complete documentation.

---

## 💡 Pro Tips

- **Never run multiple `npm run dev` instances** - use `npm run fresh:start` instead
- **Use VS Code tasks** for the best development experience
- **Check the terminal** for any error messages before starting development
- **Clear cache** if you experience weird build behaviors

**Happy coding! 🎉**

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Bitcoin Integration**: Mempool API

## Features

- User authentication and profile management
- Bitcoin funding page creation
- Real-time transaction tracking
- Transparency scoring system
- Responsive design

## Recent Updates

- **Profile Editing**: Users can now edit their profiles seamlessly with real-time updates.
- **Improved State Management**: Enhanced state management using Zustand to minimize errors and inconsistencies.
- **Bug Fixes**: Resolved issues related to asynchronous operations and localStorage.

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
   npm run dev
   ```

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
