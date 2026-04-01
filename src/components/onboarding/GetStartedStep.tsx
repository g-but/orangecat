'use client';

/**
 * Step 3: Get Started - profile summary and quick action links.
 * Final step of profile completion.
 */

import { Wallet, Sparkles, MessageCircle, ArrowRight, Check } from 'lucide-react';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { ROUTES } from '@/config/routes';

interface GetStartedStepProps {
  displayName: string;
  username: string;
  bio: string;
  locationCity: string;
  onQuickAction: (href: string) => void;
}

export function GetStartedStep({
  displayName,
  username,
  bio,
  locationCity,
  onQuickAction,
}: GetStartedStepProps) {
  // Build summary of what they entered
  const summaryItems = [
    displayName && { label: 'Name', value: displayName },
    username && { label: 'Username', value: `@${username}` },
    bio && { label: 'Bio', value: bio.length > 60 ? bio.slice(0, 60) + '...' : bio },
    locationCity && { label: 'Location', value: locationCity },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div className="space-y-6">
      {/* Profile summary */}
      {summaryItems.length > 0 && (
        <div className="rounded-lg border border-tiffany-200 bg-tiffany-50/50 p-4">
          <p className="text-sm font-medium text-tiffany-800 mb-3">Your profile so far:</p>
          <div className="space-y-1.5">
            {summaryItems.map(item => (
              <div key={item.label} className="flex items-center gap-2 text-sm">
                <Check className="h-3.5 w-3.5 text-tiffany-600 flex-shrink-0" />
                <span className="text-gray-600">{item.label}:</span>
                <span className="text-gray-900 font-medium truncate">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick actions */}
      <div className="space-y-3">
        <p className="text-sm text-gray-500 font-medium">What would you like to do first?</p>

        <QuickActionButton
          onClick={() => onQuickAction(ENTITY_REGISTRY.wallet.basePath)}
          iconBg="bg-blue-100"
          iconColor="text-blue-600"
          icon={Wallet}
          title="Add a wallet"
          description="Connect your Bitcoin wallet to receive funding"
        />

        <QuickActionButton
          onClick={() => onQuickAction(ENTITY_REGISTRY.project.createPath)}
          iconBg="bg-orange-100"
          iconColor="text-orange-600"
          icon={Sparkles}
          title="Create your first offering"
          description="Launch a project, product, or service"
        />

        <QuickActionButton
          onClick={() => onQuickAction(ROUTES.DASHBOARD.CAT)}
          iconBg="bg-purple-100"
          iconColor="text-purple-600"
          icon={MessageCircle}
          title="Chat with your Cat"
          description="Ask anything about the platform"
        />
      </div>
    </div>
  );
}

// --- Internal component ---

interface QuickActionButtonProps {
  onClick: () => void;
  iconBg: string;
  iconColor: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

function QuickActionButton({
  onClick,
  iconBg,
  iconColor,
  icon: Icon,
  title,
  description,
}: QuickActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-tiffany-300 hover:bg-tiffany-50/30 transition-all text-left group"
    >
      <div className={`p-2 ${iconBg} rounded-lg flex-shrink-0`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-tiffany-600 transition-colors" />
    </button>
  );
}
