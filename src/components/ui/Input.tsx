import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  description?: string
  error?: string
  required?: boolean
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  description,
  error,
  required = false,
  icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {icon}
          </div>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-3 border ${
            error ? 'border-red-300' : 'border-gray-200'
          } rounded-lg focus:ring-2 focus:ring-tiffany-500 focus:border-tiffany-500 transition-all duration-200 ${
            icon ? 'pl-10' : ''
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-red-500 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </p>
      )}
      {description && !error && (
        <p className="text-sm text-gray-500">{description}</p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input 