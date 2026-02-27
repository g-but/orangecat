'use client';

import Image from 'next/image';
import Link from 'next/link';
import { LogOut, ExternalLink } from 'lucide-react';
import DefaultAvatar from '@/components/ui/DefaultAvatar';
import type { MutableRefObject } from 'react';

export interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  description?: string;
}

interface UserProfileDropdownPanelProps {
  buttonRef: MutableRefObject<HTMLButtonElement | null>;
  close: () => void;
  showUserInfo: boolean;
  showDescriptions: boolean;
  avatarUrl: string | null | undefined;
  avatarError: boolean;
  setAvatarError: (v: boolean) => void;
  displayName: string;
  username: string | null | undefined;
  email: string;
  handlePublicProfileClick: () => void;
  menuItems: MenuItem[];
  itemRefs: MutableRefObject<(HTMLButtonElement | HTMLAnchorElement | null)[]>;
  focusedIndex: number;
  setFocusedIndex: (i: number) => void;
  isOpen: boolean;
  handleNavigation: (path: string) => void;
  handleSignOut: () => void;
}

export function UserProfileDropdownPanel({
  buttonRef,
  close,
  showUserInfo,
  showDescriptions,
  avatarUrl,
  avatarError,
  setAvatarError,
  displayName,
  username,
  email,
  handlePublicProfileClick,
  menuItems,
  itemRefs,
  focusedIndex,
  setFocusedIndex,
  isOpen,
  handleNavigation,
  handleSignOut,
}: UserProfileDropdownPanelProps) {
  return (
    <div
      className="fixed z-50 rounded-2xl shadow-2xl bg-white border border-gray-100 animate-in fade-in slide-in-from-top-2 zoom-in-95 duration-200 origin-top-right overflow-hidden"
      style={{
        top: buttonRef.current ? buttonRef.current.getBoundingClientRect().bottom + 12 : 'auto',
        right: buttonRef.current
          ? Math.max(16, window.innerWidth - buttonRef.current.getBoundingClientRect().right)
          : 'auto',
        width: Math.min(320, window.innerWidth - 32),
      }}
      role="menu"
      aria-orientation="vertical"
      aria-label="User menu"
    >
      {showUserInfo && (
        <div className="p-6 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
          <div className="flex items-center space-x-4">
            <Link
              href="/profiles/me"
              onClick={e => {
                e.stopPropagation();
                close();
              }}
              className="relative hover:opacity-80 transition-opacity"
            >
              {avatarUrl && !avatarError ? (
                <Image
                  src={avatarUrl}
                  alt={displayName}
                  width={56}
                  height={56}
                  className="rounded-full object-cover ring-4 ring-orange-100 cursor-pointer"
                  onError={() => setAvatarError(true)}
                />
              ) : (
                <DefaultAvatar
                  size={56}
                  className="rounded-full ring-4 ring-orange-100 cursor-pointer"
                />
              )}
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-3 border-white rounded-full shadow-sm" />
            </Link>
            <div className="flex-1 min-w-0">
              <button
                onClick={handlePublicProfileClick}
                className="group flex items-center space-x-2 hover:text-orange-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-1 rounded-lg p-1 -m-1"
              >
                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-orange-600 transition-colors duration-200 truncate">
                  {displayName}
                </h3>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-all duration-200 opacity-0 group-hover:opacity-100 transform group-hover:scale-110" />
              </button>
              {username && <p className="text-sm font-medium text-gray-600">@{username}</p>}
              {email && <p className="text-xs text-gray-500 truncate mt-1">{email}</p>}
            </div>
          </div>
        </div>
      )}

      <div className="py-2" role="none">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              ref={el => {
                itemRefs.current[index] = el;
              }}
              onClick={() => handleNavigation(item.href)}
              onFocus={() => setFocusedIndex(index)}
              role="menuitem"
              tabIndex={isOpen ? 0 : -1}
              className={`
                w-full flex items-center px-4 py-3 text-sm transition-all duration-200 group outline-none
                hover:bg-gray-50 focus:bg-gray-50 focus:ring-2 focus:ring-tiffany-400 focus:ring-inset
                ${focusedIndex === index ? 'bg-gray-50' : ''}
              `}
            >
              <div className="p-2.5 rounded-xl bg-orange-50 group-hover:bg-orange-100 group-hover:shadow-sm transition-all duration-200 mr-4">
                <Icon className="w-5 h-5 text-orange-600 group-hover:text-orange-700 transition-colors duration-200" />
              </div>
              <div className="flex-1 text-left">
                <div className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors duration-200">
                  {item.label}
                </div>
                {showDescriptions && (
                  <div className="text-sm text-gray-500 group-hover:text-gray-600 transition-colors duration-200">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="border-t border-gray-100 my-1" />

      <div className="py-2">
        <button
          ref={el => {
            itemRefs.current[menuItems.length] = el;
          }}
          onClick={handleSignOut}
          onFocus={() => setFocusedIndex(menuItems.length)}
          role="menuitem"
          tabIndex={isOpen ? 0 : -1}
          className={`
            w-full flex items-center px-4 py-3 text-sm transition-all duration-200 group outline-none
            hover:bg-red-50 focus:bg-red-50 focus:ring-2 focus:ring-red-400 focus:ring-inset
            ${focusedIndex === menuItems.length ? 'bg-red-50' : ''}
          `}
        >
          <div className="p-2.5 rounded-xl bg-red-50 group-hover:bg-red-100 group-hover:shadow-sm transition-all duration-200 mr-4">
            <LogOut className="w-5 h-5 text-red-600 transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="flex-1 text-left">
            <div className="font-semibold text-red-600 group-hover:text-red-700 transition-colors duration-200">
              Sign Out
            </div>
            {showDescriptions && (
              <div className="text-sm text-red-500 group-hover:text-red-600 transition-colors duration-200">
                End your session
              </div>
            )}
          </div>
        </button>
      </div>
    </div>
  );
}
