/**
 * Search Service Types
 *
 * All type definitions for the search service.
 * Single source of truth for search-related interfaces.
 *
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted from search.ts for better modularity
 */

// ==================== SEARCH RESULT TYPES ====================

export interface SearchProfile {
  id: string;
  username: string | null;
  name: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at: string;
}

export interface SearchFundingPage {
  id: string;
  user_id: string;
  title: string;
  description: string;
  bitcoin_address: string | null;
  category: string | null;
  status: string;
  goal_amount: number | null;
  raised_amount: number;
  created_at: string;
  updated_at: string;
  banner_url?: string | null;
  featured_image_url?: string | null;
  profiles?: {
    id: string;
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  };
}

// Raw type from Supabase (before transformation)
export interface RawSearchFundingPage {
  id: string;
  user_id: string;
  title: string;
  description: string;
  bitcoin_address: string | null;
  category: string | null;
  status: string;
  goal_amount: number | null;
  raised_amount: number;
  created_at: string;
  updated_at: string;
  profiles: Array<{
    id: string;
    username: string | null;
    name: string | null;
    avatar_url: string | null;
  }>;
}

export type SearchResult = {
  type: 'profile' | 'project';
  data: SearchProfile | SearchFundingPage;
  relevanceScore?: number;
};

// ==================== SEARCH OPTIONS ====================

export type SearchType = 'all' | 'profiles' | 'projects';
export type SortOption = 'relevance' | 'recent';

export interface SearchFilters {
  categories?: string[];
  statuses?: ('active' | 'paused' | 'completed' | 'cancelled')[]; // Filter by project status
  isActive?: boolean; // Deprecated: use statuses instead
  hasGoal?: boolean;
  minFunding?: number;
  maxFunding?: number;
  dateRange?: {
    start: string;
    end: string;
  };
  // Geographic filters (now implemented!)
  country?: string;
  city?: string;
  postal_code?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
}

export interface SearchOptions {
  query?: string;
  type: SearchType;
  sortBy: SortOption;
  filters?: SearchFilters;
  limit?: number;
  offset?: number;
}

export interface SearchResponse {
  results: SearchResult[];
  totalCount: number;
  hasMore: boolean;
  facets?: {
    categories: Array<{ name: string; count: number }>;
    totalProfiles: number;
    totalProjects: number;
  };
}


