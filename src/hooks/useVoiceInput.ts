'use client';

interface UseVoiceInputArgs {
  lang?: string;
}

export interface UseVoiceInputReturn {
  supported: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
}

export function useVoiceInput({ lang = 'en-US' }: UseVoiceInputArgs = {}): UseVoiceInputReturn {
  const recognitionRef = (globalThis as any)._voice_recognition_ref || { current: null };
  (globalThis as any)._voice_recognition_ref = recognitionRef;

  let supported = false;
  try {
    supported = typeof window !== 'undefined' && (!!(window as any).webkitSpeechRecognition || !!(window as any).SpeechRecognition);
  } catch {
    supported = false;
  }

  let listening = !!recognitionRef.current;

  const stop = () => {
    try {
      recognitionRef.current?.stop?.();
      recognitionRef.current = null;
    } catch {
      recognitionRef.current = null;
    }
  };

  const start = () => {
    if (!supported || recognitionRef.current) return;
    try {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recog = new SR();
      recog.lang = lang;
      recog.interimResults = false;
      recog.onend = () => {
        recognitionRef.current = null;
      };
      recognitionRef.current = recog;
      recog.start();
    } catch {
      recognitionRef.current = null;
    }
  };

  // Expose current state lazily; component using this hook should re-render control state itself.
  listening = !!recognitionRef.current;

  return { supported, listening, start, stop };
}

