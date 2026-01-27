/**
 * MESSAGE LIST COMPONENT
 * Displays chat messages with empty state
 */

import { RefObject } from 'react';
import { useRouter } from 'next/navigation';
import { renderMarkdownToReact } from '@/utils/markdown';
import { Bot, Key, Loader2 } from 'lucide-react';
import type { ChatMessage } from '../types';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
  endRef: RefObject<HTMLDivElement>;
  localEnabled: boolean;
  localHealthy: boolean | null;
}

export function MessageList({
  messages,
  isLoading,
  endRef,
  localEnabled,
  localHealthy,
}: MessageListProps) {
  const router = useRouter();

  if (messages.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
          <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
            <Bot className="h-6 w-6 text-orange-600" />
          </div>
          <div className="font-medium">Start a private chat with your Cat</div>
          <div className="text-sm">Choose a model, ask anything. Nothing is saved.</div>
          {!localEnabled && (
            <div className="mt-6 max-w-lg text-left space-y-4">
              {/* BYOK Setup Prompt */}
              <button
                onClick={() => router.push('/settings/ai/onboarding')}
                className="w-full text-left bg-gradient-to-r from-tiffany-50 to-blue-50 border border-tiffany-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="font-semibold text-tiffany-800 mb-2 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Set Up Your AI (Recommended)
                </div>
                <p className="text-sm text-tiffany-700 mb-2">
                  Bring your own API key for unlimited access to premium AI models. Complete our
                  5-step setup guide.
                </p>
                <span className="text-xs text-tiffany-600 hover:underline">Start AI Setup →</span>
              </button>

              {/* Local Model Alternative */}
              {localHealthy === false && (
                <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                  <div className="font-semibold text-gray-800 mb-2">
                    Alternative: Use a local model (no API key)
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-gray-700">
                    <li>Install Ollama from ollama.com and open a terminal</li>
                    <li>
                      Run:{' '}
                      <code className="bg-gray-100 px-1 py-0.5 rounded">ollama pull mistral</code>
                    </li>
                    <li>Return here and click Settings → Local → Test</li>
                  </ol>
                  <div className="text-xs text-gray-500 mt-2">
                    Alternatively, run LM Studio and enable its local server (OpenAI-compatible
                    API).
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="space-y-3">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                m.role === 'user'
                  ? 'bg-orange-500 text-white'
                  : 'bg-white border border-gray-200 text-gray-900'
              }`}
            >
              <div className="whitespace-pre-wrap">{renderMarkdownToReact(m.content)}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 px-3 py-2 rounded-2xl">
              <Loader2 className="h-4 w-4 animate-spin text-gray-500" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
