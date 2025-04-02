# Contributing to Palfare

Thank you for your interest in contributing to Palfare! This document provides guidelines and instructions for contributing to our project.

## Development Practices

### Test-Driven Development (TDD)
We follow Test-Driven Development practices:
1. Write tests first
2. Make tests pass
3. Refactor code
4. Repeat

### Code Style
- Use TypeScript for type safety
- Follow ESLint and Prettier configurations
- Write meaningful commit messages
- Keep functions small and focused

### Documentation
- Document all new features
- Update relevant documentation when making changes
- Keep TODO.md up to date
- Follow the documentation structure in the project

## Getting Started

1. Fork the repository
2. Clone your fork
3. Install dependencies: `npm install`
4. Create a new branch: `git checkout -b feature/your-feature-name`
5. Make your changes
6. Run tests: `npm test`
7. Push your changes: `git push origin feature/your-feature-name`
8. Create a pull request

## Testing

We use Jest and React Testing Library for testing:
- Unit tests for components
- Integration tests for features
- End-to-end tests for critical paths

Run tests with:
```bash
npm test        # Run all tests
npm test:watch  # Run tests in watch mode
npm test:cov    # Run tests with coverage
```

## Monitoring & Error Tracking

We use Vercel's built-in tools for:
- Error tracking
- Performance monitoring
- Analytics

See `src/utils/monitoring.ts` for available tracking functions.

## Pull Request Process

1. Update the documentation
2. Add tests for new features
3. Ensure all tests pass
4. Update CHANGELOG.md
5. Submit your pull request

## Code Review

- Reviewers will check for:
  - Code quality
  - Test coverage
  - Documentation updates
  - Performance impact
  - Security considerations

## Questions?

Feel free to open an issue or contact the maintainers. 