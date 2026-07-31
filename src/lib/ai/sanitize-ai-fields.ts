/**
 * Coerce AI-returned form values against the form's declared fields.
 *
 * The prompt tells the model to use option *values*, ISO dates, numbers — but
 * a prompt is a request, not a guarantee. This is the enforcement: a select
 * answered with its label ("Cleaning") maps back to its value ("cleaning"),
 * numbers arrive as numbers, tags as a string array, and a value that cannot
 * be made valid is dropped rather than written into the form.
 *
 * Fields the AI returned that are NOT declared pass through untouched — some
 * flows carry companion values (e.g. `currency` next to a price field) that
 * the field list doesn't declare, and dropping them would regress those forms.
 */

import type { FieldConfig } from '@/components/create/types';

function coerceNumber(value: unknown, field: FieldConfig): number | undefined {
  const num = typeof value === 'number' ? value : Number(value);
  if (typeof value === 'boolean' || value === '' || value === null || Number.isNaN(num)) {
    return undefined;
  }
  if (field.min !== undefined && num < field.min) {
    return undefined;
  }
  if (field.max !== undefined && num > field.max) {
    return undefined;
  }
  return num;
}

function coerceSelect(value: unknown, field: FieldConfig): string | undefined {
  if (typeof value !== 'string' || !field.options) {
    return undefined;
  }
  const byValue = field.options.find(option => option.value === value);
  if (byValue) {
    return byValue.value;
  }
  // Models answer with the label often enough to be worth mapping back.
  const byLabel = field.options.find(
    option => option.label.toLowerCase() === value.trim().toLowerCase()
  );
  return byLabel?.value;
}

function coerceTags(value: unknown): string[] | undefined {
  if (Array.isArray(value)) {
    const tags = value.filter((tag): tag is string => typeof tag === 'string' && tag.trim() !== '');
    return tags.length > 0 ? tags.map(tag => tag.trim()) : undefined;
  }
  if (typeof value === 'string' && value.trim() !== '') {
    return value
      .split(',')
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  return undefined;
}

function coerceBoolean(value: unknown): boolean | undefined {
  if (typeof value === 'boolean') {
    return value;
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

function coerceValue(value: unknown, field: FieldConfig): unknown {
  switch (field.type) {
    case 'number':
    case 'currency':
      return coerceNumber(value, field);
    case 'select':
    case 'radio':
      return coerceSelect(value, field);
    case 'checkbox':
    case 'boolean':
      return coerceBoolean(value);
    case 'tags':
      return coerceTags(value);
    default:
      // Free-text-ish fields (text, textarea, date, url, …): strings pass,
      // numbers are rendered, null passes (an explicit clear), rest dropped.
      if (typeof value === 'number') {
        return String(value);
      }
      return typeof value === 'string' || value === null ? value : undefined;
  }
}

/**
 * Validate/coerce `data` against `fields`. Declared fields are coerced to the
 * declared type (invalid → dropped); undeclared fields pass through unchanged.
 */
export function sanitizeAiFields(
  data: Record<string, unknown>,
  fields: FieldConfig[]
): Record<string, unknown> {
  const byName = new Map(fields.map(field => [field.name, field]));
  const result: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(data)) {
    const field = byName.get(key);
    if (!field) {
      result[key] = raw;
      continue;
    }
    const coerced = coerceValue(raw, field);
    if (coerced !== undefined) {
      result[key] = coerced;
    }
  }

  return result;
}
