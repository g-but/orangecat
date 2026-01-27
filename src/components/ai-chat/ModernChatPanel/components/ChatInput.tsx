/**
 * CHAT INPUT COMPONENT
 * Textarea with send button
 */

import { useRef } from 'react';
import { cn } from '@/lib/utils';
import { Send, Loader2 } from 'lucide-react';

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    // Reset height to auto to get the correct scrollHeight
    e.target.style.height = 'auto';
    // Set height to scrollHeight, max 200px
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="p-4 border-t border-gray-100">
      <div className="flex items-end gap-2 max-w-3xl mx-auto">
        <div className="flex-1 relative">
          <textarea
            ref={inputRef}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Message your Cat..."
            disabled={isLoading}
            rows={1}
            className={cn(
              'w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 pr-12',
              'focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300',
              'text-[15px] leading-relaxed placeholder:text-gray-400',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'max-h-[200px]'
            )}
          />
        </div>
        <button
          onClick={onSend}
          disabled={!value.trim() || isLoading}
          className={cn(
            'flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all',
            value.trim() && !isLoading
              ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          )}
        >
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
        </button>
      </div>
      <p className="text-xs text-gray-400 text-center mt-2">
        Using free AI models • No API key required
      </p>
    </div>
  );
}
