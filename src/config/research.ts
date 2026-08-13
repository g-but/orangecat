/**
 * Research Entity Configuration - Single Source of Truth
 *
 * All research-related options, labels, and types.
 * Components should import from here instead of hardcoding options in JSX.
 *
 * Created: 2026-02-09
 */

// ==================== RESEARCH FIELDS ====================

export const RESEARCH_FIELDS = [
  { value: 'fundamental_physics', label: 'Fundamental Physics' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'computer_science', label: 'Computer Science' },
  { value: 'biology', label: 'Biology' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'neuroscience', label: 'Neuroscience' },
  { value: 'psychology', label: 'Psychology' },
  { value: 'economics', label: 'Economics' },
  { value: 'philosophy', label: 'Philosophy' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'environmental_science', label: 'Environmental Science' },
  { value: 'social_science', label: 'Social Science' },
  { value: 'artificial_intelligence', label: 'Artificial Intelligence' },
  { value: 'blockchain_cryptography', label: 'Blockchain & Cryptography' },
  { value: 'other', label: 'Other' },
] as const;

export type ResearchField = (typeof RESEARCH_FIELDS)[number]['value'];

// ==================== METHODOLOGIES ====================

export const METHODOLOGIES = [
  { value: 'theoretical', label: 'Theoretical Research' },
  { value: 'experimental', label: 'Experimental Research' },
  { value: 'computational', label: 'Computational Research' },
  { value: 'empirical', label: 'Empirical Research' },
  { value: 'qualitative', label: 'Qualitative Research' },
  { value: 'mixed_methods', label: 'Mixed Methods' },
  { value: 'meta_analysis', label: 'Meta-Analysis' },
  { value: 'survey', label: 'Survey Research' },
  { value: 'case_study', label: 'Case Study' },
  { value: 'action_research', label: 'Action Research' },
] as const;

export type Methodology = (typeof METHODOLOGIES)[number]['value'];

// ==================== TIMELINES ====================

export const TIMELINES = [
  { value: 'short_term', label: 'Short-term (3-6 months)' },
  { value: 'medium_term', label: 'Medium-term (6-18 months)' },
  { value: 'long_term', label: 'Long-term (1-3 years)' },
  { value: 'ongoing', label: 'Ongoing Research' },
  { value: 'indefinite', label: 'Indefinite/Exploratory' },
] as const;

export type ResearchTimeline = (typeof TIMELINES)[number]['value'];

// ==================== FUNDING MODELS ====================

export const FUNDING_MODELS = [
  { value: 'donation', label: 'Funding-based (pure support)' },
  { value: 'subscription', label: 'Subscription (ongoing support)' },
  { value: 'milestone', label: 'Milestone-based (progress payments)' },
  { value: 'royalty', label: 'Royalty-share (revenue sharing)' },
  { value: 'hybrid', label: 'Hybrid (multiple models)' },
] as const;

export type FundingModel = (typeof FUNDING_MODELS)[number]['value'];

// ==================== PROGRESS & TRANSPARENCY ====================

export const PROGRESS_FREQUENCIES = [
  { value: 'weekly', label: 'Weekly Updates' },
  { value: 'biweekly', label: 'Bi-weekly Updates' },
  { value: 'monthly', label: 'Monthly Updates' },
  { value: 'milestone', label: 'Milestone-based Updates' },
  { value: 'as_needed', label: 'As-needed Updates' },
] as const;

export type ProgressFrequency = (typeof PROGRESS_FREQUENCIES)[number]['value'];

export const TRANSPARENCY_LEVELS = [
  { value: 'full', label: 'Full transparency' },
  { value: 'progress', label: 'Progress updates' },
  { value: 'milestone', label: 'Milestone updates' },
  { value: 'minimal', label: 'Minimal updates' },
] as const;

export type TransparencyLevel = (typeof TRANSPARENCY_LEVELS)[number]['value'];

// ==================== DISPLAY COLORS ====================

export const RESEARCH_FIELD_COLORS: Record<ResearchField, string> = {
  fundamental_physics: 'bg-sky-100 text-sky-800',
  mathematics: 'bg-amber-100 text-amber-800',
  computer_science: 'bg-indigo-100 text-indigo-800',
  biology: 'bg-green-100 text-green-800',
  chemistry: 'bg-teal-100 text-teal-800',
  neuroscience: 'bg-green-100 text-green-800',
  psychology: 'bg-rose-100 text-rose-800',
  economics: 'bg-amber-100 text-amber-800',
  philosophy: 'bg-surface-raised text-fg-primary',
  engineering: 'bg-cyan-100 text-cyan-800',
  medicine: 'bg-red-100 text-red-800',
  environmental_science: 'bg-emerald-100 text-emerald-800',
  social_science: 'bg-violet-100 text-violet-800',
  artificial_intelligence: 'bg-pink-100 text-pink-800',
  blockchain_cryptography: 'bg-yellow-100 text-yellow-800',
  other: 'bg-surface-raised text-fg-primary',
};

// DB constraint: CHECK (status IN ('draft', 'active', 'completed', 'paused', 'cancelled'))
export const RESEARCH_STATUSES = ['draft', 'active', 'completed', 'paused', 'cancelled'] as const;
export type ResearchStatus = (typeof RESEARCH_STATUSES)[number];

// Solid dot indicator colors for status — distinct from BADGE_COLORS (which uses lighter 100/700 pattern)
export const RESEARCH_STATUS_DOT_COLORS: Record<string, string> = {
  active: 'bg-green-500',
  draft: 'bg-yellow-500',
  completed: 'bg-sky-500',
  paused: 'bg-yellow-500',
  cancelled: 'bg-red-500',
};
