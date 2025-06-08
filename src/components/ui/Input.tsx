import { InputHTMLAttributes, forwardRef, useId } from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  icon?: LucideIcon
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, icon: Icon, id, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id || generatedId

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">
            {label}
          </label>
        )}
        <div className="relative">
          {Icon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icon className="h-5 w-5 text-gray-400" data-testid={`icon-${Icon.displayName?.toLowerCase() || 'icon'}`} />
            </div>
          )}
          <input
            id={inputId}
            className={cn(
              'block w-full rounded-md border-gray-300 shadow-sm focus:border-tiffany-500 focus:ring-tiffany-500 sm:text-sm',
              Icon && 'pl-10',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
      </div>
    )
  }
)

Input.displayName = 'Input'

export default Input 