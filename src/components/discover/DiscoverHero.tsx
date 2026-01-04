/**
 * Discover Hero Section
 *
 * Displays the hero section with title, description, and stats.
 * Extracted from discover/page.tsx for better modularity.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from discover/page.tsx
 */

import { motion } from 'framer-motion';

interface DiscoverHeroProps {
  totalProjects: number;
  totalProfiles: number;
  totalFunding?: number;
}

export default function DiscoverHero({
  totalProjects,
  totalProfiles,
  totalFunding = 0,
}: DiscoverHeroProps) {
  return (
    <motion.div
      className="relative overflow-hidden bg-gradient-to-br from-bitcoinOrange/5 via-tiffany-50/80 to-orange-50/60 border-b border-gray-100/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            className="text-fluid-3xl font-extrabold tracking-tight text-gray-900 mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <span className="block">Discover Projects</span>
            <span className="block bg-gradient-to-r from-tiffany-600 via-bitcoinOrange to-orange-500 bg-clip-text text-transparent">
              You Care About
            </span>
          </motion.h1>

          <motion.p
            className="mt-4 max-w-2xl mx-auto text-fluid-lg text-gray-600"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
          >
            Support creative projects, community initiatives, and bold ideas—using Bitcoin.
          </motion.p>

          {/* Stats - Compact */}
          <motion.div
            className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
          >
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-white/80 shadow-card">
              <div className="text-fluid-xl font-bold text-gray-900">{totalProjects}</div>
              <div className="text-sm text-gray-600 mt-1">Active Projects</div>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-white/80 shadow-card">
              <div className="text-fluid-xl font-bold text-tiffany-600">{totalProfiles}</div>
              <div className="text-sm text-gray-600 mt-1">People</div>
            </div>
            <div className="bg-white/80 backdrop-blur-md rounded-xl p-4 border border-white/80 shadow-card">
              <div className="text-fluid-xl font-bold text-bitcoinOrange">
                {totalFunding > 0 ? `${totalFunding} BTC` : '0 BTC'}
              </div>
              <div className="text-sm text-gray-600 mt-1">Funds Raised</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </motion.div>
  );
}


