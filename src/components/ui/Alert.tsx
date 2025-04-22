import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface AlertProps {
  children: ReactNode
  variant?: 'success' | 'error' | 'warning' | 'info'
  className?: string
}

export function Alert({ children, variant = 'info', className }: AlertProps) {
  const variants = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200'
  }

  return (
    <div
      className={cn(
        'p-4 rounded-md border',
        variants[variant],
        className
      )}
    >
      {children}
    </div>
  )
} 