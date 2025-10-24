# Types Directory

This directory contains TypeScript type definitions used throughout the application. Types are organized by domain and follow a consistent naming convention.

## Directory Structure

```
types/
├── auth.ts        # Authentication types
├── profile.ts     # Profile types
└── funding.ts     # Funding types
```

## Type Guidelines

1. **Naming Convention**
   - Use PascalCase for type names
   - Use descriptive names
   - Prefix interfaces with `I` (optional)
   - Use consistent naming patterns

2. **Organization**
   - Group related types together
   - Use type aliases for complex types
   - Export types individually
   - Document complex types

3. **Documentation**
   - Use JSDoc comments
   - Document type properties
   - Provide usage examples
   - Note any constraints

## Type Examples

### Authentication Types
```typescript
interface User {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData extends LoginCredentials {
  fullName: string;
}

type AuthState = 'authenticated' | 'unauthenticated' | 'loading';
```

### Profile Types
```typescript
interface Profile {
  id: string;
  userId: string;
  bio?: string;
  website?: string;
  socialLinks: SocialLinks;
  createdAt: Date;
  updatedAt: Date;
}

interface SocialLinks {
  twitter?: string;
  github?: string;
  linkedin?: string;
}

interface ProfileUpdate {
  bio?: string;
  website?: string;
  socialLinks?: Partial<SocialLinks>;
}
```

### Funding Types
```typescript
interface Campaign {
  id: string;
  userId: string;
  title: string;
  description: string;
  goalAmount: number;
  currentAmount: number;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

type CampaignStatus = 'active' | 'completed' | 'cancelled';

interface Donation {
  id: string;
  projectId: string;
  userId: string;
  amount: number;
  transactionId: string;
  createdAt: Date;
}

interface CampaignUpdate {
  title?: string;
  description?: string;
  goalAmount?: number;
  status?: CampaignStatus;
}
```

## Best Practices

1. **Type Safety**
   - Use strict TypeScript configuration
   - Avoid `any` type
   - Use proper type guards
   - Implement runtime type checking

2. **Reusability**
   - Create reusable type utilities
   - Use type composition
   - Implement proper type inheritance
   - Use generics when appropriate

3. **Documentation**
   - Document complex types
   - Provide usage examples
   - Note any constraints
   - Document type relationships

4. **Validation**
   - Use type guards
   - Implement runtime validation
   - Use proper error types
   - Handle edge cases

## Type Utilities

Common type utilities:

```typescript
// Make all properties optional
type Partial<T> = {
  [P in keyof T]?: T[P];
};

// Make all properties required
type Required<T> = {
  [P in keyof T]-?: T[P];
};

// Make all properties readonly
type Readonly<T> = {
  readonly [P in keyof T]: T[P];
};

// Pick specific properties
type Pick<T, K extends keyof T> = {
  [P in K]: T[P];
};

// Omit specific properties
type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
```

## Type Guards

Implement type guards for runtime type checking:

```typescript
function isUser(obj: any): obj is User {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.email === 'string' &&
    typeof obj.fullName === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}

function isCampaign(obj: any): obj is Campaign {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    typeof obj.id === 'string' &&
    typeof obj.userId === 'string' &&
    typeof obj.title === 'string' &&
    typeof obj.description === 'string' &&
    typeof obj.goalAmount === 'number' &&
    typeof obj.currentAmount === 'number' &&
    typeof obj.status === 'string' &&
    obj.createdAt instanceof Date &&
    obj.updatedAt instanceof Date
  );
}
``` 