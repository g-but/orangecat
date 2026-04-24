/**
 * WELCOME STEP COMPONENT
 * First step of the onboarding flow introducing OrangeCat.
 *
 * Cat-first design: primary CTA is "Tell My Cat what you need".
 * The manual entity creation flow remains available for users who know exactly what they want.
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bitcoin, Eye, Users, Cat, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export function WelcomeStep() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
          <span className="text-4xl">🐾</span>
        </div>
        <h2 className="text-2xl font-semibold mb-2">Welcome to OrangeCat</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Earn, fund, save, and connect — with Bitcoin, with your community, on your terms.
        </p>
      </div>

      {/* Primary CTA: Cat */}
      <button
        onClick={() => router.push(ROUTES.ONBOARDING.INTELLIGENT)}
        className="w-full text-left"
      >
        <div className="flex items-center gap-4 p-4 rounded-xl border-2 border-orange-300 bg-orange-50 hover:bg-orange-100 hover:border-orange-400 transition-all">
          <div className="p-3 bg-orange-100 rounded-xl flex-shrink-0">
            <Cat className="h-6 w-6 text-orange-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-orange-900">Tell My Cat what you need</p>
            <p className="text-sm text-orange-700 mt-0.5">
              Describe your goals — your AI assistant will suggest the right setup in seconds
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-orange-400 flex-shrink-0" />
        </div>
      </button>

      {/* Value prop cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bitcoin className="h-4 w-4 text-orange-600" />
              Direct Payments
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground">
              Receive Bitcoin directly. No middlemen, no platform cut on funding.
            </p>
          </CardContent>
        </Card>

        <Card className="border-tiffany-200 bg-tiffany-50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Eye className="h-4 w-4 text-tiffany-600" />
              Transparent
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground">
              Every transaction is on-chain. Build trust with your community.
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Any Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-xs text-muted-foreground">
              Pseudonymous by default. Any person, name, or organisation can participate.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary option: manual browse */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          Know exactly what you want to create?{' '}
          <span className="text-gray-500">Continue below to browse all options.</span>
        </p>
      </div>
    </div>
  );
}
