import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: ReactNode
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full'
  className?: string
  header?: ReactNode
  footer?: ReactNode
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  description?: string
  className?: string
  children?: ReactNode
}

interface PageSectionProps {
  children: ReactNode
  className?: string
  background?: 'default' | 'gray' | 'white' | 'tiffany'
}

export function PageLayout({ 
  children, 
  maxWidth = '6xl', 
  className,
  header,
  footer 
}: PageLayoutProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md', 
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-full'
  }

  return (
    <div className={cn("min-h-screen pt-20", className)}>
      <div className={cn("container mx-auto px-4 py-8", maxWidthClasses[maxWidth])}>
        {header}
        {children}
        {footer}
      </div>
    </div>
  )
}

export function PageHeader({ 
  title, 
  subtitle, 
  description, 
  className,
  children 
}: PageHeaderProps) {
  return (
    <div className={cn("text-center mb-12", className)}>
      <h1 className="text-4xl font-bold mb-4 text-gray-900">{title}</h1>
      {subtitle && (
        <p className="text-xl text-tiffany-600 font-medium mb-4">{subtitle}</p>
      )}
      {description && (
        <p className="text-lg text-gray-600 max-w-3xl mx-auto">{description}</p>
      )}
      {children}
    </div>
  )
}

export function PageSection({ 
  children, 
  className,
  background = 'default' 
}: PageSectionProps) {
  const backgroundClasses = {
    default: '',
    gray: 'bg-gray-50 -mx-4 px-4 py-8 md:-mx-6 md:px-6',
    white: 'bg-white -mx-4 px-4 py-8 md:-mx-6 md:px-6 shadow-sm rounded-lg',
    tiffany: 'bg-tiffany-50 -mx-4 px-4 py-8 md:-mx-6 md:px-6 rounded-lg'
  }

  return (
    <section className={cn("mb-12", backgroundClasses[background], className)}>
      {children}
    </section>
  )
} 