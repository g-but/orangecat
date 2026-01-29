'use client';

import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Play,
  Pause,
  RotateCcw,
  ExternalLink,
  Building,
  LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { Initiative, loadIconComponent } from '@/data/initiatives-lazy';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

interface DemoPageProps {
  initiative: Initiative;
}

interface DemoStep {
  id: string;
  title: string;
  description: string;
  action: string;
  mockData?: any;
}

export default function DemoPage({ initiative }: DemoPageProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [IconComponent, setIconComponent] = useState<LucideIcon>(Building);

  // Lazy load the icon component
  useEffect(() => {
    loadIconComponent(initiative.icon).then(setIconComponent);
  }, [initiative.icon]);

  // Demo steps specific to each initiative
  const getDemoSteps = (initiativeId: string): DemoStep[] => {
    switch (initiativeId) {
      case 'organizations':
        return [
          {
            id: 'create-org',
            title: 'Create Organization',
            description: 'Set up your Bitcoin-powered organization with governance structures',
            action: 'Creating "Orange Cat" organization...',
            mockData: { name: 'Orange Cat', members: 1, treasury: '0.5 BTC' },
          },
          {
            id: 'add-members',
            title: 'Invite Members',
            description: 'Add team members with specific roles and permissions',
            action: 'Inviting first team members...',
            mockData: {
              newMembers: ['Sarah (Developer)', 'Mike (Designer)', 'Alex (Community Manager)'],
            },
          },
          {
            id: 'create-proposal',
            title: 'Create Proposal',
            description: 'Submit proposals for community voting',
            action: 'Creating platform development proposal...',
            mockData: { proposal: 'Develop Organizations Feature', amount: '1.0 BTC' },
          },
          {
            id: 'vote',
            title: 'Vote on Proposals',
            description: 'Democratic decision-making with Bitcoin-weighted voting',
            action: 'Community voting on proposal...',
            mockData: { votes: { yes: 15, no: 1, abstain: 3 } },
          },
        ];

      case 'events':
        return [
          {
            id: 'create-event',
            title: 'Create Event',
            description: 'Set up your party, art exhibit, or weekend getaway',
            action: 'Creating "Summer Art Exhibit & Party"...',
            mockData: {
              name: 'Summer Art Exhibit & Party',
              date: 'July 20, 2025',
              type: 'Art Exhibit',
              capacity: 75,
            },
          },
          {
            id: 'set-tickets',
            title: 'Configure Tickets',
            description: 'Set ticket types and Bitcoin pricing for different experiences',
            action: 'Setting up ticket tiers...',
            mockData: {
              tickets: [
                { type: 'VIP Experience', price: '0.005 BTC', includes: 'Artist meet & greet' },
                { type: 'Standard Entry', price: '0.002 BTC', includes: 'Exhibit access' },
                { type: 'Student/Senior', price: '0.001 BTC', includes: 'Exhibit access' },
              ],
            },
          },
          {
            id: 'sell-tickets',
            title: 'Sell Tickets',
            description: 'Accept Bitcoin payments and manage ticket distribution',
            action: 'Processing ticket sales...',
            mockData: { sold: 42, revenue: '0.089 BTC', waitlist: 8 },
          },
          {
            id: 'manage-attendees',
            title: 'Manage Attendees',
            description: 'Coordinate with attendees, send updates, and handle RSVPs',
            action: 'Sending event reminders...',
            mockData: { attendees: 42, confirmed: 38, updates: 2, messages: 15 },
          },
        ];

      case 'projects':
        return [
          {
            id: 'create-project',
            title: 'Create Project',
            description: 'Launch your Bitcoin-funded project with milestones',
            action: 'Creating "Lightning Wallet App"...',
            mockData: { name: 'Lightning Wallet App', goal: '5 BTC', timeline: '6 months' },
          },
          {
            id: 'set-milestones',
            title: 'Set Milestones',
            description: 'Define project phases with escrow releases',
            action: 'Setting up milestones...',
            mockData: { milestones: ['MVP', 'Beta Release', 'Production Launch'] },
          },
          {
            id: 'fund-project',
            title: 'Receive Funding',
            description: 'Get Bitcoin funding with automatic escrow',
            action: 'Receiving funding...',
            mockData: { funded: '3.2 BTC', percentage: 64 },
          },
          {
            id: 'track-progress',
            title: 'Track Progress',
            description: 'Update progress and release milestone funds',
            action: 'Updating progress...',
            mockData: { progress: 75, nextMilestone: 'Beta Release' },
          },
        ];

      case 'people':
        return [
          {
            id: 'create-profile',
            title: 'Create Profile',
            description: 'Build your Bitcoin community profile',
            action: 'Setting up profile...',
            mockData: { name: 'John Bitcoiner', skills: ['Lightning', 'Development', 'Design'] },
          },
          {
            id: 'join-circles',
            title: 'Join Circles',
            description: 'Connect with Bitcoin interest groups',
            action: 'Joining circles...',
            mockData: { circles: ['Lightning Developers', 'Bitcoin Designers', 'Local Meetup'] },
          },
          {
            id: 'find-connections',
            title: 'Find Connections',
            description: 'Discover like-minded Bitcoin enthusiasts',
            action: 'Finding connections...',
            mockData: { suggestions: 12, mutual: 5 },
          },
          {
            id: 'start-collaboration',
            title: 'Start Collaboration',
            description: 'Begin working together on projects and initiatives',
            action: 'Starting collaboration...',
            mockData: { project: 'Lightning UX Research', collaborators: 3 },
          },
        ];

      case 'assets':
        return [
          {
            id: 'list-asset',
            title: 'List Asset',
            description: 'Add your tools or equipment to the marketplace',
            action: 'Listing Bitcoin mining rig...',
            mockData: { asset: 'Antminer S19', price: '0.001 BTC/day', condition: 'Excellent' },
          },
          {
            id: 'set-availability',
            title: 'Set Availability',
            description: 'Configure rental periods and pricing',
            action: 'Setting availability...',
            mockData: { available: '90% of time', bookings: 12 },
          },
          {
            id: 'receive-booking',
            title: 'Receive Booking',
            description: 'Get Bitcoin payments for asset rentals',
            action: 'Processing booking...',
            mockData: { renter: 'Alice', duration: '7 days', payment: '0.007 BTC' },
          },
          {
            id: 'manage-rental',
            title: 'Manage Rental',
            description: 'Track asset usage and handle returns',
            action: 'Managing rental...',
            mockData: { status: 'Active', daysLeft: 4, deposit: '0.01 BTC' },
          },
        ];

      case 'fundraising':
        return [
          {
            id: 'create-project',
            title: 'Create Project',
            description: 'Launch your Bitcoin fundraising project',
            action: 'Creating "Open Source Lightning Tools"...',
            mockData: { title: 'Open Source Lightning Tools', goal: '10 BTC', duration: '30 days' },
          },
          {
            id: 'customize-page',
            title: 'Customize Page',
            description: 'Design your project page with media and rewards',
            action: 'Customizing project page...',
            mockData: { media: 5, rewards: 3, updates: 0 },
          },
          {
            id: 'receive-funding',
            title: 'Receive Funding',
            description: 'Accept Bitcoin funding from supporters',
            action: 'Receiving funding...',
            mockData: { raised: '6.7 BTC', supporters: 89, percentage: 67 },
          },
          {
            id: 'engage-supporters',
            title: 'Engage Supporters',
            description: 'Send updates and thank supporters',
            action: 'Sending update to supporters...',
            mockData: { updates: 3, engagement: '94%', messages: 156 },
          },
        ];

      default:
        return [];
    }
  };

  const demoSteps = getDemoSteps(initiative.id);

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
      setCompletedSteps(prev => new Set([...Array.from(prev), currentStep]));
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setCompletedSteps(new Set());
    setIsPlaying(false);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      // Auto-advance simulation
      const interval = setInterval(() => {
        setCurrentStep(prev => {
          if (prev < demoSteps.length - 1) {
            setCompletedSteps(prevCompleted => new Set([...Array.from(prevCompleted), prev]));
            return prev + 1;
          } else {
            setIsPlaying(false);
            clearInterval(interval);
            return prev;
          }
        });
      }, 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href={initiative.routes.landing}
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to {initiative.name}
        </Link>
        <Link
          href={initiative.routes.landing}
          className="flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          View Full Details
          <ExternalLink className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {/* Demo Header */}
      <div className="text-center">
        <div
          className={`bg-gradient-to-r from-${initiative.color.bg} to-${initiative.color.bg}/50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}
        >
          <IconComponent className={`w-8 h-8 text-${initiative.color.text}`} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{initiative.name} Demo</h1>
        <p className="text-lg text-gray-600 mb-6">
          Experience how {initiative.name.toLowerCase()} work on our Bitcoin-native platform
        </p>

        {/* Demo Controls */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <Button
            onClick={togglePlayPause}
            className={`bg-${initiative.color.primary} hover:bg-${initiative.color.primary}/90 text-white`}
          >
            {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
            {isPlaying ? 'Pause' : 'Play'} Demo
          </Button>
          <Button onClick={resetDemo} variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="flex justify-between mb-2">
          {demoSteps.map((step, index) => (
            <div
              key={step.id}
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 text-sm font-medium transition-colors ${
                index === currentStep
                  ? `bg-${initiative.color.primary} border-${initiative.color.primary} text-white`
                  : completedSteps.has(index)
                    ? `bg-${initiative.color.bg} border-${initiative.color.primary} text-${initiative.color.text}`
                    : 'bg-white border-gray-300 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded-full">
          <div
            className={`h-2 bg-${initiative.color.primary} rounded-full transition-all duration-500`}
            style={{ width: `${((currentStep + 1) / demoSteps.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Current Step */}
      {demoSteps.length > 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <span
                className={`w-6 h-6 rounded-full bg-${initiative.color.primary} text-white text-sm flex items-center justify-center`}
              >
                {currentStep + 1}
              </span>
              {demoSteps[currentStep].title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">{demoSteps[currentStep].description}</p>
            <div
              className={`bg-${initiative.color.bg}/30 border border-${initiative.color.border} rounded-lg p-4 mb-4`}
            >
              <p className="text-sm font-medium text-gray-700 mb-2">Demo Action:</p>
              <p className={`text-${initiative.color.text} font-medium`}>
                {demoSteps[currentStep].action}
              </p>
              {demoSteps[currentStep].mockData && (
                <div className="mt-3 text-sm text-gray-600">
                  <pre className="bg-white/50 rounded p-2 overflow-x-auto">
                    {JSON.stringify(demoSteps[currentStep].mockData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button onClick={prevStep} disabled={currentStep === 0} variant="outline">
                Previous
              </Button>
              <Button
                onClick={nextStep}
                disabled={currentStep === demoSteps.length - 1}
                className={`bg-${initiative.color.primary} hover:bg-${initiative.color.primary}/90 text-white`}
              >
                {currentStep === demoSteps.length - 1 ? 'Complete' : 'Next Step'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Complete */}
      {currentStep === demoSteps.length - 1 && completedSteps.has(currentStep) && (
        <Card
          className={`bg-gradient-to-r from-${initiative.color.bg} to-${initiative.color.bg}/50 border-${initiative.color.border}`}
        >
          <CardContent className="text-center py-8">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Demo Complete! 🎉</h3>
            <p className="text-gray-600 mb-6">
              You&apos;ve seen how {initiative.name.toLowerCase()} work on our platform. Ready to
              get started?
            </p>
            <div className="flex gap-4 justify-center">
              <Link href={initiative.routes.create || '/auth'}>
                <Button
                  className={`bg-${initiative.color.primary} hover:bg-${initiative.color.primary}/90 text-white`}
                >
                  Get Started
                </Button>
              </Link>
              <Button onClick={resetDemo} variant="outline">
                Watch Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
