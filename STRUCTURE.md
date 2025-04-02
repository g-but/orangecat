# Palfare Project Structure

This document provides a detailed explanation of the Palfare project's file structure, including the purpose and contents of each file and directory.

## Root Directory

### Configuration Files

- `.env.example` - Example environment variables file. Contains template variables that need to be set in `.env.local` for local development.
- `.eslintrc.json` - ESLint configuration file. Defines code style rules and linting settings.
- `.gitignore` - Specifies which files and directories Git should ignore.
- `.prettierrc.json` - Prettier configuration file. Defines code formatting rules.
- `jest.config.js` - Jest testing framework configuration.
- `next.config.js` - Next.js framework configuration, including security headers and image domains.
- `package.json` - NPM package configuration, including dependencies and scripts.
- `package-lock.json` - NPM dependency lock file, ensuring consistent installations.
- `postcss.config.js` - PostCSS configuration for processing CSS.
- `tailwind.config.js` - Tailwind CSS framework configuration.
- `tsconfig.json` - TypeScript configuration, including compiler options and paths.
- `vercel.json` - Vercel deployment configuration.

### Documentation Files

- `CHANGELOG.md` - Records all notable changes to the project.
- `CODE_OF_CONDUCT.md` - Defines community standards and behavior expectations.
- `CONTRIBUTING.md` - Guidelines for contributing to the project.
- `LICENSE` - MIT License file.
- `README.md` - Main project documentation.
- `SECURITY.md` - Security policy and vulnerability reporting guidelines.
- `STRUCTURE.md` - This file, documenting the project structure.

### Source Code

- `src/` - Main source code directory.

## Source Code Structure (`src/`)

### App Directory (`src/app/`)

The app directory follows Next.js 13+ App Router conventions.

- `app/globals.css` - Global CSS styles and Tailwind CSS imports.
- `app/layout.tsx` - Root layout component, including metadata and global providers.
- `app/error.tsx` - Global error page component.
- `app/loading.tsx` - Global loading page component.
- `app/not-found.tsx` - 404 page component.
- `app/create/` - Directory for the donation page creation feature.
- `app/donate/` - Directory for the donation feature.

### Components Directory (`src/components/`)

Reusable React components used throughout the application.

- `components/CreatePageForm.tsx` - Form component for creating donation pages.
- `components/ErrorBoundary.tsx` - React error boundary component for catching and handling errors.
- `components/Loading.tsx` - Reusable loading spinner component.

### Types Directory (`src/types/`)

TypeScript type definitions.

- `types/env.d.ts` - TypeScript declarations for environment variables.

## Development Tools and Dependencies

- `node_modules/` - Directory containing installed NPM packages (not tracked in Git).
- `.git/` - Git version control directory (not tracked in Git).

## Note About `tatus` File

The `tatus` file appears to be an artifact or temporary file that should not be in the repository. It should be added to `.gitignore` and removed from the repository.

## Directory Structure Summary

```
palfare/
├── .env.example
├── .eslintrc.json
├── .gitignore
├── .prettierrc.json
├── jest.config.js
├── next.config.js
├── package.json
├── package-lock.json
├── postcss.config.js
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
├── CHANGELOG.md
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── README.md
├── SECURITY.md
├── STRUCTURE.md
├── src/
│   ├── app/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   ├── create/
│   │   └── donate/
│   ├── components/
│   │   ├── CreatePageForm.tsx
│   │   ├── ErrorBoundary.tsx
│   │   └── Loading.tsx
│   └── types/
│       └── env.d.ts
├── node_modules/
└── .git/
```

This structure follows modern Next.js best practices, with clear separation of concerns and modular organization of code. Each directory and file has a specific purpose and follows established conventions for React and Next.js applications. 