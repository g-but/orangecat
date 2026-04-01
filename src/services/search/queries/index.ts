/**
 * Search Query Functions — Barrel Re-export
 *
 * All search query functions are split into focused modules by entity type.
 * This barrel file preserves the original import surface so existing consumers
 * (e.g., `from './search/queries'`) continue to work unchanged.
 *
 * Modules:
 *   profiles.ts    — searchProfiles
 *   projects.ts    — searchFundingPages
 *   loans.ts       — searchLoans
 *   suggestions.ts — getSearchSuggestions
 *   trending.ts    — getTrending
 *   helpers.ts     — shared utilities (sanitizeQuery, buildProfileMap, haversineDistance)
 */

export { searchProfiles } from './profiles';
export { searchFundingPages } from './projects';
export { searchLoans } from './loans';
export { getSearchSuggestions } from './suggestions';
export { getTrending } from './trending';
