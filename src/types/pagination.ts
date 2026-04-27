/**
 * Canonical pagination types — single source of truth for pagination shapes.
 *
 * CursorPagination: for infinite-scroll / cursor-based APIs (messaging, circles)
 * OffsetPagination: for page-number / offset-based APIs (loans, groups)
 */

export interface CursorPagination {
  hasMore: boolean;
  nextCursor: string | null;
  count: number;
}

export interface OffsetPagination {
  page?: number;
  pageSize?: number;
  offset?: number;
}
