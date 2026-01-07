import { BaseEntity } from './entity';

export type ResearchField =
  | 'fundamental_physics'
  | 'mathematics'
  | 'computer_science'
  | 'biology'
  | 'chemistry'
  | 'neuroscience'
  | 'psychology'
  | 'economics'
  | 'philosophy'
  | 'engineering'
  | 'medicine'
  | 'environmental_science'
  | 'social_science'
  | 'artificial_intelligence'
  | 'blockchain_cryptography'
  | 'other';

export type ResearchMethodology =
  | 'theoretical'
  | 'experimental'
  | 'computational'
  | 'empirical'
  | 'qualitative'
  | 'mixed_methods'
  | 'meta_analysis'
  | 'survey'
  | 'case_study'
  | 'action_research';

export type FundingModel =
  | 'donation'
  | 'subscription'
  | 'milestone'
  | 'royalty'
  | 'hybrid';

export type TransparencyLevel =
  | 'full'
  | 'progress'
  | 'milestone'
  | 'minimal';

export type ProgressFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'milestone'
  | 'as_needed';

export type TimelineType =
  | 'short_term'
  | 'medium_term'
  | 'long_term'
  | 'ongoing'
  | 'indefinite';

export interface TeamMember {
  id?: string;
  name: string;
  role: string;
  expertise?: string;
  contribution_percentage?: number;
  joined_at?: string;
  wallet_address?: string;
}

export interface ResourceNeed {
  type: 'compute' | 'data' | 'equipment' | 'collaboration' | 'publication' | 'travel' | 'software' | 'other';
  description?: string;
  estimated_cost_sats?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
}

export interface ImpactArea {
  area: 'scientific_understanding' | 'technological_innovation' | 'medical_advancement' | 'environmental_protection' | 'social_progress' | 'economic_development' | 'education' | 'policy_making' | 'philosophical_insight' | 'other';
  description?: string;
}

export interface SDGAlignment {
  goal: string; // UN SDG identifier
  description?: string;
}

export interface ResearchProgress {
  id: string;
  title: string;
  description: string;
  milestone_achieved?: boolean;
  funding_released?: number; // sats
  created_at: string;
  attachments?: string[]; // URLs to documents, images, etc.
  votes?: {
    up: number;
    down: number;
    total: number;
  };
}

export interface ResearchVote {
  id: string;
  user_id: string;
  research_entity_id: string;
  vote_type: 'direction' | 'priority' | 'impact' | 'continuation';
  choice: string | number; // For multiple choice or rating
  weight?: number; // Voting power based on contribution
  created_at: string;
}

export interface FundingContribution {
  id: string;
  user_id: string;
  amount_sats: number;
  funding_model: FundingModel;
  message?: string;
  anonymous: boolean;
  created_at: string;
  lightning_invoice?: string;
  onchain_tx?: string;
}

export interface ResearchEntity extends BaseEntity {
  // Basic Research Info
  title: string;
  description: string;
  field: ResearchField;
  methodology: ResearchMethodology;
  expected_outcome: string;
  timeline: TimelineType;

  // Funding
  funding_goal_sats: number;
  funding_raised_sats: number;
  funding_model: FundingModel;
  wallet_address: string; // Unique BTC wallet per research entity

  // Team
  lead_researcher: string;
  team_members: TeamMember[];
  open_collaboration: boolean;

  // Resources
  resource_needs: ResourceNeed[];

  // Progress & Transparency
  progress_frequency: ProgressFrequency;
  transparency_level: TransparencyLevel;
  voting_enabled: boolean;
  current_milestone?: string;
  next_deadline?: string;

  // Impact
  impact_areas: ImpactArea[];
  target_audience: string[];
  sdg_alignment: SDGAlignment[];

  // Progress Tracking
  progress_updates: ResearchProgress[];
  total_votes: number;
  average_rating?: number;

  // Funding History
  contributions: FundingContribution[];
  total_contributors: number;

  // Computed Fields
  completion_percentage: number;
  days_active: number;
  funding_velocity: number; // sats per day

  // Social Proof
  follower_count: number;
  share_count: number;
  citation_count: number;
}

export interface ResearchEntityCreate extends Omit<ResearchEntity, keyof BaseEntity | 'funding_raised_sats' | 'progress_updates' | 'contributions' | 'total_contributors' | 'completion_percentage' | 'days_active' | 'funding_velocity' | 'follower_count' | 'share_count' | 'citation_count' | 'total_votes' | 'average_rating'> {
  // Additional fields for creation
}

export interface ResearchEntityUpdate extends Partial<ResearchEntityCreate> {
  // Update-specific fields can be added here
}

export interface ResearchEntityStats {
  total_entities: number;
  total_funding_raised: number;
  total_researchers: number;
  active_projects: number;
  completed_projects: number;
  average_completion_rate: number;
  top_research_fields: Array<{
    field: ResearchField;
    count: number;
    total_funding: number;
  }>;
  funding_distribution: {
    donation: number;
    subscription: number;
    milestone: number;
    royalty: number;
    hybrid: number;
  };
}