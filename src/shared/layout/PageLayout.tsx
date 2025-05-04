import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface PageLayoutProps extends HTMLAttributes<HTMLDivElement> {
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
}

export const PageLayout = forwardRef<HTMLDivElement, PageLayoutProps>(
  ({ className, maxWidth = 'lg', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'mx-auto w-full px-4 sm:px-6 lg:px-8',
          {
            'max-w-screen-sm': maxWidth === 'sm',
            'max-w-screen-md': maxWidth === 'md',
            'max-w-screen-lg': maxWidth === 'lg',
            'max-w-screen-xl': maxWidth === 'xl',
            'max-w-screen-2xl': maxWidth === '2xl',
            'max-w-full': maxWidth === 'full'
          },
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
) 