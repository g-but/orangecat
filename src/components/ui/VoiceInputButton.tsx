'use client';

import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff } from 'lucide-react';

// Web Speech API types (not in default TypeScript lib)
interface SpeechRecognitionResult {
  readonly transcript: string;
  readonly confidence: number;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult[];
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: Event) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInstance;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface VoiceInputButtonProps {
  onTranscript: (text: string) => void;
  lang?: string;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

export function VoiceInputButton({
  onTranscript,
  lang = 'en-US',
  size = 'md',
  className = '',
  disabled = false,
  ariaLabel = 'Voice input',
}: VoiceInputButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  useEffect(() => {
    try {
      const has =
        typeof window !== 'undefined' &&
        (window.webkitSpeechRecognition || window.SpeechRecognition);
      setSupported(!!has);
    } catch {
      setSupported(false);
    }
  }, []);

  const start = () => {
    if (!supported || listening || disabled) {
      return;
    }
    try {
      const SR = window.webkitSpeechRecognition || window.SpeechRecognition;
      if (!SR) {
        return;
      }
      const recog = new SR();
      recog.lang = lang;
      recog.interimResults = false;
      recog.onresult = (ev: SpeechRecognitionEvent) => {
        const text = ev?.results?.[0]?.[0]?.transcript || '';
        if (text) {
          onTranscript(text);
        }
      };
      recog.onend = () => {
        setListening(false);
        recognitionRef.current = null;
      };
      recog.onerror = () => {
        setListening(false);
        recognitionRef.current = null;
      };
      recognitionRef.current = recog;
      setListening(true);
      recog.start();
    } catch {
      setListening(false);
      recognitionRef.current = null;
    }
  };

  const stop = () => {
    try {
      recognitionRef.current?.stop?.();
    } catch (e) {
      console.warn('[VoiceInput] Failed to stop recognition:', e);
    }
    setListening(false);
    recognitionRef.current = null;
  };

  const btnClasses = [
    'inline-flex items-center justify-center rounded-lg transition-colors',
    size === 'sm' ? 'p-2' : 'p-3',
    disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100',
    className,
  ].join(' ');

  if (!supported) {
    return (
      <button
        type="button"
        className={btnClasses}
        aria-label={`${ariaLabel} (not supported)`}
        title="Voice input not supported in this browser"
        disabled
      >
        <MicOff className={size === 'sm' ? 'h-4 w-4 text-gray-400' : 'h-5 w-5 text-gray-400'} />
      </button>
    );
  }

  return (
    <button
      type="button"
      className={btnClasses}
      aria-label={ariaLabel}
      aria-pressed={listening}
      onClick={() => (listening ? stop() : start())}
      disabled={disabled}
      title={listening ? 'Stop voice input' : 'Start voice input'}
    >
      {listening ? (
        <MicOff className={size === 'sm' ? 'h-4 w-4 text-red-600' : 'h-5 w-5 text-red-600'} />
      ) : (
        <Mic className={size === 'sm' ? 'h-4 w-4 text-gray-700' : 'h-5 w-5 text-gray-700'} />
      )}
    </button>
  );
}

export default VoiceInputButton;
