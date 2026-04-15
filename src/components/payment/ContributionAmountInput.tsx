/**
 * ContributionAmountInput — Amount picker with quick-select buttons
 *
 * For contribution-type payments where the buyer chooses the amount.
 */

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

// Quick-select amounts in BTC (approx $1, $5, $10, $50, $100 at $100k/BTC)
const QUICK_AMOUNTS = [0.00001, 0.00005, 0.0001, 0.0005, 0.001];

interface ContributionAmountInputProps {
  value: number;
  onChange: (btc: number) => void;
  minBtc?: number;
  maxBtc?: number;
}

export function ContributionAmountInput({
  value,
  onChange,
  minBtc = 0.000001,
  maxBtc = 0.1,
}: ContributionAmountInputProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const { formatAmount } = useDisplayCurrency();

  const handleCustomBlur = () => {
    const val = parseFloat(customInput);
    if (!isNaN(val) && val > 0) {
      const clamped = Math.max(minBtc, Math.min(maxBtc, val));
      setCustomInput(String(clamped));
      onChange(clamped);
    }
  };

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-gray-700">Amount</label>

      {/* Quick select buttons */}
      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map(amount => (
          <Button
            key={amount}
            type="button"
            variant={value === amount && !customMode ? 'primary' : 'outline'}
            size="sm"
            className="min-h-11"
            onClick={() => {
              setCustomMode(false);
              onChange(amount);
            }}
          >
            {formatAmount(amount)}
          </Button>
        ))}
        <Button
          type="button"
          variant={customMode ? 'primary' : 'outline'}
          size="sm"
          className="min-h-11"
          onClick={() => {
            setCustomMode(true);
            setCustomInput(value > 0 ? String(value) : '');
          }}
        >
          Custom
        </Button>
      </div>

      {/* Custom amount input */}
      {customMode && (
        <Input
          type="number"
          value={customInput}
          onChange={e => {
            setCustomInput(e.target.value);
            const val = parseFloat(e.target.value);
            if (!isNaN(val) && val >= minBtc && val <= maxBtc) {
              onChange(val);
            }
          }}
          onBlur={handleCustomBlur}
          placeholder={`Min ${formatAmount(minBtc)}`}
          min={minBtc}
          max={maxBtc}
          className="w-full"
        />
      )}

      {value > 0 && <p className="text-sm text-gray-500">{formatAmount(value)}</p>}
    </div>
  );
}
