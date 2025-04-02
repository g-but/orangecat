'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-[#0ABAB5] to-[#0A9A95]">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-br from-[#0ABAB5] to-[#0A9A95] mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto py-24 px-4 sm:py-32 sm:px-6 lg:px-8">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Revolutionizing Bitcoin Donations
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-6 text-xl text-white/90 max-w-3xl"
          >
            Palfare makes it simple for anyone to accept Bitcoin donations with a beautiful, customizable page.
          </motion.p>
        </div>
      </div>

      {/* Value Proposition */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-extrabold text-gray-900 sm:text-4xl"
          >
            Why Choose Palfare?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mt-4 text-lg text-gray-500"
          >
            We're making Bitcoin donations accessible to everyone
          </motion.p>
        </div>

        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Simple Setup',
                description: 'Create a beautiful donation page in minutes, no technical knowledge required.',
                icon: '🚀',
              },
              {
                title: 'Bitcoin First',
                description: 'Built specifically for Bitcoin, with support for Lightning Network coming soon.',
                icon: '⚡',
              },
              {
                title: 'Customizable',
                description: 'Personalize your page with your own branding, colors, and messaging.',
                icon: '🎨',
              },
              {
                title: 'Secure',
                description: 'Your Bitcoin address is the only thing we need - no accounts, no passwords.',
                icon: '🔒',
              },
              {
                title: 'Global',
                description: 'Accept donations from anywhere in the world, instantly and without borders.',
                icon: '🌍',
              },
              {
                title: 'Free Forever',
                description: 'No fees, no hidden costs. We believe in the power of Bitcoin donations.',
                icon: '💝',
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="pt-6"
              >
                <div className="flow-root bg-white rounded-2xl px-6 pb-8 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-[#0ABAB5] rounded-full shadow-lg">
                        <span className="text-3xl">{feature.icon}</span>
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">
                      {feature.title}
                    </h3>
                    <p className="mt-5 text-base text-gray-500">{feature.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="bg-gray-50">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-extrabold text-gray-900 sm:text-4xl"
            >
              How It Works
            </motion.h2>
          </div>

          <div className="mt-20">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Create Your Page',
                  description: 'Enter your Bitcoin address and customize your page.',
                },
                {
                  step: '2',
                  title: 'Share Your Link',
                  description: 'Share your unique donation page URL with your audience.',
                },
                {
                  step: '3',
                  title: 'Receive Donations',
                  description: 'Start receiving Bitcoin donations directly to your wallet.',
                },
              ].map((step, index) => (
                <motion.div
                  key={step.step}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  className="relative"
                >
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-full bg-[#0ABAB5] text-white shadow-lg">
                    {step.step}
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg font-medium text-gray-900">{step.title}</h3>
                    <p className="mt-2 text-base text-gray-500">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-[#0ABAB5] to-[#0A9A95] rounded-2xl shadow-xl overflow-hidden">
            <div className="pt-16 pb-12 px-6 sm:pt-20 sm:px-16 lg:py-16 lg:pr-0 xl:py-20 xl:px-20">
              <div className="lg:self-center">
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="text-3xl font-extrabold text-white sm:text-4xl"
                >
                  Ready to Start Accepting Bitcoin Donations?
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-4 text-lg leading-6 text-white/90"
                >
                  Create your donation page in minutes and start receiving Bitcoin donations today.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="mt-8"
                >
                  <Link
                    href="/create"
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full text-[#0ABAB5] bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition-colors shadow-sm"
                  >
                    Create Your Page
                  </Link>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 