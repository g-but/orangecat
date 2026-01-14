'use client';

import { useMemo } from 'react';
import Button from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { AlertCircle } from 'lucide-react';

interface EntityListPageProps<T> {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  primaryHref: string;
  primaryLabel: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  items: T[];
  emptyTitle: string;
  emptyDescription: string;
  renderItem: (item: T) => React.ReactNode;
  explanation?: string;
  examples?: { title: string; description: string }[];
  headerActions?: React.ReactNode;
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
    headerActions,
  } = props;

  const hasItems = useMemo(() => items && items.length > 0, [items]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {icon ? (
                <div className="w-9 h-9 rounded-md bg-gray-100 text-gray-700 flex items-center justify-center">
                  {icon}
                </div>
              ) : null}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                {description ? <p className="text-sm text-gray-600">{description}</p> : null}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {headerActions}
              {secondaryHref && secondaryLabel ? (
                <Button href={secondaryHref} variant="ghost" size="sm" className="rounded-md">
                  {secondaryLabel}
                </Button>
              ) : null}
              <Button href={primaryHref} size="sm" className="rounded-md">
                {primaryLabel}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
        {explanation || examples?.length ? (
          <div className="bg-white rounded-lg border p-5">
            {explanation ? (
              <div>
                <h2 className="text-base font-medium text-gray-900 mb-2">
                  What is a {title.slice(0, -1)}?
                </h2>
                <p className="text-gray-600">{explanation}</p>
              </div>
            ) : null}
            {examples?.length ? (
              <details className="mt-4">
                <summary className="cursor-pointer list-none select-none text-sm font-semibold text-gray-900 mb-3">
                  Examples
                </summary>
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 mt-2">
                  {examples.map((ex, idx) => (
                    <Card key={idx} className="p-4">
                      <h4 className="font-medium mb-1 text-gray-900 truncate">{ex.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">{ex.description}</p>
                    </Card>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        ) : null}

        {hasItems ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((item, idx) => (
              <Card
                key={idx}
                className="hover:shadow-sm transition-shadow border overflow-hidden flex flex-col"
              >
                <CardContent className="p-4 flex-1 flex flex-col">{renderItem(item)}</CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-lg border">
            <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <AlertCircle className="w-7 h-7 text-gray-400" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{emptyTitle}</h2>
            <p className="text-gray-600 max-w-md mb-6">{emptyDescription}</p>
            <div className="flex items-center gap-3">
              {secondaryHref && secondaryLabel ? (
                <Button href={secondaryHref} variant="outline">
                  {secondaryLabel}
                </Button>
              ) : null}
              <Button href={primaryHref}>{primaryLabel}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
