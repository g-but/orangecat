/**
 * Image feature limits — SSOT shared by the API routes (zod) and the UI
 * (input maxLength / disabled states), so the two can't disagree and produce
 * bare "Invalid request" errors.
 */
export const IMAGE_PROMPT_LIMITS = { min: 3, max: 1000 } as const;
export const IMAGE_SEARCH_QUERY_MAX = 80;
/** Openverse results fetched per query; also the per-query page size. */
export const IMAGES_PER_QUERY = 8;
