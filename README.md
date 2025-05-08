# OrangeCat - Bitcoin Funding Platform

A modern platform for creating and managing Bitcoin funding pages with transparency features.

## Project Structure

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
```

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
