/**
 * LOCAL SETTINGS COMPONENT
 * Settings panel for local AI provider configuration
 */

import Button from '@/components/ui/Button';

interface LocalSettingsProps {
  localEnabled: boolean;
  setLocalEnabled: (enabled: boolean) => void;
  localProvider: 'ollama' | 'openai_compatible';
  setLocalProvider: (provider: 'ollama' | 'openai_compatible') => void;
  localBaseUrl: string;
  setLocalBaseUrl: (url: string) => void;
  localModel: string;
  setLocalModel: (model: string) => void;
  onSaveConfig: () => void;
  onTestHealth: () => void;
  // Client key
  clientKey: string;
  setClientKey: (key: string) => void;
  useClientKey: boolean;
  setUseClientKey: (use: boolean) => void;
  // Whisper
  whisperEnabled: boolean;
  setWhisperEnabled: (enabled: boolean) => void;
  whisperUrl: string;
  setWhisperUrl: (url: string) => void;
  whisperLang: string;
  setWhisperLang: (lang: string) => void;
}

export function LocalSettings({
  localEnabled,
  setLocalEnabled,
  localProvider,
  setLocalProvider,
  localBaseUrl,
  setLocalBaseUrl,
  localModel,
  setLocalModel,
  onSaveConfig,
  onTestHealth,
  clientKey,
  setClientKey,
  useClientKey,
  setUseClientKey,
  whisperEnabled,
  setWhisperEnabled,
  whisperUrl,
  setWhisperUrl,
  whisperLang,
  setWhisperLang,
}: LocalSettingsProps) {
  return (
    <div className="px-4 py-3 border-b bg-white flex flex-wrap items-center gap-3">
      <label className="text-sm text-gray-600">Enable Local</label>
      <input
        type="checkbox"
        checked={localEnabled}
        onChange={e => setLocalEnabled(e.target.checked)}
        onBlur={onSaveConfig}
      />
      <select
        className="border rounded-lg px-2 py-1 text-sm"
        value={localProvider}
        onChange={e => setLocalProvider(e.target.value as any)}
        onBlur={onSaveConfig}
      >
        <option value="ollama">Ollama</option>
        <option value="openai_compatible">OpenAI-compatible (LM Studio)</option>
      </select>
      <input
        className="border rounded-lg px-2 py-1 text-sm flex-1 min-w-[200px]"
        placeholder="Base URL (e.g., http://localhost:11434)"
        value={localBaseUrl}
        onChange={e => setLocalBaseUrl(e.target.value)}
        onBlur={onSaveConfig}
      />
      <input
        className="border rounded-lg px-2 py-1 text-sm"
        placeholder="Model (e.g., mistral)"
        value={localModel}
        onChange={e => setLocalModel(e.target.value)}
        onBlur={onSaveConfig}
      />
      <Button variant="outline" size="sm" onClick={onTestHealth}>
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
  );
}
