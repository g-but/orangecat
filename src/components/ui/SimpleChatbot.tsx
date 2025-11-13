'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Lightbulb, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  type: 'bot' | 'user';
  content: string;
  timestamp: Date;
}

const CHATBOT_TIPS = [
  {
    trigger: ['help', 'how', 'guide'],
    response:
      "I'm here to help you navigate OrangeCat! I can assist you with understanding how to evaluate projects, create your profile, or explore the platform. What would you like to know about?",
  },
  {
    trigger: ['evaluate', 'trust', 'verify', 'research'],
    response:
      'Great question! When evaluating a project on OrangeCat, look for:\n\n✓ Transparency Score - Higher is better\n✓ Regular updates and milestones\n✓ Clear Bitcoin wallet addresses\n✓ Detailed project description\n✓ Creator profile completeness\n\nAlways do your own research and only support projects you believe in!',
  },
  {
    trigger: ['profile', 'create', 'setup'],
    response:
      'To create a strong profile:\n\n1. Add a clear profile photo\n2. Write a detailed bio\n3. Add your Bitcoin wallet for receiving support\n4. Complete all transparency fields\n5. Link your social media\n\nHigher transparency = more trust from supporters!',
  },
  {
    trigger: ['project', 'fundraise', 'campaign'],
    response:
      'To create a successful project:\n\n1. Write a clear, compelling description\n2. Set realistic funding goals\n3. Add images/videos of your work\n4. Post regular updates\n5. Be transparent about fund usage\n6. Respond to supporter questions\n\nAuthenticity is key!',
  },
  {
    trigger: ['bitcoin', 'wallet', 'btc'],
    response:
      'Bitcoin is how funding works on OrangeCat!\n\n• All donations are direct Bitcoin transactions\n• No platform fees or middlemen\n• You control your wallet, you control your funds\n• Use a secure wallet (hardware wallet recommended)\n• Never share your private keys\n\nNeed help setting up a wallet? Check our Bitcoin Wallet Guide!',
  },
];

export function SimpleChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'bot',
      content:
        "Hi! I'm OrangeCat's assistant. I can help you understand how to use the platform and evaluate projects critically. Ask me anything!",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');

  const handleSend = () => {
    if (!input.trim()) {
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);

    // Find matching response
    const lowerInput = input.toLowerCase();
    const matchedTip = CHATBOT_TIPS.find(tip =>
      tip.trigger.some(trigger => lowerInput.includes(trigger))
    );

    // Bot response
    setTimeout(() => {
      const botMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'bot',
        content:
          matchedTip?.response ||
          "I'm not sure about that specific topic, but I can help you with:\n\n• Evaluating projects\n• Creating your profile\n• Understanding Bitcoin donations\n• Platform features\n\nWhat would you like to know?",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, botMessage]);
    }, 500);

    setInput('');
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg flex items-center justify-center text-white transition-all hover:scale-110"
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 h-[600px] bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">OrangeCat Assistant</h3>
            <p className="text-xs text-gray-600">Here to help you succeed</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <div
            key={message.id}
            className={cn('flex gap-2', message.type === 'user' ? 'justify-end' : 'justify-start')}
          >
            {message.type === 'bot' && (
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <HelpCircle className="w-4 h-4 text-orange-600" />
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] px-4 py-2 rounded-2xl whitespace-pre-line text-sm',
                message.type === 'bot'
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-gradient-to-r from-orange-500 to-orange-600 text-white'
              )}
            >
              {message.content}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="Ask me anything..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full flex items-center justify-center text-white transition-colors"
            aria-label="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
