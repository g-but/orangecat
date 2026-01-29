'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';
import { SUPER_APP_CATEGORIES, SECTION_HEADERS, CTA_LABELS } from '@/config/landing-page';

/**
 * WhatCanYouDoSection - Simplified Feature Overview
 *
 * Shows 4 main categories with 2 key features each.
 * Uses config for content (SSOT) instead of hardcoding 13 entities.
 * Links to /discover for users who want to explore more.
 */

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 },
  },
};

export default function WhatCanYouDoSection() {
  const { whatCanYouDo } = SECTION_HEADERS;

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10 sm:mb-12 lg:mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-tiffany-50 text-tiffany-700 mb-4">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Super-App</span>
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            {whatCanYouDo.title}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {whatCanYouDo.subtitle}
          </p>
        </motion.div>

        {/* Categories Grid - 4 cards in 2x2 grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10 lg:mb-12"
        >
          {SUPER_APP_CATEGORIES.map(category => {
            const Icon = category.icon;

            return (
              <motion.div
                key={category.id}
                variants={itemVariants}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Category Header */}
                <div className={`${category.bgColor} p-4 sm:p-6 border-b border-gray-200`}>
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}
                    >
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {category.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600">{category.description}</p>
                    </div>
                  </div>
                </div>

                {/* Features List */}
                <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                  {category.features.map(feature => (
                    <div
                      key={feature.title}
                      className="flex items-start gap-3 p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div
                        className={`w-2 h-2 rounded-full bg-gradient-to-r ${category.color} mt-2 flex-shrink-0`}
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1">
                          {feature.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6">
            Ready to explore? These features work together seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/discover"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-bitcoinOrange to-orange-500 hover:from-orange-600 hover:to-orange-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              {CTA_LABELS.secondaryAction}
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200"
            >
              {CTA_LABELS.createAccount}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
