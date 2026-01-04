/**
 * Profile Form Actions
 *
 * Action buttons for profile form (Cancel, Save).
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

import { Save } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProfileFormActionsProps {
  isSaving: boolean;
  isValid: boolean;
  onCancel: () => void;
  variant?: 'inline' | 'modal';
}

export function ProfileFormActions({ isSaving, isValid, onCancel, variant = 'inline' }: ProfileFormActionsProps) {
  const containerClass =
    variant === 'inline'
      ? 'flex items-center justify-between gap-3 pt-6 border-t border-gray-200 mt-6 bg-gray-50 -mx-6 px-6 py-4 rounded-b-xl'
      : 'flex items-center justify-between gap-3 pt-6 border-t border-gray-200 bg-gray-50 -mx-6 px-6 py-4 rounded-b-lg';

  return (
    <div className={containerClass}>
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        disabled={isSaving}
        className="px-4 text-gray-600 hover:text-gray-900"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSaving || !isValid}
        className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-bitcoinOrange to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>
            <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5 mr-2" />
            Save Profile
          </>
        )}
      </Button>
    </div>
  );
}


