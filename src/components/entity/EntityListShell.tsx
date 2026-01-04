'use client';

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EntityListShellProps {
  title: string
  description?: string
  headerActions?: ReactNode
  children: ReactNode
  className?: string
}

export default function EntityListShell({
  title,
  description,
  headerActions,
  children,
  className,
}: EntityListShellProps) {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8 pb-20 md:pb-8', className)}>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="text-gray-600 mt-1 text-sm sm:text-base">{description}</p>}
        </div>
        {headerActions && (
          <div className="w-full sm:w-auto">
            {headerActions}
          </div>
        )}
      </div>
      {children}
    </div>
  )
}

