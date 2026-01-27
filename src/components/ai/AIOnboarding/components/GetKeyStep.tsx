/**
 * GET KEY STEP COMPONENT
 * Third step - instructions for obtaining API key
 */

import { Key, ExternalLink, Copy, Check, AlertTriangle, CheckCircle, Shield } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { aiOnboardingContent } from '@/lib/ai-guidance';

interface GetKeyStepProps {
  provider:
    | {
        name: string;
        type: string;
        setupTime: number;
        apiKeyPrefix?: string;
        apiKeyUrl: string;
      }
    | undefined;
  copiedUrl: boolean;
  onCopyUrl: (url: string) => Promise<void>;
}

export function GetKeyStep({ provider, copiedUrl, onCopyUrl }: GetKeyStepProps) {
  if (!provider) {
    return <div className="text-center py-8 text-gray-500">Please select a provider first.</div>;
  }

  return (
    <div className="space-y-6">
      {/* Provider Info */}
      <Card className="p-6 bg-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-tiffany-100 rounded-lg flex items-center justify-center">
            <Key className="w-6 h-6 text-tiffany-600" />
          </div>
          <div>
            <h3 className="font-semibold">{provider.name}</h3>
            <p className="text-sm text-gray-600">
              {provider.type === 'aggregator' ? 'Aggregator' : 'Direct Provider'} • Setup time: ~
              {provider.setupTime} min
            </p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-tiffany-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
              1
            </div>
            <div>
              <p className="text-sm font-medium">Visit {provider.name}</p>
              <p className="text-xs text-gray-500">Create an account if you do not have one</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-tiffany-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
              2
            </div>
            <div>
              <p className="text-sm font-medium">Go to API Keys page</p>
              <p className="text-xs text-gray-500">Usually under Settings or Account</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-tiffany-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
              3
            </div>
            <div>
              <p className="text-sm font-medium">Create a new API key</p>
              <p className="text-xs text-gray-500">Name it "OrangeCat" for easy identification</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-6 h-6 rounded-full bg-tiffany-600 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
              4
            </div>
            <div>
              <p className="text-sm font-medium">Copy your key</p>
              <p className="text-xs text-gray-500">
                Keys start with{' '}
                <code className="bg-gray-200 px-1 rounded">{provider.apiKeyPrefix || 'sk-'}</code>
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => window.open(provider.apiKeyUrl, '_blank')}
            className="bg-tiffany-600 hover:bg-tiffany-700 text-white"
          >
            Open {provider.name}
            <ExternalLink className="w-4 h-4 ml-2" />
          </Button>
          <Button variant="outline" onClick={() => onCopyUrl(provider.apiKeyUrl)}>
            {copiedUrl ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Link
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Security Warnings */}
      <div className="space-y-3">
        {aiOnboardingContent.getKey.warnings?.map((warning, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span className="text-sm text-red-800">{warning}</span>
          </div>
        ))}
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" />
          Security Tips
        </h4>
        <ul className="space-y-1">
          {aiOnboardingContent.getKey.tips?.map((tip, index) => (
            <li key={index} className="text-sm text-blue-800 flex items-start gap-2">
              <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
