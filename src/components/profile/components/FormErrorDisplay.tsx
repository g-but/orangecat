/**
 * Form Error Display
 *
 * Component to display form validation errors in a user-friendly way.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 */

'use client';

interface FormErrorDisplayProps {
  errors: Record<string, { message?: string }>;
}

export function FormErrorDisplay({ errors }: FormErrorDisplayProps) {
  if (Object.keys(errors).length === 0) {
    return null;
  }

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-2">
        <div className="flex-shrink-0 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">
          !
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-semibold text-red-900 mb-2">Please fix the following errors:</h4>
          <ul className="text-sm text-red-700 space-y-1 list-disc list-inside">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>
                <span className="font-medium">{field}:</span>{' '}
                {error?.message?.toString() || 'Invalid value'}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}


