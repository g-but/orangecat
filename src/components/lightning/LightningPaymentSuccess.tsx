'use client';

import { Check } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { CurrencyDisplay } from '@/components/ui/CurrencyDisplay';

interface LightningPaymentSuccessProps {
  projectTitle: string;
  amountSats: number;
  onReset: () => void;
}

export function LightningPaymentSuccess({
  projectTitle,
  amountSats,
  onReset,
}: LightningPaymentSuccessProps) {
  return (
    <Card className="text-center">
      <CardContent className="p-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Received!</h3>
        <p className="text-gray-600 mb-4">
          Thank you for supporting {projectTitle} with your Lightning payment.
        </p>
        <CurrencyDisplay
          amount={amountSats}
          currency="SATS"
          className="text-lg font-semibold text-green-600"
        />
        <Button onClick={onReset} variant="outline" className="mt-4">
          Make Another Payment
        </Button>
      </CardContent>
    </Card>
  );
}
