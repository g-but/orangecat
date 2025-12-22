'use client';

/**
 * CURRENCY INPUT COMPONENT
 *
 * Allows users to input amounts in their preferred currency.
 * Shows live conversion to BTC/sats and other currencies.
 *
 * Created: 2025-12-04
 * Last Modified: 2025-12-04
 * Last Modified Summary: Initial currency input with multi-currency display
 */

import { useState, useEffect, useMemo } from 'react';
import { ArrowLeftRight, Bitcoin, Info } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import {
  Currency,
  FiatCurrency,
  CURRENCY_INFO,
  ALL_CURRENCIES,
  FIAT_CURRENCIES,
} from '@/types/settings';
import {
  convertToSats,
  convertFromSats,
  formatCurrency,
  getCurrencyBreakdown,
  parseAmount,
} from '@/services/currency';

interface CurrencyInputProps {
  /** Value in satoshis (always stored as sats) */
  value: number | null;
  /** Callback when value changes (returns sats) */
  onChange: (sats: number | null) => void;
  /** Default input currency */
  defaultCurrency?: Currency;
  /** User's preferred display currency */
  userCurrency?: Currency;
  /** Input label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Error message */
  error?: string;
  /** Hint text */
  hint?: string;
  /** Whether input is disabled */
  disabled?: boolean;
  /** Whether to show the currency breakdown */
  showBreakdown?: boolean;
  /** Whether to allow currency switching */
  allowCurrencySwitch?: boolean;
  /** Callback when input is focused */
  onFocus?: () => void;
  /** Callback when input loses focus */
  onBlur?: () => void;
  /** Minimum amount in sats */
  minSats?: number;
  /** Maximum amount in sats */
  maxSats?: number;
  /** ID for accessibility */
  id?: string;
}

