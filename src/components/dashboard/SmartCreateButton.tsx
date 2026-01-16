'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Edit3, MessageSquare, LucideIcon } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useProjectStore } from '@/stores/projectStore';
import { useDropdown } from '@/hooks/useDropdown';
import DraftContinueDialog from './DraftContinueDialog';
import { cn } from '@/lib/utils';
import {
  getEntitiesForCreateMenu,
  COLOR_CLASSES,
  type EntityMetadata,
  type EntityCategory,
} from '@/config/entity-registry';

interface SmartCreateButtonProps {
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  showIcon?: boolean;
  fullWidth?: boolean;
  // Force bypassing draft check (for specific use cases)
  forceNewCampaign?: boolean;
}

export default function SmartCreateButton({
  children,
  className = '',
  size = 'md',
  variant = 'primary',
  showIcon = true,
  fullWidth = false,
  forceNewCampaign = false,
}: SmartCreateButtonProps) {
  const router = useRouter();
  const { drafts } = useProjectStore();
  const [showDraftDialog, setShowDraftDialog] = useState(false);

  const hasAnyDraft = drafts.length > 0;
  const primaryDraft = hasAnyDraft ? drafts[0] : null;
  const shouldShowDraftPrompt = hasAnyDraft && !forceNewCampaign;

  const handleClick = () => {
    if (shouldShowDraftPrompt) {
      setShowDraftDialog(true);
    } else {
      // Clear any existing drafts from localStorage if starting fresh
      router.push('/projects/create');
    }
  };

  const handleContinueDraft = () => {
    setShowDraftDialog(false);
    router.push('/projects/create');
  };

  const handleStartFresh = () => {
    setShowDraftDialog(false);
    // Add query parameter to indicate starting fresh
    router.push('/projects/create?new=true');
  };

  // Determine button content based on draft status
  const getButtonContent = () => {
    if (shouldShowDraftPrompt && primaryDraft) {
      const isPendingDraft = primaryDraft.isDraft;

      return (
        <>
          {showIcon && <Edit3 className="w-4 h-4 mr-2" />}
          {children || (isPendingDraft ? 'Continue Project' : 'Complete Project')}
        </>
      );
    }

    return (
      <>
        {showIcon && <Plus className="w-4 h-4 mr-2" />}
        {children || 'Create Project'}
      </>
    );
  };

  // Determine button styling based on draft status
  const getButtonClassName = () => {
    if (shouldShowDraftPrompt) {
      // More prominent styling for continuing drafts
      return variant === 'outline'
        ? 'border-blue-300 text-blue-700 hover:bg-blue-50 hover:border-blue-400'
        : variant === 'ghost'
          ? 'text-blue-700 hover:text-blue-800 hover:bg-blue-50'
          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg';
    }

    return ''; // Use default styling
  };

  return (
    <>
      <Button
        onClick={handleClick}
        className={`${getButtonClassName()} ${fullWidth ? 'w-full' : ''} ${className}`}
        size={size}
        variant={variant}
      >
        {getButtonContent()}
      </Button>

      <DraftContinueDialog
        isOpen={showDraftDialog}
        onClose={() => setShowDraftDialog(false)}
        onContinueDraft={handleContinueDraft}
        onStartFresh={handleStartFresh}
      />
    </>
  );
}

// ==================== CREATE OPTIONS ====================
// Generated from entity-registry.ts (Single Source of Truth)

interface CreateOption {
  name: string;
  description: string;
  href: string;
  icon: LucideIcon;
  color: string;
  bgColor: string;
  category: EntityCategory | 'content'; // For grouping and dividers
}

/**
 * Generate create options from entity registry
 * Post is added as a special case since it's content, not a structured entity
 */
function generateCreateOptions(): CreateOption[] {
  // Post is special - it's content, not an entity in the registry
  const postOption: CreateOption = {
    name: 'Post',
    description: 'Share an update on your timeline',
    href: '/timeline?compose=true',
    icon: MessageSquare,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    category: 'content',
  };

  // Get all entities from registry, sorted by category and priority
  const entityOptions: CreateOption[] = getEntitiesForCreateMenu().map((entity: EntityMetadata) => {
    const colors = COLOR_CLASSES[entity.colorTheme];
    return {
      name: entity.name,
      description: entity.createActionLabel,
      href: entity.createPath,
      icon: entity.icon,
      color: colors.text,
      bgColor: colors.bg,
      category: entity.category,
    };
  });

  // Post first, then all entities
  return [postOption, ...entityOptions];
}

// Generate options once (they don't change at runtime)
const CREATE_OPTIONS = generateCreateOptions();

/**
 * Check if a divider should be shown after this option
 * Dividers appear between category groups for visual separation
 */
