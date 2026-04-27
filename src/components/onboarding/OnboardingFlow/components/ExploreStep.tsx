/**
 * EXPLORE STEP COMPONENT
 * Third step of the onboarding flow — discover and connect
 *
 * Points users to Discover, My Cat, and community features.
 * Includes a subtle note about adding a Bitcoin wallet later in Settings.
 *
 * Uses OnboardingContext to mark onboarding complete before navigating away.
 */

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Bitcoin, ArrowRight, Loader2 } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { EXPLORE_OPTIONS, EXPLORE_COLOR_CLASSES } from '@/config/onboarding';
import { useOnboardingContext } from '../context';

export function ExploreStep() {
  const { onNavigateAway } = useOnboardingContext();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  const handleOptionClick = (href: string) => {
    if (loadingHref) {
      return;
    }
    setLoadingHref(href);
    onNavigateAway(href);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        {EXPLORE_OPTIONS.map(option => {
          const Icon = option.icon;
          const colors = EXPLORE_COLOR_CLASSES[option.color];
          const isLoading = loadingHref === option.href;
          return (
            <Card
              key={option.title}
              className={`transition-all ${isLoading ? `${colors.border.replace('hover:', '')} shadow-md` : loadingHref ? 'opacity-50 cursor-not-allowed' : `${colors.border} hover:shadow-md cursor-pointer`}`}
              onClick={() => handleOptionClick(option.href)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 ${colors.bg} rounded-xl flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{option.title}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                {isLoading ? (
                  <Loader2 className={`h-4 w-4 ${colors.text} animate-spin flex-shrink-0`} />
                ) : (
                  <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Wallet setup note — gentle nudge, not a blocker */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bitcoin className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm text-amber-900">
                <strong>Bitcoin wallet?</strong> You can add your Bitcoin address anytime in{' '}
                <button
                  onClick={() => handleOptionClick(ROUTES.SETTINGS)}
                  className="underline hover:text-amber-700 font-medium"
                >
                  Settings
                </button>{' '}
                to start receiving funds directly.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
