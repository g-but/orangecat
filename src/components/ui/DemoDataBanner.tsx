'use client'

import { Info } from 'lucide-react'

interface DemoDataBannerProps {
  className?: string
}

export default function DemoDataBanner({ className = '' }: DemoDataBannerProps) {
  return (
    <div className={`inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-1 rounded-md text-xs font-medium border border-amber-200 ${className}`}>
      <Info className="w-3 h-3" />
      <span>Demo data for illustration</span>
    </div>
  )
} 