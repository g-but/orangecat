import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';

describe('VoiceInputButton', () => {
  beforeEach(() => {
    (global.fetch as any) = jest.fn();
  });

  function mockSpeechRecognition() {
    class MockSR {
      public lang = 'en-US';
      public interimResults = false;
      public onresult: ((ev: any) => void) | null = null;
      public onend: (() => void) | null = null;
      public onerror: (() => void) | null = null;
      start = () => {
        setTimeout(() => {
          this.onresult?.({ results: [[{ transcript: 'hello world' }]] });
          this.onend?.();
        }, 0);
      };
      stop = () => {
        this.onend?.();
      };
    }
    (window as any).webkitSpeechRecognition = MockSR as any;
  }

  it('calls onTranscript with captured text', async () => {
    mockSpeechRecognition();
    const onTranscript = jest.fn();
    render(<VoiceInputButton ariaLabel="Voice" onTranscript={onTranscript} />);

    const btn = screen.getByRole('button', { name: /voice/i });
    await act(async () => {
      fireEvent.click(btn);
    });

    // Allow timers to run queued callbacks
    await act(async () => {
      await new Promise(r => setTimeout(r, 0));
    });

    expect(onTranscript).toHaveBeenCalledWith('hello world');
  });
});

