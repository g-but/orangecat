'use client';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  UserPlus,
  Grid3x3,
  Settings,
  Bitcoin,
  TrendingUp,
  Shield,
  Zap,
  Eye,
  Sparkles,
  ArrowRight,
  Package,
  Briefcase,
  Lightbulb,
  Heart,
  Users,
  Bot,
} from 'lucide-react';
import { motion } from 'framer-motion';

const universalSteps = [
  {
    number: 1,
    title: 'Create Your Account',
    description:
      'Sign up for free in seconds. No credit card required, no hidden fees. Your account gives you access to everything OrangeCat offers.',
    icon: UserPlus,
    color: 'bg-tiffany-500',
    bgColor: 'bg-tiffany-50',
    details: [
      'Simple email registration',
      'Secure authentication',
      'Instant profile creation',
      'Access to all features',
    ],
  },
  {
    number: 2,
    title: 'Choose What You Want to Do',
    description:
      'OrangeCat is a super-app. Pick what fits your needs—sell products, offer services, fund projects, build communities, deploy AI, and more.',
    icon: Grid3x3,
    color: 'bg-purple-500',
    bgColor: 'bg-purple-50',
    examples: [
      { icon: Package, text: 'Sell physical or digital products' },
      { icon: Briefcase, text: 'Offer professional services' },
      { icon: Lightbulb, text: 'Launch fundraising projects' },
      { icon: Heart, text: 'Support charitable causes' },
      { icon: Users, text: 'Build and manage communities' },
      { icon: Bot, text: 'Deploy custom AI assistants' },
    ],
  },
  {
    number: 3,
    title: 'Set Up Your Offering',
    description:
      "Add your Bitcoin wallet, create your listing, set your terms. Our intuitive interface makes it easy no matter what you're doing.",
    icon: Settings,
    color: 'bg-blue-500',
    bgColor: 'bg-blue-50',
    details: [
      'Link your Bitcoin wallet (any wallet works)',
      'Create detailed listings with media',
      'Set prices, terms, and conditions',
      'Customize your profile and branding',
    ],
  },
  {
    number: 4,
    title: 'Transact with Bitcoin',
    description:
      'Buy, sell, fund, or receive—all transactions happen directly with Bitcoin. Fast, borderless, and transparent on the blockchain.',
    icon: Bitcoin,
    color: 'bg-bitcoinOrange',
    bgColor: 'bg-orange-50',
    details: [
      'Direct peer-to-peer payments',
      'Lightning Network for instant transactions',
      'On-chain for larger amounts',
      'Zero platform fees—100% goes to you',
    ],
  },
  {
    number: 5,
    title: 'Build Trust Through Transparency',
    description:
      'Every transaction is on the blockchain. Share updates, show progress, and build your reputation through radical transparency.',
    icon: TrendingUp,
    color: 'bg-green-500',
    bgColor: 'bg-green-50',
    details: [
      'All transactions publicly verifiable',
      'Post updates and progress reports',
      'Build your transparency score',
      'Earn trust, grow your audience',
    ],
  },
];

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
            How OrangeCat Works
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            One platform. Endless possibilities. Here's how to get started with anything on
            OrangeCat.
          </p>
        </motion.div>

        {/* Steps Section */}
        <div className="max-w-5xl mx-auto mb-20">
          <motion.h2
            className="text-3xl font-bold text-center mb-12"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            Get Started in 5 Simple Steps
          </motion.h2>

          <div className="space-y-8">
            {universalSteps.map((step, index) => {
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
                          className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center text-white mb-4 md:mb-0`}
                        >
                          <Icon className="w-8 h-8" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <span
                            className={`${step.color} text-white text-sm font-bold px-3 py-1 rounded-full`}
                          >
                            Step {step.number}
                          </span>
                          <h3 className="text-2xl font-bold text-gray-900 flex-1">{step.title}</h3>
                        </div>
                        <p className="text-gray-600 text-lg mb-4 leading-relaxed">
                          {step.description}
                        </p>

                        {/* Details or Examples */}
                        {step.details && (
                          <ul className="space-y-2">
                            {step.details.map((detail, i) => (
                              <li key={i} className="flex items-center gap-2 text-gray-700">
                                <div className={`w-1.5 h-1.5 rounded-full ${step.color}`} />
                                <span>{detail}</span>
                              </li>
                            ))}
                          </ul>
                        )}

                        {step.examples && (
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                            {step.examples.map((example, i) => (
                              <div
                                key={i}
                                className={`flex items-center gap-2 p-3 ${step.bgColor} rounded-lg`}
                              >
                                <example.icon className="w-5 h-5 flex-shrink-0" />
                                <span className="text-sm font-medium text-gray-700">
                                  {example.text}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Why Bitcoin Section */}
        <motion.div className="mb-20" {...fadeInUp}>
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Bitcoin Powers Everything</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bitcoin isn't just a payment method—it's the foundation for transparent, global,
              permissionless transactions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
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
                        <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Join thousands using OrangeCat for commerce, finance, community, and AI—all powered by
              Bitcoin.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button
                href="/auth?mode=register"
                size="lg"
                className="bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 text-white group"
              >
                Create Your Free Account
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button href="/discover" variant="outline" size="lg">
                Explore the Platform
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
