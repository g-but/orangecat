import { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
  subtitle?: string
}

export default function Card({ children, className = '', title, subtitle }: CardProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden transition-all duration-300 hover:shadow-md ${className}`}>
      {(title || subtitle) && (
        <div className="px-8 pt-8 pb-6">
          {title && <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>}
          {subtitle && <p className="text-gray-500">{subtitle}</p>}
        </div>
      )}
      <div className="px-8 pb-8">
        {children}
      </div>
    </div>
  )
} 