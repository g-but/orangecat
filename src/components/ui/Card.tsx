import React from 'react'
import { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-orange-100 shadow-sm hover:border-orange-200 hover:shadow-md transition-all duration-200 active:scale-[0.98] transform',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...p} className={cn('p-4 sm:p-6', className)} />
)

export const CardTitle = ({ className, ...p }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 {...p} className={cn('text-base sm:text-lg font-semibold leading-tight', className)} />
)

export const CardDescription = ({ className, ...p }: React.HTMLAttributes<HTMLParagraphElement>) => (
  <p {...p} className={cn('text-sm text-gray-500 leading-relaxed', className)} />
)

export const CardContent = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...p} className={cn('p-4 sm:p-6 pt-0', className)} />
)

// keep default export so existing imports still work
export default Card 