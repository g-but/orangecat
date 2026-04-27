'use client';

/**
 * Intelligent Onboarding
 *
 * Collects a brief description from the user, marks onboarding complete,
 * then redirects to My Cat with the description pre-loaded as the first
 * message. The Cat handles all intelligent analysis — no keyword heuristics.
 *
 * Created: 2026-01-22
 * Last Modified: 2026-04-24
 * Last Modified Summary: Replace fake keyword-analysis with Cat redirect
 */

import { useState } from 'react';
import { Cat, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProfileService } from '@/services/profile';
import { logger } from '@/utils/logger';
import { ROUTES } from '@/config/routes';
import { ONBOARDING_METHOD } from './OnboardingFlow/constants';

const EXAMPLE_PROMPTS = [
  "I'm a freelance graphic designer looking to find clients and sell design templates",
  'I run a small community garden and want to raise funds for seeds and equipment',
  'I make handmade jewellery and want to start selling online',
  "I'm a musician who wants to fund an album and connect with fans",
  'I teach yoga and want to offer online classes and workshops',
  'My neighbourhood needs a community space — I want to fundraise and organise it',
];

export default function IntelligentOnboarding() {
  const router = useRouter();
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);

  const handleStartChat = async () => {
    if (!description.trim()) {
      return;
    }
    setIsRedirecting(true);

    // Mark onboarding complete in the background — don't block the redirect
    if (user?.id) {
      ProfileService.fallbackProfileUpdate(user.id, {
        onboarding_completed: true,
        onboarding_method: ONBOARDING_METHOD.INTELLIGENT,
      }).catch(err => {
        logger.error(
          'Failed to mark intelligent onboarding complete',
          err,
          'IntelligentOnboarding'
        );
      });
    }

    // Send the user to My Cat with their description as the first message
    const params = new URLSearchParams({ q: description.trim() });
    router.push(`${ROUTES.DASHBOARD.CAT}?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-tiffany-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Back navigation */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-md">
            <Cat className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Meet My Cat</h1>
          <p className="text-gray-600">
            Tell My Cat what you&apos;re trying to do — it will suggest the right tools and help you
            get set up in minutes.
          </p>
        </div>

        {/* Input */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-4">
          <label className="block text-sm font-medium text-gray-700">
            What are you here to do?
          </label>

          <div className="flex items-start gap-2">
            <Textarea
              data-testid="onboarding-description"
              placeholder="e.g. I'm a photographer looking to sell prints and offer portrait sessions…"
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={4}
              className="w-full resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  void handleStartChat();
                }
              }}
            />
            {process.env.NEXT_PUBLIC_FEATURE_VOICE_INPUT === 'true' && (
              <VoiceInputButton
                ariaLabel="Voice input"
                size="sm"
                onTranscript={t => setDescription(prev => (prev ? prev + ' ' : '') + t)}
              />
            )}
          </div>

          {/* Example prompts */}
          <div className="space-y-1">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Examples</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLE_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => setDescription(prompt)}
                  className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50 transition-colors text-left"
                >
                  {prompt.length > 50 ? prompt.slice(0, 50) + '…' : prompt}
                </button>
              ))}
            </div>
          </div>

          <Button
            data-testid="onboarding-start-chat"
            onClick={handleStartChat}
            disabled={!description.trim() || isRedirecting}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
          >
            {isRedirecting ? (
              <>
                <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                Starting your conversation…
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4 mr-2" />
                Chat with My Cat
              </>
            )}
          </Button>

          <p className="text-xs text-center text-gray-400">
            My Cat will ask follow-up questions and suggest the right setup for your situation
          </p>
        </div>
      </div>
    </div>
  );
}
