/**
 * WELCOME STEP COMPONENT
 * First step of the onboarding flow introducing OrangeCat
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Bitcoin, DollarSign, Users, CheckCircle, Sparkles } from 'lucide-react';
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
          <h2 className="text-2xl font-bold mb-2">Welcome to OrangeCat</h2>
          <p className="text-muted-foreground">
            The decentralized platform where Bitcoin meets community. Fund projects, access
            peer-to-peer lending, and build with like-minded creators.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bitcoin className="h-5 w-5 text-orange-600" />
              Bitcoin-First
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Fund and receive payments in Bitcoin. No intermediaries, no fees on donations.
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Peer-to-Peer Lending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              List loans for refinancing or lend to community members. Better rates than banks.
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Community-Driven
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Social features, project discussions, and collective wisdom against scams.
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
