import Link from 'next/link';
import { Check, X, ArrowRight, Plus } from 'lucide-react';
import {
  PLATFORM_COMPARISON,
  PLATFORM_BENEFITS,
  TRUST_SIGNALS,
  SECTION_HEADERS,
  CTA_LABELS,
} from '@/config/landing-page';
import { ROUTES } from '@/config/routes';

export default function TrustSection() {
  const { whyBitcoin } = SECTION_HEADERS;

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-surface-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold text-fg-primary mb-3 sm:mb-4">
            {whyBitcoin.title}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-fg-secondary max-w-3xl mx-auto">
            {whyBitcoin.subtitle}
          </p>
        </div>

        {/* Comparison Table - Desktop */}
        <div className="mb-12 sm:mb-20 hidden md:block">
          <div className="bg-surface-base rounded-lg shadow-sm border border-default overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-default">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-fg-secondary">
                      Feature
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-fg-secondary">
                      Traditional Platforms
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-fg-primary bg-surface-raised/50">
                      OrangeCat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fg-tertiary">
                  {PLATFORM_COMPARISON.map(row => (
                    <tr
                      key={row.feature}
                      className={row.highlight ? 'bg-status-positive-subtle' : ''}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-fg-primary">
                        {row.feature}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="w-4 h-4 text-status-negative" />
                          <span className="text-sm text-fg-secondary">{row.traditional}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-surface-raised/30">
                        <div className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4 text-status-positive" />
                          <span
                            className={`text-sm font-semibold ${row.highlight ? 'text-status-positive' : 'text-fg-primary'}`}
                          >
                            {row.orangecat}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Comparison Cards - Mobile */}
        <div className="mb-12 space-y-3 md:hidden">
          {PLATFORM_COMPARISON.map(row => (
            <div
              key={row.feature}
              className={`bg-surface-base rounded-lg shadow-sm border border-default p-4 ${row.highlight ? 'ring-2 ring-status-positive' : ''}`}
            >
              <h4 className="text-sm font-semibold text-fg-primary mb-3">{row.feature}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-surface-raised/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <X className="w-3 h-3 text-status-negative" />
                    <span className="text-xs font-medium text-fg-secondary">Traditional</span>
                  </div>
                  <span className="text-xs text-fg-secondary">{row.traditional}</span>
                </div>
                <div className="text-center p-2 bg-surface-raised/50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Check className="w-3 h-3 text-status-positive" />
                    <span className="text-xs font-medium text-fg-primary">OrangeCat</span>
                  </div>
                  <span
                    className={`text-xs font-semibold ${row.highlight ? 'text-status-positive' : 'text-fg-primary'}`}
                  >
                    {row.orangecat}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {PLATFORM_BENEFITS.map(benefit => (
            <div key={benefit.title} className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg bg-surface-raised mb-3 sm:mb-4">
                <benefit.icon className="w-6 h-6 sm:w-8 sm:h-8 text-fg-primary" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-fg-primary mb-2">
                {benefit.title}
              </h3>
              <p className="text-sm text-fg-secondary leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>

        {/* Trust Signals */}
        <div className="mt-10 sm:mt-12 lg:mt-16 text-center">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-surface-raised rounded-lg">
            {TRUST_SIGNALS.map((signal, index) => (
              <div key={signal} className="flex items-center gap-1.5 sm:gap-2">
                {index > 0 && (
                  <div className="w-px h-3 sm:h-4 bg-border-strong hidden sm:block mr-3 sm:mr-4 lg:mr-6" />
                )}
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-status-positive-subtle0 rounded-full" />
                <span className="text-xs sm:text-sm font-medium text-fg-primary">{signal}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="mt-12 sm:mt-16 lg:mt-20 text-center">
          <p className="text-base sm:text-lg text-fg-secondary mb-6">
            Ready to make something? It&apos;s free, no gatekeepers.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href={ROUTES.AUTH}
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-fg-inverted bg-fg-primary rounded-lg hover:bg-muted-strong transition-colors duration-150"
            >
              <Plus className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
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
