'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

// Group entities by super-app category
const categories = [
  {
    title: 'Commerce',
    description: 'Buy and sell with Bitcoin',
    color: 'from-blue-500 to-blue-600',
    bgColor: 'bg-blue-50',
    entities: ['product', 'service', 'asset'] as const,
  },
  {
    title: 'Finance',
    description: 'Fund, lend, and manage Bitcoin',
    color: 'from-orange-500 to-orange-600',
    bgColor: 'bg-orange-50',
    entities: ['project', 'cause', 'loan', 'wallet'] as const,
  },
  {
    title: 'Community',
    description: 'Connect and collaborate',
    color: 'from-purple-500 to-purple-600',
    bgColor: 'bg-purple-50',
    entities: ['group', 'event', 'wishlist'] as const,
  },
  {
    title: 'AI & Innovation',
    description: 'Build with artificial intelligence',
    color: 'from-green-500 to-green-600',
    bgColor: 'bg-green-50',
    entities: ['ai_assistant', 'research'] as const,
  },
];

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
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            What Can You Do on OrangeCat?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            From selling products to funding research—all powered by Bitcoin in one unified platform.
          </p>
        </motion.div>

        {/* Categories Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10 lg:mb-12"
        >
          {categories.map((category) => (
            <motion.div
              key={category.title}
              variants={itemVariants}
              className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300"
            >
              {/* Category Header */}
              <div className={`${category.bgColor} p-4 sm:p-6 border-b border-gray-200`}>
                <h3 className={`text-xl sm:text-2xl font-bold bg-gradient-to-r ${category.color} bg-clip-text text-transparent mb-1`}>
                  {category.title}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">{category.description}</p>
              </div>

              {/* Features List */}
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {category.entities.map((entityType) => {
                  const meta = ENTITY_REGISTRY[entityType];
                  const Icon = meta.icon;

                  return (
                    <Link
                      key={entityType}
                      href={meta.basePath}
                      className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-gray-50 transition-colors duration-200 group"
                    >
                      <div className={`${category.bgColor} p-2 sm:p-3 rounded-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-200`}>
                        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-r ${category.color} bg-clip-text`} style={{ WebkitTextFillColor: 'transparent' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base mb-1 group-hover:text-gray-700">
                          {meta.namePlural}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600">{meta.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all duration-200 flex-shrink-0 mt-1" />
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          ))}
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
            Ready to explore? Start with any feature—they all work together seamlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
            <Link
              href="/discover"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-bitcoinOrange to-orange-500 hover:from-orange-600 hover:to-orange-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            >
              Explore the Platform
              <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:h-5" />
            </Link>
            <Link
              href="/auth"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-gray-700 bg-white hover:bg-gray-50 border-2 border-gray-300 hover:border-gray-400 rounded-lg transition-all duration-200"
            >
              Create Free Account
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
