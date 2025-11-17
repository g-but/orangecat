'use client';

import { useState } from 'react';
import {
  Lightbulb,
  Users,
  User,
  Heart,
  Target,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  MessageSquare,
  DollarSign,
  Globe,
  Zap,
  Building,
} from 'lucide-react';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Textarea';
import { Progress } from '@/components/ui/progress';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

type AnalysisResult = {
  isPersonal: boolean;
  isBusiness: boolean;
  isCharity: boolean;
  needsFunding: boolean;
  confidence: number;
  recommendation?: string;
};

export default function IntelligentOnboarding() {
  const router = useRouter();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [userDescription, setUserDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startAnalysis = async () => {
    if (!userDescription.trim()) {
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    setCurrentStep(1); // move to analyzing step
    try {
      const res = await fetch('/api/onboarding/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: userDescription }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to analyze');
      }

      setAnalysis(data as AnalysisResult);
      // brief delay for UX polish
      setTimeout(() => {
        setIsAnalyzing(false);
        setCurrentStep(2);
      }, 800);
    } catch (e) {
      setIsAnalyzing(false);
      setError(e instanceof Error ? e.message : 'Analysis failed');
    }
  };

  const goNext = () => setCurrentStep(s => Math.min(s + 1, 3));
  const goBack = () => setCurrentStep(s => Math.max(s - 1, 0));

  const handleSetup = () => {
    router.push('/projects/create');
  };

  // Step 1: Describe needs
  const Step1 = (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-orange-100 to-tiffany-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="w-8 h-8 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">What do you need Bitcoin for?</h2>
        <p className="text-gray-600">
          Tell us about your project, cause, or idea. We'll help you set up the perfect Bitcoin
          fundraising solution.
        </p>
      </div>

      <div className="space-y-4">
        <Textarea
          data-testid="onboarding-description"
          placeholder="e.g., 'I run a local cat shelter and need funds for food and medical care' or 'I'm building an open source Bitcoin wallet and need development funding' or 'My community wants to organize a Bitcoin education event'..."
          value={userDescription}
          onChange={e => setUserDescription(e.target.value)}
          rows={6}
          className="w-full resize-none"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className="p-4 border-2 border-dashed border-gray-200 hover:border-orange-300 transition-colors cursor-pointer"
            onClick={() =>
              setUserDescription(
                prev =>
                  (prev ? prev + ' ' : '') +
                  'I run a local cat shelter and need funds for food and medical care'
              )
            }
          >
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-red-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Charity/Non-profit</h3>
                <p className="text-sm text-gray-600">
                  Animal shelters, community aid, disaster relief
                </p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 border-2 border-dashed border-gray-200 hover:border-tiffany-300 transition-colors cursor-pointer"
            onClick={() =>
              setUserDescription(
                prev =>
                  (prev ? prev + ' ' : '') +
                  'I am building an open source Bitcoin wallet and need development funding'
              )
            }
          >
            <div className="flex items-center gap-3">
              <Building className="w-6 h-6 text-blue-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Business/Startup</h3>
                <p className="text-sm text-gray-600">Product development, business expansion</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 border-2 border-dashed border-gray-200 hover:border-green-300 transition-colors cursor-pointer"
            onClick={() =>
              setUserDescription(
                prev =>
                  (prev ? prev + ' ' : '') +
                  'My community wants to organize a Bitcoin education event'
              )
            }
          >
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Community/Event</h3>
                <p className="text-sm text-gray-600">Meetups, conferences, group activities</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-4 border-2 border-dashed border-gray-200 hover:border-yellow-300 transition-colors cursor-pointer"
            onClick={() =>
              setUserDescription(
                prev =>
                  (prev ? prev + ' ' : '') +
                  'I am developing open source Bitcoin software and need funding'
              )
            }
          >
            <div className="flex items-center gap-3">
              <Zap className="w-6 h-6 text-orange-500" />
              <div>
                <h3 className="font-semibold text-gray-900">Open Source/Tech</h3>
                <p className="text-sm text-gray-600">Software development, research projects</p>
              </div>
            </div>
          </Card>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <Button
          data-testid="onboarding-analyze"
          onClick={startAnalysis}
          disabled={!userDescription.trim()}
          className="w-full bg-gradient-to-r from-orange-600 to-tiffany-600 hover:from-orange-700 hover:to-tiffany-700"
        >
          Analyze My Needs
        </Button>
      </div>
    </div>
  );

  // Step 2: Analyzing
  const Step2 = (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-br from-tiffany-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Lightbulb className="w-8 h-8 text-tiffany-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Analyzing Your Needs...</h2>
        <p className="text-gray-600">Analyzing keywords, context, and requirements...</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
        </div>
        <Progress value={66} className="w-full" />
      </div>
    </div>
  );

  // Step 3: Recommendation
  const Step3 = (
    <div className="space-y-6">
      {analysis && (
        <>
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-br from-green-100 to-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8 text-green-600" />
            </div>
            <h2
              data-testid="onboarding-recommended-title"
              className="text-2xl font-bold text-gray-900 mb-2"
            >
              Personal Project Recommended
            </h2>
            <p className="text-gray-600">
              {analysis.recommendation ||
                'Based on your description, a personal project is the perfect fit for your Bitcoin fundraising needs.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6 border-2 border-green-200 bg-green-50">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5" />
                Recommended Benefits
              </h3>
              <ul className="space-y-2">
                {[
                  'Get started quickly with a simple setup',
                  'You have full control over your project',
                  'A personal page to share your story',
                  'Directly connect with your supporters',
                  'Transparent Bitcoin fundraising',
                  'Easy project management and updates',
                ].map((b, i) => (
                  <li key={i} className="text-sm text-green-700 flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    {b}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-6 border-2 border-blue-200 bg-blue-50">
              <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                <Target className="w-5 h-5" />
                What You'll Get
              </h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-700">Bitcoin wallet setup</span>
                </div>
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-700">Public fundraising page</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-blue-700">Transparency dashboard</span>
                </div>
              </div>
            </Card>
          </div>

          <div className="flex justify-end pt-4">
            <Button data-testid="onboarding-next" onClick={goNext}>
              Next
            </Button>
          </div>
        </>
      )}
    </div>
  );

  // Step 4: Ready to Start
  const Step4 = (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Ready to Get Started?</h2>
        <p className="text-gray-600">
          Create your personal Bitcoin fundraising project and start making an impact.
        </p>
      </div>

      <div className="space-y-6">
        <Card
          className="p-6 border-2 border-orange-500 bg-gradient-to-br from-orange-50 to-tiffany-50 cursor-pointer hover:shadow-lg transition-shadow relative"
          onClick={handleSetup}
        >
          <div className="absolute top-4 right-4 px-2 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
            Recommended
          </div>
          <div className="flex items-center gap-3 mb-4">
            <User className="w-8 h-8 text-orange-600" />
            <h3 className="text-xl font-semibold text-orange-800">Create Your Personal Project</h3>
          </div>
          <p className="text-orange-700 mb-4">
            Start your Bitcoin fundraising journey with a personal project. Full control,
            transparency, and direct connection with supporters.
          </p>
          <Button
            data-testid="onboarding-create-personal"
            className="w-full bg-orange-600 hover:bg-orange-700"
          >
            Create My Project
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Card>
      </div>

      <div className="space-y-4">
        <Card
          className="p-4 border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
          onClick={() => router.push('/discover')}
        >
          <div className="flex items-center gap-3 mb-2">
            <Globe className="w-6 h-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Explore Existing Projects</h3>
          </div>
          <p className="text-sm text-gray-600">
            See how others are using OrangeCat for Bitcoin fundraising.
          </p>
        </Card>

        <Card
          className="p-4 border-2 border-gray-200 hover:border-gray-300 transition-colors cursor-pointer"
          onClick={() => router.push('/study-bitcoin')}
        >
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-6 h-6 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-800">Learn About Bitcoin</h3>
          </div>
          <p className="text-sm text-gray-600">
            New to Bitcoin? Get started with our educational resources.
          </p>
        </Card>
      </div>
    </div>
  );

  // Layout wrapper with step controls
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-tiffany-50">
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">Step {currentStep + 1} of 4</p>
            <h1 className="text-3xl font-bold text-gray-900">Smart Setup Guide</h1>
          </div>
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={goBack}>
                Back
              </Button>
            )}
          </div>
        </div>

        <Card className="p-6">
          {currentStep === 0 && Step1}
          {currentStep === 1 && Step2}
          {currentStep === 2 && Step3}
          {currentStep === 3 && Step4}
        </Card>
      </div>
    </div>
  );
}
