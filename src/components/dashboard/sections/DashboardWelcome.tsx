'use client';

import Link from 'next/link';
import { X, Sparkles, Target, Wallet, CheckCircle, ArrowRight } from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

interface DashboardWelcomeProps {
  profile: {
    name?: string | null;
    username?: string | null;
    bitcoin_address?: string | null;
  } | null;
  hasProjects?: boolean;
  onDismiss: () => void;
}

/**
 * DashboardWelcome - Personalized welcome message for new users
 * Shows dynamic suggestions based on what's missing (wallet? project?)
 */
export function DashboardWelcome({
  profile,
  hasProjects = false,
  onDismiss,
}: DashboardWelcomeProps) {
  const hasWallet = !!profile?.bitcoin_address;
  const displayName = profile?.name || profile?.username || 'Creator';

  // Determine what the user should do next
  const getNextAction = () => {
    if (!hasWallet) {
      return {
        priority: 'wallet',
        title: 'Add your Bitcoin wallet',
        description: 'Set up your wallet to receive funding from supporters.',
        href: ENTITY_REGISTRY.wallet.basePath,
        icon: Wallet,
        iconColor: 'text-blue-600',
        bgColor: 'bg-blue-100',
        buttonText: 'Add Wallet',
      };
    }
    if (!hasProjects) {
      return {
        priority: 'project',
        title: 'Create your first project',
        description: 'Launch a Bitcoin crowdfunding campaign and start receiving support.',
        href: ENTITY_REGISTRY.project.createPath,
        icon: Target,
        iconColor: 'text-orange-600',
        bgColor: 'bg-orange-100',
        buttonText: 'Create Project',
      };
    }
    return null;
  };

  const nextAction = getNextAction();
  const completedItems = [
    hasWallet ? 'Wallet connected' : null,
    hasProjects ? 'Project created' : null,
  ].filter((item): item is string => item !== null);

  // If everything is set up, show a celebratory message
  if (!nextAction) {
    return (
      <div className="mb-6">
        <div className="relative rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 shadow-sm">
          <button
            onClick={onDismiss}
            className="absolute top-3 right-3 sm:top-4 sm:right-4 text-green-600 hover:text-green-800 transition-colors"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
          <div className="flex items-start gap-3 sm:gap-4">
            <div className="p-2 sm:p-3 bg-green-100 rounded-xl flex-shrink-0">
              <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-1">
                You're all set, {displayName}!
              </h3>
              <p className="text-green-800 text-sm sm:text-base">
                Your wallet is connected and your project is live. Keep building your community and
                track your progress from this dashboard.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <div className="relative rounded-xl border border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 shadow-sm">
        <button
          onClick={onDismiss}
          className="absolute top-3 right-3 sm:top-4 sm:right-4 text-green-600 hover:text-green-800 transition-colors"
        >
          <X className="h-4 w-4 sm:h-5 sm:w-5" />
        </button>
        <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
          <div className="p-2 sm:p-3 bg-green-100 rounded-xl flex-shrink-0">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base sm:text-lg font-semibold text-green-900 mb-2">
              Welcome to OrangeCat, {displayName}!
            </h3>

            {/* Progress indicator */}
            {completedItems.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {completedItems.map(item => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full"
                  >
                    <CheckCircle className="h-3 w-3" />
                    {item}
                  </span>
                ))}
              </div>
            )}

            {/* Next action card */}
            <Link href={nextAction.href}>
              <div className="p-4 bg-white rounded-lg border border-green-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 ${nextAction.bgColor} rounded-lg flex-shrink-0`}>
                      <nextAction.icon className={`h-5 w-5 ${nextAction.iconColor}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{nextAction.title}</p>
                      <p className="text-sm text-gray-600 mt-0.5">{nextAction.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 flex-shrink-0 hidden sm:block" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardWelcome;
