'use client';

import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ReactNode } from 'react'

interface CommerceCardProps {
  id: string
  title: string
  description?: string | null
  priceLabel?: string
  thumbnailUrl?: string | null
  href: string
  badge?: string
  className?: string
  actions?: ReactNode
}

export default function CommerceCard({
  id,
  title,
  description,
  priceLabel,
  thumbnailUrl,
  href,
  badge,
  className,
  actions,
}: CommerceCardProps) {
  return (
    <Link href={href} className={cn('block rounded-xl border bg-white hover:shadow-md transition-shadow', className)}>
      <div className="p-4 flex gap-4">
        <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
          {thumbnailUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-gray-400 text-xs">No Image</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
            {badge && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border">{badge}</span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-600 line-clamp-2 mt-1">{description}</p>
          )}
          {priceLabel && (
            <div className="text-sm text-gray-900 font-medium mt-2">{priceLabel}</div>
          )}
        </div>
      </div>
      {actions && (
        <div className="px-4 pb-4">
          <div className="pt-3 border-t flex items-center justify-end">
            {actions}
          </div>
        </div>
      )}
    </Link>
  )
}
