# Voice Input Component Spec

Status: Proposal (MVP scope approved)

## Goals

- Provide a reusable, accessible, privacy-respecting voice input for forms and composers.
- Drop-in across Orangecat (onboarding, create forms, timeline/messages, My Cat).
- Align with SSOT/DRY/SoC, a11y, security, and performance principles.

## Non-goals

- Server-side transcription (MVP). Future: optional local Whisper endpoint.
- Persisting audio/transcripts (beyond the hosting form’s state).

## API

Component: `VoiceInputButton`

```
interface VoiceInputButtonProps {
  onTranscript: (text: string) => void; // receives final transcript
  lang?: string;                         // BCP-47 (default: 'en-US')
  size?: 'sm' | 'md';                   // UI size
  className?: string;                   // Tailwind classes (literal only)
  disabled?: boolean;                   // disabled state
  ariaLabel?: string;                   // accessibility label
}
```

Hook: `useVoiceInput`

```
interface UseVoiceInputArgs { lang?: string }
interface UseVoiceInputReturn {
  supported: boolean;
  listening: boolean;
  start: () => void;
  stop: () => void;
}
```

Usage

```
import { VoiceInputButton } from '@/components/ui/VoiceInputButton';

function DescriptionField() {
  const [value, setValue] = useState('');
  return (
    <div className="flex items-center gap-2">
      <textarea value={value} onChange={e => setValue(e.target.value)} />
      <VoiceInputButton ariaLabel="Voice input" onTranscript={t => setValue(v => (v ? v + ' ' : '') + t)} />
    </div>
  );
}
```

## Implementation Details

- Client-only: Feature-detect Web Speech API; SSR-safe with 'use client' and runtime checks.
- Privacy: No upload; transcript stays in client state. No analytics or logging of audio/transcripts.
- States: supported, listening, and error messages. Show clear start/stop state.
- Errors: Unsupported browser, permission denied, microphone not found. Provide helpful tooltips.
- i18n: lang prop forwarded to recognition instance.
- Performance: Instantiate recognition per start; clean up listeners on stop/unmount.
- Styling: Tailwind literal classes; avoid dynamic class generation.

## Accessibility

- Button: role="button", aria-label, aria-pressed while listening.
- Focus: Visible focus ring; ESC or click toggles stop.
- Announcements: Optionally announce state changes for screen readers.

## Security & Privacy

- No network calls. No storage of transcripts. No unexpected persistence.
- Future local Whisper endpoint: explicit opt-in; calls stay on localhost with CORS enabled.

## Testing

- Unit: Supported/not-supported branches; onTranscript fired; state toggles; cleanup.
- Integration: With form field (textarea/input) ensuring transcript appends/prepends as designed.
- E2E: Mock SpeechRecognition in Playwright; verify UX affordances and a11y.

## Rollout & Migration Plan

- Feature Flag: NEXT_PUBLIC_FEATURE_VOICE_INPUT to guard non-critical pages.
- Phase 1 (MVP): My Cat (done), Onboarding description, Service create description field.
- Phase 2: Timeline composer, Messages composer, other entity descriptions.
- Phase 3: Add local Whisper endpoint option to settings. Extend to more fields based on usage.

### Integration Pointers

- Onboarding: src/components/onboarding/IntelligentOnboarding.tsx – attach VoiceInputButton next to the description Textarea.
- Create Forms: src/components/create/EntityForm.tsx – where FieldInputType is text or textarea (e.g., description), render VoiceInputButton adjacent, controlled by feature flag.
- Composers: Timeline/Messages – similar to above; ensure mobile-friendly tap targets.

## Future Enhancements

- Streaming interim results (UI hint while speaking).
- Local Whisper endpoint config in Settings with test.
- “Append vs Replace” mode per field; punctuation controls.
- Language auto-detect.

## References

- Best practices: docs/development/BEST_PRACTICES.md; docs/components/component-architecture.md
- Security: docs/security/README.md
- My Cat: docs/my-cat-spec.md; docs/my-cat-voice-and-local-models.md

