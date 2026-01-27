/**
 * WIZARD HEADER COMPONENT
 * Title and progress bar
 */

import { X } from 'lucide-react';

interface WizardHeaderProps {
  progress: number;
  onCancel: () => void;
}

export function WizardHeader({ progress, onCancel }: WizardHeaderProps) {
  return (
    <div className="flex items-center justify-between p-6 border-b bg-gradient-to-r from-orange-50 to-orange-100">
      <div className="flex items-center gap-4">
        <button
          onClick={onCancel}
          className="p-2 hover:bg-orange-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>

        <div>
          <h1 className="text-xl font-semibold text-gray-900">Complete Your Profile</h1>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-sm text-gray-600">{progress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