function shouldShowDivider(current: CreateOption, next: CreateOption | undefined): boolean {
  if (!next) {
    return false;
  }
  return current.category !== next.category;
}

// Export a specialized version for navigation/header use with dropdown
export function HeaderCreateButton() {
  const { isOpen, dropdownRef, buttonRef, toggle, close } = useDropdown({
    closeOnRouteChange: true,
    keyboardNavigation: true,
    itemCount: CREATE_OPTIONS.length,
  });

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Plus Button - Mobile-optimized with proper touch targets */}
      <button
        ref={buttonRef}
        onClick={toggle}
        className={cn(
          'flex items-center justify-center w-10 h-10 sm:w-9 sm:h-9 rounded-xl transition-all duration-200',
          'bg-gradient-to-r from-orange-500 to-tiffany-500 text-white',
          'hover:from-orange-600 hover:to-tiffany-600 hover:shadow-md',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2',
          'touch-manipulation', // Optimize touch response
          isOpen && 'shadow-md'
        )}
        aria-label="Create new"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Plus
          className={cn(
            'w-5 h-5 sm:w-5 sm:h-5 transition-transform duration-200',
            isOpen && 'rotate-45'
          )}
        />
      </button>

      {/* Dropdown Menu - Fixed positioning like UserProfileDropdown */}
      {isOpen && (
        <div
          className="fixed z-50 rounded-xl shadow-xl bg-white border border-gray-100 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 origin-top-right overflow-hidden"
          style={{
            top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 12 : 'auto',
            right: buttonRef.current
              ? Math.max(16, window.innerWidth - buttonRef.current.getBoundingClientRect().right)
              : 'auto',
            width: Math.min(320, window.innerWidth - 32),
          }}
          role="menu"
          aria-orientation="vertical"
          aria-label="Create new"
        >
          <div className="p-2 max-h-[70vh] overflow-y-auto">
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Create New
            </div>
            <div className="space-y-0.5">
              {CREATE_OPTIONS.map((option, index) => (
                <div key={option.name}>
                  <Link
                    href={option.href}
                    onClick={close}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 transition-colors group"
                    role="menuitem"
                    tabIndex={isOpen ? 0 : -1}
                  >
                    <div className={cn('p-2 rounded-lg', option.bgColor)}>
                      <option.icon className={cn('w-4 h-4', option.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                        {option.name}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{option.description}</div>
                    </div>
                  </Link>
                  {/* Subtle divider between category groups */}
                  {shouldShowDivider(option, CREATE_OPTIONS[index + 1]) && (
                    <div className="my-1.5 mx-3 border-t border-gray-100" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Mobile version - shows in mobile bottom nav or as a floating button
export function MobileCreateButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          'flex items-center justify-center w-12 h-12 rounded-full',
          'bg-gradient-to-r from-orange-500 to-tiffany-500 text-white shadow-lg',
          'hover:from-orange-600 hover:to-tiffany-600',
          'focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2'
        )}
        aria-label="Create new"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* Mobile Bottom Sheet */}
      {isOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setIsOpen(false)}>
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

          {/* Sheet */}
          <div
            className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 pb-8 animate-slide-up max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
            style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}
          >
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-4 px-2">Create New</h3>
            <div className="grid grid-cols-3 gap-2">
              {CREATE_OPTIONS.map((option, _index) => (
                <div key={option.name} className="contents">
                  <Link
                    href={option.href}
                    onClick={() => setIsOpen(false)}
                    className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/50 transition-colors"
                  >
                    <div className={cn('p-2.5 rounded-xl', option.bgColor)}>
                      <option.icon className={cn('w-5 h-5', option.color)} />
                    </div>
                    <span className="text-xs font-medium text-gray-900 text-center">
                      {option.name}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Export a specialized version for dashboard cards
export function DashboardCreateButton({ className = '' }: { className?: string }) {
  const { drafts } = useProjectStore();
  const hasAnyDraft = drafts.length > 0;

  return (
    <SmartCreateButton
      className={`${hasAnyDraft ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700' : 'bg-gradient-to-r from-tiffany-600 to-orange-600 hover:from-tiffany-700 hover:to-orange-700'} min-h-[44px] ${className}`}
      size="lg"
      fullWidth={true}
    />
  );
}

// Export a specialized version that always creates new (for "Start Fresh" scenarios)
export function NewCampaignButton({
  children,
  className = '',
  ...props
}: Omit<SmartCreateButtonProps, 'forceNewCampaign'>) {
  return (
    <SmartCreateButton {...props} forceNewCampaign={true} className={className}>
      {children || 'Start New Project'}
    </SmartCreateButton>
  );
}
