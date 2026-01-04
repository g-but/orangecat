/**
 * Loan Mode Selector Component
 *
 * Allows users to choose between creating a new loan request
 * or listing an existing loan for refinancing.
 *
 * Created: 2025-12-31
 * Last Modified: 2025-12-31
 * Last Modified Summary: Initial creation
 */

'use client';

import { PlusCircle, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LoanMode = 'new_request' | 'existing_loan';

interface LoanModeSelectorProps {
  value: LoanMode;
  onChange: (mode: LoanMode) => void;
  className?: string;
}

const modes: { value: LoanMode; label: string; description: string; icon: typeof PlusCircle }[] = [
  {
    value: 'new_request',
    label: 'Request New Loan',
    description: 'I need funding and want to find lenders',
    icon: PlusCircle,
  },
  {
    value: 'existing_loan',
    label: 'Refinance Existing Loan',
    description: 'I have an existing loan and want better terms',
    icon: RefreshCcw,
  },
];

export function LoanModeSelector({ value, onChange, className }: LoanModeSelectorProps) {
  return (
    <div className={cn('grid grid-cols-1 sm:grid-cols-2 gap-4', className)}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isSelected = value === mode.value;

        return (
          <button
            key={mode.value}
            type="button"
            onClick={() => onChange(mode.value)}
            className={cn(
              'relative flex flex-col items-start p-4 rounded-xl border-2 transition-all text-left',
              'hover:border-tiffany-400 hover:bg-tiffany-50/50',
              isSelected
                ? 'border-tiffany-500 bg-tiffany-50 ring-2 ring-tiffany-500/20'
                : 'border-gray-200 bg-white'
            )}
          >
            <div className="flex items-center gap-3 mb-2">
              <div
                className={cn(
                  'p-2 rounded-lg',
                  isSelected ? 'bg-tiffany-100 text-tiffany-600' : 'bg-gray-100 text-gray-500'
                )}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className={cn('font-semibold', isSelected ? 'text-tiffany-700' : 'text-gray-900')}>
                {mode.label}
              </span>
            </div>
            <p className={cn('text-sm', isSelected ? 'text-tiffany-600' : 'text-gray-500')}>
              {mode.description}
            </p>
            {isSelected && (
              <div className="absolute top-3 right-3">
                <div className="w-5 h-5 rounded-full bg-tiffany-500 flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default LoanModeSelector;
