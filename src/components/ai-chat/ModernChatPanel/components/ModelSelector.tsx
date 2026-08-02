/**
 * MODEL SELECTOR
 *
 * Shows ONLY models the signed-in user can actually use, from the access SSOT
 * (`useAvailableModels` → `/api/user/available-models`): the free pool always,
 * plus frontier models served by their Cat Credits or their own key. Real models
 * they can't reach yet are listed as disabled "unlock" rows — never fake-enabled.
 * The custom-model input appears only when a verified OpenRouter key makes any
 * model id reachable. While loading / signed out, it falls back to the free pool
 * so it is never empty.
 */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { getFreeModels } from '@/config/ai-models';
import { useAvailableModels } from '@/hooks/useAvailableModels';
import type { ModelAccessSource, UsableModel } from '@/services/cat/model-access';
import { Sparkles, ChevronDown, Check, ArrowRight, Lock, Laptop } from 'lucide-react';
import { makeLocalModelId, parseLocalModelId } from '@/config/local-ai';
import { probeAllLocalRuntimesCached, type LocalRuntimeStatus } from '@/services/ai/local-runtime';

interface ModelSelectorProps {
  selectedModel: string;
  onSelect: (model: string) => void;
  disabled?: boolean;
  /** Open the menu upward — for use at the bottom-anchored composer. */
  openUp?: boolean;
  /** Ghost trigger (no border/fill) so it reads as part of the composer bar. */
  subtle?: boolean;
}

const SOURCE_LABEL: Record<ModelAccessSource, string> = {
  free: 'Free',
  credits: 'Frontier · your credits',
  byok: 'Frontier · your key',
};
const SOURCE_ORDER: ModelAccessSource[] = ['free', 'byok', 'credits'];

