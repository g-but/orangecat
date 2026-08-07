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

/** A Bitcoin amount the user actually stated — "0.01 BTC", "₿0.5", "in bitcoin". */
const MENTIONS_BITCOIN = /\b(btc|bitcoin|sats?|satoshis?)\b|₿/i;

/**
 * Drop `*_btc` values the user never gave in Bitcoin.
 *
 * Some entities only have a BTC-denominated price field — an asset has
 * `rental_price_btc` and no fiat equivalent — so a model told "1800 a month"
 * has one field to put it in and converts. It has no exchange rate, so the
 * number is invented: "rent out my apartment in Basel for 1800 a month" came
 * back as `rental_price_btc: 0.072`, roughly double what the person said, next
 * to `currency: CHF` contradicting it.
 *
 * The prompt says not to. A prompt is a request; this is the enforcement, and
 * the stakes justify it — the number goes on a listing someone gets charged
 * against. Absent beats invented: the field stays empty and the user fills in
 * the amount they meant.
 */
function dropUnstatedBitcoinAmounts(
  data: Record<string, unknown>,
  sourceText: string
): Record<string, unknown> {
  if (MENTIONS_BITCOIN.test(sourceText)) {
    return data;
  }
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data)) {
    if (/_btc$/.test(key) && typeof value === 'number') {
      continue;
    }
    cleaned[key] = value;
  }
  return cleaned;
}

/**
 * Validate/coerce `data` against `fields`. Declared fields are coerced to the
 * declared type (invalid → dropped); undeclared fields pass through unchanged.
 *
 * `sourceText` is what the user wrote; it is used to reject Bitcoin amounts
 * they never stated. Omit it only where no user text exists.
 */
export function sanitizeAiFields(
  data: Record<string, unknown>,
  fields: FieldConfig[],
  sourceText = ''
): Record<string, unknown> {
  const byName = new Map(fields.map(field => [field.name, field]));
  const result: Record<string, unknown> = {};
  const safe = dropUnstatedBitcoinAmounts(data, sourceText);

  for (const [key, raw] of Object.entries(safe)) {
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
