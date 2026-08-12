import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SUPER_APP_CATEGORIES, SECTION_HEADERS, CTA_LABELS } from '@/config/landing-page';
import { ROUTES } from '@/config/routes';

/**
 * WhatCanYouDoSection - Simplified Feature Overview
 *
 * Shows 4 main categories with 2 key features each.
 * Uses config for content (SSOT) instead of hardcoding 13 entities.
 * Links to /discover for users who want to explore more.
 */

export default function WhatCanYouDoSection() {
  const { whatCanYouDo } = SECTION_HEADERS;

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-surface-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-raised text-fg-primary mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">For Makers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold text-fg-primary mb-3 sm:mb-4">
            {whatCanYouDo.title}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-fg-secondary max-w-3xl mx-auto">
            {whatCanYouDo.subtitle}
          </p>
        </div>

        {/* Categories Grid - 4 cards in 2x2 grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10 lg:mb-12">
          {SUPER_APP_CATEGORIES.map(category => {
            const Icon = category.icon;

            return (
              <div key={category.id} className="oc-surface oc-card-link overflow-hidden">
                {/* Category Header */}
                <div className="p-4 sm:p-6 border-b border-default bg-surface-raised/30">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-surface-base border border-default flex items-center justify-center">
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-fg-primary" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-semibold text-fg-primary">
                        {category.title}
                      </h3>
                      <p className="text-sm sm:text-base text-fg-secondary">
                        {category.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {category.features.map(feature => (
                    <div
                      key={feature.title}
                      className="flex items-start gap-3 p-3 sm:p-4 rounded-lg hover:bg-surface-raised/50 transition-colors duration-200"
                    >
                      <div className="w-2 h-2 rounded-full bg-fg-primary mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-fg-primary text-sm sm:text-base mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-fg-secondary">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <p className="text-sm sm:text-base text-fg-secondary mb-4 sm:mb-6">
            Ready to make something? These features work together seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href={ROUTES.AUTH}
              className={cn(
                'inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-fg-inverted bg-fg-primary rounded-lg hover:bg-muted-strong transition-colors duration-150'
              )}
            >
              {CTA_LABELS.startCreating}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <Link
              href={ROUTES.DISCOVER}
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-fg-primary bg-surface-base hover:bg-surface-raised border border-default rounded-lg transition-all duration-200"
            >
              {CTA_LABELS.discoverAction}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
