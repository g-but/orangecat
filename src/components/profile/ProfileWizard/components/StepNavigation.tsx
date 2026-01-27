/**
 * STEP NAVIGATION COMPONENT
 * Visual step indicators with progress
 */

import { CheckCircle } from 'lucide-react';
import type { WizardStep } from '../types';

interface StepNavigationProps {
  steps: WizardStep[];
  currentStep: number;
}

export function StepNavigation({ steps, currentStep }: StepNavigationProps) {
  return (
    <div className="px-6 py-6 bg-gradient-to-r from-gray-50 to-orange-50 border-b relative">
      <div className="flex items-center justify-between max-w-2xl mx-auto relative">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <div key={step.id} className="flex-1 flex flex-col items-center relative">
              {/* Step Circle */}
              <div
                className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-300 ${
                  isCompleted
                    ? 'bg-green-500 border-green-500 text-white shadow-lg'
                    : isCurrent
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg animate-pulse'
                      : isUpcoming
                        ? 'bg-white border-gray-300 text-gray-400'
                        : 'bg-gray-200 border-gray-300 text-gray-500'
                }`}
              >
                {isCompleted ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  <span className="text-lg">{step.title.split(' ')[0]}</span>
                )}

                {/* Priority indicator */}
                {step.required && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white" />
                )}
              </div>

              {/* Step Title */}
              <div className="mt-3 text-center">
                <div
                  className={`text-sm font-semibold transition-colors ${
                    isCompleted ? 'text-green-600' : isCurrent ? 'text-orange-600' : 'text-gray-500'
                  }`}
                >
                  {step.title.split(' ').slice(1).join(' ')}
                </div>
                <div
                  className={`text-xs mt-1 transition-colors ${
                    isCompleted ? 'text-green-500' : isCurrent ? 'text-orange-500' : 'text-gray-400'
                  }`}
                >
                  {isCompleted
                    ? '✓ Complete'
                    : isCurrent
                      ? 'In Progress'
                      : step.required
                        ? 'Required'
                        : 'Optional'}
                </div>
              </div>

              {/* Connection Line */}
              {index < steps.length - 1 && (
                <div
                  className={`absolute top-6 left-1/2 w-full h-0.5 transition-colors ${
                    isCompleted ? 'bg-green-400' : 'bg-gray-300'
                  }`}
                  style={{
                    width: 'calc(100% - 3rem)',
                    left: 'calc(50% + 1.5rem)',
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Current Step Description */}
      <div className="mt-6 text-center max-w-md mx-auto">
        <p className="text-sm text-gray-600 leading-relaxed">{steps[currentStep].description}</p>
        {steps[currentStep].required && (
          <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-red-50 text-red-600 text-xs rounded-full">
            <span>⚠️</span>
            <span>This step is required to continue</span>
          </div>
        )}
      </div>
    </div>
  );
}
