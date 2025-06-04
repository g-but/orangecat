import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'outline'
}

export const Badge = ({ variant = 'default', className, ...props }: BadgeProps) => (
  <span
    {...props}
    className={cn(
      'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold',
      variant === 'default'
        ? 'bg-orange-100 text-orange-700'
        : 'border border-gray-300 text-gray-700',
      className
    )}
  />
)

export default Badge   // optional, mirrors Card/Table pattern 