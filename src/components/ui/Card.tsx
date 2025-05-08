import { HTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-orange-100 shadow-sm hover:border-orange-200 transition-all duration-200',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
} 