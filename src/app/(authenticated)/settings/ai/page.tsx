'use client';

/**
 * /settings/ai — three-mode AI configuration page.
 *
 * Layout matches the freedom architecture: Managed (default, free with cap),
 * Bring Your Own Key (any provider, you pay them directly), and Local (run
 * inference on your own machine). Each mode is presented as an honest card
 * with real status, not a tier picker.
 *
 * Drops the AIModelPreferences tier picker (decorative — auto-router picks
 * the best free model already), the AIUsageStats panel (the QuotaMeter chip
 * in /dashboard/cat shows the same number with less ceremony), and the
 * right-sidebar guidance (added noise).
 */

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, Check, Server, Terminal, AlertCircle } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { CAT_FRONTIER_MODELS_OR } from '@/config/cat-plans';
import { useRequireAuth } from '@/hooks/useAuth';
import { useAISettings } from '@/hooks/useAISettings';
import Loading from '@/components/Loading';
import { AIKeyManager } from '@/components/ai/AIKeyManager';
import { CatCreditsPanel } from '@/components/ai/CatCreditsPanel';
import { CatMemoryManager } from '@/components/ai/CatMemoryManager';
import { CatMemoryImport } from '@/components/ai/CatMemoryImport';
import { getProvidersByCategory } from '@/data/aiProviders';

export default function AISettingsPage() {
  const { user, hydrated, isLoading: authLoading } = useRequireAuth();
  const [memoryReloadKey, setMemoryReloadKey] = useState(0);

  const {
    keys,
    preferences,
    isLoading: settingsLoading,
    hasByok,
    addKey,
    deleteKey,
    setPrimaryKey,
    reorderKeys,
  } = useAISettings();

  if (!hydrated || authLoading) {
    return <Loading fullScreen />;
  }
  if (!user) {
    return null;
  }

  const localProviders = getProvidersByCategory('local');

  return (
    <div className="min-h-screen bg-surface-page">
      <div className="border-b border-default bg-surface-base">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-4 px-4 sm:px-6 lg:px-8">
          <Link href={ROUTES.SETTINGS} className="text-fg-secondary hover:text-fg-primary">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <Bot className="h-6 w-6 text-fg-secondary" />
          <h1 className="text-xl font-semibold text-fg-primary">Cat AI</h1>
        </div>
      </div>

      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <p className="text-fg-primary">
          Cat works any of three ways. Pick whichever fits — they&apos;re all first-class. OrangeCat
          earns from platform activity, not from your AI bill.
        </p>

        {/* ── Managed ───────────────────────────────────────────────────── */}
        <section className="rounded-lg border border-default bg-surface-base p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-md bg-surface-raised p-2">
              <Bot className="h-5 w-5 text-fg-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-fg-primary">Use OrangeCat</h2>
                {!hasByok && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-status-positive/30 bg-status-positive-subtle px-2 py-0.5 text-xs font-medium text-status-positive">
                    <Check className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-fg-secondary">
                Free out of the box. OrangeCat picks the best open-source model on the free pool. No
                setup, no key, daily cap. See{' '}
                <Link href={ROUTES.PRICING} className="underline hover:no-underline">
                  pricing
                </Link>{' '}
                for the Pro option (coming soon — it&apos;s a waitlist for now).
              </p>
              <p className="mt-2 text-xs text-fg-tertiary">
                Capability: <span className="font-medium text-fg-secondary">Capable</span> — great
                for chat, drafting, and suggestions. Discovery, matchmaking, and multi-step tasks
                work best on a <span className="font-medium text-fg-secondary">frontier</span> model
                — add a {CAT_FRONTIER_MODELS_OR} key below to unlock them.
              </p>
            </div>
          </div>
        </section>

        {/* ── Cat Credits (pay with Bitcoin) ────────────────────────────── */}
        <CatCreditsPanel />

        {/* ── BYOK ──────────────────────────────────────────────────────── */}
        <section className="rounded-lg border border-default bg-surface-base p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-md bg-surface-raised p-2">
              <Server className="h-5 w-5 text-fg-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-fg-primary">Bring your own key</h2>
                {hasByok && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-status-positive/30 bg-status-positive-subtle px-2 py-0.5 text-xs font-medium text-status-positive">
                    <Check className="h-3 w-3" /> Active
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-fg-secondary">
                Use any provider — direct or aggregator. You pay them, OrangeCat never sees your
                bill. Want {CAT_FRONTIER_MODELS_OR}? Add an OpenRouter key — one key fronts all 200+
                models.
              </p>
            </div>
          </div>
          <AIKeyManager
            keys={keys}
            onAdd={addKey}
            onDelete={deleteKey}
            onSetPrimary={setPrimaryKey}
            onReorder={reorderKeys}
            platformPosition={preferences?.platform_chain_position ?? 0}
            isLoading={settingsLoading}
          />
        </section>

        {/* ── Memory ────────────────────────────────────────────────────── */}
        <CatMemoryManager reloadKey={memoryReloadKey} />

        {/* ── Import memory from another AI ──────────────────────────────── */}
        <CatMemoryImport onImported={() => setMemoryReloadKey(k => k + 1)} />

        {/* ── Local ─────────────────────────────────────────────────────── */}
        <section className="rounded-lg border border-default bg-surface-base p-6">
          <div className="mb-4 flex items-start gap-3">
            <div className="rounded-md bg-surface-raised p-2">
              <Terminal className="h-5 w-5 text-fg-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-fg-primary">Run locally</h2>
              <p className="mt-1 text-sm text-fg-secondary">
                Cat talks to a model running on your own machine. Nothing leaves the laptop. Free
                forever. Limited by your hardware (8B–70B models run on most laptops).
              </p>
            </div>
          </div>
          <div className="space-y-3">
            {localProviders.map(p => (
              <div
                key={p.id}
                className="flex items-start gap-3 rounded-md border border-subtle bg-surface-raised/30 p-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-fg-primary">{p.name}</p>
                    <span className="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface-page px-2 py-0.5 text-xs text-fg-secondary">
                      <AlertCircle className="h-3 w-3" /> Coming soon
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-fg-secondary">{p.description}</p>
                </div>
                <Link
                  href={p.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-fg-secondary underline hover:text-fg-primary"
                >
                  Learn more
                </Link>
              </div>
            ))}
            <p className="text-xs text-fg-secondary">
              Cat doesn&apos;t route to local endpoints yet. Wiring this is on the roadmap so the
              sovereignty path is real, not decorative.
            </p>
          </div>
        </section>

        {/* Privacy footnote */}
        <div className="rounded-md border border-subtle bg-surface-raised/30 p-4 text-sm text-fg-secondary">
          <p>
            <strong className="text-fg-primary">Privacy:</strong> keys are encrypted at rest, never
            logged, and stripped of whitespace before use. Cat chats save to your history; clear
            them anytime from the chat panel.
          </p>
        </div>
      </div>
    </div>
  );
}
