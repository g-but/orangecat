/**
 * Client-safe image types (no server imports) — shared by the Openverse search
 * service, the API route, and the browser picker.
 */

export interface StockImage {
  id: string;
  /** Openverse thumbnail proxy — small, fast, for the grid. */
  thumbUrl: string;
  /** Full-resolution source image — what we set as the cover / insert inline. */
  fullUrl: string;
  title: string;
  creator: string | null;
  /** e.g. "cc0", "pdm". */
  license: string;
  /** Landing page on the source (Flickr, Wikimedia…), for a credit link. */
  sourceUrl: string | null;
}

export interface ImageSuggestResult {
  /** The AI-derived (or echoed manual) search terms used. */
  queries: string[];
  images: StockImage[];
}

/**
 * Mime → file-extension map for image formats the pipeline produces. The
 * generation sniffer and the storage route both derive from this — one list.
 */
export const IMAGE_MIME_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
};
