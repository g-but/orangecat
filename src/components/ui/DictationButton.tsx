'use client';

/**
 * DictationButton — server-side dictation that actually works in Brave.
 *
 * Drop-in replacement for VoiceInputButton (same props). Instead of the browser
 * Web Speech API (webkitSpeechRecognition — disabled by default in Brave, the
 * founder's browser), it records with MediaRecorder and POSTs the audio to
 * /api/cat/transcribe (Groq Whisper). States: idle → recording → transcribing.
 */

import { useRef, useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { API_ROUTES } from '@/config/api-routes';
import { logger } from '@/utils/logger';
import { cn } from '@/lib/utils';

interface DictationButtonProps {
  onTranscript: (text: string) => void;
  /** BCP-47 hint (e.g. "en-US"); only the primary subtag is sent to Whisper. */
  lang?: string;
  size?: 'sm' | 'md';
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
}

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }
  for (const m of MIME_CANDIDATES) {
    if (MediaRecorder.isTypeSupported(m)) {
      return m;
    }
  }
  return undefined;
}

type RecState = 'idle' | 'recording' | 'transcribing';

export function DictationButton({
  onTranscript,
  lang,
  size = 'md',
  className = '',
  disabled = false,
  ariaLabel = 'Dictate your message',
}: DictationButtonProps) {
  const [state, setState] = useState<RecState>('idle');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const releaseStream = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const start = async () => {
    if (disabled || state !== 'idle' || !supported) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const rec = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = e => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      rec.onstop = async () => {
        releaseStream();
        const blob = new Blob(chunksRef.current, { type: rec.mimeType || 'audio/webm' });
        chunksRef.current = [];
        if (blob.size === 0) {
          setState('idle');
          return;
        }
        setState('transcribing');
        try {
          const fd = new FormData();
          fd.append('file', blob, 'audio.webm');
          if (lang) {
            fd.append('language', lang.split('-')[0]);
          }
          const res = await fetch(API_ROUTES.CAT.TRANSCRIBE, { method: 'POST', body: fd });
          const json = await res.json().catch(() => null);
          const text: string = json?.data?.text ?? '';
          if (text) {
            onTranscript(text);
          } else if (!res.ok) {
            toast.error("Couldn't transcribe — try again in a moment.");
          } else {
            toast.message("Didn't catch any speech — try speaking closer to the mic.");
          }
        } catch (e) {
          logger.warn('[Dictation] transcription request failed', { error: e });
          toast.error("Couldn't transcribe — check your connection and try again.");
        } finally {
          setState('idle');
        }
      };
      recorderRef.current = rec;
      rec.start();
      setState('recording');
    } catch (e) {
      // Permission denied or no mic. This must be AUDIBLE feedback — a silent
      // return reads as "the mic button is broken" (it did, verbatim, in a
      // founder bug report from Brave, which blocks mic access by default).
      logger.warn('[Dictation] microphone unavailable', { error: e });
      const denied = e instanceof DOMException && e.name === 'NotAllowedError';
      toast.error(
        denied
          ? 'Microphone blocked — allow mic access for orangecat.ch in your browser, then try again.'
          : 'No microphone available — check your device and browser settings.'
      );
      releaseStream();
      setState('idle');
    }
  };

  const stop = () => {
    try {
      recorderRef.current?.stop();
    } catch (e) {
      logger.warn('[Dictation] failed to stop recorder', { error: e });
    }
  };

  // No MediaRecorder/mic API → render nothing (the composer keeps its other controls).
  if (!supported) {
    return null;
  }

  const dim = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  const isRecording = state === 'recording';
  const isBusy = state === 'transcribing';

  return (
    <button
      type="button"
      onClick={() => (isRecording ? stop() : start())}
      disabled={disabled || isBusy}
      aria-label={ariaLabel}
      aria-pressed={isRecording}
      title={isRecording ? 'Stop & transcribe' : 'Dictate'}
      className={cn(
        'inline-flex items-center justify-center rounded-lg transition-colors',
        size === 'sm' ? 'p-2' : 'p-3',
        disabled || isBusy ? 'opacity-60' : 'hover:bg-surface-raised',
        isRecording && 'bg-status-negative-subtle',
        className
      )}
    >
      {isBusy ? (
        <Loader2 className={cn(dim, 'animate-spin text-fg-secondary')} />
      ) : isRecording ? (
        <Square
          className={cn(
            size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4',
            'fill-current text-status-negative'
          )}
        />
      ) : (
        <Mic className={cn(dim, 'text-fg-secondary')} />
      )}
    </button>
  );
}

export default DictationButton;
