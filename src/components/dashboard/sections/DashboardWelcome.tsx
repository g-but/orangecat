'use client';

import Link from 'next/link';
import { X, Sparkles, Target, Wallet, Eye, MessageCircle } from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';

interface DashboardWelcomeProps {
  profile: {
    name?: string | null;
    username?: string | null;
  } | null;
  onDismiss: () => void;
}

/**
 * DashboardWelcome - Welcome message for new users
 * Shows getting started actions using ENTITY_REGISTRY for routes
 */
export function DashboardWelcome({ profile, onDismiss }: DashboardWelcomeProps) {
  const welcomeActions = [
    {
      href: ENTITY_REGISTRY.project.createPath,
      icon: Target,
      iconColor: 'text-orange-600',
      label: 'Create Project',
      description: 'Launch your first campaign',
    },
    {
      href: ENTITY_REGISTRY.wallet.basePath,
      icon: Wallet,
      iconColor: 'text-blue-600',
      label: 'Add Wallet',
      description: 'Connect Bitcoin wallet',
    },
    {
      href: '/discover',
      icon: Eye,
      iconColor: 'text-purple-600',
      label: 'Explore',
      description: 'Discover projects',
    },
    {
      href: '/timeline',
      icon: MessageCircle,
      iconColor: 'text-indigo-600',
      label: 'Join Community',
      description: 'Connect & engage',
    },
  ];

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
              🎉 Welcome to OrangeCat, {profile?.name || profile?.username || 'Creator'}!
            </h3>
            <p className="text-green-800 mb-3 sm:mb-4 text-sm sm:text-base">
              Your Bitcoin crowdfunding journey starts now. Here's what you can do to get started:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {welcomeActions.map(action => (
                <Link key={action.href} href={action.href}>
                  <div className="p-3 bg-white rounded-lg border border-green-200 hover:border-green-300 hover:shadow-sm transition-all cursor-pointer min-h-[80px] sm:min-h-0">
                    <action.icon className={`h-5 w-5 ${action.iconColor} mb-2`} />
                    <p className="text-sm font-medium text-gray-900">{action.label}</p>
                    <p className="text-xs text-gray-600 hidden sm:block mt-1">
                      {action.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardWelcome;
