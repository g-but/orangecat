import { ButtonHTMLAttributes, forwardRef } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { COMPONENT_STYLES } from '@/config/design-system';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline' | 'gradient' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  href?: string;
}

/** Only used when a loading button has no label of its own to keep showing. */
const LOADING_FALLBACK_LABEL = 'Loading...';

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    // A busy button keeps its own label. Replacing it with "Loading..." threw
    // away the caller's copy — so a button that said "Sending…" while a payment
    // was in flight silently became a generic one, and the word the user needed
    // (which action is happening?) was the one we removed.
    const buttonContent = isLoading ? (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-3" />
        <span>{children ?? LOADING_FALLBACK_LABEL}</span>
      </div>
    ) : (
      children
    );

    if (props.href) {
      return (
        <Link
          href={props.href}
          className={cn(
            COMPONENT_STYLES.button.base,
            COMPONENT_STYLES.button.variants[variant],
            COMPONENT_STYLES.button.sizes[size],
            className
          )}
        >
          {buttonContent}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(
          COMPONENT_STYLES.button.base,
          COMPONENT_STYLES.button.variants[variant],
          COMPONENT_STYLES.button.sizes[size],
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

Button.displayName = 'Button';

// Export both named and default exports to handle different import patterns
export { Button };
export default Button;
