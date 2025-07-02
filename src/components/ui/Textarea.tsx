import { TextareaHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  description?: string
  error?: string
  required?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, description, error, required, id, ...props }, ref) => {
    const generatedId = useId()
    const textareaId = id || generatedId
    const errorId = `${textareaId}-error`
    const descriptionId = `${textareaId}-description`

    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={textareaId} className="block text-sm font-medium text-gray-700">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          id={textareaId}
          className={cn(
            'flex min-h-[80px] w-full rounded-md border px-3 py-2 text-sm shadow-sm',
            'border-gray-300 bg-white placeholder:text-gray-400',
            'focus:border-tiffany-500 focus:ring-tiffany-500 focus:outline-none focus:ring-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-300 focus:border-red-500 focus:ring-red-500',
            className
          )}
          aria-describedby={cn(
            error && errorId,
            description && descriptionId
          )}
          aria-invalid={error ? 'true' : 'false'}
          ref={ref}
          {...props}
        />
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
    )
  }
)

Textarea.displayName = 'Textarea'

export default Textarea 