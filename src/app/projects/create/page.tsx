'use client';

import { useState } from 'react';
import { ProjectWizard } from '@/components/wizard/ProjectWizard';
import { DynamicSidebar, type FieldType } from '@/components/create/DynamicSidebar';
import { Card } from '@/components/ui/Card';
import { CheckCircle2 } from 'lucide-react';

export default function CreateProjectPage() {
  const [focusedField, setFocusedField] = useState<FieldType>('title');
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [goalAmount, setGoalAmount] = useState<number | undefined>();
  const [goalCurrency, setGoalCurrency] = useState<'CHF' | 'USD' | 'EUR' | 'BTC' | 'SATS'>('CHF');

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50/30 via-white to-tiffany-50/20">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Content - Project Form */}
          <div className="lg:col-span-7">
            <ProjectWizard
              onFieldFocus={setFocusedField}
              onProgressChange={setCompletionPercentage}
              onGoalAmountChange={setGoalAmount}
              onGoalCurrencyChange={setGoalCurrency}
            />
          </div>

          {/* Right Sidebar - Dynamic Guidance */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-6">
              {/* Progress Card */}
              <Card className="p-6">
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">Completion</h3>
                    <span className="text-sm font-medium text-gray-600">
                      {completionPercentage}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-gradient-to-r from-bitcoinOrange to-orange-500 h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${completionPercentage}%` }}
                    />
                  </div>
                </div>
                {completionPercentage === 100 && (
                  <div className="flex items-center gap-2 text-sm text-green-600 mt-4">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="font-medium">Ready to publish!</span>
                  </div>
                )}
              </Card>

              {/* Dynamic Guidance */}
              <DynamicSidebar
                activeField={focusedField}
                goalAmount={goalAmount}
                goalCurrency={goalCurrency}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
