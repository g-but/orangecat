'use client';

import { motion } from 'framer-motion';
import { UserPlus, Grid3x3, Bitcoin, TrendingUp } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: UserPlus,
    title: 'Create Your Account',
    description: 'Sign up free in seconds. Get instant access to everything OrangeCat offers.',
    time: '30 seconds',
    color: 'from-tiffany-500 to-tiffany-600',
    bgColor: 'bg-tiffany-50',
  },
  {
    number: '2',
    icon: Grid3x3,
    title: 'Choose What to Do',
    description: 'Sell products, offer services, fund projects, build communities, deploy AI—pick what fits your needs.',
    time: '2 minutes',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
  },
  {
    number: '3',
    icon: Bitcoin,
    title: 'Transact with Bitcoin',
    description: 'Link your wallet. Buy, sell, fund, or receive—all directly with Bitcoin. Zero platform fees.',
    time: 'Instant',
    color: 'from-bitcoinOrange to-orange-600',
    bgColor: 'bg-orange-50',
  },
  {
    number: '4',
    icon: TrendingUp,
    title: 'Build Through Transparency',
    description: 'Every transaction on-chain. Share updates, build trust, grow your reputation.',
    time: 'Ongoing',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
  },
];

export default function HowItWorksSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            How It Works
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-2xl mx-auto">
            From idea to execution in 4 simple steps. One platform for everything.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-tiffany-500 via-purple-500 via-bitcoinOrange to-green-500 opacity-20" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative"
              >
                {/* Card */}
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 sm:p-8 h-full">
                  {/* Step Number Badge */}
                  <div className="relative mb-4 sm:mb-6">
                    <div
                      className={`inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${step.color} text-white text-xl sm:text-2xl font-bold shadow-lg`}
                    >
                      {step.number}
                    </div>
                    {/* Time Badge */}
                    <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2">
                      <span className="inline-flex items-center px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold bg-gray-900 text-white shadow-md">
                        {step.time}
                      </span>
                    </div>
                  </div>

                  {/* Icon */}
                  <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${step.bgColor} mb-3 sm:mb-4`}>
                    <step.icon className="w-5 h-5 sm:w-6 sm:h-6 text-gray-700" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{step.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow (Desktop only, not on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-4 transform translate-x-1/2 z-10">
                    <svg
                      className="w-8 h-8 text-gray-300"
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
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="text-center mt-10 sm:mt-12"
        >
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">Ready to get started?</p>
          <a
            href="/auth"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-bitcoinOrange to-orange-500 hover:from-orange-600 hover:to-orange-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Create Free Account
          </a>
        </motion.div>
      </div>
    </section>
  );
}
