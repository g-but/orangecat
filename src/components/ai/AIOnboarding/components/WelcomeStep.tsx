/**
 * WELCOME STEP COMPONENT
 * First step of onboarding - introduction and benefits
 */

import { Bot, CheckCircle, Lightbulb } from 'lucide-react';
import { aiOnboardingContent } from '@/lib/ai-guidance';

export function WelcomeStep() {
  return (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-tiffany-100 rounded-full flex items-center justify-center mx-auto">
        <Bot className="w-10 h-10 text-tiffany-600" />
      </div>

      <div>
        <h3 className="text-xl font-semibold mb-2">{aiOnboardingContent.welcome.whyTitle}</h3>
        <p className="text-gray-600">{aiOnboardingContent.welcome.whyContent}</p>
      </div>

      {/* Benefits */}
      <div className="grid grid-cols-2 gap-4 text-left">
        {aiOnboardingContent.welcome.tips?.map((tip, index) => (
          <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded-lg">
            <CheckCircle className="w-5 h-5 text-tiffany-600 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-gray-700">{tip}</span>
          </div>
        ))}
      </div>

      {/* Pro Tip */}
      <div className="bg-tiffany-50 border border-tiffany-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Lightbulb className="w-5 h-5 text-tiffany-600 mt-0.5 flex-shrink-0" />
          <div className="text-left">
            <h4 className="font-semibold text-tiffany-900 mb-1">Pro Tip</h4>
            <p className="text-tiffany-800 text-sm">
              We recommend OpenRouter for beginners - one key gives you access to 100+ AI models
              with simple, prepaid billing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
