'use client';
import Link from 'next/link';
import { Edit as EditIcon, EyeOff } from 'lucide-react';

interface ProfileFieldProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  /** If provided, shown as-is. If falsy, shows empty state. */
  value?: React.ReactNode;
  /** If provided and isOwnProfile, shows an edit link when value is empty. */
  editHref?: string;
  emptyText?: string;
  isOwnProfile?: boolean;
  /**
   * Owner-only cue: this field is hidden from visitors (per the profile privacy
   * settings). Renders a small "Hidden" pill next to the label so the owner can
   * see their own choice without opening the editor. Only meaningful when
   * isOwnProfile — visitors never receive hidden values in the first place.
   */
  hiddenFromVisitors?: boolean;
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
  hiddenFromVisitors,
}: ProfileFieldProps) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-5 h-5 text-fg-tertiary mt-0.5" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm text-fg-secondary">{label}</span>
          {hiddenFromVisitors && isOwnProfile && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-surface-raised px-1.5 py-0.5 text-2xs font-medium text-fg-tertiary"
              title="Hidden from visitors — only you can see this"
            >
              <EyeOff className="h-3 w-3" aria-hidden />
              Hidden
            </span>
          )}
        </div>
        {value ? (
          <>{value}</>
        ) : isOwnProfile && editHref ? (
          <Link
            href={editHref}
            className="inline-flex items-center gap-2 text-fg-primary hover:underline underline-offset-4 group"
          >
            <span className="text-fg-tertiary italic group-hover:text-fg-primary">{emptyText}</span>
            <EditIcon className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            <span className="text-xs">Click to add</span>
          </Link>
        ) : (
          <div className="text-fg-tertiary italic">{emptyText}</div>
        )}
      </div>
    </div>
  );
}
