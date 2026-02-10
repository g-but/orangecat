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

// ==================== RESOURCE NEEDS ====================

export const RESOURCE_NEED_TYPES = [
  { value: 'compute', label: 'Compute' },
  { value: 'data', label: 'Data' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'collaboration', label: 'Collaboration' },
  { value: 'publication', label: 'Publication' },
  { value: 'travel', label: 'Travel' },
  { value: 'software', label: 'Software' },
  { value: 'other', label: 'Other' },
] as const;

export type ResourceNeedType = (typeof RESOURCE_NEED_TYPES)[number]['value'];

export const RESOURCE_NEED_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

export type ResourceNeedPriority = (typeof RESOURCE_NEED_PRIORITIES)[number]['value'];

// ==================== IMPACT AREAS ====================

export const IMPACT_AREAS = [
  { value: 'scientific_understanding', label: 'Scientific Understanding' },
  { value: 'technological_innovation', label: 'Technological Innovation' },
  { value: 'medical_advancement', label: 'Medical Advancement' },
  { value: 'environmental_protection', label: 'Environmental Protection' },
  { value: 'social_progress', label: 'Social Progress' },
  { value: 'economic_development', label: 'Economic Development' },
  { value: 'education', label: 'Education' },
  { value: 'policy_making', label: 'Policy Making' },
  { value: 'philosophical_insight', label: 'Philosophical Insight' },
  { value: 'other', label: 'Other' },
] as const;

export type ImpactArea = (typeof IMPACT_AREAS)[number]['value'];
