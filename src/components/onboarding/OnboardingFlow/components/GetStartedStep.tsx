/**
 * GET STARTED STEP COMPONENT
 * Final step - shows action cards for starting the journey
 */

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Badge } from '@/components/ui/badge';
import { DollarSign, MessageCircle, Target, TrendingUp, Users, Sparkles } from 'lucide-react';

export function GetStartedStep() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">You're All Set!</h3>
        <p className="text-muted-foreground">
          Welcome to the OrangeCat community. Here's how to get started right away.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="border-orange-200 bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer"
          onClick={() => router.push('/projects/create')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-orange-600" />
              Create Your First Project
            </CardTitle>
            <CardDescription>Launch a Bitcoin crowdfunding campaign</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Share your idea with the community and start receiving Bitcoin donations. No fees,
              pure peer-to-peer funding.
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-blue-200 bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
          onClick={() => router.push('/discover')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              Explore Projects
            </CardTitle>
            <CardDescription>Discover what the community is building</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Browse innovative Bitcoin projects, support creators you believe in, and learn from
              the community.
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-green-200 bg-green-50 hover:border-green-300 transition-colors cursor-pointer"
          onClick={() => router.push('/loans')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              Check Out My Loans
            </CardTitle>
            <CardDescription>Explore peer-to-peer lending opportunities</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              See how community members are refinancing debt at better rates, or list your own
              loans.
            </p>
          </CardContent>
        </Card>

        <Card
          className="border-purple-200 bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer"
          onClick={() => router.push('/timeline')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-purple-600" />
              Join the Conversation
            </CardTitle>
            <CardDescription>Connect with the Bitcoin community</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Follow projects, engage in discussions, and build relationships with like-minded
              Bitcoin enthusiasts.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-r from-orange-50 to-blue-50 border-orange-200">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Sparkles className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-2">Your OrangeCat Adventure Begins Now</h4>
              <p className="text-sm text-muted-foreground mb-4">
                You've joined a community of Bitcoin innovators, creators, and lenders. Every
                project funded, every loan refinanced, and every connection made strengthens our
                decentralized future.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge>🎯 Bitcoin-Powered</Badge>
                <Badge>🤝 Community-Driven</Badge>
                <Badge>🔓 Self-Custody</Badge>
                <Badge>🚀 Innovation</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
