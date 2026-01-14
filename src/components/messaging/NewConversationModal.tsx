'use client';

import { logger } from '@/utils/logger';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { X, Search, MessageSquare, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils';

type ProfileLite = {
  id: string;
  username: string | null;
  name: string | null;
  avatar_url: string | null;
  bio?: string | null;
};

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
  /** Pre-fill with a specific user to message */
  initialUserId?: string;
}

export default function NewConversationModal({
  isOpen,
  onClose,
  onCreated,
  initialUserId,
}: NewConversationModalProps) {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingId, setCreatingId] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<ProfileLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetchProfiles = useCallback(async (q: string) => {
    try {
      setLoading(true);
      setError(null);
      if (abortRef.current) {
        abortRef.current.abort();
      }
      const controller = new AbortController();
      abortRef.current = controller;
      const url = q
        ? `/api/profiles?limit=20&search=${encodeURIComponent(q)}`
        : '/api/profiles?limit=20';
      const res = await fetch(url, { credentials: 'same-origin', signal: controller.signal });
      if (!res.ok) {
        throw new Error('Failed to load people');
      }
      const data = await res.json();
      // API returns { success: true, data: [...] } but older responses nested under data.data
      const arr = Array.isArray(data.data)
        ? data.data
        : Array.isArray(data.data?.data)
          ? data.data.data
          : [];
      setProfiles(arr);
    } catch (e) {
      interface ErrorWithName {
        name?: string;
      }
      const errorWithName = e as ErrorWithName;
      if (errorWithName.name === 'AbortError') {
        return;
      }
      setError(e instanceof Error ? e.message : 'Failed to load people');
    } finally {
      setLoading(false);
    }
  }, []);

  const startConversation = useCallback(
    async (profileId: string) => {
      try {
        setCreatingId(profileId);
        setError(null);

        // Use /api/messages/open which handles self / direct / group cases
        const res = await fetch('/api/messages/open', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'same-origin',
          body: JSON.stringify({ participantIds: [profileId] }),
        });

        const data = await res.json();

        // Handle wrapped response format from apiSuccess
        const conversationId = data.data?.conversationId || data.conversationId;

        if (!res.ok || !conversationId) {
          const errorMessage =
            data.error || data.details || data.hint || 'Failed to create conversation';
          logger.error('Failed to create conversation:', {
            status: res.status,
            error: data.error,
            details: data.details,
            code: data.code,
            hint: data.hint,
            responseData: data,
          });
          throw new Error(errorMessage);
        }
        // Note: onCreated handler in parent already closes the modal via setShowNewModal(false)
        onCreated(conversationId);
      } catch (e) {
        logger.error('Error creating conversation:', e);
        setError(e instanceof Error ? e.message : 'Failed to create conversation');
      } finally {
        setCreatingId(null);
      }
    },
    [onCreated]
  );

  useEffect(() => {
    if (isOpen) {
      fetchProfiles('');
      // Focus search input when modal opens
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [isOpen, fetchProfiles]);

  // Handle initial user ID
  useEffect(() => {
    if (isOpen && initialUserId) {
      startConversation(initialUserId);
    }
  }, [isOpen, initialUserId, startConversation]);

  const handleChange = (val: string) => {
    setSearch(val);
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = window.setTimeout(() => fetchProfiles(val), 300);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
      onClick={e => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">New Message</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 hover:text-gray-700 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              ref={inputRef}
              value={search}
              onChange={e => handleChange(e.target.value)}
              placeholder="Search by name or @username"
              className="w-full pl-11 pr-4 py-3 bg-gray-100 border-0 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="px-4 py-3 bg-red-50 border-b border-red-100">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading && !creatingId ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="py-12 text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 font-medium">
                {search ? 'No people found' : 'Search for someone to message'}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                {search ? 'Try a different search term' : 'Type a name or username above'}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {profiles.map(p => (
                <div
                  key={p.id}
                  role="button"
                  tabIndex={0}
                  aria-disabled={!!creatingId}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-25 text-left transition-all duration-200 rounded-lg',
                    creatingId === p.id && 'opacity-60'
                  )}
                  onClick={() => {
                    if (!creatingId) {
                      startConversation(p.id);
                    }
                  }}
                  onKeyDown={e => {
                    if (creatingId) {
                      return;
                    }
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      startConversation(p.id);
                    }
                  }}
                >
                  <img
                    src={p.avatar_url || '/default-avatar.svg'}
                    alt={p.name || p.username || 'User'}
                    className="w-11 h-11 rounded-full object-cover bg-gray-200"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 truncate">
                      {p.name || p.username || 'User'}
                    </div>
                    {p.username && (
                      <div className="text-sm text-gray-500 truncate">@{p.username}</div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    disabled={!!creatingId && creatingId !== p.id}
                    className="bg-orange-500 hover:bg-orange-600 text-white flex-shrink-0"
                    onClick={e => {
                      e.stopPropagation();
                      if (!creatingId) {
                        startConversation(p.id);
                      }
                    }}
                  >
                    {creatingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Message'}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
