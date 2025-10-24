"use client"

import Link from 'next/link'
import { useMemo } from 'react'
import Button from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { AlertCircle } from 'lucide-react'

interface EntityListPageProps<T> {
  title: string
  description?: string
  icon?: React.ReactNode
  primaryHref: string
  primaryLabel: string
  secondaryHref?: string
  secondaryLabel?: string
  items: T[]
  emptyTitle: string
  emptyDescription: string
  renderItem: (item: T) => React.ReactNode
  explanation?: string
  examples?: { title: string; description: string }[]
}

export default function EntityListPage<T>(props: EntityListPageProps<T>) {
  const {
    title,
    description,
    icon,
    primaryHref,
    primaryLabel,
    secondaryHref,
    secondaryLabel,
    items,
    emptyTitle,
    emptyDescription,
    renderItem,
    explanation,
    examples,
  } = props

  const hasItems = useMemo(() => items && items.length > 0, [items])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="bg-gradient-to-r from-[#F7931A] to-[#81D8D0] text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-3">
              {icon ? (
                <div className="w-10 h-10 rounded-lg bg-white/20 text-white flex items-center justify-center">
                  {icon}
                </div>
              ) : null}
              <div>
                <h1 className="text-xl font-semibold">{title}</h1>
                {description ? (
                  <p className="text-sm opacity-90">{description}</p>
                ) : null}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {secondaryHref && secondaryLabel ? (
                <Button href={secondaryHref} variant="outline" className="text-white border-white hover:bg-white/20"> {secondaryLabel}</Button>
              ) : null}
              <Button href={primaryHref} className="bg-white text-[#F7931A] hover:bg-white/90">{primaryLabel}</Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {(explanation || examples?.length) ? (
          <div className="bg-white rounded-lg shadow p-6">
            {explanation ? (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">What is a {title.slice(0, -1)}?</h2>
                <p className="text-gray-600">{explanation}</p>
              </div>
            ) : null}
            {examples?.length ? (
              <div>
                <h3 className="text-md font-semibold mb-4">Examples</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {examples.map((ex, idx) => (
                    <Card key={idx} className="p-4">
                      <h4 className="font-medium mb-2">{ex.title}</h4>
                      <p className="text-sm text-gray-600">{ex.description}</p>
                    </Card>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        {hasItems ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow overflow-hidden">
                <CardContent className="p-4">{renderItem(item)}</CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-lg shadow">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{emptyTitle}</h2>
            <p className="text-gray-600 max-w-md mb-6">{emptyDescription}</p>
            <div className="flex items-center gap-3">
              {secondaryHref && secondaryLabel ? (
                <Button href={secondaryHref} variant="outline">{secondaryLabel}</Button>
              ) : null}
              <Button href={primaryHref}>{primaryLabel}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
