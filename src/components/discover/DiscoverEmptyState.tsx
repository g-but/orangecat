/**
 * Discover Empty State Component
 *
 * Displays appropriate empty states based on search/filter context.
 * Extracted from discover/page.tsx for better modularity.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-31
 * Last Modified Summary: Added loans tab support with appropriate empty state messages and CTAs
 */

import { motion } from 'framer-motion';
import { Target, Users, DollarSign } from 'lucide-react';
import Button from '@/components/ui/Button';
import type { DiscoverTabType } from '@/components/discover/DiscoverTabs';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { ROUTES } from '@/config/routes';

interface DiscoverEmptyStateProps {
  activeTab: DiscoverTabType;
  hasFilters: boolean;
  onClearFilters: () => void;
}

export default function DiscoverEmptyState({
  activeTab,
  hasFilters,
  onClearFilters,
}: DiscoverEmptyStateProps) {
  if (!hasFilters) {
    // No filters - show full CTA
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="text-center py-16"
      >
        <div className="bg-gradient-to-r from-orange-50 via-tiffany-50 to-orange-50 rounded-2xl border border-orange-200 p-8 text-center max-w-2xl mx-auto">
          <div className="w-16 h-16 bg-gradient-to-r from-orange-100 to-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {activeTab === 'profiles' ? (
              <Users className="w-8 h-8 text-orange-600" />
            ) : activeTab === 'loans' ? (
              <DollarSign className="w-8 h-8 text-tiffany-600" />
            ) : (
              <Target className="w-8 h-8 text-orange-600" />
            )}
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {activeTab === 'profiles'
              ? 'No People Found'
              : activeTab === 'loans'
                ? 'No Loans Available'
                : 'Be the First to Launch'}
          </h3>
          <p className="text-lg text-gray-600 mb-6 leading-relaxed">
            {activeTab === 'profiles'
              ? 'No profiles match your search criteria. Try adjusting your filters or browse all people.'
              : activeTab === 'loans'
                ? 'No loan listings available yet. Be the first to request a loan or refinance an existing one!'
                : "No projects here yet—which means you could be the first! Whether you're funding a creative project, community initiative, or passion project, this is your chance to lead the way."}
          </p>

          {activeTab === 'loans' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-tiffany-600 mb-1">1</div>
                  <div className="text-sm font-medium">Create</div>
                  <div className="text-xs text-gray-600">Set up your loan listing</div>
                </div>
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-1">2</div>
                  <div className="text-sm font-medium">Connect</div>
                  <div className="text-xs text-gray-600">Find peer-to-peer lenders</div>
                </div>
              </div>

              <Button
                href={ENTITY_REGISTRY.loan.createPath}
                size="lg"
                className="bg-gradient-to-r from-tiffany-600 to-tiffany-700 hover:from-tiffany-700 hover:to-tiffany-800 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mb-4"
              >
                Create Loan Listing
              </Button>

              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <a href={ROUTES.AUTH} className="text-tiffany-600 hover:underline font-medium">
                  Sign in
                </a>{' '}
                to get started.
              </p>
            </>
          )}

          {activeTab !== 'profiles' && activeTab !== 'loans' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600 mb-1">1</div>
                  <div className="text-sm font-medium">Create</div>
                  <div className="text-xs text-gray-600">Set up your project page</div>
                </div>
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-tiffany-600 mb-1">2</div>
                  <div className="text-sm font-medium">Share</div>
                  <div className="text-xs text-gray-600">Tell your story and set a goal</div>
                </div>
                <div className="p-4 bg-white/60 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-1">3</div>
                  <div className="text-sm font-medium">Receive</div>
                  <div className="text-xs text-gray-600">Accept Bitcoin funding</div>
                </div>
              </div>

              <Button
                href={ENTITY_REGISTRY.project.createPath}
                size="lg"
                className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 mb-4"
              >
                Launch Your Project
              </Button>

              <p className="text-sm text-gray-500">
                Already have an account?{' '}
                <a href={ROUTES.AUTH} className="text-orange-600 hover:underline font-medium">
                  Sign in
                </a>{' '}
                to get started.
              </p>
            </>
          )}
        </div>
      </motion.div>
    );
  }

  // Has filters - show filtered empty state
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center py-16"
    >
      <div className="max-w-md mx-auto">
        {activeTab === 'profiles' ? (
          <Users className="w-16 h-16 text-orange-300 mx-auto mb-4" />
        ) : activeTab === 'loans' ? (
          <DollarSign className="w-16 h-16 text-tiffany-300 mx-auto mb-4" />
        ) : (
          <Target className="w-16 h-16 text-orange-300 mx-auto mb-4" />
        )}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
        <p className="text-gray-600 mb-8">
          {activeTab === 'profiles'
            ? 'Try different filters or browse all people to discover someone new.'
            : activeTab === 'loans'
              ? 'Try different filters or browse all loans to discover available lending opportunities.'
              : 'Try different filters or browse all projects to discover something new.'}
        </p>
        <div className="space-y-3">
          <Button onClick={onClearFilters} variant="outline" className="px-6 py-2">
            Clear Filters
          </Button>
          {activeTab === 'loans' && (
            <Button
              href={ENTITY_REGISTRY.loan.createPath}
              className="bg-gradient-to-r from-tiffany-600 to-tiffany-700 hover:from-tiffany-700 hover:to-tiffany-800 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Or create your own loan listing →
            </Button>
          )}
          {activeTab !== 'profiles' && activeTab !== 'loans' && (
            <Button
              href={ENTITY_REGISTRY.project.createPath}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
            >
              Or launch your own project →
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
