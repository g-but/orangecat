'use client'

import { cn } from '@/lib/utils'

interface ProgressProps {
  value?: number
  max?: number
  className?: string
}

export function Progress({ value = 0, max = 100, className }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

  return (
    <div className={cn('w-full bg-gray-200 rounded-full h-2', className)}>
      <div
        className="bg-bitcoinOrange h-2 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      />
    </div>
  )
}

export { Progress as default }
