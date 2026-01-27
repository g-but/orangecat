/**
 * ADD KEY STEP COMPONENT
 * Fourth step - enter and validate API key
 */

import { Layers, CheckCircle, Shield, Lock } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { aiOnboardingContent } from '@/lib/ai-guidance';

interface AddKeyStepProps {
  provider:
    | {
        name: string;
        apiKeyExample?: string;
      }
    | undefined;
  apiKey: string;
  keyName: string;
  keyValidation: { valid: boolean; message?: string } | null;
  keyAdded: boolean;
  isSubmitting: boolean;
  submitError: string | null;
  onApiKeyChange: (value: string) => void;
  onKeyNameChange: (value: string) => void;
  onAddKey: () => Promise<void>;
}

export function AddKeyStep({
  provider,
  apiKey,
  keyName,
  keyValidation,
  keyAdded,
  isSubmitting,
  submitError,
  onApiKeyChange,
  onKeyNameChange,
  onAddKey,
}: AddKeyStepProps) {
  return (
    <div className="space-y-6">
      {/* Key Input Form */}
      <Card className="p-6">
        <div className="space-y-4">
          {/* Provider Display */}
          {provider && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-tiffany-100 rounded-lg flex items-center justify-center">
                <Layers className="w-5 h-5 text-tiffany-600" />
              </div>
              <div>
                <p className="font-medium">{provider.name}</p>
                <p className="text-xs text-gray-500">
                  Key format:{' '}
                  <code className="bg-gray-200 px-1 rounded">{provider.apiKeyExample}</code>
                </p>
              </div>
            </div>
          )}

          {/* Key Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Key Name (optional)
            </label>
            <Input
              type="text"
              placeholder={`${provider?.name || 'API'} Key`}
              value={keyName}
              onChange={e => onKeyNameChange(e.target.value)}
              disabled={keyAdded}
            />
            <p className="text-xs text-gray-500 mt-1">A friendly name to identify this key later</p>
          </div>

          {/* API Key Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              API Key <span className="text-red-500">*</span>
            </label>
            <Input
              type="password"
              placeholder={provider?.apiKeyExample || 'sk-...'}
              value={apiKey}
              onChange={e => onApiKeyChange(e.target.value)}
              disabled={keyAdded}
              className={cn(
                keyValidation && !keyValidation.valid && 'border-red-300 focus:border-red-500'
              )}
            />
            {keyValidation && !keyValidation.valid && (
              <p className="text-xs text-red-600 mt-1">{keyValidation.message}</p>
            )}
            {keyValidation?.valid && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Key format looks correct
              </p>
            )}
          </div>

          {/* Submit Error */}
          {submitError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{submitError}</p>
            </div>
          )}

          {/* Success Message */}
          {keyAdded && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Key added successfully!</span>
              </div>
              <p className="text-sm text-green-600 mt-1">
                Your key has been encrypted and saved securely.
              </p>
            </div>
          )}

          {/* Add Key Button */}
          {!keyAdded && (
            <Button
              onClick={onAddKey}
              disabled={!apiKey || !keyValidation?.valid || isSubmitting}
              className="w-full bg-tiffany-600 hover:bg-tiffany-700 text-white"
            >
              {isSubmitting ? 'Adding Key...' : 'Add API Key'}
            </Button>
          )}
        </div>
      </Card>

      {/* Security Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">
              {aiOnboardingContent.addKey.whyTitle}
            </h4>
            <p className="text-sm text-blue-800">{aiOnboardingContent.addKey.whyContent}</p>
          </div>
        </div>
      </div>

      {/* Encryption Details */}
      <div className="flex flex-wrap gap-3">
        {aiOnboardingContent.addKey.tips?.map((tip, index) => (
          <div key={index} className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-full">
            <Lock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{tip}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
