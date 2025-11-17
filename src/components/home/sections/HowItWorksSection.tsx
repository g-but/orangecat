'use client';

import { motion } from 'framer-motion';
import { Edit3, Share2, Zap } from 'lucide-react';

const steps = [
  {
    number: '1',
    icon: Edit3,
    title: 'Create Your Profile',
    description: 'Share your story, link your Bitcoin wallet, add projects you\'re working on',
    time: '2 minutes',
    color: 'from-bitcoinOrange to-orange-500',
    bgColor: 'bg-orange-50',
  },
  {
    number: '2',
    icon: Share2,
    title: 'Share & Build Trust',
    description: 'Share your profile. People can support you OR specific projects.',
    time: 'Instant',
    color: 'from-tiffany-500 to-tiffany-600',
    bgColor: 'bg-tiffany-50',
  },
  {
    number: '3',
    icon: Zap,
    title: 'Show Transparency',
    description: 'Receive Bitcoin directly. Show how you use it. Build your transparency score.',
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
            Profile-based transparency. People can support you OR your specific projects.
          </p>
        </div>

        {/* Timeline */}
        <div className="relative">
          {/* Connection Line (Desktop) */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-1 bg-gradient-to-r from-bitcoinOrange via-tiffany-500 to-green-500 opacity-20" />

          {/* Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
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
                    <step.icon className={`w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br ${step.color} bg-clip-text text-transparent`} style={{ WebkitTextFillColor: 'transparent' }} />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 sm:mb-3">{step.title}</h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{step.description}</p>
                </div>

                {/* Arrow (Desktop only, not on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-24 -right-6 transform translate-x-1/2">
                    <svg
                      className="w-12 h-12 text-gray-300"
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
            Start Your Project Now
          </a>
        </motion.div>
      </div>
    </section>
  );
}
