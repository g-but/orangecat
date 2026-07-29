/**
 * Shared writing-engine types — client-safe (no server imports), so both the
 * server engine and the browser composer import them from one place.
 */

export type WritingKind = 'post' | 'article';

export interface ProposedTopic {
  kind: WritingKind;
  /** The headline / topic itself. */
  title: string;
  /** One line on the angle — why it's worth writing, in their voice. */
  angle: string;
}

export interface ArticleDraft {
  title: string;
  excerpt: string;
  body: string;
}

export interface PostDraft {
  text: string;
}

/**
 * In-editor AI revision actions. Each transforms the author's own text (their
 * selection, or the whole body) rather than generating from scratch:
 * - improve   → sharpen clarity & flow, keep the meaning and voice
 * - continue  → write the next paragraph(s) from where they stopped
 * - tighten   → same idea, fewer words
 * - expand    → add depth, detail, a concrete example
 * - grammar   → fix grammar/spelling only, minimal changes
 * - tone      → rewrite in a different register (see TonePreset)
 * - outline   → propose a section outline for a topic (seeds an empty body)
 */
export type ReviseAction =
  | 'improve'
  | 'continue'
  | 'tighten'
  | 'expand'
  | 'grammar'
  | 'tone'
  | 'outline';

export type TonePreset = 'casual' | 'formal' | 'punchy' | 'warm';
