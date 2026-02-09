export interface OrganizationGroup {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  label: string;
  is_public: boolean;
  bitcoin_address: string | null;
  lightning_address: string | null;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  role: string;
  status: string;
  joined_at: string;
  voting_weight: number;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
}

export interface OrganizationProposal {
  id: string;
  title: string;
  status: string;
  proposal_type: string;
  proposer_id: string;
  voting_ends_at: string | null;
  voting_results: {
    yes_votes: number;
    no_votes: number;
    abstain_votes: number;
  } | null;
  proposer: {
    name: string | null;
    avatar_url: string | null;
  } | null;
  created_at: string;
}
