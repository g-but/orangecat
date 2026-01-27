/**
 * CHAT FOOTER COMPONENT
 * Error display, suggestions, and input area
 */

import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Bot, Key, Loader2, Mic, MicOff, PlusCircle } from 'lucide-react';
import type { EntitySuggestion } from '../types';

interface ChatFooterProps {
  error: string | null;
  suggestEntities: EntitySuggestion[];
  input: string;
  setInput: (value: string) => void;
  isLoading: boolean;
  listening: boolean;
  messagesCount: number;
  onSend: () => void;
  onClear: () => void;
  onCreateService: () => void;
  onVoiceInput: () => void;
}

export function ChatFooter({
  error,
  suggestEntities,
  input,
  setInput,
  isLoading,
  listening,
  messagesCount,
  onSend,
  onClear,
  onCreateService,
  onVoiceInput,
}: ChatFooterProps) {
  const router = useRouter();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="border-t bg-white p-3">
      {error && (
        <div className="text-sm text-red-600 mb-2 p-2 bg-red-50 rounded-lg border border-red-100">
          <p>{error}</p>
          {(error.includes('API key') ||
            error.includes('not configured') ||
            error.includes('openrouter')) && (
            <div className="mt-2 flex flex-col gap-2">
              <button
                onClick={() => router.push('/settings/ai')}
                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
              >
                <Key className="h-3 w-3" /> Configure API Key in AI Settings
              </button>
              <button
                onClick={() => router.push('/settings/ai/onboarding')}
                className="text-xs text-tiffany-600 hover:underline flex items-center gap-1"
              >
                <Bot className="h-3 w-3" /> Complete AI Setup (5-step guide)
              </button>
            </div>
          )}
        </div>
      )}

      {suggestEntities.length > 0 && (
        <div className="flex items-center gap-2 mb-2 text-sm">
          <span className="text-gray-600">Suggested:</span>
          {suggestEntities.map(s => (
            <button
              key={s.type}
              onClick={s.action}
              className="px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              Create {s.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={onCreateService} className="gap-2">
          <PlusCircle className="h-4 w-4" /> Create Service from chat
        </Button>
        <div className="flex-1 flex items-center gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask your Cat..."
            disabled={isLoading}
          />
          <button
            className={`p-2 rounded-lg ${
              listening ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100 text-gray-600'
            }`}
            title="Voice input"
            onClick={onVoiceInput}
          >
            {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>
          <Button onClick={onSend} disabled={!input.trim() || isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
          </Button>
          <Button variant="ghost" onClick={onClear} disabled={messagesCount === 0}>
            Clear
          </Button>
        </div>
      </div>
    </div>
  );
}
