'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Key, Loader2, Sparkles } from 'lucide-react';
import { fetchImageGenCapability, generateImage } from '@/services/images/generate-client';
import type { StockImage } from '@/services/images/types';
import { ROUTES } from '@/config/routes';
import { getAIProvider } from '@/data/aiProviders';

/**
 * BYOK image generation panel for the shared image picker. Probes capability
 * on open; without an image-capable key it shows a Settings → AI pointer
 * instead of a dead form. Generation runs on the user's own key only.
 */
export default function ImageGeneratePanel({
  initialPrompt = '',
  onPick,
}: {
  initialPrompt?: string;
  onPick: (image: StockImage) => void;
}) {
  const [capability, setCapability] = useState<{
    canGenerate: boolean;
    provider: string | null;
  } | null>(null);
  const [prompt, setPrompt] = useState(initialPrompt.slice(0, 300));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ url: string; prompt: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchImageGenCapability().then(cap => {
      if (!cancelled) {
        setCapability(cap);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleGenerate() {
    const trimmed = prompt.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const generated = await generateImage(trimmed);
      setResult({ url: generated.url, prompt: trimmed });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate an image. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  if (capability === null) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-sm text-fg-tertiary">
        <Loader2 className="h-4 w-4 animate-spin" />
        Checking your AI keys…
      </div>
    );
  }

  if (!capability.canGenerate) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <Sparkles className="h-6 w-6 text-fg-tertiary" />
        <p className="max-w-xs text-sm text-fg-secondary">
          Image generation runs on your own AI key — the free OrangeCat pool is text-only.
        </p>
        <Link
          href={ROUTES.SETTINGS_AI}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent-warm px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-warm/90"
        >
          <Key className="h-3.5 w-3.5" />
          Add a key (OpenRouter, OpenAI, or xAI)
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <textarea
        value={prompt}
        onChange={e => setPrompt(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Describe the image you want…"
        aria-label="Image prompt"
        disabled={busy}
        className="w-full rounded-md border border-default bg-surface-page px-3 py-2 text-sm text-fg-primary placeholder:text-fg-tertiary focus:border-accent-warm focus:outline-none disabled:opacity-50"
      />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!prompt.trim() || busy}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent-warm px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-accent-warm/90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {busy ? 'Generating… ~30s' : result ? 'Generate again' : 'Generate'}
        </button>
        {error && <span className="text-xs text-status-negative">{error}</span>}
      </div>

      {result && !busy && (
        <div className="space-y-2">
          {/* eslint-disable-next-line @next/next/no-img-element -- freshly generated, stored on our own storage host */}
          <img
            src={result.url}
            alt={result.prompt}
            className="max-h-64 w-auto max-w-full rounded-md border border-subtle object-contain"
          />
          <button
            type="button"
            onClick={() =>
              onPick({
                id: `gen-${Date.now()}`,
                thumbUrl: result.url,
                fullUrl: result.url,
                title: result.prompt,
                creator: null,
                license: 'ai-generated',
                sourceUrl: null,
              })
            }
            className="inline-flex items-center gap-1.5 rounded-md border border-default px-3 py-1.5 text-sm font-medium text-fg-primary transition-colors hover:bg-surface-raised"
          >
            Use this image
          </button>
        </div>
      )}

      <p className="text-2xs text-fg-tertiary">
        Generated with your own{' '}
        {getAIProvider(capability.provider ?? '')?.name ?? capability.provider} key and labeled
        AI-generated.
      </p>
    </div>
  );
}
