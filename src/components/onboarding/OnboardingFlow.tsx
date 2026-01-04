'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  MessageCircle,
  Heart,
  Share2,
  Target,
  TrendingUp,
  Users,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Bitcoin,
  Building,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileService } from '@/services/profile';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { onboardingEvents } from '@/lib/analytics';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  content: React.ReactNode;
  action?: {
    label: string;
    href: string;
    primary?: boolean;
  };
}

export function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [completingOnboarding, setCompletingOnboarding] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    // Track onboarding start when component mounts
    onboardingEvents.started(user?.id);
  }, [user?.id]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to OrangeCat! 🟠',
      description: 'Your gateway to Bitcoin-powered crowdfunding and community lending',
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🐾</span>
              </div>
              <h2 className="text-2xl font-bold mb-2">
                Welcome to OrangeCat
              </h2>
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
        </div>
      ),
    },
    {
      id: 'wallet-setup',
      title: 'Add Your Bitcoin Address',
      description: 'Paste your Bitcoin address to receive funds',
      icon: Bitcoin,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bitcoin className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Add Your Bitcoin Address</h3>
            <p className="text-muted-foreground">
              Paste your Bitcoin wallet address so supporters can send you Bitcoin directly. You keep full control of your funds.
            </p>
          </div>

          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Sparkles className="h-6 w-6 text-orange-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">How It Works</h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">1.</span>
                      <span><strong>Get your address</strong> from your Bitcoin wallet (Muun, BlueWallet, Ledger, etc.)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">2.</span>
                      <span><strong>Paste it</strong> in your OrangeCat wallet settings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-orange-600 font-bold">3.</span>
                      <span><strong>Receive Bitcoin</strong> directly when your projects get funded</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Self-Custody</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your Bitcoin goes directly to your wallet. We never hold your funds.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">No Fees</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Zero platform fees on donations. You keep 100% of what's sent.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Don't have a Bitcoin wallet yet?</p>
                <p className="text-xs text-blue-700 mt-1">
                  No problem! You can skip this step and add your address later. We recommend <strong>Muun</strong> or <strong>BlueWallet</strong> for beginners.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
      action: {
        label: 'Add My Bitcoin Address',
        href: '/dashboard/wallets',
      },
    },
    {
      id: 'get-started',
      title: 'Ready to Start Your Journey?',
      description: 'Choose your first action and begin building with OrangeCat',
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">You're All Set!</h3>
            <p className="text-muted-foreground">
              Welcome to the OrangeCat community. Here's how to get started right away.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-orange-200 bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer"
                  onClick={() => router.push('/projects/create')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-600" />
                  Create Your First Project
                </CardTitle>
                <CardDescription>Launch a Bitcoin crowdfunding campaign</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share your idea with the community and start receiving Bitcoin donations. No fees, pure peer-to-peer funding.
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50 hover:border-blue-300 transition-colors cursor-pointer"
                  onClick={() => router.push('/discover')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Explore Projects
                </CardTitle>
                <CardDescription>Discover what the community is building</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Browse innovative Bitcoin projects, support creators you believe in, and learn from the community.
                </p>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50 hover:border-green-300 transition-colors cursor-pointer"
                  onClick={() => router.push('/loans')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Check Out My Loans
                </CardTitle>
                <CardDescription>Explore peer-to-peer lending opportunities</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  See how community members are refinancing debt at better rates, or list your own loans.
                </p>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50 hover:border-purple-300 transition-colors cursor-pointer"
                  onClick={() => router.push('/timeline')}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-purple-600" />
                  Join the Conversation
                </CardTitle>
                <CardDescription>Connect with the Bitcoin community</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Follow projects, engage in discussions, and build relationships with like-minded Bitcoin enthusiasts.
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
                    You've joined a community of Bitcoin innovators, creators, and lenders. Every project funded,
                    every loan refinanced, and every connection made strengthens our decentralized future.
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
      ),
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Track step completion
      onboardingEvents.stepCompleted(currentStep, steps[currentStep].id, user?.id);
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
      // Track viewing next step
      onboardingEvents.stepViewed(currentStep + 1, steps[currentStep + 1].id, user?.id);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onboardingEvents.skipped(currentStep, user?.id);
    router.push('/dashboard?welcome=true');
  };

  const handleAction = (href: string) => {
    onboardingEvents.stepCompleted(currentStep, steps[currentStep].id, user?.id);
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    router.push(href);
  };

  const handleCompleteOnboarding = async () => {
    if (!user?.id) {
      router.push('/dashboard?welcome=true');
      return;
    }

    setCompletingOnboarding(true);
    try {
      await ProfileService.fallbackProfileUpdate(user.id, {
        onboarding_completed: true
      });
      onboardingEvents.completed(user.id);
      toast.success('Welcome to OrangeCat! Your journey begins now.');
      router.push('/dashboard?welcome=true');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
      // Still mark as completed in analytics - the user tried
      onboardingEvents.completed(user.id);
      toast.error('Something went wrong, but you can continue to your dashboard.');
      router.push('/dashboard?welcome=true');
    } finally {
      setCompletingOnboarding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome to OrangeCat</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-2">
            Discover all the amazing features we've built for Bitcoin creators and lenders!
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium">
              Step {currentStep + 1} of {steps.length}
            </span>
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="mb-8">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {React.createElement(steps[currentStep].icon, {
                      className: 'h-6 w-6 text-primary',
                    })}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{steps[currentStep].title}</CardTitle>
                    <CardDescription>{steps[currentStep].description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>{steps[currentStep].content}</CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="w-full sm:w-auto"
          >
            Previous
          </Button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {steps[currentStep].action && (
              <Button
                onClick={() => handleAction(steps[currentStep].action!.href)}
                variant={steps[currentStep].action.primary ? 'primary' : 'outline'}
                className="w-full sm:w-auto"
              >
                {steps[currentStep].action.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {currentStep < steps.length - 1 && (
              <Button onClick={handleNext} className="w-full sm:w-auto">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {currentStep === steps.length - 1 && (
              <Button
                onClick={handleCompleteOnboarding}
                disabled={completingOnboarding}
                className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700"
              >
                {completingOnboarding ? 'Setting up...' : 'Get Started'}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>

        {/* Step Indicators */}
        <div className="flex justify-center mt-8 gap-2">
          {steps.map((step, index) => (
            <button
              key={step.id}
              onClick={() => setCurrentStep(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                index === currentStep
                  ? 'bg-primary'
                  : completedSteps.has(index)
                    ? 'bg-primary/60'
                    : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
