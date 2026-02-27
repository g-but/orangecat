'use client';
import Link from 'next/link';
import { Edit as EditIcon } from 'lucide-react';

interface ProfileFieldProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** If provided, shown as-is. If falsy, shows empty state. */
  value?: React.ReactNode;
  /** If provided and isOwnProfile, shows an edit link when value is empty. */
  editHref?: string;
  emptyText?: string;
  isOwnProfile?: boolean;
}

/**
 * Single profile info row with icon, label, and 3-state value:
 * 1. Has value → display it
 * 2. Own profile + editHref → show edit link with "Click to add"
 * 3. Otherwise → italic empty text
 */
export function ProfileField({
  icon: Icon,
  label,
  value,
  editHref,
  emptyText = 'Not filled out yet',
  isOwnProfile,
}: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-gray-400 mt-0.5" />
      <div className="flex-1">
        <div className="text-sm text-gray-500">{label}</div>
        {value ? (
          <>{value}</>
        ) : isOwnProfile && editHref ? (
          <Link
            href={editHref}
            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 hover:underline group"
          >
            <span className="text-gray-400 italic group-hover:text-orange-600">{emptyText}</span>
            <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs">Click to add</span>
          </Link>
        ) : (
          <div className="text-gray-400 italic">{emptyText}</div>
        )}
      </div>
    </div>
  );
}
