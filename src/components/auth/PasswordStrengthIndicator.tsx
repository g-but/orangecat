'use client';

/**
 * Password Strength Indicator Component
 *
 * Displays real-time password validation feedback as the user types.
 * Uses the centralized PASSWORD_RULES from @/lib/validation/password.
 *
 * @module auth/PasswordStrengthIndicator
 */

import React, { useMemo } from 'react';
import { Check, X, Circle } from 'lucide-react';
import { PASSWORD_RULES } from '@/lib/validation/password';
import { cn } from '@/lib/utils';

interface PasswordRequirement {
  id: string;
  label: string;
  test: (password: string) => boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
  className?: string;
  showOnlyWhenFocused?: boolean;
  isFocused?: boolean;
}

/**
 * Password requirements derived from PASSWORD_RULES (SSOT)
 */
const PASSWORD_REQUIREMENTS: PasswordRequirement[] = [
  {
    id: 'minLength',
    label: `At least ${PASSWORD_RULES.minLength} characters`,
    test: pwd => pwd.length >= PASSWORD_RULES.minLength,
  },
  {
    id: 'uppercase',
    label: 'At least one uppercase letter (A-Z)',
    test: pwd => /[A-Z]/.test(pwd),
  },
  {
    id: 'lowercase',
    label: 'At least one lowercase letter (a-z)',
    test: pwd => /[a-z]/.test(pwd),
  },
  {
    id: 'number',
    label: 'At least one number (0-9)',
    test: pwd => /[0-9]/.test(pwd),
  },
  {
    id: 'special',
    label: 'At least one special character (!@#$%...)',
    test: pwd => /[^A-Za-z0-9]/.test(pwd),
  },
];

/**
 * Calculate password strength as a percentage
 */
function calculateStrength(password: string): number {
  if (!password) {
    return 0;
  }
  const metCount = PASSWORD_REQUIREMENTS.filter(req => req.test(password)).length;
  return Math.round((metCount / PASSWORD_REQUIREMENTS.length) * 100);
}

/**
 * Get strength level label and color
 */
function getStrengthLevel(strength: number): {
  label: string;
  colorClass: string;
  bgClass: string;
} {
  if (strength === 0) {
    return { label: '', colorClass: 'text-gray-400', bgClass: 'bg-gray-200' };
  }
  if (strength < 40) {
    return { label: 'Weak', colorClass: 'text-red-600', bgClass: 'bg-red-500' };
  }
  if (strength < 80) {
    return { label: 'Fair', colorClass: 'text-yellow-600', bgClass: 'bg-yellow-500' };
  }
  if (strength < 100) {
    return { label: 'Good', colorClass: 'text-blue-600', bgClass: 'bg-blue-500' };
  }
  return { label: 'Strong', colorClass: 'text-green-600', bgClass: 'bg-green-500' };
}

export function PasswordStrengthIndicator({
  password,
  className,
  showOnlyWhenFocused = false,
  isFocused = true,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculateStrength(password), [password]);
  const strengthLevel = useMemo(() => getStrengthLevel(strength), [strength]);

  // Don't render if password is empty and we're showing only when focused
  if (showOnlyWhenFocused && !isFocused && !password) {
    return null;
  }

  // Don't show anything if no password entered
  if (!password) {
    return (
      <div className={cn('mt-2 space-y-2', className)}>
        <p className="text-xs text-gray-500">Password must contain:</p>
        <ul className="space-y-1">
          {PASSWORD_REQUIREMENTS.map(req => (
            <li key={req.id} className="flex items-center gap-2 text-xs text-gray-400">
              <Circle className="h-3 w-3 flex-shrink-0" />
              <span>{req.label}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className={cn('mt-2 space-y-2', className)}>
      {/* Strength Bar */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn('h-full transition-all duration-300', strengthLevel.bgClass)}
            style={{ width: `${strength}%` }}
          />
        </div>
        {strengthLevel.label && (
          <span className={cn('text-xs font-medium', strengthLevel.colorClass)}>
            {strengthLevel.label}
          </span>
        )}
      </div>

      {/* Requirements Checklist */}
      <ul className="space-y-1">
        {PASSWORD_REQUIREMENTS.map(req => {
          const isMet = req.test(password);
          return (
            <li
              key={req.id}
              className={cn(
                'flex items-center gap-2 text-xs transition-colors duration-200',
                isMet ? 'text-green-600' : 'text-gray-500'
              )}
            >
              {isMet ? (
                <Check className="h-3 w-3 flex-shrink-0 text-green-600" />
              ) : (
                <X className="h-3 w-3 flex-shrink-0 text-gray-400" />
              )}
              <span className={isMet ? 'line-through opacity-70' : ''}>{req.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default PasswordStrengthIndicator;
