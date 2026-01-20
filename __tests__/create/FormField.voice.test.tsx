import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { FormField } from '@/components/create/FormField';

jest.mock('@/components/ui/VoiceInputButton', () => ({
  __esModule: true,
  VoiceInputButton: ({ onTranscript }: { onTranscript: (t: string) => void }) => (
    <button onClick={() => onTranscript('voice-data')} aria-label="Voice input for Description">Voice</button>
  ),
  default: () => null,
}));

describe('FormField voice integration', () => {
  const OLD_ENV = process.env;
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...OLD_ENV, NEXT_PUBLIC_FEATURE_VOICE_INPUT: 'true' } as any;
  });
  afterAll(() => {
    process.env = OLD_ENV;
  });

  it('appends voice transcript to textarea', () => {
    const onChange = jest.fn();
    render(
      <FormField
        config={{ name: 'description', label: 'Description', type: 'textarea' } as any}
        value={''}
        error={undefined}
        onChange={val => onChange(val)}
        onFocus={() => {}}
        disabled={false}
      />
    );
    const btn = screen.getByRole('button', { name: /voice input for description/i });
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith('voice-data');
  });
});

