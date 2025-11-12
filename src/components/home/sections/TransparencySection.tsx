'use client';

import { motion } from 'framer-motion';
import { Shield, Eye, TrendingUp, CheckCircle2 } from 'lucide-react';

export default function TransparencySection() {
  return (
    <section className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-tiffany-50 to-orange-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            The Transparency Difference
          </h2>
          <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
            All Bitcoin transactions are public. Show how you use support. Build trust. Earn a transparency score.
          </p>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-16">
          {/* Left: How it Works */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-bitcoinOrange to-orange-500 rounded-xl flex items-center justify-center">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">How Transparency Works</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-orange-600 font-semibold text-sm">1</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">You receive Bitcoin support</p>
                    <p className="text-gray-600 text-sm">All transactions are visible on the blockchain</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-orange-600 font-semibold text-sm">2</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">You withdraw or spend funds</p>
                    <p className="text-gray-600 text-sm">Supporters can see when Bitcoin moves</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-orange-600 font-semibold text-sm">3</span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">You explain your spending</p>
                    <p className="text-gray-600 text-sm">Post updates with receipts, photos, or progress reports</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-1">Your transparency score increases</p>
                    <p className="text-gray-600 text-sm">Build trust and credibility with supporters</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Example Profile */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Example: Maria's Profile</h3>
              </div>

              <div className="space-y-6">
                {/* Profile Info */}
                <div className="flex items-start gap-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-2xl">
                    👩‍🎨
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Maria - Artist</p>
                    <p className="text-sm text-gray-600">2 active projects • Member since Jan 2025</p>
                  </div>
                </div>

                {/* Transparency Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">Transparency Score</span>
                    <span className="text-2xl font-bold text-green-600">92/100</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: '92%' }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-2">
                    <Shield className="w-3 h-3 inline mr-1" />
                    High transparency - explains all spending with receipts
                  </p>
                </div>

                {/* Recent Activity */}
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-3">Latest Transparency Update:</p>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 mb-2">
                      &quot;Received $5,000 for education fund. Withdrew $2,000 and posted receipts for textbooks.&quot;
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="bg-green-100 text-green-700 px-2 py-1 rounded">+10 points</span>
                      <span>2 days ago</span>
                    </div>
                  </div>
                </div>

                {/* Trust Indicators */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <div className="text-2xl font-bold text-gray-900">23</div>
                    <div className="text-xs text-gray-600">Supporters Trust Maria</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">15</div>
                    <div className="text-xs text-gray-600">Updates Posted</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <p className="text-lg text-gray-600 mb-6">
            Transparency builds trust. Trust attracts support. Start building yours today.
          </p>
          <a
            href="/auth"
            className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gradient-to-r from-bitcoinOrange to-orange-500 hover:from-orange-600 hover:to-orange-600 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            Create Your Profile
          </a>
        </div>
      </div>
    </section>
  );
}