export function CurrencyInput({
  value,
  onChange,
  defaultCurrency = 'CHF',
  userCurrency,
  label,
  placeholder,
  error,
  hint,
  disabled = false,
  showBreakdown = true,
  allowCurrencySwitch = true,
  onFocus,
  onBlur,
  minSats,
  maxSats,
  id,
}: CurrencyInputProps) {
  // Use user's currency preference or default
  const [inputCurrency, setInputCurrency] = useState<Currency>(userCurrency || defaultCurrency);

  // Local input value (in display currency)
  const [localValue, setLocalValue] = useState<string>('');
  const [isUserEditing, setIsUserEditing] = useState<boolean>(false);

  // Update local value when external value changes, but only when not focused
  useEffect(() => {
    if (value === null || value === undefined) {
      setLocalValue('');
      setIsUserEditing(false);
      return;
    }

    // Only auto-format if user is not actively editing
    if (!isUserEditing) {
      const displayValue = convertFromSats(value, inputCurrency);

      // Format based on currency type
      if (inputCurrency === 'SATS') {
        setLocalValue(displayValue.toLocaleString('en-US', { maximumFractionDigits: 0 }));
      } else if (inputCurrency === 'BTC') {
        setLocalValue(displayValue.toFixed(8).replace(/\.?0+$/, ''));
      } else {
        // For fiat currencies, format with 2 decimals
        setLocalValue(displayValue.toFixed(2));
      }
    }
  }, [value, inputCurrency, isUserEditing]);

  // Currency breakdown for display
  const breakdown = useMemo(() => {
    if (!value || value === 0) {
      return null;
    }
    return getCurrencyBreakdown(value);
  }, [value]);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setLocalValue(rawValue);
    setIsUserEditing(true);

    const parsed = parseAmount(rawValue);
    if (parsed === null) {
      onChange(null);
      return;
    }

    const sats = convertToSats(parsed, inputCurrency);

    // Apply min/max constraints
    let constrainedSats = sats;
    if (minSats !== undefined && sats < minSats) {
      constrainedSats = minSats;
    }
    if (maxSats !== undefined && sats > maxSats) {
      constrainedSats = maxSats;
    }

    onChange(constrainedSats);
  };

  // Handle currency switch
  const handleCurrencyChange = (newCurrency: Currency) => {
    setInputCurrency(newCurrency);

    // Recalculate local value in new currency
    if (value !== null && value !== undefined) {
      const displayValue = convertFromSats(value, newCurrency);

      if (newCurrency === 'SATS') {
        setLocalValue(displayValue.toLocaleString('en-US', { maximumFractionDigits: 0 }));
      } else if (newCurrency === 'BTC') {
        setLocalValue(displayValue.toFixed(8).replace(/\.?0+$/, ''));
      } else {
        setLocalValue(displayValue.toFixed(2));
      }
    }
  };

  const currencyInfo = CURRENCY_INFO[inputCurrency];

  return (
    <div className="space-y-2">
      {/* Label */}
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Input with currency selector */}
      <div className="relative">
        <div className="flex">
          <Input
            id={id}
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={handleInputChange}
            onFocus={onFocus}
            onBlur={() => {
              setIsUserEditing(false);
              onBlur?.();
            }}
            placeholder={placeholder || `0${currencyInfo.decimals > 0 ? '.00' : ''}`}
            disabled={disabled}
            className={`rounded-r-none ${error ? 'border-red-500' : ''}`}
          />

          {allowCurrencySwitch ? (
            <select
              value={inputCurrency}
              onChange={e => handleCurrencyChange(e.target.value as Currency)}
              disabled={disabled}
              className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-orange-500 focus:border-transparent cursor-pointer"
            >
              {ALL_CURRENCIES.map(curr => (
                <option key={curr} value={curr}>
                  {curr}
                </option>
              ))}
            </select>
          ) : (
            <div className="px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-sm font-medium text-gray-700">
              {inputCurrency}
            </div>
          )}
        </div>
      </div>

      {/* Hint or error */}
      {error && <p className="text-red-600 text-sm">{error}</p>}
      {hint && !error && <p className="text-xs text-gray-500">{hint}</p>}

      {/* Currency breakdown */}
      {showBreakdown && breakdown && value && value > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeftRight className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-semibold text-gray-900">Equivalent to</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* BTC */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600 flex items-center gap-1">
                <Bitcoin className="w-3 h-3" />
                BTC
              </span>
              <span className="font-mono font-semibold">
                {breakdown.btc.toFixed(8).replace(/\.?0+$/, '')}
              </span>
            </div>

            {/* Sats */}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Sats</span>
              <span className="font-mono font-semibold">{breakdown.sats.toLocaleString()}</span>
            </div>

            {/* Fiat currencies (show only non-selected ones) */}
            {FIAT_CURRENCIES.filter(c => c !== inputCurrency)
              .slice(0, 2)
              .map(curr => (
                <div key={curr} className="flex justify-between items-center">
                  <span className="text-gray-600">{curr}</span>
                  <span className="font-mono font-medium text-gray-700">
                    {formatCurrency(breakdown.fiat[curr], curr, { showSymbol: true })}
                  </span>
                </div>
              ))}
          </div>

          <div className="mt-2 pt-2 border-t border-orange-100 flex items-start gap-1">
            <Info className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-gray-600">
              All transactions settle in Bitcoin. Fiat values are estimates.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple display-only currency component
interface CurrencyDisplayProps {
  sats: number;
  currency?: Currency;
  showBreakdown?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  sats,
  currency = 'CHF',
  showBreakdown = false,
  className = '',
}: CurrencyDisplayProps) {
  const displayValue = convertFromSats(sats, currency);
  const breakdown = showBreakdown ? getCurrencyBreakdown(sats) : null;

  return (
    <div className={className}>
      <span className="font-semibold">{formatCurrency(displayValue, currency)}</span>
      {breakdown && (
        <span className="text-sm text-gray-500 ml-2">
          ({formatCurrency(breakdown.sats, 'SATS', { compact: true })})
        </span>
      )}
    </div>
  );
}