export function ModelSelector({
  selectedModel,
  onSelect,
  disabled,
  openUp,
  subtle,
}: ModelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [customModel, setCustomModel] = useState('');
  const [localStatuses, setLocalStatuses] = useState<LocalRuntimeStatus[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { access, loading } = useAvailableModels();

  // Fallback to the free pool until access resolves, so the menu is never empty.
  const usable: UsableModel[] =
    access?.models ??
    getFreeModels().map(m => ({
      id: m.id,
      name: m.name,
      provider: m.provider,
      tier: m.tier,
      contextWindow: m.contextWindow,
      capabilities: m.capabilities,
      source: 'free' as const,
    }));
  const locked = access?.locked ?? [];
  const allowsCustom = access?.allowsCustomModel ?? false;

  const grouped = SOURCE_ORDER.map(source => ({
    source,
    models: usable.filter(m => m.source === source),
  })).filter(g => g.models.length > 0);

  const selectedLocal = parseLocalModelId(selectedModel);
  const selectedName =
    selectedModel === 'auto'
      ? 'Auto (Best Free)'
      : selectedLocal
        ? selectedLocal.model
        : (usable.find(m => m.id === selectedModel)?.name ?? selectedModel);

  const applyCustom = () => {
    const id = customModel.trim();
    if (!id) {
      return;
    }
    onSelect(id);
    setCustomModel('');
    setIsOpen(false);
  };

  // Detect models on THIS machine when the menu opens (probe is cached, so
  // reopening doesn't hammer localhost). No runtime → the group just absent.
  useEffect(() => {
    if (!isOpen) {
      return;
    }
    let cancelled = false;
    void probeAllLocalRuntimesCached().then(statuses => {
      if (!cancelled) {
        setLocalStatuses(statuses.filter(s => s.reachable && s.models.length > 0));
      }
    });
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'flex items-center gap-1.5 rounded-md text-sm transition-colors',
          subtle
            ? 'px-2 py-1 text-fg-secondary hover:bg-surface-raised hover:text-fg-primary'
            : 'border border-subtle bg-surface-raised px-3 py-1.5 hover:bg-surface-raised/80',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Sparkles className="h-4 w-4 text-fg-secondary" />
        <span
          className={cn('max-w-[120px] truncate', subtle ? 'text-fg-secondary' : 'text-fg-primary')}
        >
          {selectedName}
        </span>
        <ChevronDown
          className={cn('h-4 w-4 text-fg-tertiary transition-transform', isOpen && 'rotate-180')}
        />
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute left-0 z-50 max-h-80 w-72 max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-md border border-subtle bg-surface-modal py-2 shadow-sm',
            openUp ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
        >
          <button
            onClick={() => {
              onSelect('auto');
              setIsOpen(false);
            }}
            className={cn(
              'flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-raised',
              selectedModel === 'auto' && 'bg-surface-raised'
            )}
          >
            <div className="flex-1">
              <div className="font-medium text-fg-primary flex items-center gap-2">
                Auto (Best Free)
                {selectedModel === 'auto' && <Check className="h-4 w-4 text-fg-primary" />}
              </div>
              <div className="text-xs text-fg-secondary">Automatically selects the best model</div>
            </div>
          </button>

          {grouped.map(group => (
            <div key={group.source}>
              <div className="h-px bg-border-subtle my-1" />
              <div className="px-3 py-1.5 text-xs font-medium text-fg-secondary uppercase">
                {SOURCE_LABEL[group.source]}
              </div>
              {group.models.map(model => (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelect(model.id);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-raised',
                    selectedModel === model.id && 'bg-surface-raised'
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-fg-primary flex items-center gap-2 truncate">
                      {model.name}
                      {selectedModel === model.id && (
                        <Check className="h-4 w-4 flex-shrink-0 text-fg-primary" />
                      )}
                    </div>
                    <div className="text-xs text-fg-secondary truncate">{model.provider}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}

          {localStatuses.length > 0 && (
            <>
              <div className="h-px bg-border-subtle my-1" />
              <div className="px-3 py-1.5 text-xs font-medium text-fg-secondary uppercase">
                On this computer · private
              </div>
              {localStatuses.flatMap(status =>
                status.models.map(model => {
                  const id = makeLocalModelId(status.runtime.id, model);
                  return (
                    <button
                      key={id}
                      onClick={() => {
                        onSelect(id);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-raised',
                        selectedModel === id && 'bg-surface-raised'
                      )}
                    >
                      <Laptop className="h-3.5 w-3.5 flex-shrink-0 text-fg-tertiary" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-fg-primary flex items-center gap-2 truncate">
                          {model}
                          {selectedModel === id && (
                            <Check className="h-4 w-4 flex-shrink-0 text-fg-primary" />
                          )}
                        </div>
                        <div className="text-xs text-fg-secondary truncate">
                          {status.runtime.name} · replies never leave this machine
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </>
          )}

          {locked.length > 0 && (
            <>
              <div className="h-px bg-border-subtle my-1" />
              <div className="px-3 py-1.5 text-xs font-medium text-fg-secondary uppercase">
                Locked
              </div>
              {locked.map(model => (
                <div
                  key={model.id}
                  className="flex w-full items-center gap-3 px-4 py-2 text-left opacity-60"
                >
                  <Lock className="h-3.5 w-3.5 flex-shrink-0 text-fg-tertiary" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-fg-secondary truncate">{model.name}</div>
                    <div className="text-xs text-fg-tertiary truncate">{model.provider}</div>
                  </div>
                </div>
              ))}
              <Link
                href="/settings/ai"
                className="block px-4 py-1.5 text-xs text-accent-warm hover:underline"
                onClick={() => setIsOpen(false)}
              >
                Add credits or connect a key to unlock →
              </Link>
            </>
          )}

          {allowsCustom && (
            <>
              <div className="h-px bg-border-subtle my-1" />
              <div className="px-3 py-1.5 text-xs font-medium text-fg-secondary uppercase">
                Custom model
              </div>
              <div className="px-3 pb-2">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={customModel}
                    onChange={e => setCustomModel(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        applyCustom();
                      }
                    }}
                    placeholder="e.g. anthropic/claude-sonnet-5"
                    className="min-w-0 flex-1 rounded-md border border-subtle bg-surface-base px-2 py-1.5 text-sm text-fg-primary placeholder:text-fg-tertiary"
                    aria-label="Custom model id"
                  />
                  <button
                    type="button"
                    onClick={applyCustom}
                    disabled={!customModel.trim()}
                    aria-label="Use custom model"
                    className="flex h-8 w-8 items-center justify-center rounded-md border border-subtle text-fg-secondary hover:bg-surface-raised disabled:opacity-40"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <p className="mt-1 text-xs text-fg-tertiary">
                  Any model id — your OpenRouter key routes it (Settings → AI).
                </p>
              </div>
            </>
          )}
          {loading && !access && (
            <div className="px-4 py-1.5 text-xs text-fg-tertiary">Checking your models…</div>
          )}
        </div>
      )}
    </div>
  );
}
