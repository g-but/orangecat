'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useDropdown } from '@/hooks/useDropdown';
import { cn } from '@/lib/utils';
import { HeaderIconButton } from '@/components/layout/HeaderIconButton';
import { CREATE_OPTIONS, shouldShowDivider } from './SmartCreateButton';
import { VoiceCreate } from '@/components/create/VoiceCreate';

export function HeaderCreateButton() {
  const { isOpen, dropdownRef, buttonRef, toggle, close } = useDropdown({
    closeOnRouteChange: true,
    keyboardNavigation: true,
    itemCount: CREATE_OPTIONS.length,
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <HeaderIconButton
        ref={buttonRef}
        icon={Plus}
        label="Create new"
        variant="inverse"
        active={isOpen}
        onClick={toggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        iconClassName={cn('transition-transform duration-200', isOpen && 'rotate-45')}
      />

      {isOpen && (
        <div
          className="fixed z-50 overflow-hidden rounded-md border border-subtle bg-surface-base shadow-none animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 origin-top-right"
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
            <div className="px-3 py-2 text-xs font-semibold text-fg-secondary uppercase tracking-wider">
              Create New
            </div>
            {/* Above the list: naming the thing out loud is faster than finding
                it, and doesn't require knowing our vocabulary for it. */}
            <VoiceCreate className="px-1 pb-2" onNavigate={close} />
            <div className="space-y-0.5">
              {CREATE_OPTIONS.map((option, index) => (
                <div key={option.name}>
                  <Link
                    href={option.href}
                    onClick={close}
                    className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-surface-raised"
                    role="menuitem"
                    tabIndex={isOpen ? 0 : -1}
                  >
                    <div className="oc-icon-tile h-9 w-9">
                      <option.icon className={cn('w-4 h-4', option.color)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-fg-primary transition-colors group-hover:text-fg-primary">
                        {option.name}
                      </div>
                      <div className="text-xs text-fg-secondary truncate">{option.description}</div>
                    </div>
                  </Link>
                  {shouldShowDivider(option, CREATE_OPTIONS[index + 1]) && (
                    <div className="my-1.5 mx-3 border-t border-subtle" />
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
