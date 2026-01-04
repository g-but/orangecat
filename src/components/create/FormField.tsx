'use client';

/**
 * FORM FIELD COMPONENT
 *
 * Unified form field component that renders different input types
 * based on the field configuration.
 *
 * Created: 2025-12-03
 * Last Modified: 2025-12-04
 * Last Modified Summary: Added currency input support with multi-currency display
 */

import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { CurrencyInput } from '@/components/ui/CurrencyInput';
import type { FieldConfig, FormFieldProps } from './types';

// ==================== COMPONENT ====================

export function FormField({
  config,
  value,
  error,
  onChange,
  onFocus,
  disabled = false,
}: FormFieldProps) {
  const userCurrency = useUserCurrency();
  const {
    name,
    label,
    type,
    placeholder,
    required,
    options,
    hint,
    min,
    max,
    rows = 4,
  } = config;

  const baseInputClass = error
    ? 'border-red-500 focus:ring-red-500'
    : 'border-gray-300';

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <Textarea
            id={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder={placeholder}
            rows={rows}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'number':
        return (
          <Input
            id={name}
            type="number"
            value={value || ''}
            onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
            onFocus={onFocus}
            placeholder={placeholder}
            min={min}
            max={max}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'currency':
        return (
          <CurrencyInput
            id={name}
            value={value || null}
            onChange={onChange}
            onFocus={onFocus}
            placeholder={placeholder}
            disabled={disabled}
            defaultCurrency="CHF"
            userCurrency={userCurrency}
            showBreakdown={true}
            allowCurrencySwitch={true}
            minSats={min}
            maxSats={max}
          />
        );

      case 'select':
        return (
          <select
            id={name}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            disabled={disabled}
            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:border-transparent transition-colors ${baseInputClass} ${
              disabled ? 'bg-gray-50 cursor-not-allowed' : ''
            }`}
          >
            <option value="">Select {label.toLowerCase()}</option>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2">
            {options?.map((option) => (
              <label
                key={option.value}
                className="flex items-start gap-3 cursor-pointer"
              >
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={(e) => onChange(e.target.value)}
                  onFocus={onFocus}
                  disabled={disabled}
                  className="mt-1"
                />
                <div>
                  <span className="text-sm font-medium text-gray-900">
                    {option.label}
                  </span>
                  {option.description && (
                    <p className="text-xs text-gray-500">{option.description}</p>
                  )}
                </div>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              id={name}
              checked={!!value}
              onChange={(e) => onChange(e.target.checked)}
              onFocus={onFocus}
              disabled={disabled}
              className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm text-gray-700">{placeholder || label}</span>
          </label>
        );

      case 'url':
      case 'email':
        return (
          <Input
            id={name}
            type={type}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'bitcoin_address':
        return (
          <Input
            id={name}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder={placeholder || 'bc1q... or 3... or 1...'}
            disabled={disabled}
            className={`font-mono text-sm ${baseInputClass}`}
          />
        );

      case 'tags':
        return (
          <Input
            id={name}
            type="text"
            value={Array.isArray(value) ? value.join(', ') : value || ''}
            onChange={(e) => {
              const tags = e.target.value
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean);
              onChange(tags);
            }}
            onFocus={onFocus}
            placeholder={placeholder || 'Enter tags separated by commas'}
            disabled={disabled}
            className={baseInputClass}
          />
        );

      case 'text':
      default:
        return (
          <Input
            id={name}
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            onFocus={onFocus}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClass}
          />
        );
    }
  };

  // Checkbox has its own label handling
  if (type === 'checkbox') {
    return (
      <div>
        {renderInput()}
        {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div>
      <label
        htmlFor={name}
        className="block text-sm font-medium text-gray-700 mb-2"
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {hint && !error && (
        <p className="text-xs text-gray-500 mt-1">{hint}</p>
      )}
      {error && <p className="text-red-600 text-sm mt-1">{error}</p>}
    </div>
  );
}

