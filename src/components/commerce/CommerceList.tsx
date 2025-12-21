'use client';

import CommerceCard from './CommerceCard'

interface BaseItem {
  id: string
  title: string
  description?: string | null
  thumbnail_url?: string | null
  price_sats?: number
  hourly_rate_sats?: number | null
  fixed_price_sats?: number | null
}

interface CommerceListProps<T extends BaseItem = BaseItem> {
  items: T[]
  makeHref: (item: T) => string
  makeBadge?: (item: T) => string | undefined
  makePriceLabel?: (item: T) => string | undefined
  emptyState?: { title: string; description?: string }
  makeActions?: (item: T) => React.ReactNode
}

export default function CommerceList<T extends BaseItem>({
  items,
  makeHref,
  makeBadge,
  makePriceLabel,
  emptyState = { title: 'No items yet' },
  makeActions,
}: CommerceListProps<T>) {
  if (!items || items.length === 0) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center">
        <h3 className="font-semibold text-gray-900">{emptyState.title}</h3>
        {emptyState.description && (
          <p className="text-sm text-gray-600 mt-2">{emptyState.description}</p>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <CommerceCard
          key={item.id}
          id={item.id}
          title={item.title}
          description={item.description}
          priceLabel={makePriceLabel?.(item)}
          thumbnailUrl={(item as any).thumbnail_url}
          href={makeHref(item)}
          badge={makeBadge?.(item)}
          actions={makeActions?.(item)}
        />
      ))}
    </div>
  )
}
