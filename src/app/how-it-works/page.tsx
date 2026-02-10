'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Shield, Zap, Eye, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  HOW_IT_WORKS_STEPS,
  SECTION_HEADERS,
  CTA_LABELS,
  SUPER_APP_CATEGORIES,
} from '@/config/landing-page';

/**
 * How It Works Page - Detailed walkthrough
 *
 * Uses the same 4-step process as the home page for consistency.
 * Provides more detail and explanation for users who want to learn more.
 */

const whyBitcoin = [
  {
    icon: Shield,
    title: 'Trustless & Secure',
    description:
      "Bitcoin's blockchain ensures every transaction is permanent, transparent, and immutable. No chargebacks, no fraud.",
  },
  {
    icon: Zap,
    title: 'Fast & Borderless',
    description:
      'Send and receive funds anywhere in the world, instantly with Lightning Network or within minutes on-chain.',
  },
  {
    icon: Eye,
    title: 'Complete Transparency',
    description:
      'Every transaction is publicly verifiable on the Bitcoin blockchain. Build trust through radical transparency.',
  },
  {
    icon: Sparkles,
    title: 'Zero Platform Fees',
    description:
      'Direct peer-to-peer payments mean 100% goes to the recipient. No middlemen, no processing costs.',
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function HowItWorksPage() {
  const { howItWorks } = SECTION_HEADERS;

  return (
    <div className="min-h-screen pt-20 pb-16">
      <div className="container mx-auto px-4">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 bg-tiffany-50 text-tiffany-700 px-4 py-2 rounded-full mb-6">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-medium">Simple, Universal, Powerful</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-tiffany-600 to-bitcoinOrange bg-clip-text text-transparent">
            {howItWorks.title}
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            One platform. Endless possibilities. Here's how to get started with anything on
            OrangeCat.
          </p>
        </motion.div>

        {/* Steps Section - Matches home page (4 steps) */}
        <div className="max-w-5xl mx-auto mb-20">
          <motion.h2
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Get Started in {HOW_IT_WORKS_STEPS.length} Simple Steps
          </motion.h2>

          <div className="space-y-8">
            {HOW_IT_WORKS_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  <Card className="p-6 md:p-8 hover:shadow-xl transition-shadow">
                    <div className="flex flex-col md:flex-row gap-6">
                      {/* Step Number & Icon */}
                      <div className="flex-shrink-0">
                        <div
                          className={`bg-gradient-to-br ${step.color} w-16 h-16 rounded-full flex items-center justify-center text-white mb-4 md:mb-0`}
                        >
                          <Icon className="w-8 h-8" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <span
                            className={`bg-gradient-to-br ${step.color} text-white text-sm font-bold px-3 py-1 rounded-full`}
                          >
                            Step {step.number}
                          </span>
                          <h3 className="text-2xl font-bold text-gray-900 flex-1">{step.title}</h3>
                        </div>
                        <p className="text-gray-600 text-lg leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* What You Can Do Section */}
        <motion.div className="mb-20" {...fadeInUp}>
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-4">What You Can Do</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              OrangeCat combines commerce, funding, community, and AI—all in one Bitcoin-powered
              platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {SUPER_APP_CATEGORIES.map((category, index) => {
              const Icon = category.icon;
              return (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`${category.bgColor} p-3 rounded-lg flex-shrink-0`}>
                        <Icon className="w-6 h-6 text-gray-700" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{category.title}</h3>
                        <p className="text-gray-600 mb-3">{category.description}</p>
                        <ul className="space-y-1">
                          {category.features.map(feature => (
                            <li
                              key={feature.title}
                              className="text-sm text-gray-500 flex items-center gap-2"
                            >
                              <div
                                className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${category.color}`}
                              />
                              {feature.title}: {feature.description}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Why Bitcoin Section */}
        <motion.div className="mb-20" {...fadeInUp}>
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold mb-4">Why Bitcoin Powers Everything</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bitcoin isn't just a payment method—it's the foundation for transparent, global,
              permissionless transactions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {whyBitcoin.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 + 0.3, duration: 0.5 }}
                >
                  <Card className="p-6 h-full hover:shadow-lg transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className="bg-tiffany-100 p-3 rounded-lg flex-shrink-0">
                        <Icon className="w-6 h-6 text-tiffany-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                        <p className="text-gray-600 leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div className="text-center" {...fadeInUp}>
          <Card className="p-12 bg-gradient-to-br from-tiffany-50 via-white to-orange-50 border-2 border-tiffany-100">
            <h2 className="text-2xl font-semibold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join OrangeCat for commerce, funding, community, and AI—all powered by Bitcoin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                href="/auth?mode=register"
                size="lg"
                className="bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white group"
              >
                {CTA_LABELS.createAccount}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button href="/discover" variant="outline" size="lg">
                {CTA_LABELS.secondaryAction}
              </Button>
            </div>
            <p className="mt-6 text-sm text-gray-500">
              No credit card required • Free forever • Set up in minutes
            </p>
          </Card>
        </motion.div>

        {/* Additional Help */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Need more help?</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button href="/discover" variant="ghost">
              See What Others Are Doing
            </Button>
            <Button href="/about" variant="ghost">
              About OrangeCat
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
