'use client';

import { Zap } from 'lucide-react';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';

interface LightningInvoiceFormProps {
  amount: string;
  setAmount: (v: string) => void;
  message: string;
  setMessage: (v: string) => void;
  displayCurrency: string;
  isGenerating: boolean;
  onGenerate: () => void;
}

export function LightningInvoiceForm({
  amount,
  setAmount,
  message,
  setMessage,
  displayCurrency,
  isGenerating,
  onGenerate,
}: LightningInvoiceFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Amount ({displayCurrency})
        </label>
        <Input
          type="number"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          placeholder="Enter amount"
          min="1"
          className="font-mono"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Message (optional)</label>
        <Input
          type="text"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Add a message with your payment"
          maxLength={100}
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <Zap className="w-5 h-5 text-blue-500 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900 mb-1">Lightning Benefits</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>Instant payments (usually under 3 seconds)</li>
              <li>Extremely low fees (typically &lt; 1 sat)</li>
              <li>Perfect for small amounts and tips</li>
            </ul>
          </div>
        </div>
      </div>

      <Button onClick={onGenerate} disabled={isGenerating || !amount} className="w-full">
        {isGenerating ? (
          'Generating...'
        ) : (
          <>
            <Zap className="w-4 h-4 mr-2" />
            Generate Lightning Invoice
          </>
        )}
      </Button>
    </div>
  );
}
