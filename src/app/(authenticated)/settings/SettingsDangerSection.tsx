'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';

interface Props {
  isDeleting: boolean;
  onDelete: () => void;
}

export function SettingsDangerSection({ isDeleting, onDelete }: Props) {
  return (
    <div className="border-t border-red-200 pt-10">
      <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center">
        <AlertTriangle className="w-6 h-6 mr-2" />
        Danger Zone
      </h3>
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h4 className="text-lg font-medium text-red-800 mb-2">Delete Account</h4>
        <p className="text-base text-red-700 mb-4">
          This will permanently delete your account and all associated data including your profile,
          projects, and transaction history. This action cannot be undone.
        </p>
        <Button
          type="button"
          variant="danger"
          onClick={onDelete}
          disabled={isDeleting}
          className="px-6 py-2"
        >
          {isDeleting ? (
            <>
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
              Deleting...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
