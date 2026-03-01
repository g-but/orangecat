'use client';

import Link from 'next/link';
import { ArrowRight, Globe, Zap, TrendingUp, Cat } from 'lucide-react';
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center">
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
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-4 sm:mb-6">
              Your AI Economic Agent.{' '}
              <span className="bg-gradient-to-r from-tiffany-500 to-tiffany-700 bg-clip-text text-transparent">
                Any Currency. Any Identity.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 leading-relaxed mb-3 sm:mb-4">
              Buy, sell, fund, lend, invest, and govern — with your own AI, under any identity, in
              any currency.
            </p>

            {/* Supporting text */}
            <p className="text-base sm:text-lg text-gray-600 leading-relaxed mb-6 sm:mb-8">
              OrangeCat gives every person and organization a full-spectrum AI agent for economic
              activity. No gatekeepers. Bitcoin-native, but not Bitcoin-only.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6 sm:mb-8">
              <Link href="/discover" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 min-h-[48px] sm:min-h-[56px] bg-gradient-to-r from-tiffany-500 to-tiffany-600 hover:from-tiffany-600 hover:to-tiffany-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <TrendingUp className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Discover
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </Link>
              <Link href="/auth" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 min-h-[48px] sm:min-h-[56px] border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                >
                  <Cat className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  Meet Your Cat
                </Button>
              </Link>
            </div>

            {/* Key Benefits */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: Cat, text: 'Your AI agent' },
                { icon: Globe, text: 'Any currency' },
                { icon: Zap, text: 'Zero fees' },
              ].map(benefit => (
                <div key={benefit.text} className="flex items-center gap-2 text-gray-600">
                  <benefit.icon className="w-4 h-4 text-tiffany-600 flex-shrink-0" />
                  <span className="text-sm font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Visual Demo */}
          <div className="relative">
            {/* Demo Card */}
            <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              {/* Card Header */}
              <div className="p-4 sm:p-6 border-b border-gray-100">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-tiffany-400 to-tiffany-600 flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                    🐱
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">My Cat</h3>
                    <p className="text-xs sm:text-sm text-gray-600">Your AI economic agent</p>
                  </div>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {/* Progress Bar */}
                <div>
                  <div className="flex justify-between text-xs sm:text-sm mb-2">
                    <span className="font-semibold text-gray-900">24,297 CHF raised</span>
                    <span className="text-gray-600">of 69,420 CHF</span>
                  </div>
                  <div className="w-full h-2 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-tiffany-400 to-tiffany-600 rounded-full"
                      style={{ width: '35%' }}
                    />
                  </div>
                  <p className="text-xs text-gray-600 mt-1 sm:mt-2">Backed by 142 supporters</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-1 sm:pt-2">
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">0%</div>
                    <div className="text-xs text-gray-600">Platform Fees</div>
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold text-gray-900">100%</div>
                    <div className="text-xs text-gray-600">To Creator</div>
                  </div>
                </div>

                {/* CTA Button in Demo */}
                <a
                  href="/discover"
                  className="block w-full px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-tiffany-500 to-tiffany-600 text-white text-sm sm:text-base font-semibold rounded-lg hover:from-tiffany-600 hover:to-tiffany-700 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  <Cat className="w-4 h-4 sm:w-5 sm:h-5" />
                  View Project
                </a>
              </div>

              {/* Floating badges */}
              <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-green-500 text-white text-[10px] sm:text-xs font-semibold rounded-full shadow-lg">
                ✓ 0% Fees
              </div>

              <div className="absolute -bottom-2 -left-2 sm:-bottom-3 sm:-left-3 px-2 py-1 sm:px-3 sm:py-1.5 bg-tiffany-500 text-white text-[10px] sm:text-xs font-semibold rounded-full shadow-lg">
                🐱 AI-powered
              </div>
            </div>

            {/* Background decoration dots */}
            <div className="absolute -z-10 -top-4 -right-4 w-24 h-24 bg-tiffany-400/20 rounded-full blur-2xl" />
            <div className="absolute -z-10 -bottom-4 -left-4 w-32 h-32 bg-tiffany-400/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}
