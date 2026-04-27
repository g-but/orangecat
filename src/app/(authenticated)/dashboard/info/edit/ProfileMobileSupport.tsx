'use client';

import { CheckCircle2, HelpCircle } from 'lucide-react';
import { DynamicSidebar } from '@/components/create/DynamicSidebar';
import {
  profileGuidanceContent,
  profileDefaultContent,
  type ProfileFieldType,
} from '@/lib/profile-guidance';

interface ProfileMobileSupportProps {
  completionPercentage: number;
  missingFields: string[];
  focusedField: ProfileFieldType;
  showMobileGuidance: boolean;
  setShowMobileGuidance: (show: boolean) => void;
}

export function ProfileMobileSupport({
  completionPercentage,
  missingFields,
  focusedField,
  showMobileGuidance,
  setShowMobileGuidance,
}: ProfileMobileSupportProps) {
  return (
    <>
      {/* Progress bar at top (mobile only) */}
      <div className="lg:hidden mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Profile Completion</span>
            <span className="text-sm font-bold text-gray-900">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-bitcoinOrange via-orange-500 to-orange-600 h-2 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          {completionPercentage === 100 ? (
            <div className="flex items-center gap-2 text-xs text-green-700 mt-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span className="font-medium">Profile complete!</span>
            </div>
          ) : (
            <div className="mt-3 text-xs text-gray-700">
              <div className="font-medium mb-1">To reach 100%, add:</div>
              <ul className="list-disc list-inside space-y-0.5">
                {missingFields.map(field => (
                  <li key={field}>{field}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Floating help button (mobile, only when a field is focused) */}
      {focusedField && (
        <button
          onClick={() => setShowMobileGuidance(true)}
          className="lg:hidden fixed bottom-6 right-6 z-50 p-4 bg-gradient-to-r from-bitcoinOrange to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200"
          aria-label="Get help"
        >
          <HelpCircle className="w-6 h-6" />
        </button>
      )}

      {/* Guidance modal (mobile) */}
      {showMobileGuidance && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
          onClick={() => setShowMobileGuidance(false)}
        >
          <div
            className="w-full bg-white rounded-t-2xl shadow-2xl max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Help & Guidance</h3>
              <button
                onClick={() => setShowMobileGuidance(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <DynamicSidebar<NonNullable<ProfileFieldType>>
                activeField={focusedField}
                guidanceContent={profileGuidanceContent}
                defaultContent={profileDefaultContent}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
