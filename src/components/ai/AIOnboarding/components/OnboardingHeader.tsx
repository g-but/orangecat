/**
 * ONBOARDING HEADER COMPONENT
 * Header with progress bar and navigation
 */

import { useRouter } from 'next/navigation';
import { Bot } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Progress } from '@/components/ui/progress';

interface OnboardingHeaderProps {
  currentStep: number;
  totalSteps: number;
  currentStepTitle: string;
  progress: number;
}

export function OnboardingHeader({
  currentStep,
  totalSteps,
  currentStepTitle,
  progress,
}: OnboardingHeaderProps) {
  const router = useRouter();

  return (
    <>
      {/* Header */}
      <div className="bg-white border-b border-tiffany-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Bot className="w-8 h-8 text-tiffany-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">Set Up My AI</h1>
                <p className="text-sm text-gray-600">
                  Step {currentStep + 1} of {totalSteps}
                </p>
              </div>
            </div>
            <Button variant="outline" onClick={() => router.push('/settings/ai')}>
              Skip for Now
            </Button>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">{currentStepTitle}</span>
              <span className="text-sm text-gray-500">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </>
  );
}
