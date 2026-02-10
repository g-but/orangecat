'use client';

import { useState } from 'react';
import { X, Bitcoin, Zap, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import {
  bitcoinPaymentService,
  PaymentRequest,
  PaymentType,
} from '@/services/bitcoin/paymentService';
import QRCodeGenerator from './QRCodeGenerator';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

interface BitcoinPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  suggestedAmount?: number;
  recipientAddress?: string;
}

export default function BitcoinPaymentModal({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  suggestedAmount = 10000,
  recipientAddress,
}: BitcoinPaymentModalProps) {
  const { formatAmount } = useDisplayCurrency();
  const [paymentType, setPaymentType] = useState<PaymentType>('lightning');
  const [amount, setAmount] = useState(suggestedAmount);
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [transactionId, setTransactionId] = useState<string | null>(null);

  const handleCreatePayment = async () => {
    setLoading(true);

    const description = `Support for ${projectTitle}`;

    // Record pending transaction for transparency
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          amount_sats: amount,
          payment_method: paymentType,
        }),
      });
      if (res.ok) {
        try {
          const data = await res.json();
          if (data?.id) {
            setTransactionId(data.id);
          }
        } catch {
          /* ignore */
        }
      }
    } catch {
      /* ignore */
    }

    const result =
      paymentType === 'lightning'
        ? await bitcoinPaymentService.createLightningPayment(projectId, amount, description)
        : await bitcoinPaymentService.createOnChainPayment(
            projectId,
            amount,
            description,
            recipientAddress || ''
          );

    if (result.success && result.paymentRequest) {
      setPaymentRequest(result.paymentRequest);
    }

    setLoading(false);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">Bitcoin Payment</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <div className="p-6 space-y-6">
          {!paymentRequest ? (
            <>
              <div className="text-center">
                <h3 className="font-semibold mb-1">Supporting</h3>
                <p className="text-gray-600">{projectTitle}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={paymentType === 'lightning' ? 'primary' : 'outline'}
                  onClick={() => setPaymentType('lightning')}
                  className="flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  Lightning
                </Button>
                <Button
                  variant={paymentType === 'onchain' ? 'primary' : 'outline'}
                  onClick={() => setPaymentType('onchain')}
                  className="flex items-center gap-2"
                >
                  <Bitcoin className="w-4 h-4" />
                  On-Chain
                </Button>
              </div>

              <Input
                type="number"
                value={amount}
                onChange={e => setAmount(parseInt(e.target.value) || 0)}
                placeholder="Enter amount"
                className="text-center"
              />

              <Button
                onClick={handleCreatePayment}
                disabled={loading}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {loading ? 'Creating...' : 'Create Payment'}
              </Button>
            </>
          ) : (
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span>Payment Request Created</span>
              </div>

              <QRCodeGenerator
                value={bitcoinPaymentService.getPaymentQRData(paymentRequest)}
                size={200}
                label={paymentType === 'lightning' ? 'Lightning Invoice' : 'Bitcoin Address'}
              />

              <div className="text-sm text-gray-600">
                Amount: {formatAmount(paymentRequest.amount)}
              </div>
              {transactionId && <div className="text-xs text-gray-500">Transaction created</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
