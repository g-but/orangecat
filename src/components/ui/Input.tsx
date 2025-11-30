import { InputHTMLAttributes, forwardRef, useId } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
  required?: boolean;
  icon?: LucideIcon;
}

// Helper function to get icon test ID based on icon name
const getIconTestId = (Icon: LucideIcon): string => {
  const iconName = Icon.displayName || Icon.name || 'icon';
  // Map common Lucide icon names to test IDs
  const iconMap: Record<string, string> = {
    Mail: 'mail',
    Lock: 'lock',
    Bitcoin: 'bitcoin',
    User: 'user',
    Search: 'search',
    Key: 'key',
    Eye: 'eye',
    EyeOff: 'eye-off',
  };
  return iconMap[iconName] || iconName.toLowerCase();
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, description, error, required, icon: Icon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const descriptionId = `${inputId}-description`;

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" data-testid={`icon-${getIconTestId(Icon)}`} />
            </div>
          )}
          <input
            id={inputId}
            required={required}
            className={cn(
              'block w-full rounded-md shadow-sm text-sm text-gray-900',
              'border-gray-300 focus:border-tiffany-500 focus:ring-tiffany-500',
              'placeholder:text-gray-400',
              error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
              Icon && 'pl-10',
              className
            )}
            aria-describedby={cn(error && errorId, description && descriptionId)}
            aria-invalid={error ? 'true' : 'false'}
            ref={ref}
            {...props}
          />
        </div>
        {description && !error && (
          <p id={descriptionId} className="text-sm text-gray-600">
            {description}
          </p>
        )}
        {error && (
          <p id={errorId} className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;
