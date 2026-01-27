/**
 * USE VOICE INPUT HOOK
 * Handles Web Speech API and local Whisper transcription
 */

import { useCallback, useRef, useState } from 'react';

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  onError: (error: string) => void;
}

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions) {
  const [listening, setListening] = useState(false);
  const [whisperEnabled, setWhisperEnabled] = useState(false);
  const [whisperUrl, setWhisperUrl] = useState('');
  const [whisperLang, setWhisperLang] = useState('en');

  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startWebSpeech = useCallback(() => {
    try {
      const SpeechRecognition =
        (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      if (!SpeechRecognition) {
        onError('Speech recognition not supported by this browser.');
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
        onTranscript(transcript);
      };
      recog.onend = () => setListening(false);
      recog.onerror = () => setListening(false);
      setListening(true);
      recog.start();
    } catch {
      onError('Failed to start voice input');
    }
  }, [listening, onTranscript, onError]);

  const startWhisper = useCallback(async () => {
    if (!whisperUrl) {
      onError('Set Whisper endpoint URL in settings.');
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
            onTranscript(data.text);
          }
        } catch (err) {
          onError(err instanceof Error ? err.message : 'Transcription failed');
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
        } catch {}
      }, 10000);
    } catch {
      onError('Failed to access microphone');
    }
  }, [whisperUrl, onTranscript, onError]);

  const toggleVoiceInput = useCallback(() => {
    if (whisperEnabled) {
      if (listening && mediaRecorderRef.current?.state !== 'inactive') {
        try {
          mediaRecorderRef.current?.stop();
        } catch {}
        return;
      }
      void startWhisper();
    } else {
      startWebSpeech();
    }
  }, [whisperEnabled, listening, startWhisper, startWebSpeech]);

  return {
    listening,
    whisperEnabled,
    setWhisperEnabled,
    whisperUrl,
    setWhisperUrl,
    whisperLang,
    setWhisperLang,
    toggleVoiceInput,
  };
}
