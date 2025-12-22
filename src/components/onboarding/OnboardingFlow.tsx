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
  const router = useRouter();

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to OrangeCat! 🟠',
      description: 'Your Bitcoin crowdfunding platform just got supercharged with new features!',
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <div className="mb-6">
              <Bitcoin className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">
                Welcome to the Future of Bitcoin Crowdfunding
              </h2>
              <p className="text-muted-foreground">
                OrangeCat has evolved from simple crowdfunding to a comprehensive financial
                platform. Discover your new superpowers!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                  My Loans System
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  List your loans for refinancing or browse community lending opportunities. Beat
                  high-interest lenders with peer-to-peer offers!
                </p>
              </CardContent>
            </Card>

            <Card className="border-blue-200 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-blue-600" />
                  Social Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Like, comment, share, and engage with posts. Build community around projects you
                  care about with full social features.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      id: 'loans',
      title: 'Discover My Loans',
      description: 'Your personal peer-to-peer lending marketplace',
      icon: DollarSign,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Building className="h-12 w-12 text-orange-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Break Free from High-Interest Debt</h3>
            <p className="text-muted-foreground">
              List your existing loans and receive competitive refinancing offers from the
              community.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 border rounded-lg">
              <div className="bg-orange-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-orange-600" />
              </div>
              <h4 className="font-semibold mb-2">List Your Loans</h4>
              <p className="text-sm text-muted-foreground">
                Add your credit cards, student loans, personal loans, or any debt
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="bg-green-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-semibold mb-2">Receive Offers</h4>
              <p className="text-sm text-muted-foreground">
                Get competitive refinancing offers from community lenders
              </p>
            </div>

            <div className="text-center p-4 border rounded-lg">
              <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <h4 className="font-semibold mb-2">Save Money</h4>
              <p className="text-sm text-muted-foreground">
                Lower interest rates, better terms, community-powered lending
              </p>
            </div>
          </div>

          <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">What Makes My Loans Special?</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>
                      • <strong>Peer-to-peer:</strong> Direct connection with lenders
                    </li>
                    <li>
                      • <strong>Bitcoin-powered:</strong> Fast, low-fee transactions
                    </li>
                    <li>
                      • <strong>Community-driven:</strong> Wisdom of crowds for better rates
                    </li>
                    <li>
                      • <strong>Transparent:</strong> Full visibility into terms and conditions
                    </li>
                    <li>
                      • <strong>Flexible:</strong> Refinance or payoff options
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      action: {
        label: 'Explore My Loans',
        href: '/loans',
        primary: true,
      },
    },
    {
      id: 'social',
      title: 'Social Timeline Features',
      description: 'Engage with the community through likes, comments, and shares',
      icon: Heart,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Build Community Together</h3>
            <p className="text-muted-foreground">
              Every post now supports full social interaction. Like, comment, share, and engage!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500" />
                  Like & Dislike
                </CardTitle>
                <CardDescription>Show appreciation or flag potential issues</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Like posts you support and dislike those that might be suspicious. Help the
                  community identify scams and celebrate great projects.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  Comments & Threads
                </CardTitle>
                <CardDescription>Discuss projects in detail</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Ask questions, share feedback, and build discussions around projects. Threaded
                  replies keep conversations organized.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-purple-500" />
                  Share & Repost
                </CardTitle>
                <CardDescription>Spread the word about great projects</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Share projects with your network. Add your own commentary to help others discover
                  amazing Bitcoin projects.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-orange-500" />
                  Community Moderation
                </CardTitle>
                <CardDescription>Collective wisdom against scams</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  High dislike counts help identify potential issues. Community-driven moderation
                  keeps OrangeCat safe and trustworthy.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Users className="h-6 w-6 text-blue-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">Why Social Features Matter</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>
                      • <strong>Discovery:</strong> Find projects through shares and likes
                    </li>
                    <li>
                      • <strong>Trust:</strong> Community feedback builds credibility
                    </li>
                    <li>
                      • <strong>Engagement:</strong> Discussions drive project success
                    </li>
                    <li>
                      • <strong>Safety:</strong> Collective moderation against scams
                    </li>
                    <li>
                      • <strong>Network:</strong> Connect with like-minded Bitcoin enthusiasts
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      action: {
        label: 'Explore Timeline',
        href: '/timeline',
      },
    },
    {
      id: 'dashboard',
      title: 'Your Enhanced Dashboard',
      description: 'Everything you need in one place',
      icon: TrendingUp,
      content: (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <TrendingUp className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Your Command Center</h3>
            <p className="text-muted-foreground">
              Access all your projects, loans, and social activity from one unified dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Everything at your fingertips</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <DollarSign className="h-5 w-5 text-orange-500" />
                  <div>
                    <p className="font-medium">My Loans</p>
                    <p className="text-sm text-muted-foreground">Manage your loan listings</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Target className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">Create Project</p>
                    <p className="text-sm text-muted-foreground">
                      Start a new crowdfunding campaign
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <MessageCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <p className="font-medium">Timeline</p>
                    <p className="text-sm text-muted-foreground">See community activity</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>Track your engagement and progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Projects Created</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Loans Listed</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Community Likes</span>
                  <Badge variant="secondary">0</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Offers Received</span>
                  <Badge variant="secondary">0</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold mb-2">Ready to Start Your Journey?</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Your OrangeCat dashboard is your gateway to Bitcoin crowdfunding, peer-to-peer
                    lending, and community engagement. Everything you need to succeed is right here.
                  </p>
                  <div className="flex gap-2">
                    <Badge>Projects</Badge>
                    <Badge>Loans</Badge>
                    <Badge>Social</Badge>
                    <Badge>Analytics</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ),
      action: {
        label: 'Go to Dashboard',
        href: '/dashboard',
        primary: true,
      },
    },
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    router.push('/dashboard');
  };

  const handleAction = (href: string) => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">Welcome to OrangeCat 2.0</h1>
          <p className="text-muted-foreground">
            Discover all the amazing new features we've added just for you!
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
        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 0}>
            Previous
          </Button>

          <div className="flex gap-2">
            {steps[currentStep].action && (
              <Button
                onClick={() => handleAction(steps[currentStep].action!.href)}
                variant={steps[currentStep].action.primary ? 'default' : 'outline'}
              >
                {steps[currentStep].action.label}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {currentStep < steps.length - 1 && (
              <Button onClick={handleNext}>
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}

            {currentStep === steps.length - 1 && (
              <Button onClick={() => router.push('/dashboard')}>
                Get Started
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
