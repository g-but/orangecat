import Link from 'next/link';
import Button from '@/components/ui/Button';
import { HOW_IT_WORKS_STEPS, SECTION_HEADERS, CTA_LABELS } from '@/config/landing-page';
import { ROUTES } from '@/config/routes';

export default function HowItWorksSection() {
  const { howItWorks } = SECTION_HEADERS;

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-surface-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-semibold text-fg-primary mb-3 sm:mb-4">
            {howItWorks.title}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-fg-secondary max-w-2xl mx-auto">
            {howItWorks.subtitle}
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-px bg-border" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {HOW_IT_WORKS_STEPS.map((step, index) => (
              <div key={step.number} className="relative">
                {/* Card */}
                <div className="oc-surface oc-card-link h-full p-6 sm:p-8">
                  {/* Step Number Badge */}
                  <div className="mb-4 sm:mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-lg sm:rounded-lg ${step.iconGradient} text-white text-xl sm:text-2xl font-bold shadow-sm`}
                    >
                      {step.number}
                    </div>
                  </div>

                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-lg ${step.bgColor} mb-3 sm:mb-4`}
                  >
                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-fg-primary" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-semibold text-fg-primary mb-2 sm:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-fg-secondary leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Arrow (Desktop only, not on last item) */}
                {index < HOW_IT_WORKS_STEPS.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-4 transform translate-x-1/2 z-10">
                    <svg
                      className="w-8 h-8 text-fg-tertiary dark:text-fg-secondary"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-10 sm:mt-12">
          <p className="text-sm sm:text-base text-fg-secondary mb-4 sm:mb-6">
            Ready to get started?
          </p>
          <Link href={ROUTES.AUTH}>
            <Button variant="accent" size="lg">
              {CTA_LABELS.createAccount}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
