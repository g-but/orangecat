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

const QUICK_AMOUNTS = [1_000, 5_000, 10_000, 50_000, 100_000];

interface ContributionAmountInputProps {
  value: number;
  onChange: (sats: number) => void;
  minSats?: number;
  maxSats?: number;
}

export function ContributionAmountInput({
  value,
  onChange,
  minSats = 100,
  maxSats = 10_000_000,
}: ContributionAmountInputProps) {
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const { formatAmount } = useDisplayCurrency();

  const handleCustomBlur = () => {
    const val = parseInt(customInput, 10);
    if (!isNaN(val)) {
      const clamped = Math.max(minSats, Math.min(maxSats, val));
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
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= minSats && val <= maxSats) {
              onChange(val);
            }
          }}
          onBlur={handleCustomBlur}
          placeholder={`Min ${formatAmount(minSats)}`}
          min={minSats}
          max={maxSats}
          className="w-full"
        />
      )}

      {value > 0 && <p className="text-sm text-gray-500">{formatAmount(value)}</p>}
    </div>
  );
}
