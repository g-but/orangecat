---
created_date: YYYY-MM-DD
last_modified_date: YYYY-MM-DD
last_modified_summary: Initial creation
---

# Component: [ComponentName]

## Overview
Brief description of what this component does and where it's used in the application.

## File Location
```
src/components/[category]/[ComponentName].tsx
```

## Props Interface
```typescript
interface ComponentNameProps {
  // Required props
  requiredProp: string;

  // Optional props
  optionalProp?: string;

  // Event handlers
  onAction?: (data: ActionData) => void;

  // Styling
  className?: string;

  // Variants
  variant?: 'primary' | 'secondary' | 'tertiary';
  size?: 'sm' | 'md' | 'lg';
}
```

## Usage Examples

### Basic Usage
```tsx
import ComponentName from '@/components/[category]/ComponentName';

function MyComponent() {
  return (
    <ComponentName
      requiredProp="example value"
      onAction={(data) => console.log(data)}
    />
  );
}
```

### Advanced Usage
```tsx
function AdvancedExample() {
  const [data, setData] = useState(initialData);

  const handleAction = useCallback((actionData) => {
    // Handle the action
    setData(updatedData);
  }, []);

  return (
    <ComponentName
      requiredProp="advanced example"
      optionalProp="additional configuration"
      variant="primary"
      size="lg"
      className="custom-styling"
      onAction={handleAction}
    />
  );
}
```

## Props Documentation

### Required Props

#### `requiredProp`
- **Type**: `string`
- **Description**: Description of what this prop does
- **Validation**: Any validation rules or constraints

### Optional Props

#### `optionalProp`
- **Type**: `string`
- **Default**: `undefined`
- **Description**: Description of what this optional prop does

#### `onAction`
- **Type**: `(data: ActionData) => void`
- **Default**: `undefined`
- **Description**: Callback function called when action occurs

#### `className`
- **Type**: `string`
- **Default**: `undefined`
- **Description**: Additional CSS classes to apply

#### `variant`
- **Type**: `'primary' | 'secondary' | 'tertiary'`
- **Default**: `'primary'`
- **Description**: Visual variant of the component

#### `size`
- **Type**: `'sm' | 'md' | 'lg'`
- **Default**: `'md'`
- **Description**: Size variant of the component

## Styling

### CSS Classes
The component uses Tailwind CSS classes and can be customized via the `className` prop.

### Variants
- **Primary**: Default styling with brand colors
- **Secondary**: Muted styling for secondary actions
- **Tertiary**: Minimal styling for subtle elements

### Sizes
- **Small (sm)**: Compact size for tight spaces
- **Medium (md)**: Standard size for most use cases
- **Large (lg)**: Prominent size for important elements

## Accessibility
- Component supports keyboard navigation
- Screen reader compatible with proper ARIA labels
- Focus management follows accessibility guidelines
- Color contrast meets WCAG standards

## Testing

### Unit Tests
Located at: `src/components/[category]/__tests__/ComponentName.test.tsx`

### Test Cases
- Renders correctly with required props
- Handles optional props appropriately
- Calls event handlers with correct data
- Applies correct CSS classes
- Accessible to screen readers

## Dependencies
- `react`: Core React functionality
- `@/lib/utils`: Utility functions
- `@/components/ui/Button`: Button component (if used)
- Other dependencies...

## Related Components
- [RelatedComponent](../components/RelatedComponent.md)
- [AnotherComponent](../components/AnotherComponent.md)

## Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes
- Component is memoized to prevent unnecessary re-renders
- Minimal DOM footprint
- Optimized for mobile performance
- Lazy loads heavy dependencies if applicable

## Migration Guide
If this component replaces an older version:

### From v1 to v2
```tsx
// Old usage (v1)
<OldComponent prop="value" />

// New usage (v2)
<ComponentName requiredProp="value" />
```

## Changelog
- YYYY-MM-DD: Initial implementation
- YYYY-MM-DD: Added new variant option
- YYYY-MM-DD: Improved accessibility support
