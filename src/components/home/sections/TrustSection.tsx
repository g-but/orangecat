'use client';

import { motion } from 'framer-motion';
import { Check, X, Bitcoin, Globe, Shield, Zap } from 'lucide-react';

const comparisonData = [
  { feature: 'Platform fees', traditional: '5-10%', orangecat: '0%', highlight: true },
  { feature: 'Geographic reach', traditional: 'Limited', orangecat: 'Global' },
  { feature: 'Funds control', traditional: 'Platform holds', orangecat: 'Direct to wallet' },
  { feature: 'Account freezing', traditional: 'Can happen', orangecat: 'Impossible' },
  { feature: 'Transaction speed', traditional: '3-7 days', orangecat: 'Instant' },
  { feature: 'Transparency', traditional: 'Limited', orangecat: 'Blockchain verified' },
];

const benefits = [
  {
    icon: Bitcoin,
    title: 'No Platform Fees',
    description: 'Keep 100% of donations. Bitcoin transactions go directly to your wallet.',
  },
  {
    icon: Globe,
    title: 'Works Globally',
    description: 'Accept support from anywhere in the world. No geographic restrictions.',
  },
  {
    icon: Shield,
    title: 'Transparent & Secure',
    description: 'All transactions are recorded on the Bitcoin blockchain. Fully auditable.',
  },
  {
    icon: Zap,
    title: 'Instant Setup',
    description: 'Create your funding page in 2 minutes. No lengthy verification process.',
  },
];

export default function TrustSection() {
  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            Why Bitcoin? Why OrangeCat?
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            Traditional platforms charge fees and control your funds. Bitcoin changes the game.
          </p>
        </div>

        {/* Comparison Table - Desktop */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 sm:mb-20 hidden md:block"
        >
          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-600">
                      Traditional Platforms
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-bitcoinOrange bg-orange-50">
                      OrangeCat
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {comparisonData.map((row, index) => (
                    <motion.tr
                      key={row.feature}
                      initial={{ opacity: 0, x: -20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={row.highlight ? 'bg-green-50' : ''}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">{row.feature}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <X className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-gray-600">{row.traditional}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center bg-orange-50/50">
                        <div className="flex items-center justify-center gap-2">
                          <Check className="w-4 h-4 text-green-600" />
                          <span className={`text-sm font-semibold ${row.highlight ? 'text-green-700' : 'text-gray-900'}`}>
                            {row.orangecat}
                          </span>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>

        {/* Comparison Cards - Mobile */}
        <div className="mb-12 space-y-3 md:hidden">
          {comparisonData.map((row, index) => (
            <motion.div
              key={row.feature}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`bg-white rounded-lg shadow-md border border-gray-200 p-4 ${row.highlight ? 'ring-2 ring-green-500' : ''}`}
            >
              <h4 className="text-sm font-semibold text-gray-900 mb-3">{row.feature}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-2 bg-red-50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <X className="w-3 h-3 text-red-500" />
                    <span className="text-xs font-medium text-gray-600">Traditional</span>
                  </div>
                  <span className="text-xs text-gray-600">{row.traditional}</span>
                </div>
                <div className="text-center p-2 bg-orange-50 rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Check className="w-3 h-3 text-green-600" />
                    <span className="text-xs font-medium text-bitcoinOrange">OrangeCat</span>
                  </div>
                  <span className={`text-xs font-semibold ${row.highlight ? 'text-green-700' : 'text-gray-900'}`}>
                    {row.orangecat}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 mb-3 sm:mb-4">
                <benefit.icon className="w-7 h-7 sm:w-8 sm:h-8 text-bitcoinOrange" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{benefit.description}</p>
            </motion.div>
          ))}
        </div>

        {/* Trust Signals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 sm:mt-12 lg:mt-16 text-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-3 sm:gap-4 lg:gap-6 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gray-50 rounded-xl sm:rounded-2xl">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">No platform fees</span>
            </div>
            <div className="w-px h-3 sm:h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Everything transparent</span>
            </div>
            <div className="w-px h-3 sm:h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Direct Bitcoin transfers</span>
            </div>
            <div className="w-px h-3 sm:h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full" />
              <span className="text-xs sm:text-sm font-medium text-gray-700">Open source</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
