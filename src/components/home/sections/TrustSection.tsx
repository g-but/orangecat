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
    <section className="py-16 sm:py-20 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Why Bitcoin? Why OrangeCat?
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            Traditional platforms charge fees and control your funds. Bitcoin changes the game.
          </p>
        </div>

        {/* Comparison Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-20"
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

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-50 mb-4">
                <benefit.icon className="w-8 h-8 text-bitcoinOrange" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{benefit.title}</h3>
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
          className="mt-16 text-center"
        >
          <div className="inline-flex flex-wrap items-center justify-center gap-6 px-8 py-4 bg-gray-50 rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-gray-700">No platform fees</span>
            </div>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-gray-700">Everything transparent</span>
            </div>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-gray-700">Direct Bitcoin transfers</span>
            </div>
            <div className="w-px h-4 bg-gray-300 hidden sm:block" />
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-sm font-medium text-gray-700">Open source</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
