/**
 * EXPLORE STEP COMPONENT
 * Third step of the onboarding flow — discover and connect
 *
 * Points users to Discover, My Cat, and community features.
 * Includes a subtle note about adding a Bitcoin wallet later in Settings.
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/Card';
import { Compass, MessageCircle, Users, Bitcoin, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/config/routes';

const EXPLORE_OPTIONS = [
  {
    icon: Compass,
    title: 'Discover Projects',
    description: 'Browse what others are building and find inspiration',
    href: ROUTES.DISCOVER,
    color: 'orange',
  },
  {
    icon: MessageCircle,
    title: 'My Cat',
    description: 'Your AI assistant for questions about OrangeCat',
    href: '/dashboard/my-cat',
    color: 'purple',
  },
  {
    icon: Users,
    title: 'Community',
    description: 'Connect with creators and supporters',
    href: ROUTES.COMMUNITY,
    color: 'blue',
  },
] as const;

const COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  orange: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'hover:border-orange-300' },
  purple: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'hover:border-purple-300' },
  blue: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'hover:border-blue-300' },
};

export function ExploreStep() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold mb-2">Explore & Connect</h3>
        <p className="text-sm text-muted-foreground">
          Discover what's happening on OrangeCat and find your community.
        </p>
      </div>

      <div className="space-y-3">
        {EXPLORE_OPTIONS.map(option => {
          const Icon = option.icon;
          const colors = COLOR_CLASSES[option.color];
          return (
            <Card
              key={option.title}
              className={`${colors.border} hover:shadow-md transition-all cursor-pointer`}
              onClick={() => router.push(option.href)}
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
                  onClick={() => router.push(ROUTES.SETTINGS)}
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
