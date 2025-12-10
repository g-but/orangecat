'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MessageSquare, Search, Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Button from '@/components/ui/Button';
import ConversationList from './ConversationList';
import MessageView from './MessageView';
import { cn } from '@/lib/utils';
import NewConversationModal from './NewConversationModal';

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
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(
    initialConversationId || null
  );
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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    })
  };

  const clearConvSelection = () => setSelectedConvIds(new Set());

  const bulkDeleteSelected = async () => {
    const convIds = Array.from(selectedConvIds);
    if (convIds.length === 0) return;
    if (convIds.length >= 2) {
      const ok = window.confirm(`Delete ${convIds.length} conversations? This removes them for you and leaves all participants.`);
      if (!ok) return;
    }
    try {
      const res = await fetch('/api/messages/bulk-conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify({ ids: convIds })
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
  }

  useEffect(() => {
    if (initialConversationId) {
      setSelectedConversationId(initialConversationId);
    }
  }, [initialConversationId]);

  if (!isOpen) {
    return null;
  }

  const content = (
    <div
      className={cn(
        'flex h-full bg-white shadow-lg',
        fullPage
          ? 'w-full rounded-none'
          : 'w-full max-w-5xl rounded-2xl border border-gray-200 overflow-hidden'
      )}
    >
      {/* Conversations Sidebar */}
      <div
        className={cn(
          'border-r border-gray-200 flex flex-col bg-gray-50/60',
          fullPage ? 'w-[23rem]' : 'w-[23rem]',
          // On mobile, show as overlay when conversation is selected
          !fullPage && selectedConversationId ? 'hidden md:flex' : 'flex',
          // On mobile when no conversation selected, take full width
          !fullPage && !selectedConversationId ? 'w-full md:w-80' : ''
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
            {(['all', 'requests'] as const).map((tab) => (
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
              onChange={(e) => setSearchQuery(e.target.value)}
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
            onSelectConversation={(conversationId) => {
              if (convSelectionMode) {
                toggleConvSelect(conversationId);
                return;
              }
              setSelectedConversationId(conversationId);
              router.push(`/messages?id=${conversationId}`);
            }}
          />
        </div>
      </div>

      {/* Message View */}
      <div
        className={cn(
          'flex-1 flex flex-col bg-white',
          selectedConversationId ? 'flex' : 'hidden md:flex'
        )}
      >
        {selectedConversationId ? (
          <MessageView
            conversationId={selectedConversationId}
            onBack={(reason) => {
              setSelectedConversationId(null)
              // Remove id from the URL when navigating back
              router.push('/messages')
              if (reason === 'forbidden' || reason === 'not_found') {
                // Auto-open the New Conversation modal to help user start a valid chat
                setShowNewModal(true)
              }
            }}
          />
        ) : (
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
        )}
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        onCreated={(convId) => {
          setSelectedConversationId(convId);
          setShowNewModal(false);
        }}
      />
    </div>
  );

  // Full page mode - no overlay
  if (fullPage) {
    return (
      <div className={cn('h-[calc(100vh-4rem)]', className)}>
        {content}
      </div>
    );
  }

  // Modal mode
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-4xl h-[80vh] max-h-[700px]">
        {content}
      </div>
    </div>
  );
}
