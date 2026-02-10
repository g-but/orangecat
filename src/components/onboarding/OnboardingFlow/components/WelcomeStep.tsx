/**
 * WELCOME STEP COMPONENT
 * First step of the onboarding flow introducing OrangeCat
 *
 * Follows Progressive Disclosure: Focus on core value prop only
 * Advanced features (P2P lending, etc.) discovered later
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bitcoin, Eye, Users, CheckCircle, Sparkles } from 'lucide-react';
import { ROUTES } from '@/config/routes';

export function WelcomeStep() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🐾</span>
          </div>
          <h2 className="text-2xl font-semibold mb-2">Welcome to OrangeCat</h2>
          <p className="text-muted-foreground">
            Create a project, share your story, and receive Bitcoin funding directly from supporters
            around the world.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-orange-600" />
              Direct to Your Wallet
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Receive Bitcoin directly. No middlemen, no platform fees on funding.
            </p>
          </CardContent>
        </Card>

        <Card className="border-tiffany-200 bg-tiffany-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Eye className="h-5 w-5 text-tiffany-600" />
              Fully Transparent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Every transaction is visible on-chain. Build trust with your supporters.
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Community Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Connect with like-minded supporters who believe in your project.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-orange-50 to-blue-50 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Ready for your Bitcoin journey?</p>
              <p className="text-xs text-muted-foreground mt-1">
                Let's get you set up in just a few quick steps.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Smart Setup Option */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-3">
            Want a personalized setup based on your goals?
          </p>
          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.ONBOARDING.INTELLIGENT)}
            className="border-purple-200 hover:border-purple-300 hover:bg-purple-50"
          >
            <Sparkles className="h-4 w-4 mr-2 text-purple-600" />
            Smart Setup Guide
          </Button>
        </div>
      </div>
    </div>
  );
}
