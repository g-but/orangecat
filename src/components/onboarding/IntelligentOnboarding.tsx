'use client';

/**
 * Intelligent Onboarding
 *
 * Collects a brief description of who the user is, then — instead of only
 * seeding a Cat conversation — runs the economic-agent chain synchronously
 * (POST /api/cat/offers-from-text → extract profile + generateOffers) and shows
 * concrete, typed offerings the user can create in one click. "Paste who you
 * are → get monetizable offerings." The Cat chat remains as a fallback.
 *
 * Created: 2026-01-22
 * Last Modified: 2026-07-28
 * Last Modified Summary: Add synchronous "see what Cat suggests" offer cards
 */

import { useState } from 'react';
import { Cat, ArrowRight, ArrowLeft, Sparkles, Plus, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { DictationButton } from '@/components/ui/DictationButton';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProfileService } from '@/services/profile';
import { logger } from '@/utils/logger';
import { API_ROUTES } from '@/config/api-routes';
import { ROUTES } from '@/config/routes';
import { FEATURES } from '@/config/features';
import { ONBOARDING_METHOD } from '@/config/onboarding';
import { ENTITY_REGISTRY } from '@/config/entity-registry';
import { useCatHealth } from '@/hooks/useCatHealth';
import { CatStatusNote } from '@/components/ai-chat/CatStatusNote';
import type { ProposedOffer } from '@/services/cat/offer-engine';

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
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [offers, setOffers] = useState<ProposedOffer[] | null>(null);
  const [genError, setGenError] = useState<string | null>(null);
  // When offers come back empty, the platform LLM being down produces the exact
  // same empty result as genuinely thin input — probe Cat's health to tell them
  // apart instead of blaming the user.
  const { health, probe } = useCatHealth();

  const canSubmit = description.trim().length > 0 && displayName.trim().length > 0;

  // Persist what we collected so Cat has context next session and the dashboard
  // greeting can stop saying "User". Shared by both actions below.
  const persistProfile = () => {
    if (!user?.id) {
      return;
    }
    ProfileService.fallbackProfileUpdate(user.id, {
      onboarding_completed: true,
      onboarding_method: ONBOARDING_METHOD.INTELLIGENT,
      name: displayName.trim(),
      bio: description.trim(),
    }).catch(err => {
      logger.error('Failed to mark intelligent onboarding complete', err, 'IntelligentOnboarding');
    });
  };

  // Primary path: turn the pasted description into concrete offerings right here.
  const handleSeeOffers = async () => {
    if (!canSubmit || isGenerating) {
      return;
    }
    setGenError(null);
    setIsGenerating(true);
    persistProfile();
    try {
      const res = await fetch(API_ROUTES.CAT.OFFERS_FROM_TEXT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: description.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data?.error || `Request failed (${res.status})`);
      }
      const list: ProposedOffer[] = Array.isArray(data.offers) ? data.offers : [];
      setOffers(list);
      // Empty could mean "AI is down", not "you gave me too little" — find out.
      if (list.length === 0) {
        void probe();
      }
    } catch (err) {
      logger.error('Failed to generate offers from onboarding', err, 'IntelligentOnboarding');
      setGenError('Could not generate suggestions right now — you can still chat with your Cat.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Fallback path: open the Cat chat with the description as the first message.
  const handleStartChat = () => {
    if (!canSubmit) {
      return;
    }
    setIsRedirecting(true);
    persistProfile();
    const params = new URLSearchParams({ q: description.trim() });
    router.push(`${ROUTES.DASHBOARD.CAT}?${params.toString()}`);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-page p-4">
      <div className="w-full max-w-lg">
        {/* Back navigation */}
        <button
          onClick={() => (offers ? setOffers(null) : router.back())}
          className="flex items-center gap-1.5 text-sm text-fg-secondary hover:text-fg-primary mb-6 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-md border border-subtle bg-surface-raised">
            <Cat className="h-8 w-8 text-fg-primary" />
          </div>
          {offers ? (
            <>
              <h1 className="text-2xl font-bold text-fg-primary mb-2">
                Here&apos;s what you could offer
              </h1>
              <p className="text-fg-secondary">
                Your Cat turned what you told it into ways to earn. Create any of them in one click
                — or refine them in a chat.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-fg-primary mb-2">Tell Cat who you are</h1>
              <p className="text-fg-secondary">
                Paste your bio, background, or a few lines about what you do. Cat will propose
                concrete ways to earn — and set them up.
              </p>
            </>
          )}
        </div>

        {offers ? (
          /* ---- Offers view ---- */
          <div className="space-y-4">
            {offers.length === 0 ? (
              <div className="rounded-md border border-subtle bg-surface-page p-6 text-center">
                {health && !health.catCanAnswer ? (
                  // Real cause: the AI layer is down, not thin input.
                  <CatStatusNote health={health} />
                ) : (
                  <>
                    <p className="text-fg-secondary mb-4">
                      Cat needs a little more to go on. Tell it more in a chat and it&apos;ll
                      suggest offerings as you talk.
                    </p>
                    <Button
                      onClick={handleStartChat}
                      disabled={isRedirecting}
                      className="bg-fg-primary text-fg-inverted hover:bg-fg-primary/90"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat with Cat
                    </Button>
                  </>
                )}
              </div>
            ) : (
              <>
                {offers.map((offer, i) => {
                  const meta = ENTITY_REGISTRY[offer.entityType];
                  if (!meta) {
                    return null;
                  }
                  const href = `${meta.createPath}?description=${encodeURIComponent(offer.description)}`;
                  return (
                    <div
                      key={`${offer.entityType}-${i}`}
                      data-testid="offer-card"
                      className="rounded-md border border-subtle bg-surface-page p-5"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-flex items-center rounded-full border border-default bg-surface-raised px-2.5 py-0.5 text-xs font-medium text-fg-primary">
                          {meta.name}
                        </span>
                      </div>
                      <p className="text-sm text-fg-primary mb-2">{offer.description}</p>
                      {offer.rationale && (
                        <p className="text-xs text-fg-tertiary mb-4">{offer.rationale}</p>
                      )}
                      <Link href={href}>
                        <Button
                          variant="accent"
                          size="sm"
                          className="w-full sm:w-auto"
                          data-testid="offer-create"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create this
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </div>
                  );
                })}
                <button
                  onClick={handleStartChat}
                  className="w-full text-center text-sm text-fg-secondary hover:text-fg-primary transition-colors py-2"
                >
                  Or refine these with your Cat in a chat →
                </button>
              </>
            )}
          </div>
        ) : (
          /* ---- Input view ---- */
          <div className="space-y-4 rounded-md border border-subtle bg-surface-page p-6">
            <Input
              data-testid="onboarding-display-name"
              label="What should Cat call you?"
              description="A name or alias — pseudonyms are fine."
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              placeholder="Satoshi"
              maxLength={100}
              required
            />

            <label className="block text-sm font-medium text-fg-primary">
              Who are you? What do you do?
            </label>

            <div className="flex items-start gap-2">
              <Textarea
                data-testid="onboarding-description"
                placeholder="e.g. Senior product designer, 10 years, ex-fintech. I also restore vintage bikes on weekends…"
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={4}
                className="w-full resize-none"
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    void handleSeeOffers();
                  }
                }}
              />
              {FEATURES.voiceInput && (
                <DictationButton
                  ariaLabel="Voice input"
                  size="sm"
                  onTranscript={t => setDescription(prev => (prev ? prev + ' ' : '') + t)}
                />
              )}
            </div>

            {/* Example prompts */}
            <div className="space-y-1">
              <p className="text-xs text-fg-tertiary font-medium uppercase tracking-wide">
                Examples
              </p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map(prompt => (
                  <button
                    key={prompt}
                    onClick={() => setDescription(prompt)}
                    className="rounded-sm border border-subtle px-3 py-1.5 text-left text-xs text-fg-secondary transition-colors hover:border-strong hover:bg-surface-raised hover:text-fg-primary"
                  >
                    {prompt.length > 50 ? prompt.slice(0, 50) + '…' : prompt}
                  </button>
                ))}
              </div>
            </div>

            {genError && <p className="text-sm text-status-negative">{genError}</p>}

            <Button
              data-testid="onboarding-see-offers"
              onClick={handleSeeOffers}
              disabled={!canSubmit || isGenerating}
              variant="accent"
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                  Reading you, finding offers…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  See what Cat suggests
                </>
              )}
            </Button>

            <button
              data-testid="onboarding-start-chat"
              onClick={handleStartChat}
              disabled={!canSubmit || isRedirecting}
              className="w-full text-center text-sm text-fg-secondary hover:text-fg-primary transition-colors py-1 disabled:opacity-50"
            >
              Or just chat with your Cat instead →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
