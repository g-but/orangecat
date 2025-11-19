'use client';

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, ArrowLeft, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

type TopicId = 'main' | 'evaluate' | 'profile' | 'project' | 'bitcoin';

interface Topic {
  message: string;
  options?: Array<{ id: string; label: string; icon: string }>;
  back?: boolean;
}

const CHATBOT_TOPICS: Record<TopicId, Topic> = {
  main: {
    message: "Hi! I'm OrangeCat's assistant. What would you like help with?",
    options: [
      { id: 'evaluate', label: 'How to evaluate projects', icon: '🔍' },
      { id: 'profile', label: 'Setting up my profile', icon: '👤' },
      { id: 'project', label: 'Creating a project', icon: '🚀' },
      { id: 'bitcoin', label: 'Bitcoin & Wallets', icon: '₿' },
    ],
  },
  evaluate: {
    message:
      'When evaluating a project, look for:\n\n✓ High Transparency Score\n✓ Regular updates\n✓ Clear Bitcoin addresses\n✓ Detailed description\n✓ Complete creator profile\n\nAlways do your own research!',
    back: true,
  },
  profile: {
    message:
      'To create a strong profile:\n\n1. Add a clear photo\n2. Write a detailed bio\n3. Add your Bitcoin wallet\n4. Complete transparency fields\n5. Link social media\n\nHigher transparency = more trust!',
    back: true,
  },
  project: {
    message:
      'To create a successful project:\n\n1. Clear, compelling description\n2. Realistic funding goals\n3. Images/videos of your work\n4. Regular updates\n5. Transparent fund usage\n6. Respond to questions\n\nAuthenticity is key!',
    back: true,
  },
  bitcoin: {
    message:
      'Bitcoin powers OrangeCat funding!\n\n• Direct transactions\n• No platform fees\n• You control your funds\n• Use a secure wallet\n• Never share private keys\n\nCheck our Bitcoin Wallet Guide!',
    back: true,
  },
};

export function SimpleChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentTopic, setCurrentTopic] = useState<TopicId>('main');
  const chatRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (chatRef.current && !chatRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleTopicSelect = (topicId: string) => {
    setCurrentTopic(topicId as TopicId);
  };

  const handleBack = () => {
    setCurrentTopic('main');
  };

  const handleClose = () => {
    setIsOpen(false);
    // Reset to main after close animation
    setTimeout(() => setCurrentTopic('main'), 300);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg flex items-center justify-center text-white transition-all hover:scale-110"
        aria-label="Open chat assistant"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  const topic = CHATBOT_TOPICS[currentTopic];

  return (
    <div
      ref={chatRef}
      className="fixed bottom-6 left-6 z-50 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl">
        <div className="flex items-center gap-2">
          {topic.back && (
            <button
              onClick={handleBack}
              className="p-1.5 hover:bg-white/50 rounded-lg transition-colors mr-1"
              aria-label="Go back"
            >
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
          )}
          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">OrangeCat Assistant</h3>
            <p className="text-xs text-gray-600">One-tap help</p>
          </div>
        </div>
        <button
          onClick={handleClose}
          className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          aria-label="Close chat"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Message */}
        <div className="mb-6">
          <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-2xl whitespace-pre-line text-sm">
            {topic.message}
          </div>
        </div>

        {/* Quick Action Buttons */}
        {topic.options && (
          <div className="space-y-2">
            {topic.options.map(option => (
              <button
                key={option.id}
                onClick={() => handleTopicSelect(option.id)}
                className="w-full text-left px-4 py-3 bg-white border-2 border-gray-200 hover:border-orange-500 hover:bg-orange-50 rounded-xl transition-all flex items-center gap-3 group"
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                  {option.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Back Button for Detail Pages */}
        {topic.back && (
          <button
            onClick={handleBack}
            className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to menu
          </button>
        )}
      </div>
    </div>
  );
}
