'use client';

/**
 * Recording and transcription, with no opinion about what happens to the words.
 *
 * Lifted out of DictationButton so the mic-in-a-textbox and the voice-first
 * create flow share one implementation of the fiddly part: MIME negotiation,
 * stream cleanup, and the permission failures that otherwise read as "the mic
 * button is broken".
 *
 * PORTABILITY — this is the piece meant to travel to the other apps. It depends
 * on nothing OrangeCat-specific: pass `endpoint` and it works anywhere that has
 * a multipart transcription route. Keep it that way; app-specific behaviour
 * belongs in the components that call it.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

export type DictationState = 'idle' | 'recording' | 'transcribing';

export type DictationError =
  /** Mic blocked at the browser/OS level — recoverable, but only by the user. */
  | 'permission_denied'
  /** No microphone, or the browser lacks MediaRecorder. */
  | 'no_microphone'
  /** We recorded, but transcription failed. */
  | 'transcription_failed'
  /** Recorded silence — nothing to transcribe. */
  | 'no_speech';

interface UseDictationOptions {
  /** Multipart endpoint taking field "file"; returns { data: { text } }. */
  endpoint: string;
  /** BCP-47 hint (e.g. "en-US"); only the primary subtag is sent. */
  lang?: string;
  onTranscript: (text: string) => void;
  onError?: (error: DictationError) => void;
}

const MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === 'undefined') {
    return undefined;
  }
  return MIME_CANDIDATES.find(m => MediaRecorder.isTypeSupported(m));
}

export function useDictation({ endpoint, lang, onTranscript, onError }: UseDictationOptions) {
  const [state, setState] = useState<DictationState>('idle');
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Read through refs so a re-render mid-recording can't strand the callbacks
  // registered on the recorder.
  const onTranscriptRef = useRef(onTranscript);
  onTranscriptRef.current = onTranscript;
  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  const supported =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia &&
    typeof MediaRecorder !== 'undefined';

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // A live mic track outlives the component otherwise — the browser keeps
  // showing "recording" on a page the user has already left.
  useEffect(() => () => releaseStream(), [releaseStream]);

  const start = useCallback(async () => {
    if (!supported) {
      onErrorRef.current?.('no_microphone');
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
          onErrorRef.current?.('no_speech');
          return;
        }

        setState('transcribing');
        try {
          const fd = new FormData();
          fd.append('file', blob, 'audio.webm');
          if (lang) {
            fd.append('language', lang.split('-')[0]);
          }
          const res = await fetch(endpoint, { method: 'POST', body: fd });
          const json = (await res.json().catch(() => null)) as {
            data?: { text?: string };
          } | null;
          const text = json?.data?.text ?? '';

          if (text) {
            onTranscriptRef.current(text);
          } else {
            onErrorRef.current?.(res.ok ? 'no_speech' : 'transcription_failed');
          }
        } catch {
          onErrorRef.current?.('transcription_failed');
        } finally {
          setState('idle');
        }
      };

      recorderRef.current = rec;
      rec.start();
      setState('recording');
    } catch (error) {
      // Silence here reads as a broken button — a real founder bug report from
      // Brave, which blocks mic access by default. Always surface it.
      releaseStream();
      setState('idle');
      onErrorRef.current?.(
        error instanceof DOMException && error.name === 'NotAllowedError'
          ? 'permission_denied'
          : 'no_microphone'
      );
    }
  }, [supported, endpoint, lang, releaseStream]);

  const stop = useCallback(() => {
    try {
      recorderRef.current?.stop();
    } catch {
      // Already stopped; onstop has run or will not fire.
    }
  }, []);

  const toggle = useCallback(() => {
    if (state === 'recording') {
      stop();
    } else if (state === 'idle') {
      void start();
    }
  }, [state, start, stop]);

  return {
    state,
    supported,
    isRecording: state === 'recording',
    isTranscribing: state === 'transcribing',
    start,
    stop,
    toggle,
  };
}
