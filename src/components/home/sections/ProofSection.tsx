'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Lightbulb } from 'lucide-react';
import Button from '@/components/ui/Button';
import { EXAMPLE_USE_CASES, SECTION_HEADERS, CTA_LABELS } from '@/config/landing-page';

/**
 * ProofSection - Example Use Cases
 *
 * Shows potential use cases clearly labeled as examples, not fake testimonials.
 * Users can see what's possible without being misled by fabricated stories.
 */
export default function ProofSection() {
  const { exampleUseCases } = SECTION_HEADERS;

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-10 lg:mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-50 text-orange-700 mb-4">
            <Lightbulb className="w-4 h-4" />
            <span className="text-sm font-medium">Possibilities</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            {exampleUseCases.title}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {exampleUseCases.subtitle}
          </p>
        </div>

        {/* Use Case Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-10 lg:mb-12">
          {EXAMPLE_USE_CASES.map((useCase, index) => (
            <motion.div
              key={useCase.category}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`bg-gradient-to-br ${useCase.gradient} rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 border border-gray-100 hover:shadow-lg transition-shadow duration-300`}
            >
              {/* Category Badge */}
              <div className="flex items-start justify-between mb-4">
                <span className="text-3xl sm:text-4xl">{useCase.emoji}</span>
                <span className="px-3 py-1 bg-white/80 text-gray-600 text-xs sm:text-sm font-medium rounded-full">
                  {useCase.category}
                </span>
              </div>

              {/* Title & Description */}
              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">{useCase.title}</h3>
              <p className="text-sm sm:text-base text-gray-700 mb-4 leading-relaxed">
                {useCase.description}
              </p>

              {/* Transparency Example */}
              <div className="bg-white/60 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-semibold text-gray-800">Transparency in action: </span>
                  {useCase.transparencyExample}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            These are just examples. What will you create?
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link href="/discover">
              <Button size="lg" className="w-full sm:w-auto">
                {CTA_LABELS.browseAll} Projects
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                {CTA_LABELS.primaryAction}
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
