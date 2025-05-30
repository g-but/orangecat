import { ButtonHTMLAttributes, forwardRef } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  href?: string
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 transform'
    
    const variants = {
      primary: 'bg-tiffany-600 text-white hover:bg-tiffany-700 focus-visible:ring-tiffany-500 shadow-sm hover:shadow-md active:shadow-sm',
      secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-500 shadow-sm hover:shadow-md active:shadow-sm',
      ghost: 'hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-500',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 shadow-sm hover:shadow-md active:shadow-sm',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus-visible:ring-gray-500 shadow-sm hover:shadow-md active:shadow-sm'
    }

    const sizes = {
      sm: 'h-9 min-h-[36px] px-3 text-sm min-w-[80px]',
      md: 'h-10 min-h-[40px] px-4 text-base min-w-[100px] sm:h-11 sm:min-h-[44px] sm:px-5',
      lg: 'h-12 min-h-[48px] px-6 text-lg min-w-[120px] sm:h-14 sm:min-h-[56px] sm:px-8 sm:text-xl',
    }

    const buttonContent = isLoading ? (
      <div className="flex items-center">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
        Loading...
      </div>
    ) : children

    if (props.href) {
      return (
        <Link
          href={props.href}
          className={cn(
            baseStyles,
            variants[variant],
            sizes[size],
            className
          )}
        >
          {buttonContent}
        </Link>
      )
    }

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading}
        {...props}
      >
        {buttonContent}
      </button>
    )
  }
)

Button.displayName = 'Button'

export default Button 