# Hooks Directory

This directory contains custom React hooks that encapsulate reusable logic and state management. Hooks follow React's best practices and are organized by functionality.

## Directory Structure

```
hooks/
├── useAuth.ts      # Authentication hook
├── useProfile.ts   # Profile hook
└── useFunding.ts   # Funding hook
```

## Hook Guidelines

1. **Naming Convention**
   - Prefix with `use` (e.g., `useAuth`, `useProfile`)
   - Use camelCase
   - Be descriptive of the hook's purpose

2. **Implementation**
   - Follow React hooks rules
   - Use TypeScript for type safety
   - Handle loading and error states
   - Implement proper cleanup

3. **Documentation**
   - Document parameters and return values
   - Provide usage examples
   - Note any dependencies
   - Document side effects

## Hook Examples

### Authentication Hook
```typescript
interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: Error | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
}

function useAuth(): UseAuthReturn {
  // Implementation
}
```

### Profile Hook
```typescript
interface UseProfileReturn {
  profile: Profile | null;
  loading: boolean;
  error: Error | null;
  updateProfile: (data: ProfileUpdate) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

function useProfile(userId: string): UseProfileReturn {
  // Implementation
}
```

### Funding Hook
```typescript
interface UseFundingReturn {
  project: Campaign | null;
  loading: boolean;
  error: Error | null;
  donate: (amount: number) => Promise<void>;
  refreshCampaign: () => Promise<void>;
}

function useFunding(projectId: string): UseFundingReturn {
  // Implementation
}
```

## Best Practices

1. **State Management**
   - Use appropriate state management solutions
   - Implement proper state initialization
   - Handle state updates efficiently
   - Clean up state when unmounting

2. **Error Handling**
   - Implement comprehensive error handling
   - Provide meaningful error messages
   - Handle edge cases gracefully
   - Log errors appropriately

3. **Performance**
   - Use memoization when necessary
   - Avoid unnecessary re-renders
   - Implement proper dependency arrays
   - Use batched state updates

4. **Testing**
   - Write tests for hook behavior
   - Test error scenarios
   - Verify state updates
   - Test cleanup functions

## Hook Composition

Hooks can be composed to create more complex functionality:

```typescript
function useUserDashboard() {
  const { user } = useAuth();
  const { profile } = useProfile(user?.id);
  const { projects } = useUserProjects(user?.id);

  return {
    user,
    profile,
    projects,
    loading: !user || !profile || !projects,
  };
}
```

## Documentation

Each hook should include:

```typescript
/**
 * Custom hook for managing user authentication
 * 
 * @returns {UseAuthReturn} Object containing user state and auth methods
 * 
 * @example
 * const { user, login, logout } = useAuth();
 * 
 * // Login
 * await login('user@example.com', 'password');
 * 
 * // Logout
 * await logout();
 */
function useAuth(): UseAuthReturn {
  // Implementation
}
```

## Error Handling

Hooks should implement proper error handling:

```typescript
function useData<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const result = await fetchFn();
        if (mounted) {
          setData(result);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error);
          setData(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [fetchFn]);

  return { data, error, loading };
}
``` 