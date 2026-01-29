'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Button from '@/components/ui/Button';
import { ArrowRight, Bitcoin, Heart, Shield, Zap, Sparkles, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Hero() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-tiffany-50 to-orange-100" />
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Modern Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-tiffany-50 to-orange-100" />
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />

      {/* Animated Bitcoin Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-20 left-10 w-2 h-2 bg-bitcoinOrange/30 rounded-full"
          animate={{
            y: [0, -20, 0],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-3 h-3 bg-tiffany-400/40 rounded-full"
          animate={{
            y: [0, 15, 0],
            x: [0, 10, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute bottom-40 left-1/4 w-1 h-1 bg-bitcoinOrange/40 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-screen flex flex-col justify-center py-12 sm:py-16 lg:py-20">
          {/* Hero Content */}
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Hero Badge */}
            <motion.div
              className="mb-8"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-bitcoinOrange/20 to-tiffany-500/20 border border-bitcoinOrange/30">
                <Sparkles className="w-4 h-4 text-bitcoinOrange mr-2" />
                <span className="text-sm font-medium bg-gradient-to-r from-bitcoinOrange to-tiffany-600 bg-clip-text text-transparent">
                  Be free. Be open. Fund with Bitcoin.
                </span>
                <Sparkles className="w-4 h-4 text-tiffany-500 ml-2" />
              </div>
            </motion.div>

            {/* Main Heading with Gradient Text */}
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <span className="block text-gray-900">Fund Anything</span>
              <span className="block mt-2">
                <span className="bg-gradient-to-r from-tiffany-600 via-tiffany-500 to-bitcoinOrange bg-clip-text text-transparent">
                  With Bitcoin
                </span>
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mt-6 max-w-3xl mx-auto text-lg sm:text-xl lg:text-2xl text-gray-600 leading-relaxed px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.5 }}
            >
              Create transparent funding projects and receive Bitcoin support instantly. Perfect for
              personal projects, organizations, and causes you care about.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 px-4 sm:px-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.7 }}
            >
              <Link href="/auth" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-4 min-h-[56px] bg-gradient-to-r from-bitcoinOrange to-orange-500 hover:from-orange-600 hover:to-orange-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Bitcoin className="mr-2 h-5 w-5" />
                  Start Your Campaign
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/discover" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-4 min-h-[56px] border-2 border-tiffany-300 text-tiffany-700 hover:bg-tiffany-50 hover:border-tiffany-400 transform hover:scale-105 transition-all duration-200"
                >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Explore Projects
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Feature Cards */}
          <motion.div
            className="mt-20 lg:mt-28"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
              {[
                {
                  icon: Bitcoin,
                  title: 'Bitcoin-Powered',
                  description: 'Secure, global transactions with no platform fees',
                  gradient: 'from-bitcoinOrange/10 to-orange-100/50',
                  iconColor: 'text-bitcoinOrange',
                },
                {
                  icon: Heart,
                  title: 'For Everyone',
                  description: 'Fund yourself, loved ones, or any cause you care about',
                  gradient: 'from-pink-50 to-red-100/50',
                  iconColor: 'text-red-500',
                },
                {
                  icon: Shield,
                  title: 'Transparent',
                  description: 'Real-time tracking and public funding history',
                  gradient: 'from-tiffany-50 to-tiffany-100/50',
                  iconColor: 'text-tiffany-600',
                },
                {
                  icon: Zap,
                  title: 'Instant Setup',
                  description: 'Create your funding page and go live in minutes',
                  gradient: 'from-yellow-50 to-amber-100/50',
                  iconColor: 'text-amber-600',
                },
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  className={`relative p-6 bg-gradient-to-br ${feature.gradient} backdrop-blur-sm rounded-2xl border border-white/20 hover:border-white/40 hover:shadow-xl transform hover:scale-105 transition-all duration-300 group`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 1.1 + index * 0.1 }}
                  whileHover={{ y: -5 }}
                >
                  <div className="flex flex-col items-center text-center">
                    <div
                      className={`p-3 rounded-full bg-white/80 backdrop-blur-sm mb-4 group-hover:scale-110 transition-transform duration-200`}
                    >
                      <feature.icon className={`h-8 w-8 ${feature.iconColor}`} />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Trust Indicators */}
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            <p className="text-sm font-medium text-gray-500 mb-6">Powered by Bitcoin technology</p>
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-2 sm:space-y-0 sm:space-x-8">
              {['No Platform Fees', 'Global Access', 'Self-Custody'].map((feature, index) => (
                <motion.div
                  key={feature}
                  className="flex items-center text-gray-600"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 1.7 + index * 0.1 }}
                >
                  <div className="w-2 h-2 bg-gradient-to-r from-bitcoinOrange to-tiffany-500 rounded-full mr-3" />
                  <span className="text-sm font-medium">{feature}</span>
                </motion.div>
              ))}
            </div>
            <motion.p
              className="mt-6 text-sm text-gray-500 leading-relaxed max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2 }}
            >
              We connect people and enable Bitcoin payments. You keep your keys, we keep it simple.
            </motion.p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
