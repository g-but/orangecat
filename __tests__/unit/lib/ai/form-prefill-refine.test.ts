/**
 * Regression lock: AI form prefill must be able to CHANGE fields that are
 * already filled.
 *
 * The reported failure: on the Create Service form a user typed "make
 * description longer and in english and german". The UI reported "AI filled the
 * form" / "Form updated" and the description stayed "I offer photography."
 *
 * Two independent causes, both locked here:
 *  1. the service re-applied every non-empty existing value ON TOP of the AI's
 *     output, so a refinement could never change a filled field;
 *  2. the prompt told the model to "Preserve these existing values (do not
 *     overwrite)" — including the very field the user asked to rewrite.
 */

import { generateFormPrefill } from '@/lib/ai/form-prefill-service';
import { getSystemPrompt, getUserPrompt } from '@/lib/ai/prompts/form-prefill';
import { PREFILL_MIN_INPUT_LENGTH } from '@/config/ai-prefill';
import type { EntityConfig } from '@/components/create/types';

const ENTITY_CONFIG = {
  fieldGroups: [
    {
      id: 'basic',
      title: 'Basic Information',
      fields: [
        { name: 'title', label: 'Service Title', type: 'text', required: true },
        { name: 'description', label: 'Description', type: 'textarea' },
      ],
    },
  ],
} as unknown as EntityConfig;

const CURRENT_FORM = {
  title: 'Photography',
  description: 'I offer photography.',
  category: 'Photography',
  hourly_rate: 50,
  currency: 'CHF',
};

const LONGER_BILINGUAL = [
  'I offer professional photography for portraits, events and products.',
  'Ich biete professionelle Fotografie für Porträts, Events und Produkte an.',
].join('\n\n');

function mockAIResponse(data: Record<string, unknown>) {
  return jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      choices: [{ message: { content: JSON.stringify({ data, confidence: {} }) } }],
    }),
  });
}

/** The user prompt sent to the model on the most recent call. */
function sentUserPrompt(fetchMock: jest.Mock): string {
  const body = JSON.parse((fetchMock.mock.calls[0][1] as { body: string }).body);
  return body.messages.find((m: { role: string }) => m.role === 'user').content;
}

describe('AI form prefill — refine mode', () => {
  const originalFetch = global.fetch;
  const originalGroqKey = process.env.GROQ_API_KEY;

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GROQ_API_KEY = originalGroqKey;
    jest.restoreAllMocks();
  });

  it('returns the AI rewrite of a field that is already filled', async () => {
    const fetchMock = mockAIResponse({ description: LONGER_BILINGUAL });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await generateFormPrefill(
      'service',
      'make description longer and in english and german',
      ENTITY_CONFIG,
      CURRENT_FORM,
      undefined,
      'refine'
    );

    expect(result.success).toBe(true);
    // The whole point: the old value must NOT come back.
    expect(result.data.description).toBe(LONGER_BILINGUAL);
    expect(result.data.description).not.toBe(CURRENT_FORM.description);
  });

  it('does not resurrect existing values for fields the AI rewrote', async () => {
    const fetchMock = mockAIResponse({ title: 'Professional Photography', hourly_rate: 90 });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await generateFormPrefill(
      'service',
      'better title, raise the rate to 90',
      ENTITY_CONFIG,
      CURRENT_FORM,
      undefined,
      'refine'
    );

    expect(result.data).toEqual({ title: 'Professional Photography', hourly_rate: 90 });
    // Untouched fields are simply absent — the client merges them over form state.
    expect(result.data).not.toHaveProperty('category');
  });

  it('accepts a short instruction that generate mode would reject', async () => {
    const fetchMock = mockAIResponse({ title: 'Photos' });
    global.fetch = fetchMock as unknown as typeof fetch;

    const shortInstruction = 'shorter';
    expect(shortInstruction.length).toBeLessThan(PREFILL_MIN_INPUT_LENGTH.generate);

    const refined = await generateFormPrefill(
      'service',
      shortInstruction,
      ENTITY_CONFIG,
      CURRENT_FORM,
      undefined,
      'refine'
    );
    expect(refined.success).toBe(true);

    const generated = await generateFormPrefill(
      'service',
      shortInstruction,
      ENTITY_CONFIG,
      CURRENT_FORM,
      undefined,
      'generate'
    );
    expect(generated.success).toBe(false);
  });

  it('sends the current values as context, never as a preservation lock', async () => {
    const fetchMock = mockAIResponse({ description: LONGER_BILINGUAL });
    global.fetch = fetchMock as unknown as typeof fetch;

    await generateFormPrefill(
      'service',
      'make description longer and in english and german',
      ENTITY_CONFIG,
      CURRENT_FORM,
      undefined,
      'refine'
    );

    const prompt = sentUserPrompt(fetchMock);
    expect(prompt).toContain('I offer photography.');
    expect(prompt).not.toMatch(/do not overwrite/i);
    expect(prompt).not.toMatch(/preserve these existing values/i);
  });
});

describe('AI form prefill — generate mode still protects typed input', () => {
  const originalFetch = global.fetch;
  const originalGroqKey = process.env.GROQ_API_KEY;

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    process.env.GROQ_API_KEY = originalGroqKey;
  });

  it('keeps a value the user typed rather than the AI-generated one', async () => {
    const fetchMock = mockAIResponse({ title: 'AI Title', description: 'AI description' });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await generateFormPrefill(
      'service',
      'I photograph weddings around Zurich, 50 CHF per hour',
      ENTITY_CONFIG,
      { title: 'My own title' },
      undefined,
      'generate'
    );

    expect(result.data.title).toBe('My own title');
    expect(result.data.description).toBe('AI description');
  });

  it('defaults to generate when no mode is given (back-compat)', async () => {
    const fetchMock = mockAIResponse({ title: 'AI Title' });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await generateFormPrefill(
      'service',
      'I photograph weddings around Zurich, 50 CHF per hour',
      ENTITY_CONFIG,
      { title: 'My own title' }
    );

    expect(result.data.title).toBe('My own title');
  });
});

describe('AI form prefill prompts', () => {
  it('tells the model to overwrite in refine mode', () => {
    const system = getSystemPrompt('service', 'refine');
    expect(system).toMatch(/overwrite existing values/i);
    expect(system).not.toMatch(/Do not make up information/i);
  });

  it('keeps extraction semantics in generate mode', () => {
    const system = getSystemPrompt('service', 'generate');
    expect(system).toMatch(/extract structured data/i);
    expect(system).toMatch(/Do not make up information/i);
  });

  it('honours explicit language and length instructions in refine mode', () => {
    const system = getSystemPrompt('service', 'refine');
    expect(system).toMatch(/languages are named/i);
    expect(system).toMatch(/substantially expand/i);
  });

  it('shows current values without a preserve instruction in refine mode', () => {
    const prompt = getUserPrompt(
      'service',
      'make the description longer',
      '- description (textarea): Description',
      '',
      CURRENT_FORM,
      'refine'
    );

    expect(prompt).toContain('I offer photography.');
    // Prices are context in refine mode too — the instruction may target them.
    expect(prompt).toContain('50');
    expect(prompt).not.toMatch(/do not overwrite/i);
  });

  it('still asks generate mode to preserve filled fields', () => {
    const prompt = getUserPrompt(
      'service',
      'I photograph weddings around Zurich',
      '- description (textarea): Description',
      '',
      { title: 'My own title' },
      'generate'
    );

    expect(prompt).toMatch(/do not overwrite/i);
    expect(prompt).toContain('My own title');
  });
});
