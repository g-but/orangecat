'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ProjectWizard } from '@/components/wizard/ProjectWizard';
import { DynamicSidebar, type FieldType } from '@/components/create/DynamicSidebar';
import { Card } from '@/components/ui/Card';
import { CheckCircle2, Edit, Rocket, HelpCircle } from 'lucide-react';

export default function CreateProjectPage() {
  const searchParams = useSearchParams();
  const isEditMode = !!(searchParams.get('edit') || searchParams.get('draft'));

  const [focusedField, setFocusedField] = useState<FieldType>('title');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [goalAmount, setGoalAmount] = useState<number | undefined>();
  const [goalCurrency, setGoalCurrency] = useState<'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS'>('CHF');
  const [showMobileGuidance, setShowMobileGuidance] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {/* Mobile: Compact Progress Bar at Top */}
        <div className="lg:hidden mb-6">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Progress</span>
              <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-bitcoinOrange via-orange-500 to-orange-600 h-2 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            {completionPercentage === 100 && (
              <div className="flex items-center gap-2 text-xs text-green-700 mt-2">
                <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="font-medium">Ready to publish!</span>
              </div>
            )}
          </div>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            {isEditMode ? (
              <>
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Edit className="w-5 h-5 text-orange-600" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Edit Project</h1>
              </>
            ) : (
              <>
                <div className="p-2 bg-gradient-to-br from-orange-100 to-orange-50 rounded-lg">
                  <Rocket className="w-5 h-5 text-orange-600" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">Create New Project</h1>
              </>
            )}
          </div>
          <p className="text-base text-gray-600 ml-12">
            {isEditMode
              ? 'Update your project details below'
              : 'Share your cause and start accepting Bitcoin donations'}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-12">
          {/* Desktop: Progress Card & Guidance Sidebar */}
          <div className="hidden lg:block lg:col-span-5 lg:order-2">
            <div className="lg:sticky lg:top-8 space-y-6">
              {/* Progress Card */}
              <Card className="p-6 shadow-sm border-gray-200">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-semibold text-gray-900">Completion</h3>
                    <span className="text-sm font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-full">
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-bitcoinOrange via-orange-500 to-orange-600 h-3 rounded-full transition-all duration-700 ease-out shadow-sm"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
                {completionPercentage === 100 && (
                  <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded-lg border border-green-200 mt-4">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span className="font-medium">Ready to publish!</span>
                  </div>
                )}
              </Card>

              {/* Dynamic Guidance - Desktop Only */}
              <DynamicSidebar
                activeField={focusedField}
                goalAmount={goalAmount}
                goalCurrency={goalCurrency}
              />
            </div>
          </div>

          {/* Main Content - Project Form */}
          <div className="lg:col-span-7 lg:order-1">
            <ProjectWizard
              onFieldFocus={setFocusedField}
              onProgressChange={setCompletionPercentage}
              onGoalAmountChange={setGoalAmount}
              onGoalCurrencyChange={setGoalCurrency}
            />
          </div>
        </div>

        {/* Mobile: Floating Help Button */}
        {focusedField && (
          <button
            onClick={() => setShowMobileGuidance(true)}
            className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-bitcoinOrange to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
            aria-label="Get help"
          >
            <HelpCircle className="w-6 h-6" />
          </button>
        )}

        {/* Mobile: Guidance Modal */}
        {showMobileGuidance && (
          <div
            className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
            onClick={() => setShowMobileGuidance(false)}
          >
            <div
              className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Help & Guidance</h3>
                <button
                  onClick={() => setShowMobileGuidance(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4">
                <DynamicSidebar
                  activeField={focusedField}
                  goalAmount={goalAmount}
                  goalCurrency={goalCurrency}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
