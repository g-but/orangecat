/**
 * USE LOCAL PROVIDER HOOK
 * Manages local AI provider settings (Ollama, LM Studio)
 */

import { useCallback, useEffect, useState } from 'react';
import type { LocalProviderConfig } from '../types';

const STORAGE_KEY = 'cat_local_provider';

export function useLocalProvider() {
  const [localEnabled, setLocalEnabled] = useState(false);
  const [localProvider, setLocalProvider] = useState<'ollama' | 'openai_compatible'>('ollama');
  const [localBaseUrl, setLocalBaseUrl] = useState('http://localhost:11434');
  const [localModel, setLocalModel] = useState('mistral');
  const [localHealthy, setLocalHealthy] = useState<boolean | null>(null);

  // Load settings from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const cfg: LocalProviderConfig = JSON.parse(raw);
        setLocalEnabled(!!cfg.enabled);
        if (cfg.provider) {
          setLocalProvider(cfg.provider);
        }
        if (cfg.baseUrl) {
          setLocalBaseUrl(cfg.baseUrl);
        }
        if (cfg.model) {
          setLocalModel(cfg.model);
        }
      }
    } catch {}
  }, []);

  // Auto-detect local providers on first load
  useEffect(() => {
    if (localEnabled) {
      return;
    }

    const tryDetect = async () => {
      // Try Ollama
      try {
        const url = 'http://localhost:11434/api/tags';
        const res = await fetch(url, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          const first = data?.models?.[0]?.name || 'mistral';
          setLocalProvider('ollama');
          setLocalBaseUrl('http://localhost:11434');
          setLocalModel(first);
          setLocalEnabled(true);
          setLocalHealthy(true);
          return;
        }
      } catch {}

      // Try LM Studio (OpenAI-compatible)
      try {
        const base = 'http://localhost:1234';
        const res = await fetch(`${base}/v1/models`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          const first = data?.data?.[0]?.id || 'mistral';
          setLocalProvider('openai_compatible');
          setLocalBaseUrl(base);
          setLocalModel(first);
          setLocalEnabled(true);
          setLocalHealthy(true);
          return;
        }
      } catch {}

      setLocalHealthy(false);
    };

    void tryDetect();
  }, [localEnabled]);

  const saveConfig = useCallback(() => {
    const cfg: LocalProviderConfig = {
      enabled: localEnabled,
      provider: localProvider,
      baseUrl: localBaseUrl,
      model: localModel,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    } catch {}
  }, [localEnabled, localProvider, localBaseUrl, localModel]);

  const testHealth = useCallback(async () => {
    try {
      const url =
        localProvider === 'ollama'
          ? `${localBaseUrl.replace(/\/$/, '')}/api/tags`
          : `${localBaseUrl.replace(/\/$/, '')}/v1/models`;
      const res = await fetch(url, { method: 'GET' });
      setLocalHealthy(res.ok);
    } catch {
      setLocalHealthy(false);
    }
  }, [localProvider, localBaseUrl]);

  return {
    localEnabled,
    setLocalEnabled,
    localProvider,
    setLocalProvider,
    localBaseUrl,
    setLocalBaseUrl,
    localModel,
    setLocalModel,
    localHealthy,
    saveConfig,
    testHealth,
  };
}
