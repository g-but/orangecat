'use client';

/**
 * "Run locally" — live detection panel for local AI runtimes.
 *
 * Probes Ollama / LM Studio on the user's machine from the BROWSER (our
 * server can never reach a user's localhost) and shows the honest state:
 *   detected → green, lists installed models, "pick one in any Cat chat";
 *   not detected → the exact download link + copy-paste start command
 *     (including the CORS origin flag) that makes it work.
 * No decorative "coming soon" — either it works or the fix is one command.
 */

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, ClipboardCopy, RefreshCw, XCircle } from 'lucide-react';
import { LOCAL_RUNTIMES } from '@/config/local-ai';
import { probeAllLocalRuntimes, type LocalRuntimeStatus } from '@/services/ai/local-runtime';

export function LocalRuntimePanel() {
  const [statuses, setStatuses] = useState<LocalRuntimeStatus[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      setStatuses(await probeAllLocalRuntimes());
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void check();
  }, [check]);

  const copySetup = async (id: string, command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* clipboard unavailable — the command is visible to copy manually */
    }
  };

  const anyDetected = statuses?.some(s => s.reachable) ?? false;

  return (
    <div className="space-y-3">
      {(statuses ?? LOCAL_RUNTIMES.map(runtime => ({ runtime, reachable: false, models: [] }))).map(
        ({ runtime, reachable, models }) => (
          <div
            key={runtime.id}
            className="rounded-md border border-subtle bg-surface-raised/30 p-3"
          >
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-fg-primary">{runtime.name}</p>
                  {statuses &&
                    (reachable ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-status-positive/30 bg-status-positive/10 px-2 py-0.5 text-xs text-status-positive">
                        <Check className="h-3 w-3" /> Detected · {models.length}{' '}
                        {models.length === 1 ? 'model' : 'models'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-subtle bg-surface-page px-2 py-0.5 text-xs text-fg-secondary">
                        <XCircle className="h-3 w-3" /> Not detected
                      </span>
                    ))}
                </div>
                <p className="mt-0.5 text-sm text-fg-secondary">{runtime.description}</p>

                {reachable && models.length > 0 && (
                  <p className="mt-1.5 text-xs text-fg-secondary">
                    Installed:{' '}
                    <span className="font-mono text-fg-primary">{models.join(', ')}</span>
                  </p>
                )}

                {statuses && !reachable && (
                  <div className="mt-2 space-y-1.5">
                    <p className="text-xs text-fg-secondary">
                      1 ·{' '}
                      <Link
                        href={runtime.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-fg-primary"
                      >
                        Install {runtime.name}
                      </Link>{' '}
                      · 2 · start it with OrangeCat allowed:
                    </p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 overflow-x-auto rounded bg-surface-page px-2 py-1.5 font-mono text-xs text-fg-primary">
                        {runtime.corsSetup}
                      </code>
                      <button
                        type="button"
                        onClick={() => void copySetup(runtime.id, runtime.corsSetup)}
                        className="inline-flex items-center gap-1 rounded-md border border-subtle px-2 py-1.5 text-xs text-fg-secondary hover:text-fg-primary"
                        title="Copy command"
                      >
                        <ClipboardCopy className="h-3.5 w-3.5" />
                        {copied === runtime.id ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-fg-secondary">
          {anyDetected
            ? 'Ready — pick a local model from the model menu in any Cat chat. Replies stream from this machine; no provider sees them.'
            : 'Once a runtime is running with OrangeCat allowed, hit Check again — your models appear in the Cat chat model menu.'}
        </p>
        <button
          type="button"
          onClick={() => void check()}
          disabled={checking}
          className="inline-flex items-center gap-1.5 rounded-md border border-subtle px-2.5 py-1.5 text-xs font-medium text-fg-secondary hover:text-fg-primary disabled:opacity-50"
        >
          <RefreshCw className={checking ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
          Check again
        </button>
      </div>
    </div>
  );
}
