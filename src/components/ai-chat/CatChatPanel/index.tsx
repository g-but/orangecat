'use client';

/**
 * CAT CHAT PANEL (REFACTORED)
 *
 * Legacy chat component with local model support, voice input, and entity prefill.
 * Split into smaller subcomponents and hooks for maintainability.
 */

import { useCallback, useState } from 'react';

import { useLocalProvider, useVoiceInput, useChatState, useEntityPrefill } from './hooks';
import { ChatHeader, LocalSettings, MessageList, ChatFooter } from './components';
import type { UserStatus } from './types';

export function CatChatPanel() {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('auto');
  const [showLocalSettings, setShowLocalSettings] = useState(false);
  const [_userStatus, _setUserStatus] = useState<UserStatus | null>(null);

  // Client-provided BYOK (not stored)
  const [clientKey, setClientKey] = useState('');
  const [useClientKey, setUseClientKey] = useState(false);

  // Local provider hook
  const {
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
  } = useLocalProvider();

  // Chat state hook
  const { messages, isLoading, error, setError, lastModelUsed, endRef, clearChat, sendMessage } =
    useChatState({
      selectedModel,
      localEnabled,
      localProvider,
      localBaseUrl,
      localModel,
      useClientKey,
      clientKey,
    });

  // Voice input hook
  const {
    listening,
    whisperEnabled,
    setWhisperEnabled,
    whisperUrl,
    setWhisperUrl,
    whisperLang,
    setWhisperLang,
    toggleVoiceInput,
  } = useVoiceInput({
    onTranscript: (text: string) => {
      setInput(prev => (prev ? prev + ' ' : '') + text);
    },
    onError: setError,
  });

  // Entity prefill hook
  const { handleCreateService, suggestEntities } = useEntityPrefill(messages);

  // Send handler
  const handleSend = useCallback(() => {
    const content = input.trim();
    if (content) {
      setInput('');
      void sendMessage(content);
    }
  }, [input, sendMessage]);

  return (
    <div className="flex flex-col h-full bg-gray-50 rounded-2xl overflow-hidden border border-gray-200">
      {/* Header */}
      <ChatHeader
        userStatus={_userStatus}
        lastModelUsed={lastModelUsed}
        localEnabled={localEnabled}
        localHealthy={localHealthy}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
        onSettingsClick={() => setShowLocalSettings(s => !s)}
      />

      {/* Local settings */}
      {showLocalSettings && (
        <LocalSettings
          localEnabled={localEnabled}
          setLocalEnabled={setLocalEnabled}
          localProvider={localProvider}
          setLocalProvider={setLocalProvider}
          localBaseUrl={localBaseUrl}
          setLocalBaseUrl={setLocalBaseUrl}
          localModel={localModel}
          setLocalModel={setLocalModel}
          onSaveConfig={saveConfig}
          onTestHealth={testHealth}
          clientKey={clientKey}
          setClientKey={setClientKey}
          useClientKey={useClientKey}
          setUseClientKey={setUseClientKey}
          whisperEnabled={whisperEnabled}
          setWhisperEnabled={setWhisperEnabled}
          whisperUrl={whisperUrl}
          setWhisperUrl={setWhisperUrl}
          whisperLang={whisperLang}
          setWhisperLang={setWhisperLang}
        />
      )}

      {/* Messages */}
      <MessageList
        messages={messages}
        isLoading={isLoading}
        endRef={endRef}
        localEnabled={localEnabled}
        localHealthy={localHealthy}
      />

      {/* Footer */}
      <ChatFooter
        error={error}
        suggestEntities={suggestEntities}
        input={input}
        setInput={setInput}
        isLoading={isLoading}
        listening={listening}
        messagesCount={messages.length}
        onSend={handleSend}
        onClear={clearChat}
        onCreateService={handleCreateService}
        onVoiceInput={toggleVoiceInput}
      />
    </div>
  );
}

export default CatChatPanel;
