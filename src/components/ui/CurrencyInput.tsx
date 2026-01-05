'use client';

/**
 * CURRENCY INPUT COMPONENT
 *
 * Allows users to input amounts in their preferred currency.
 * Amounts are stored in the currency specified, NOT in satoshis.
 * Conversion to satoshis happens ONLY when sending Bitcoin transactions.
 *
 * Created: 2025-12-04
 * Last Modified: 2026-01-05
 * Last Modified Summary: Refactored to store amounts in user currency, not satoshis
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
  convert,
  formatCurrency,
  parseAmount,
} from '@/services/currency';
import { PLATFORM_DEFAULT_CURRENCY } from '@/config/currencies';
import { getGoalExplanation, isBitcoinNativeCurrency } from '@/utils/currency-helpers';

interface CurrencyInputProps {
  /** Value in the specified currency (NOT satoshis) */
  value: number | null;
  /** Current currency for the value */
  currency: Currency;
  /** Callback when value changes (returns amount in current currency) */
  onChange: (amount: number | null) => void;
  /** Callback when currency changes */
  onCurrencyChange?: (currency: Currency) => void;
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
  /** Minimum amount in current currency */
  min?: number;
  /** Maximum amount in current currency */
  max?: number;
  /** ID for accessibility */
  id?: string;
}

export function CurrencyInput({
  value,
  currency: propCurrency,
  onChange,
  onCurrencyChange,
  defaultCurrency = PLATFORM_DEFAULT_CURRENCY,
  userCurrency,
  label,
  placeholder,
  error,
  hint,
  disabled = false,
  showBreakdown = false, // Don't show breakdown by default (no sats!)
  allowCurrencySwitch = true,
  onFocus,
  onBlur,
  min,
  max,
  id,
}: CurrencyInputProps) {
  // Use prop currency or user preference or default
  const [inputCurrency, setInputCurrency] = useState<Currency>(
    propCurrency || userCurrency || defaultCurrency
  );

  // Sync with prop currency changes
  useEffect(() => {
    if (propCurrency) {
      setInputCurrency(propCurrency);
    }
  }, [propCurrency]);

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
      // Value is already in the input currency, just format it
      let formatted: string;
      
      if (inputCurrency === 'BTC') {
        formatted = value.toFixed(8).replace(/\.?0+$/, '');
      } else if (inputCurrency === 'SATS') {
        formatted = Math.round(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
      } else {
        // For fiat currencies, format with 2 decimals
        formatted = value.toFixed(2);
      }
      
      setLocalValue(formatted);
    }
  }, [value, inputCurrency, isUserEditing]);

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

    // Apply min/max constraints in current currency
    let constrainedAmount = parsed;
    if (min !== undefined && parsed < min) {
      constrainedAmount = min;
    }
    if (max !== undefined && parsed > max) {
      constrainedAmount = max;
    }

    // If currency changed, convert the value
    if (value !== null && value !== undefined && inputCurrency !== propCurrency) {
      const converted = convert(value, propCurrency, inputCurrency);
      onChange(converted);
    } else {
      onChange(constrainedAmount);
    }
  };

  // Handle currency switch
  const handleCurrencyChange = (newCurrency: Currency) => {
    // Convert value to new currency if we have a value
    if (value !== null && value !== undefined) {
      const converted = convert(value, inputCurrency, newCurrency);
      onChange(converted);
    }
    
    setInputCurrency(newCurrency);
    
    // Notify parent component of currency change
    if (onCurrencyChange) {
      onCurrencyChange(newCurrency);
    }
  };

  const currencyInfo = CURRENCY_INFO[inputCurrency];

  // Calculate breakdown only if showBreakdown is true AND user prefers SATS
  const breakdown = useMemo(() => {
    if (!showBreakdown || !value || value === 0) {
      return null;
    }
    
    // Only show breakdown if user explicitly wants it
    // Convert to other currencies for display
    const otherCurrencies: Record<string, number> = {};
    FIAT_CURRENCIES.forEach(curr => {
      if (curr !== inputCurrency) {
        otherCurrencies[curr] = convert(value, inputCurrency, curr);
      }
    });
    
    // Convert to BTC for display
    const btcValue = inputCurrency === 'BTC' ? value : convert(value, inputCurrency, 'BTC');
    
    return {
      btc: btcValue,
      other: otherCurrencies,
    };
  }, [value, inputCurrency, showBreakdown]);

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
            placeholder={placeholder || (inputCurrency === 'SATS' ? '0' : '0.00')}
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
      
      {/* Currency-specific info hint */}
      {!error && !hint && value && value > 0 && (
        <div className="text-xs text-gray-500 mt-1">
          <span className="flex items-center gap-1">
            <Info className="w-3 h-3" />
            <span>{getGoalExplanation(inputCurrency)}</span>
          </span>
        </div>
      )}

      {/* Currency breakdown - only show if explicitly requested */}
      {showBreakdown && breakdown && value && value > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <ArrowLeftRight className="w-4 h-4 text-orange-600" />
            <span className="text-xs font-semibold text-gray-900">Equivalent in other currencies</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* BTC */}
            {inputCurrency !== 'BTC' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600 flex items-center gap-1">
                  <Bitcoin className="w-3 h-3" />
                  BTC
                </span>
                <span className="font-mono font-semibold">
                  {breakdown.btc.toFixed(8).replace(/\.?0+$/, '')}
                </span>
              </div>
            )}

            {/* SATS - Show for Bitcoin-native convenience */}
            {inputCurrency !== 'SATS' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">SATS</span>
                <span className="font-mono font-medium text-gray-700">
                  {Math.round(breakdown.btc * 100000000).toLocaleString('en-US')}
                </span>
              </div>
            )}

            {/* Other fiat currencies */}
            {Object.entries(breakdown.other)
              .slice(0, inputCurrency === 'BTC' || inputCurrency === 'SATS' ? 3 : 2)
              .map(([curr, amount]) => (
                <div key={curr} className="flex justify-between items-center">
                  <span className="text-gray-600">{curr}</span>
                  <span className="font-mono font-medium text-gray-700">
                    {formatCurrency(amount, curr as Currency, { showSymbol: false })}
                  </span>
                </div>
              ))}
          </div>

          <div className="mt-2 pt-2 border-t border-orange-100 flex items-start gap-1">
            <Info className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-gray-600">
              All transactions settle in Bitcoin. Amounts shown are estimates based on current exchange rates.
              {isBitcoinNativeCurrency(inputCurrency) && ' SATS shown for Bitcoin-native convenience.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple display-only currency component
interface CurrencyDisplayProps {
  amount: number;
  currency: Currency;
  showBreakdown?: boolean;
  className?: string;
}

export function CurrencyDisplay({
  amount,
  currency,
  showBreakdown = false,
  className = '',
}: CurrencyDisplayProps) {
  return (
    <div className={className}>
      <span className="font-semibold">{formatCurrency(amount, currency)}</span>
    </div>
  );
}
