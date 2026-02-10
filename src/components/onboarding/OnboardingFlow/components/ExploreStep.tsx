/**
 * EXPLORE STEP COMPONENT
 * Third step of the onboarding flow — discover and connect
 *
 * Points users to Discover, My Cat, and community features.
 * Includes a subtle note about adding a Bitcoin wallet later in Settings.
 *
 * Uses OnboardingContext to mark onboarding complete before navigating away.
 */

import { Card, CardContent } from '@/components/ui/Card';
import { Bitcoin, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { EXPLORE_OPTIONS, EXPLORE_COLOR_CLASSES } from '@/config/onboarding';
import { useOnboardingContext } from '../context';

export function ExploreStep() {
  const { onNavigateAway } = useOnboardingContext();

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold mb-2">Explore & Connect</h3>
        <p className="text-sm text-muted-foreground">
          Discover what's happening on OrangeCat and find your community.
        </p>
      </div>

      <div className="space-y-3">
        {EXPLORE_OPTIONS.map(option => {
          const Icon = option.icon;
          const colors = EXPLORE_COLOR_CLASSES[option.color];
          return (
            <Card
              key={option.title}
              className={`${colors.border} hover:shadow-md transition-all cursor-pointer`}
              onClick={() => onNavigateAway(option.href)}
            >
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-3 ${colors.bg} rounded-xl flex-shrink-0`}>
                  <Icon className={`h-5 w-5 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{option.title}</p>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
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
                  onClick={() => onNavigateAway(ROUTES.SETTINGS)}
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
