/**
 * AI form assist beyond registry entities — target resolution, output
 * sanitizing, and the standalone form catalog (tasks, proposals).
 *
 * These lock the contract that made the assist bar generalizable: any form is
 * a resolved target (name + declared fields + instructions), and AI output is
 * coerced against those declared fields before it ever reaches a form.
 */

import { resolveAiAssistTarget } from '@/lib/ai/assist-target';
import { sanitizeAiFields } from '@/lib/ai/sanitize-ai-fields';
import { generateFormPrefill } from '@/lib/ai/form-prefill-service';
import { AI_ASSIST_FORMS } from '@/config/ai-assist-forms';
import { getExampleDescriptions } from '@/config/ai-form-assist';
import { ENTITY_TYPES } from '@/config/entity-registry';
import { applyTaskAiData } from '@/app/(authenticated)/dashboard/tasks/task-form-types';
import type { TaskFormData } from '@/app/(authenticated)/dashboard/tasks/task-form-types';
import type { FieldConfig } from '@/components/create/types';

describe('AI_ASSIST_FORMS — the standalone form catalog', () => {
  it('never collides with an entity type (entity registry resolves first)', () => {
    for (const formId of Object.keys(AI_ASSIST_FORMS)) {
      expect(ENTITY_TYPES).not.toContain(formId);
    }
  });

  it('declares complete forms: name, fields, and starter examples', () => {
    for (const form of Object.values(AI_ASSIST_FORMS)) {
      expect(form.name).toBeTruthy();
      expect(form.fields.length).toBeGreaterThan(0);
      expect(form.examples.length).toBeGreaterThan(0);
      for (const field of form.fields) {
        expect(field.name).toBeTruthy();
        expect(field.label).toBeTruthy();
        if (field.type === 'select' || field.type === 'radio') {
          expect(field.options?.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('has a textarea in every form — the bar exists for prose-heavy forms', () => {
    for (const form of Object.values(AI_ASSIST_FORMS)) {
      expect(form.fields.some(field => field.type === 'textarea')).toBe(true);
    }
  });
});

describe('resolveAiAssistTarget — one resolver for every form kind', () => {
  it('resolves an entity type through the registry', () => {
    const target = resolveAiAssistTarget('service');
    expect(target).not.toBeNull();
    expect(target?.name).toBe('Service');
    expect(target?.fields.length).toBeGreaterThan(0);
    expect(target?.instructions.length).toBeGreaterThan(0);
  });

  it('resolves a standalone assist form', () => {
    const target = resolveAiAssistTarget('task');
    expect(target).not.toBeNull();
    expect(target?.name).toBe('Task');
    expect(target?.fields.map(field => field.name)).toContain('task_type');
  });

  it('resolves the proposal form with its own instructions on top of universal ones', () => {
    const target = resolveAiAssistTarget('proposal');
    expect(target?.instructions.join('\n')).toContain('treasury');
  });

  it('returns null for an unknown form type', () => {
    expect(resolveAiAssistTarget('nonsense')).toBeNull();
    expect(resolveAiAssistTarget('')).toBeNull();
  });
});

describe('sanitizeAiFields — declared fields are enforced, not requested', () => {
  const fields: FieldConfig[] = [
    { name: 'title', label: 'Title', type: 'text' },
    {
      name: 'category',
      label: 'Category',
      type: 'select',
      options: [
        { value: 'cleaning', label: 'Cleaning' },
        { value: 'it', label: 'IT' },
      ],
    },
    { name: 'estimated_minutes', label: 'Minutes', type: 'number', min: 1, max: 480 },
    { name: 'tags', label: 'Tags', type: 'tags' },
    { name: 'is_public', label: 'Public', type: 'boolean' },
  ];

  it('maps a select answered with its label back to the option value', () => {
    expect(sanitizeAiFields({ category: 'Cleaning' }, fields)).toEqual({ category: 'cleaning' });
  });

  it('drops a select value that matches no option', () => {
    expect(sanitizeAiFields({ category: 'gardening' }, fields)).toEqual({});
  });

  it('coerces numeric strings and drops out-of-range numbers', () => {
    expect(sanitizeAiFields({ estimated_minutes: '45' }, fields)).toEqual({
      estimated_minutes: 45,
    });
    expect(sanitizeAiFields({ estimated_minutes: 9999 }, fields)).toEqual({});
  });

  it('accepts tags as an array or a comma-separated string', () => {
    expect(sanitizeAiFields({ tags: ['a', ' b '] }, fields)).toEqual({ tags: ['a', 'b'] });
    expect(sanitizeAiFields({ tags: 'a, b' }, fields)).toEqual({ tags: ['a', 'b'] });
  });

  it('coerces boolean strings', () => {
    expect(sanitizeAiFields({ is_public: 'true' }, fields)).toEqual({ is_public: true });
    expect(sanitizeAiFields({ is_public: 'maybe' }, fields)).toEqual({});
  });

  it('passes undeclared fields through untouched (companion values like currency)', () => {
    expect(sanitizeAiFields({ currency: 'CHF' }, fields)).toEqual({ currency: 'CHF' });
  });

  it('renders a number handed to a text field instead of losing it', () => {
    expect(sanitizeAiFields({ title: 2026 }, fields)).toEqual({ title: '2026' });
  });
});

describe('generateFormPrefill — service floor follows the intent, like the route', () => {
  // #508 lowered the ROUTE floor for refine to 3 but its test mocked this
  // service, which still hard-rejected under 10 — so "shorter" passed the
  // route and then died here. Both layers now read AI_ASSIST_MIN_INPUT_LENGTH.
  const target = resolveAiAssistTarget('service');
  const envKeys = ['GROQ_API_KEY', 'OPENROUTER_API_KEY'] as const;
  const saved: Record<string, string | undefined> = {};

  beforeAll(() => {
    // No provider keys → a request that passes the length gate fails on
    // provider config, proving the gate let it through without any network.
    for (const key of envKeys) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterAll(() => {
    for (const key of envKeys) {
      if (saved[key] !== undefined) {
        process.env[key] = saved[key];
      }
    }
  });

  it('does not reject a short refine instruction as "too short"', async () => {
    const result = await generateFormPrefill({
      target: target!,
      description: 'shorter',
      intent: 'refine',
    });
    expect(result.error).not.toMatch(/at least/);
  });

  it('still rejects a too-short fill description', async () => {
    const result = await generateFormPrefill({ target: target!, description: 'hi' });
    expect(result.success).toBe(false);
    expect(result.error).toContain('at least 10');
  });
});

describe('generateFormPrefill — retries a transient provider failure', () => {
  const target = resolveAiAssistTarget('service');
  const originalFetch = global.fetch;
  const originalGroqKey = process.env.GROQ_API_KEY;

  beforeEach(() => {
    process.env.GROQ_API_KEY = 'test-key';
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalGroqKey === undefined) {
      delete process.env.GROQ_API_KEY;
    } else {
      process.env.GROQ_API_KEY = originalGroqKey;
    }
  });

  it('recovers from a single 503 without surfacing an error to the caller', async () => {
    const okBody = {
      choices: [
        {
          message: { content: JSON.stringify({ data: { title: 'Retried fine' }, confidence: {} }) },
        },
      ],
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503, text: async () => 'upstream hiccup' })
      .mockResolvedValueOnce({ ok: true, json: async () => okBody });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await generateFormPrefill({
      target: target!,
      description: 'A cleaning service for offices in Zurich',
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.success).toBe(true);
    expect(result.data.title).toBe('Retried fine');
  });

  it('gives up after repeated failures with the same user-facing message', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue({ ok: false, status: 503, text: async () => 'still down' });
    global.fetch = fetchMock as unknown as typeof fetch;

    const result = await generateFormPrefill({
      target: target!,
      description: 'A cleaning service for offices in Zurich',
    });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(result.success).toBe(false);
    expect(result.error).toBe('AI service temporarily unavailable. Please try again.');
  });
});

describe('getExampleDescriptions — standalone forms get starters too', () => {
  it('returns the declared examples for task and proposal', () => {
    expect(getExampleDescriptions('task')).toEqual(AI_ASSIST_FORMS.task.examples);
    expect(getExampleDescriptions('proposal')).toEqual(AI_ASSIST_FORMS.proposal.examples);
  });

  it('returns nothing for an unknown form instead of a fake fallback', () => {
    expect(getExampleDescriptions('nonsense')).toEqual([]);
  });
});

describe('applyTaskAiData — AI output lands safely in task form state', () => {
  const base: TaskFormData = {
    title: 'Old',
    description: '',
    instructions: '',
    task_type: 'one_time',
    schedule_cron: '',
    schedule_human: '',
    category: 'other',
    tags: [],
    priority: 'normal',
    estimated_minutes: '',
    project_id: 'keep-me',
  };

  it('applies valid values and keeps untouched state', () => {
    const next = applyTaskAiData(base, {
      title: 'Clean workshop',
      task_type: 'recurring_scheduled',
      schedule_human: 'Every Friday',
      category: 'cleaning',
      estimated_minutes: 45,
      tags: ['workshop'],
    });
    expect(next.title).toBe('Clean workshop');
    expect(next.task_type).toBe('recurring_scheduled');
    expect(next.schedule_human).toBe('Every Friday');
    expect(next.category).toBe('cleaning');
    expect(next.estimated_minutes).toBe(45);
    expect(next.tags).toEqual(['workshop']);
    expect(next.project_id).toBe('keep-me');
  });

  it('rejects invalid enum values and malformed types', () => {
    const next = applyTaskAiData(base, {
      task_type: 'sometimes',
      category: 42,
      priority: 'asap',
      estimated_minutes: 'soon',
      tags: 'not-an-array',
    });
    expect(next).toEqual(base);
  });

  it('caps tags at the form limit of 10', () => {
    const next = applyTaskAiData(base, { tags: Array.from({ length: 15 }, (_, i) => `t${i}`) });
    expect(next.tags).toHaveLength(10);
  });
});
