'use client';

import { useState } from 'react';
import { ModelSelector, ModelBadge } from '@/components/ai-chat/ModelSelector';

export default function TestModelSelectorPage() {
  const [selectedModel, setSelectedModel] = useState('meta-llama/llama-4-maverick:free');

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Model Selector Test Page</h1>

      <div className="space-y-8">
        {/* Model Selector Demo */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Model Selector Component</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Select AI Model:
              </label>
              <ModelSelector
                selectedModel={selectedModel}
                onModelChange={setSelectedModel}
                size="default"
                showPricing={true}
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-gray-600 mb-2">
                Currently Selected Model:
              </p>
              <ModelBadge modelId={selectedModel} />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-xs font-mono text-gray-700">
                Model ID: {selectedModel}
              </p>
            </div>
          </div>
        </div>

        {/* Small Size Demo */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Small Size Variant</h2>
          <ModelSelector
            selectedModel={selectedModel}
            onModelChange={setSelectedModel}
            size="sm"
            showPricing={false}
          />
        </div>

        {/* Model Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-4">Model Information</h2>
          <div className="space-y-2 text-sm">
            <p>
              <strong>Default Model:</strong> Llama 4 Maverick (Free)
            </p>
            <p>
              <strong>Provider:</strong> Meta via OpenRouter
            </p>
            <p>
              <strong>Free Tier:</strong> Yes (50-1000 requests/day)
            </p>
            <p>
              <strong>Verified:</strong> January 18, 2026
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
