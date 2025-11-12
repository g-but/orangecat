'use client';

import Link from 'next/link';
import { ArrowRight, Bitcoin, Shield, Zap, TrendingUp } from 'lucide-react';
import Button from '@/components/ui/Button';

/**
 * Static Hero Section - Renders immediately without animations
 * This provides instant content while the animated version loads
 */
export default function HeroSectionStatic() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-orange-50 via-tiffany-50 to-orange-100">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Column - Content */}
          <div>
            {/* Trust Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 backdrop-blur-sm border border-orange-200/50 mb-6">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <span className="text-sm font-medium text-gray-700">Live projects</span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-sm font-medium text-gray-700">Open source</span>
              <span className="text-gray-400">•</span>
              <span className="text-sm font-medium text-gray-700">Zero fees</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
              Fund People. Support Projects.{' '}
              <span className="bg-gradient-to-r from-bitcoinOrange to-orange-600 bg-clip-text text-transparent">
                Total Transparency.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl sm:text-2xl text-gray-600 leading-relaxed mb-4">
              Support creators directly with Bitcoin, or fund their specific projects. All transactions visible. Zero fees.
            </p>

            {/* Supporting text */}
            <p className="text-lg text-gray-600 leading-relaxed mb-8">
              Create your profile. Add projects. Link your Bitcoin wallet.
              Receive support from people who believe in your work. Show how you spend it.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link href="/discover" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-4 min-h-[56px] bg-gradient-to-r from-bitcoinOrange to-orange-500 hover:from-orange-600 hover:to-orange-600 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Discover
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-lg px-8 py-4 min-h-[56px] border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  <Bitcoin className="mr-2 h-5 w-5" />
                  Start Your Project
                </Button>
              </Link>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Bitcoin, text: 'Bitcoin-powered' },
                { icon: Shield, text: 'Transparent' },
                { icon: Zap, text: 'Instant setup' },
              ].map((benefit) => (
                <div
                  key={benefit.text}
                  className="flex items-center gap-2 text-gray-600"
                >
                  <benefit.icon className="w-4 h-4 text-bitcoinOrange flex-shrink-0" />
                  <span className="text-sm font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Visual Demo */}
          <div className="relative">
            {/* Demo Card - Real Orange Cat Project */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-bitcoinOrange to-orange-500 flex items-center justify-center text-2xl">
                    🐈
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">Orange Cat</h3>
                    <p className="text-sm text-gray-600">Transparent Bitcoin Fundraising Platform</p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-semibold text-gray-900">69,420 CHF</span>
                    <span className="text-gray-600">goal</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-bitcoinOrange to-orange-500 rounded-full"
                      style={{ width: '2%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">Just getting started - be an early supporter!</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">0%</div>
                    <div className="text-xs text-gray-600">Platform Fees</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">100%</div>
                    <div className="text-xs text-gray-600">To Creator</div>
                  </div>
                </div>

                {/* CTA Button in Demo */}
                <a
                  href="/discover"
                  className="block w-full px-4 py-3 bg-gradient-to-r from-bitcoinOrange to-orange-500 text-white font-semibold rounded-lg hover:from-orange-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Bitcoin className="w-5 h-5" />
                  View Project
                </a>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-3 -right-3 px-3 py-1.5 bg-green-500 text-white text-xs font-semibold rounded-full shadow-lg">
                ✓ 0% Fees
              </div>

              <div className="absolute -bottom-3 -left-3 px-3 py-1.5 bg-tiffany-500 text-white text-xs font-semibold rounded-full shadow-lg">
                ⚡ Instant
              </div>
            </div>

            {/* Background decoration dots */}
            <div className="absolute -z-10 -top-4 -right-4 w-24 h-24 bg-bitcoinOrange/20 rounded-full blur-2xl" />
            <div className="absolute -z-10 -bottom-4 -left-4 w-32 h-32 bg-tiffany-400/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
