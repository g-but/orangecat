'use client';

import { motion } from 'framer-motion';
import { Shield, Eye, TrendingUp, CheckCircle2 } from 'lucide-react';
import { SECTION_HEADERS } from '@/config/landing-page';

export default function TransparencySection() {
  const { transparency } = SECTION_HEADERS;

  return (
    <section className="py-12 sm:py-16 lg:py-24 bg-gradient-to-br from-tiffany-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-3 sm:mb-4">
            {transparency.title}
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 max-w-3xl mx-auto">
            {transparency.subtitle}
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 mb-10 sm:mb-12 lg:mb-16">
          {/* Left: How it Works */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8">
              <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-bitcoinOrange to-orange-500 rounded-lg sm:rounded-xl flex items-center justify-center">
                  <Eye className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  How Transparency Works
                </h3>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                    <span className="text-orange-600 font-semibold text-xs sm:text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">
                      You receive Bitcoin support
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      All transactions are visible on the blockchain
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                    <span className="text-orange-600 font-semibold text-xs sm:text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">
                      You withdraw or spend funds
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Supporters can see when Bitcoin moves
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                    <span className="text-orange-600 font-semibold text-xs sm:text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">
                      You explain your spending
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Post updates with receipts, photos, or progress reports
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 sm:gap-3">
                  <div className="w-5 h-5 sm:w-6 sm:h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 sm:mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm sm:text-base mb-0.5 sm:mb-1">
                      Your transparency score increases
                    </p>
                    <p className="text-gray-600 text-xs sm:text-sm">
                      Build trust and credibility with supporters
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Example Profile Preview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-6 sm:p-8">
              {/* Example Label */}
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg sm:rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Profile Preview</h3>
                </div>
                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] sm:text-xs font-medium rounded">
                  UI Example
                </span>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Profile Info */}
                <div className="flex items-start gap-3 sm:gap-4 pb-3 sm:pb-4 border-b border-gray-100">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-xl sm:text-2xl flex-shrink-0">
                    👩‍🎨
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm sm:text-base">
                      Your Name Here
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600">Your projects • Your journey</p>
                  </div>
                </div>

                {/* Transparency Score */}
                <div>
                  <div className="flex items-center justify-between mb-1.5 sm:mb-2">
                    <span className="text-xs sm:text-sm font-medium text-gray-700">
                      Transparency Score
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-green-600">High</span>
                  </div>
                  <div className="w-full h-2.5 sm:h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
                      style={{ width: '85%' }}
                    />
                  </div>
                  <p className="text-[10px] sm:text-xs text-gray-600 mt-1.5 sm:mt-2">
                    <Shield className="w-2.5 h-2.5 sm:w-3 sm:h-3 inline mr-1" />
                    Score increases as you share updates and receipts
                  </p>
                </div>

                {/* How Updates Work */}
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-gray-900 mb-2 sm:mb-3">
                    How Updates Work:
                  </p>
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <p className="text-xs sm:text-sm text-gray-700 mb-1.5 sm:mb-2">
                      &quot;Received funding for my project. Withdrew funds and posted receipts
                      showing exactly how it was spent.&quot;
                    </p>
                    <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-600">
                      <span className="bg-green-100 text-green-700 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs">
                        Score increases
                      </span>
                      <span>With each update</span>
                    </div>
                  </div>
                </div>

                {/* What Gets Tracked */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t border-gray-100">
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900">Supporters</div>
                    <div className="text-[10px] sm:text-xs text-gray-600">
                      Who trust your transparency
                    </div>
                  </div>
                  <div>
                    <div className="text-lg sm:text-xl font-bold text-gray-900">Updates</div>
                    <div className="text-[10px] sm:text-xs text-gray-600">
                      You've shared publicly
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 mb-4 sm:mb-6">
            Transparency builds trust. Trust attracts support. Start building yours today.
          </p>
          <a
            href="/auth"
            className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold text-white bg-gradient-to-r from-bitcoinOrange to-orange-500 hover:from-orange-600 hover:to-orange-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Create Your Profile
          </a>
        </div>
      </div>
    </section>
  );
}
