'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import ConversationList from './ConversationList';
import MessageView from './MessageView';
import { cn } from '@/lib/utils';
import NewConversationModal from './NewConversationModal';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeManager } from '@/hooks/useRealtimeManager';
import { useMessagingStore } from '@/stores/messaging';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';

interface MessagePanelProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  initialConversationId?: string;
  /** If true, renders as full page instead of modal */
  fullPage?: boolean;
}

export default function MessagePanel({
  isOpen,
  onClose,
  className = '',
  initialConversationId,
  fullPage = false,
}: MessagePanelProps) {
  const router = useRouter();
  const { user, hydrated, isLoading } = useAuth();

  // Initialize real-time manager for connection status
  useRealtimeManager();

  // Use centralized messaging store
  const { conversations, currentConversationId, setCurrentConversation, setConversations } =
    useMessagingStore();

  // Track if auth is truly ready (hydrated + not loading + has checked user)
  const isAuthReady = hydrated && !isLoading;

  // Use centralized store for conversation selection
  const selectedConversationId = currentConversationId;
  const [hasInitializedFromUrl, setHasInitializedFromUrl] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
  const [convSelectionMode, setConvSelectionMode] = useState(false);
  const [selectedConvIds, setSelectedConvIds] = useState<Set<string>>(new Set());
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [refreshSignal, setRefreshSignal] = useState(0);

  const toggleConvSelect = (id: string) => {
    setSelectedConvIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const clearConvSelection = () => setSelectedConvIds(new Set());

  // Helper to set conversation using store
  const setSelectedConversationId = (id: string | null) => {
    setCurrentConversation(id);
  };

  const bulkDeleteSelected = async () => {
    const convIds = Array.from(selectedConvIds);
    if (convIds.length === 0) {
      return;
    }
    if (convIds.length >= 2) {
      const ok = window.confirm(
        `Delete ${convIds.length} conversations? This removes them for you and leaves all participants.`
      );
      if (!ok) {
        return;
      }
    }
    try {
      const res = await fetch('/api/messages/bulk-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ids: convIds }),
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        toast.error('Could not delete conversations', {
          description: txt || 'Please try again.',
        });
        return;
      }
      toast.success(`Deleted ${convIds.length} conversation${convIds.length > 1 ? 's' : ''}`);
      clearConvSelection();
      setConvSelectionMode(false);
      setRefreshSignal(s => s + 1);
      if (selectedConversationId && convIds.includes(selectedConversationId)) {
        setSelectedConversationId(null);
        router.replace('/messages');
      }
    } catch (e) {
      console.error('Bulk conversation leave error:', e);
    }
  };

  // Initialize conversation ID from URL only after auth is ready
  // This prevents "conversation not found" errors during auth hydration
  useEffect(() => {
    if (!isAuthReady) {
      // Don't do anything until auth is ready
      return;
    }

    if (user && initialConversationId && !hasInitializedFromUrl) {
      // Auth is ready and we have a user - now safe to load the conversation
      setSelectedConversationId(initialConversationId);
      setHasInitializedFromUrl(true);
    } else if (!user) {
      // No user - clear selection
      setSelectedConversationId(null);
      setHasInitializedFromUrl(false);
    } else if (!initialConversationId && selectedConversationId && hasInitializedFromUrl) {
      // URL changed to /messages without id - clear the selected conversation
      // Only clear if we had previously initialized from URL (to avoid clearing on initial load)
      setSelectedConversationId(null);
      setHasInitializedFromUrl(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId, user, isAuthReady, hasInitializedFromUrl, selectedConversationId]);

  // Reset initialization flag when URL changes
  useEffect(() => {
    if (initialConversationId !== selectedConversationId) {
      setHasInitializedFromUrl(false);
    }
  }, [initialConversationId, selectedConversationId]);

  if (!isOpen) {
    return null;
  }

  // Show loading state while auth is hydrating
  // This prevents race conditions where we try to load conversations before auth is ready
  if (!isAuthReady) {
    const loadingContent = (
      <div
        className={cn(
          'flex h-full bg-white shadow-lg items-center justify-center',
          fullPage ? 'w-full rounded-none' : 'w-full max-w-5xl rounded-2xl border border-gray-200'
        )}
      >
        <div className="text-center p-10">
          <Loader2 className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading messages...</p>
        </div>
      </div>
    );

    if (fullPage) {
      return <div className={cn('h-[calc(100vh-4rem)]', className)}>{loadingContent}</div>;
    }

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-4xl h-[80vh] max-h-[700px]">{loadingContent}</div>
      </div>
    );
  }

  const content = (
    <div
      className={cn(
        'flex h-full bg-white shadow-lg relative',
        // Mobile: single column (flex-col), Desktop: two columns (flex-row)
        'flex-col md:flex-row',
        // Prevent horizontal overflow on mobile
        'overflow-hidden',
        fullPage ? 'w-full rounded-none' : 'w-full max-w-5xl rounded-2xl border border-gray-200'
      )}
    >
      {/* Conversations Sidebar */}
      <div
        className={cn(
          'border-r border-gray-200 flex flex-col bg-gray-50/60 transition-transform duration-300 ease-in-out',
          // Mobile: full width when no conversation, hidden when conversation selected
          // Desktop: fixed width
          selectedConversationId
            ? 'hidden md:flex md:w-80' // Hide on mobile when conversation selected, show on desktop
            : 'flex w-full md:w-80', // Full width on mobile when no conversation, fixed on desktop
          fullPage && 'w-[23rem]'
        )}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            {!fullPage && (
              <Button variant="ghost" size="sm" onClick={onClose} className="-ml-2">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            )}
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              <p className="text-xs text-gray-500">Reach anyone on OrangeCat</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!convSelectionMode ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConvSelectionMode(true)}
                className="text-gray-600"
              >
                Select
              </Button>
            ) : (
              <>
                <span className="text-sm text-gray-600">{selectedConvIds.size} selected</span>
                <Button
                  size="sm"
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={bulkDeleteSelected}
                  disabled={selectedConvIds.size === 0}
                >
                  Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConvSelectionMode(false);
                    clearConvSelection();
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
            <Button
              size="sm"
              onClick={() => setShowNewModal(true)}
              className="bg-orange-500 hover:bg-orange-600 text-white shadow-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              New
            </Button>
          </div>
        </div>

        {/* Filters + Search */}
        <div className="p-4 border-b border-gray-100 space-y-3 bg-white/80">
          <div className="flex items-center gap-2">
            {(['all', 'requests'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm font-medium transition-all border',
                  activeTab === tab
                    ? 'bg-orange-100 text-orange-700 border-orange-200 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                )}
              >
                {tab === 'all' ? 'All' : 'Requests'}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          <ConversationList
            searchQuery={searchQuery}
            selectedConversationId={selectedConversationId}
            filterTab={activeTab}
            selectionMode={convSelectionMode}
            selectedIds={selectedConvIds}
            onToggleSelect={toggleConvSelect}
            onRequestSelectionMode={() => setConvSelectionMode(true)}
            refreshSignal={refreshSignal}
            onSelectConversation={conversationId => {
              if (convSelectionMode) {
                toggleConvSelect(conversationId);
                return;
              }
              // Set conversation immediately for smooth mobile transition
              setSelectedConversationId(conversationId);
              // Update URL for deep linking
              router.push(`/messages?id=${conversationId}`, { scroll: false });
            }}
          />
        </div>
      </div>

      {/* Message View - X-style full-screen on mobile */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-white transition-opacity duration-200 ease-in-out min-h-0',
          // Mobile: full width when conversation selected, hidden when no conversation
          // Desktop: always visible
          selectedConversationId
            ? 'flex w-full' // Show full width when conversation selected
            : 'hidden md:flex' // Hide on mobile when no conversation, show on desktop
        )}
      >
        {selectedConversationId ? (
          <MessageView
            conversationId={selectedConversationId}
            onBack={(reason?: 'forbidden' | 'not_found' | 'unknown' | 'network') => {
              setSelectedConversationId(null);
              // Remove id from the URL when navigating back
              router.push('/messages');
              if (reason === 'forbidden' || reason === 'not_found') {
                // Auto-open the New Conversation modal to help user start a valid chat
                setShowNewModal(true);
              }
            }}
          />
        ) : (
          <div className="flex flex-col h-full">
            {/* Connection Status Indicator - Always visible */}
            <div className="px-4 pt-2">
              <ConnectionStatusIndicator />
            </div>

            {/* Empty State */}
            <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
              <div className="text-center p-10 max-w-md">
                <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center">
                  <MessageSquare className="w-9 h-9 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Select a chat</h3>
                <p className="text-sm text-gray-600 mb-5">
                  Choose from your existing conversations or start a new one.
                </p>
                <Button
                  onClick={() => setShowNewModal(true)}
                  className="bg-orange-500 hover:bg-orange-600 text-white shadow"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New chat
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={convId => {
          // When a new conversation is created:
          // - select it in the UI
          // - refresh the list so it appears in the sidebar
          // - update the URL for deep-linking
          setSelectedConversationId(convId);
          setShowNewModal(false);
          setRefreshSignal(s => s + 1);
          router.push(`/messages?id=${convId}`, { scroll: false });
        }}
      />
    </div>
  );

  // Full page mode - no overlay
  if (fullPage) {
    return <div className={cn('h-[calc(100vh-4rem)]', className)}>{content}</div>;
  }

  // Modal mode
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl h-[80vh] max-h-[700px]">{content}</div>
    </div>
  );
}
