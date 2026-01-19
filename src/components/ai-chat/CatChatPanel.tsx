'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Button from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/badge';
import { ModelSelector, ModelBadge } from './ModelSelector';
import {
  Bot,
  Cat as CatIcon,
  Gift,
  Key,
  Loader2,
  PlusCircle,
  Mic,
  MicOff,
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { OPENROUTER_KEY_HEADER } from '@/config/http-headers';
import { readEventStream } from '@/lib/sse';
import { useRouter } from 'next/navigation';

type Role = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  created_at: string;
}

interface UserStatus {
  hasByok: boolean;
  freeMessagesPerDay: number;
  freeMessagesRemaining: number;
}

export function CatChatPanel() {
  const router = useRouter();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userStatus, setUserStatus] = useState<UserStatus | null>(null);
  const [lastModelUsed, setLastModelUsed] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const [showLocalSettings, setShowLocalSettings] = useState(false);
  const [localEnabled, setLocalEnabled] = useState(false);
  const [localProvider, setLocalProvider] = useState<'ollama' | 'openai_compatible'>('ollama');
  const [localBaseUrl, setLocalBaseUrl] = useState('http://localhost:11434');
  const [localModel, setLocalModel] = useState('mistral');
  const [localHealthy, setLocalHealthy] = useState<boolean | null>(null);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  // Local Whisper endpoint (optional)
  const [whisperEnabled, setWhisperEnabled] = useState(false);
  const [whisperUrl, setWhisperUrl] = useState('');
  const [whisperLang, setWhisperLang] = useState('en');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  // Client-provided BYOK (not stored)
  const [clientKey, setClientKey] = useState('');
  const [useClientKey, setUseClientKey] = useState(false);

  const scrollToEnd = useCallback(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToEnd();
  }, [messages, scrollToEnd]);

  // Load local provider settings
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cat_local_provider');
      if (raw) {
        const cfg = JSON.parse(raw);
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

  // Auto-detect local providers on first load to make local models usable without manual setup
  useEffect(() => {
    // Skip if already configured
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
        const res = await fetch(`${base.replace(/\/$/, '')}/v1/models`, { method: 'GET' });
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

  const saveLocalConfig = () => {
    const cfg = {
      enabled: localEnabled,
      provider: localProvider,
      baseUrl: localBaseUrl,
      model: localModel,
    };
    try {
      localStorage.setItem('cat_local_provider', JSON.stringify(cfg));
    } catch {}
  };

  const testLocalHealth = async () => {
    try {
      // For Ollama, try tags; for OpenAI-compatible, try models
      const url =
        localProvider === 'ollama'
          ? `${localBaseUrl.replace(/\/$/, '')}/api/tags`
          : `${localBaseUrl.replace(/\/$/, '')}/v1/models`;
      const res = await fetch(url, { method: 'GET' });
      setLocalHealthy(res.ok);
    } catch {
      setLocalHealthy(false);
    }
  };

  const clearChat = () => {
    setMessages([]);
    setError(null);
    setLastModelUsed(null);
  };

  const send = useCallback(async () => {
    const content = input.trim();
    if (!content || isLoading) {
      return;
    }
    setError(null);
    setInput('');

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    try {
      if (localEnabled) {
        // Direct call to local runtime from browser (requires local server with CORS)
        const tempAssistantId = `a-${Date.now()}`;
        setMessages(prev => [
          ...prev,
          {
            id: tempAssistantId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
          },
        ]);

        if (localProvider === 'ollama') {
          const res = await fetch(`${localBaseUrl.replace(/\/$/, '')}/api/chat`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: localModel,
              stream: true,
              messages: [
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content },
              ],
            }),
          });
          if (!res.ok || !res.body) {
            let msg = 'Local model error';
            try {
              const data = await res.json();
              msg = data?.error || msg;
            } catch {}
            throw new Error(msg);
          }
          await readEventStream(res.body, (evt: any) => {
            const e = evt as any;
            // Ollama streams JSONL like: { message: { content: '...' }, done: false }
            const chunk = e?.message?.content || '';
            if (chunk) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === tempAssistantId ? { ...m, content: (m.content || '') + chunk } : m
                )
              );
            }
          });
          setLastModelUsed(localModel);
        } else {
          // OpenAI-compatible (e.g., LM Studio)
          const res = await fetch(`${localBaseUrl.replace(/\/$/, '')}/v1/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer lm-studio' },
            body: JSON.stringify({
              model: localModel,
              messages: [
                ...messages.map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content },
              ],
              stream: true,
              temperature: 0.7,
            }),
          });
          if (!res.ok || !res.body) {
            let msg = 'Local model error';
            try {
              const data = await res.json();
              msg = data?.error?.message || msg;
            } catch {}
            throw new Error(msg);
          }
          await readEventStream(res.body, (evt: any) => {
            const e = evt as any;
            // OpenAI-compatible delta: choices[0].delta.content
            const delta = e?.choices?.[0]?.delta?.content || '';
            if (delta) {
              setMessages(prev =>
                prev.map(m =>
                  m.id === tempAssistantId ? { ...m, content: (m.content || '') + delta } : m
                )
              );
            }
          });
          setLastModelUsed(localModel);
        }
      } else {
        // Server-side OpenRouter path with streaming SSE for better UX
        const res = await fetch('/api/cat/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(useClientKey && clientKey ? { [OPENROUTER_KEY_HEADER]: clientKey } : {}),
          },
          body: JSON.stringify({
            message: content,
            model: selectedModel !== 'auto' ? selectedModel : undefined,
            stream: true,
          }),
        });
        if (!res.ok || !res.body) {
          let msg = 'Failed to get response';
          try {
            const data = await res.json();
            msg = data?.error || msg;
          } catch {}
          throw new Error(msg);
        }

        // Create a temporary assistant message we update incrementally
        const tempAssistantId = `a-${Date.now()}`;
        setMessages(prev => [
          ...prev,
          {
            id: tempAssistantId,
            role: 'assistant',
            content: '',
            created_at: new Date().toISOString(),
          },
        ]);

        await readEventStream(res.body, (json: any) => {
          if ((json as any)?.content) {
            setMessages(prev =>
              prev.map(m =>
                m.id === tempAssistantId
                  ? { ...m, content: (m.content || '') + (json as any).content }
                  : m
              )
            );
          }
          // Optionally handle usage json.usage and json.done here
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
      // revert optimistic user message on failure
      setMessages(prev => prev.filter(m => !m.id.startsWith('u-')));
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, selectedModel]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  };

  // Extract prefill for Service entity
  const buildServicePrefill = useCallback(() => {
    // Use the latest user message as description basis
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const description = lastUser?.content || '';
    // Heuristic title: first sentence or 60 chars
    let title = 'New Service';
    if (description) {
      const firstSentence = description.split(/\.|\n|\r/)[0]?.trim();
      title =
        firstSentence && firstSentence.length > 0 ? firstSentence.slice(0, 60) : 'New Service';
    }
    return {
      title,
      description,
      category: 'Other',
      service_location_type: 'remote',
    } as Record<string, unknown>;
  }, [messages]);

  const handleCreateService = () => {
    const prefill = buildServicePrefill();
    try {
      localStorage.setItem('service_prefill', JSON.stringify(prefill));
    } catch {}
    router.push('/dashboard/services/create?prefill=1');
  };

  const buildProductPrefill = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const description = lastUser?.content || '';
    let title = 'New Product';
    if (description) {
      const firstSentence = description.split(/[\.\n\r]/)[0]?.trim();
      title =
        firstSentence && firstSentence.length > 0 ? firstSentence.slice(0, 60) : 'New Product';
    }
    return {
      title,
      description,
      category: '',
      price: null,
      currency: undefined,
    } as Record<string, unknown>;
  }, [messages]);

  const buildProjectPrefill = useCallback(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const description = lastUser?.content || '';
    let title = 'New Project';
    if (description) {
      const firstSentence = description.split(/[\.\n\r]/)[0]?.trim();
      title =
        firstSentence && firstSentence.length > 0 ? firstSentence.slice(0, 60) : 'New Project';
    }
    return {
      title,
      description,
      funding_goal: null,
      currency: undefined,
    } as Record<string, unknown>;
  }, [messages]);

  const handleCreateProduct = () => {
    const prefill = buildProductPrefill();
    try {
      localStorage.setItem('product_prefill', JSON.stringify(prefill));
    } catch {}
    router.push('/dashboard/store/create?prefill=1');
  };

  const handleCreateProject = () => {
    const prefill = buildProjectPrefill();
    try {
      localStorage.setItem('project_prefill', JSON.stringify(prefill));
    } catch {}
    router.push('/dashboard/projects/create?prefill=1');
  };

  // Naive intent detection: check for keywords to suggest entity type
  const suggestEntities = useMemo(() => {
    const lastUser = [...messages].reverse().find(m => m.role === 'user');
    const text = (lastUser?.content || '').toLowerCase();
    const suggestions: Array<{
      type: 'service' | 'product' | 'project';
      label: string;
      action: () => void;
    }> = [];
    if (!text) {
      return suggestions;
    }
    if (/(offer|consult|service|hire|teach|coach|design|develop)/.test(text)) {
      suggestions.push({ type: 'service', label: 'Service', action: handleCreateService });
    }
    if (/(sell|buy|product|item|store|price)/.test(text)) {
      suggestions.push({ type: 'product', label: 'Product', action: handleCreateProduct });
    }
    if (/(raise|fund|project|campaign|goal|donat)/.test(text)) {
      suggestions.push({ type: 'project', label: 'Project', action: handleCreateProject });
    }
    return suggestions;
  }, [messages, handleCreateProduct, handleCreateProject]);

  const headerBadge = useMemo(() => {
    if (userStatus?.hasByok) {
      return (
        <Badge variant="secondary" className="bg-green-50 text-green-700 border-green-200">
          <Key className="h-3 w-3 mr-1" /> BYOK
        </Badge>
      );
    }
    if (userStatus) {
      return (
        <Badge variant="secondary" className="bg-amber-50 text-amber-700 border-amber-200">
          <Gift className="h-3 w-3 mr-1" />
          {userStatus.freeMessagesRemaining}/{userStatus.freeMessagesPerDay} free
        </Badge>
      );
    }
    return null;
  }, [userStatus]);

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200">
        <Avatar className="h-10 w-10">
          <AvatarImage src={undefined} />
          <AvatarFallback className="bg-orange-100 text-orange-600">
            <CatIcon className="h-5 w-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-gray-900 truncate">My Cat</h2>
            <Badge variant="secondary" className="bg-gray-50 text-gray-600 border-gray-200">
              Private — not saved
            </Badge>
            {headerBadge}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            {lastModelUsed && <ModelBadge modelId={lastModelUsed} />}
          </div>
        </div>

        {/* Local/Remote controls */}
        <div className="flex items-center gap-2">
          {localEnabled ? (
            <Badge
              variant="secondary"
              className={`border ${localHealthy ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : localHealthy === false ? 'bg-red-50 text-red-700 border-red-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
            >
              {localHealthy ? (
                <Wifi className="h-3 w-3 mr-1" />
              ) : localHealthy === false ? (
                <WifiOff className="h-3 w-3 mr-1" />
              ) : (
                <Wifi className="h-3 w-3 mr-1" />
              )}
              Local
            </Badge>
          ) : null}
          <button
            className="p-2 rounded-lg hover:bg-gray-100"
            onClick={() => setShowLocalSettings(s => !s)}
            title="Local model settings"
          >
            <SettingsIcon className="h-5 w-5 text-gray-600" />
          </button>
          {/* Model selector (remote path) */}
          {!localEnabled && (
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={setSelectedModel}
              size="sm"
              showPricing={true}
            />
          )}
        </div>
      </div>

      {/* Local settings */}
      {showLocalSettings && (
        <div className="px-4 py-3 border-b bg-white flex flex-wrap items-center gap-3">
          <label className="text-sm text-gray-600">Enable Local</label>
          <input
            type="checkbox"
            checked={localEnabled}
            onChange={e => {
              setLocalEnabled(e.target.checked);
            }}
            onBlur={saveLocalConfig}
          />
          <select
            className="border rounded-lg px-2 py-1 text-sm"
            value={localProvider}
            onChange={e => setLocalProvider(e.target.value as any)}
            onBlur={saveLocalConfig}
          >
            <option value="ollama">Ollama</option>
            <option value="openai_compatible">OpenAI-compatible (LM Studio)</option>
          </select>
          <input
            className="border rounded-lg px-2 py-1 text-sm flex-1 min-w-[200px]"
            placeholder="Base URL (e.g., http://localhost:11434)"
            value={localBaseUrl}
            onChange={e => setLocalBaseUrl(e.target.value)}
            onBlur={saveLocalConfig}
          />
          <input
            className="border rounded-lg px-2 py-1 text-sm"
            placeholder="Model (e.g., mistral)"
            value={localModel}
            onChange={e => setLocalModel(e.target.value)}
            onBlur={saveLocalConfig}
          />
          <Button variant="outline" size="sm" onClick={testLocalHealth}>
            Test
          </Button>
          <div className="text-sm text-gray-500">
            Local requests are sent directly from your browser to your local server.
          </div>
          {!localEnabled && (
            <>
              <div className="w-full h-px bg-gray-200 my-2" />
              <label className="text-sm text-gray-600">
                Client-provided OpenRouter key (not stored)
              </label>
              <input
                type="password"
                className="border rounded-lg px-2 py-1 text-sm min-w-[280px]"
                placeholder="sk-or-..."
                value={clientKey}
                onChange={e => setClientKey(e.target.value)}
              />
              <label className="text-sm text-gray-600 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useClientKey}
                  onChange={e => setUseClientKey(e.target.checked)}
                />{' '}
                Use client key for remote calls
              </label>
              <div className="text-xs text-gray-500">
                Key is kept in memory only for this session and sent only with your request.
              </div>
            </>
          )}
          <div className="w-full h-px bg-gray-200 my-2" />
          <label className="text-sm text-gray-600 flex items-center gap-2">
            <input
              type="checkbox"
              checked={whisperEnabled}
              onChange={e => setWhisperEnabled(e.target.checked)}
            />{' '}
            Use local Whisper endpoint (optional)
          </label>
          <input
            className="border rounded-lg px-2 py-1 text-sm min-w-[280px]"
            placeholder="http://localhost:8000/transcribe"
            value={whisperUrl}
            onChange={e => setWhisperUrl(e.target.value)}
          />
          <input
            className="border rounded-lg px-2 py-1 text-sm w-28"
            placeholder="lang (e.g., en)"
            value={whisperLang}
            onChange={e => setWhisperLang(e.target.value)}
          />
          <div className="text-xs text-gray-500">
            We will POST recorded audio to your endpoint and expect JSON <code>{'{ text }'}</code>.
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-600">
            <div className="h-12 w-12 rounded-full bg-orange-100 flex items-center justify-center mb-2">
              <Bot className="h-6 w-6 text-orange-600" />
            </div>
            <div className="font-medium">Start a private chat with your Cat</div>
            <div className="text-sm">Choose a model, ask anything. Nothing is saved.</div>
            {!localEnabled && localHealthy === false && (
              <div className="mt-6 max-w-lg text-left bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                <div className="font-semibold text-gray-800 mb-2">
                  Quickstart: Use a small local model (no API key)
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
                  Alternatively, run LM Studio and enable its local server (OpenAI-compatible API).
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map(m => (
              <div
                key={m.id}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${m.role === 'user' ? 'bg-orange-500 text-white' : 'bg-white border border-gray-200 text-gray-900'}`}
                >
                  <div className="whitespace-pre-wrap">{m.content}</div>
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
        )}
      </div>

      {/* Footer actions + input */}
      <div className="border-t bg-white p-3">
        {error && <div className="text-sm text-red-600 mb-2">{error}</div>}
        {suggestEntities.length > 0 && (
          <div className="flex items-center gap-2 mb-2 text-sm">
            <span className="text-gray-600">Suggested:</span>
            {suggestEntities.map(s => (
              <button
                key={s.type}
                onClick={s.action}
                className="px-2 py-1 rounded-lg border border-gray-200 hover:bg-gray-50"
              >
                Create {s.label}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCreateService} className="gap-2">
            <PlusCircle className="h-4 w-4" /> Create Service from chat
          </Button>
          <div className="flex-1 flex items-center gap-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your Cat..."
              disabled={isLoading}
            />
            {/* Mic: Web Speech API (browser) */}
            <button
              className={`p-2 rounded-lg ${listening ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100 text-gray-600'}`}
              title="Voice input"
              onClick={() => {
                const startWebSpeech = () => {
                  try {
                    const SpeechRecognition =
                      (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
                    if (!SpeechRecognition) {
                      setError('Speech recognition not supported by this browser.');
                      return;
                    }
                    if (listening) {
                      recognitionRef.current?.stop?.();
                      setListening(false);
                      return;
                    }
                    const recog = new SpeechRecognition();
                    recognitionRef.current = recog;
                    recog.lang = 'en-US';
                    recog.interimResults = false;
                    recog.onresult = (ev: any) => {
                      const transcript = ev.results?.[0]?.[0]?.transcript || '';
                      setInput(prev => (prev ? prev + ' ' : '') + transcript);
                    };
                    recog.onend = () => setListening(false);
                    recog.onerror = () => setListening(false);
                    setListening(true);
                    recog.start();
                  } catch (e) {
                    setError('Failed to start voice input');
                  }
                };

                const startWhisper = async () => {
                  if (!whisperUrl) {
                    setError('Set Whisper endpoint URL in settings.');
                    return;
                  }
                  try {
                    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                    const mr = new MediaRecorder(stream);
                    mediaRecorderRef.current = mr;
                    audioChunksRef.current = [];
                    mr.ondataavailable = e => {
                      if (e.data.size > 0) {
                        audioChunksRef.current.push(e.data);
                      }
                    };
                    mr.onstop = async () => {
                      setListening(false);
                      const blob = new Blob(audioChunksRef.current, {
                        type: mr.mimeType || 'audio/webm',
                      });
                      try {
                        const resp = await fetch(whisperUrl, {
                          method: 'POST',
                          headers: { Accept: 'application/json' },
                          body: blob,
                        });
                        const data = await resp.json();
                        if (!resp.ok) {
                          throw new Error(data?.error || 'Whisper error');
                        }
                        if (data?.text) {
                          setInput(prev => (prev ? prev + ' ' : '') + data.text);
                        }
                      } catch (err) {
                        setError(err instanceof Error ? err.message : 'Transcription failed');
                      }
                    };
                    setListening(true);
                    mr.start();
                    // Auto-stop after 10s
                    setTimeout(() => {
                      try {
                        if (mr.state !== 'inactive') {
                          mr.stop();
                        }
                      } catch {
                        // Ignore errors if recorder already stopped
                      }
                    }, 10000);
                  } catch (err) {
                    setError('Failed to access microphone');
                  }
                };

                if (whisperEnabled) {
                  // Toggle stop if already recording
                  if (
                    listening &&
                    mediaRecorderRef.current &&
                    mediaRecorderRef.current.state !== 'inactive'
                  ) {
                    try {
                      mediaRecorderRef.current.stop();
                    } catch {}
                    return;
                  }
                  void startWhisper();
                } else {
                  startWebSpeech();
                }
              }}
            >
              {listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
            </button>
            <Button onClick={() => void send()} disabled={!input.trim() || isLoading}>
              {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Send'}
            </Button>
            <Button variant="ghost" onClick={clearChat} disabled={messages.length === 0}>
              Clear
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CatChatPanel;
