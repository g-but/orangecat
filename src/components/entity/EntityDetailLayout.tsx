'use client';

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface EntityDetailLayoutProps {
  title: string
  subtitle?: string
  headerActions?: ReactNode
  left: ReactNode
  right?: ReactNode
  className?: string
}

export default function EntityDetailLayout({
  title,
  subtitle,
  headerActions,
  left,
  right,
  className,
}: EntityDetailLayoutProps) {
  return (
    <div className={cn('min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20 p-4 sm:p-6 lg:p-8', className)}>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-1">{subtitle}</p>}
        </div>
        {headerActions}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">{left}</div>
        <div>{right}</div>
      </div>
    </div>
  )
}

