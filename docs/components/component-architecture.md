# Components Directory

This directory contains all React components used in the OrangeCat application. Components are organized by feature and type to maintain a clear and scalable structure.

## Directory Structure

```
components/
├── auth/             # Authentication-related components
│   ├── LoginForm.tsx
│   ├── RegisterForm.tsx
│   └── AuthProvider.tsx
├── dashboard/        # Dashboard components
│   ├── StatsCard.tsx
│   ├── ActivityFeed.tsx
│   └── FundingOverview.tsx
├── funding/          # Funding page components
│   ├── DonationForm.tsx
│   ├── ProgressBar.tsx
│   └── FundingCard.tsx
├── profile/          # Profile-related components
│   ├── ProfileHeader.tsx
│   ├── ProfileForm.tsx
│   └── SocialLinks.tsx
└── ui/               # Reusable UI components
    ├── Button.tsx
    ├── Card.tsx
    ├── Input.tsx
    └── Modal.tsx
```

## Component Guidelines

1. **Naming Convention**
   - Use PascalCase for component names
   - Suffix with `.tsx` for TypeScript React components
   - Use descriptive names that reflect the component's purpose

2. **Props**
   - Define all props using TypeScript interfaces
   - Use meaningful prop names
   - Document required and optional props
   - Provide default values where appropriate

3. **Styling**
   - Use Tailwind CSS for styling
   - Follow the design system guidelines
   - Ensure responsive design
   - Maintain accessibility standards

4. **Testing**
   - Each component should have corresponding test files
   - Tests should cover main functionality and edge cases
   - Use React Testing Library for component tests

5. **Documentation**
   - Include JSDoc comments for component props
   - Document usage examples
   - Note any dependencies or requirements

## Best Practices

- Keep components small and focused on a single responsibility
- Use composition over inheritance
- Implement proper error handling
- Follow React hooks rules
- Use memoization when necessary
- Ensure proper TypeScript typing
- Maintain consistent code style 