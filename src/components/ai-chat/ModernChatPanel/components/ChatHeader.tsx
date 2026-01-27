/**
 * CHAT HEADER COMPONENT
 * Header with title, model selector, and actions
 */

import { useRouter } from 'next/navigation';
import { Cat, Trash2, Settings2 } from 'lucide-react';
import { ModelSelector } from './ModelSelector';

interface ChatHeaderProps {
  selectedModel: string;
  onModelSelect: (model: string) => void;
  isLoading: boolean;
  hasMessages: boolean;
  onClearChat: () => void;
}

export function ChatHeader({
  selectedModel,
  onModelSelect,
  isLoading,
  hasMessages,
  onClearChat,
}: ChatHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center">
          <Cat className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="font-semibold text-gray-900">My Cat</h1>
          <p className="text-xs text-gray-500">Private • Not saved</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ModelSelector
          selectedModel={selectedModel}
          onSelect={onModelSelect}
          disabled={isLoading}
        />

        {hasMessages && (
          <button
            onClick={onClearChat}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}

        <button
          onClick={() => router.push('/settings/ai')}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          title="AI Settings"
        >
          <Settings2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
