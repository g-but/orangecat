/**
 * Search Query Functions
 *
 * Handles all database queries for search operations.
 * Separated from main search.ts for better modularity and testability.
 *
 * Created: 2025-01-30
 * Last Modified: 2025-01-30
 * Last Modified Summary: Extracted from search.ts to complete modular refactoring
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import { PROJECT_STATUS, PUBLIC_SEARCH_STATUSES } from '@/config/project-statuses';
import { DATABASE_TABLES } from '@/config/database-tables';
import { getTableName } from '@/config/entity-registry';
import type {
  SearchProfile,
  SearchFundingPage,
  SearchLoan,
  SearchFilters,
  RawSearchProfile,
  RawSearchProject,
  RawSearchLoan,
  ProfileReference,
} from './types';

/**
 * Search profiles with filters
 */
export async function searchProfiles(
  query?: string,
  filters?: SearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SearchProfile[]> {
  // Start with minimal columns for better performance
  let profileQuery = supabase
    .from(DATABASE_TABLES.PROFILES)
    .select(
      'id, username, name, bio, avatar_url, created_at, location_country, location_city, location_zip, latitude, longitude'
    );

  // Priority 1: If radius is specified, use PostGIS RPC (handles both query and radius)
  if (filters?.radius_km && filters.lat !== undefined && filters.lng !== undefined) {
    try {
      const { data, error } = await supabase.rpc('search_profiles_nearby', {
        p_lat: filters.lat,
        p_lng: filters.lng,
        p_radius_km: filters.radius_km,
        p_query: query || null,
        p_limit: limit,
        p_offset: offset,
      } as any);

      if (!error && data) {
        // Apply additional location filters if needed
        let results = data as RawSearchProfile[];
        if (filters.country) {
          results = results.filter(p => p.location_country === filters.country!.toUpperCase());
        }
        if (filters.city) {
          const sanitizedCity = filters.city.replace(/[%_]/g, '\\$&');
          results = results.filter(p =>
            p.location_city?.toLowerCase().includes(sanitizedCity.toLowerCase())
          );
        }
        if (filters.postal_code) {
          results = results.filter(p => p.location_zip === filters.postal_code);
        }

        return results.map(p => ({
          ...p,
          name: p.name,
        }));
      }
    } catch (rpcError) {
      // Fall back to bounding box if RPC not available
      logger.warn('PostGIS RPC not available, using bounding box', rpcError, 'Search');
    }
  }

  // Priority 2: If query is specified (and no radius), use full-text search RPC
  if (query) {
    try {
      const { data, error } = await supabase.rpc('search_profiles_fts', {
        p_query: query,
        p_limit: limit,
        p_offset: offset,
      } as any);

      if (!error && data) {
        // Apply location filters to RPC results if needed
        let results = data as RawSearchProfile[];
        if (filters) {
          if (filters.country) {
            results = results.filter(p => p.location_country === filters.country!.toUpperCase());
          }
          if (filters.city) {
            const sanitizedCity = filters.city.replace(/[%_]/g, '\\$&');
            results = results.filter(p =>
              p.location_city?.toLowerCase().includes(sanitizedCity.toLowerCase())
            );
          }
          if (filters.postal_code) {
            results = results.filter(p => p.location_zip === filters.postal_code);
          }
        }

        return results.map(p => ({
          ...p,
          name: p.name,
        }));
      }
    } catch (rpcError) {
      // Fall back to ILIKE if RPC function doesn't exist yet
      logger.warn('Full-text search RPC not available, using ILIKE', rpcError, 'Search');
    }
  }

  // Fallback: Use standard Supabase query builder with ILIKE
  if (query) {
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
    profileQuery = profileQuery.or(
      `username.ilike.%${sanitizedQuery}%,name.ilike.%${sanitizedQuery}%,bio.ilike.%${sanitizedQuery}%`
    );
  }

  // Apply location filters
  if (filters) {
    if (filters.country) {
      profileQuery = profileQuery.eq('location_country', filters.country.toUpperCase());
    }

    if (filters.city) {
      const sanitizedCity = filters.city.replace(/[%_]/g, '\\$&');
      profileQuery = profileQuery.ilike('location_city', `%${sanitizedCity}%`);
    }

    if (filters.postal_code) {
      profileQuery = profileQuery.eq('location_zip', filters.postal_code);
    }

    // Bounding box fallback for radius (if PostGIS RPC failed)
    if (filters.radius_km && filters.lat !== undefined && filters.lng !== undefined) {
      const radiusDegrees = filters.radius_km / 111.0;
      profileQuery = profileQuery
        .gte('latitude', filters.lat - radiusDegrees)
        .lte('latitude', filters.lat + radiusDegrees)
        .gte('longitude', filters.lng - radiusDegrees)
        .lte('longitude', filters.lng + radiusDegrees);
    }
  }

  // Use created_at index for better performance
  const { data: profiles, error } = await profileQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }

  let results = ((profiles as RawSearchProfile[]) || []).map(p => ({
    ...p,
    name: p.name,
  }));

  // Apply precise radius filtering if needed (Haversine formula)
  // Note: This is fallback code - PostGIS RPC is prioritized above
  if (filters?.radius_km && filters.lat !== undefined && filters.lng !== undefined) {
    results = results.filter(profile => {
      if (!profile.latitude || !profile.longitude) {
        return false;
      }

      // Haversine formula for precise distance calculation
      const R = 6371; // Earth's radius in km
      const dLat = ((profile.latitude - filters.lat!) * Math.PI) / 180;
      const dLon = ((profile.longitude - filters.lng!) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((filters.lat! * Math.PI) / 180) *
          Math.cos((profile.latitude * Math.PI) / 180) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c;

      return distance <= filters.radius_km!;
    });
  }

  return results;
}

/**
 * Search projects with filters
 */
export async function searchFundingPages(
  query?: string,
  filters?: SearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SearchFundingPage[]> {
  // Only select necessary columns to reduce payload
  // Note: location columns (location_city, location_country, location_coordinates) don't exist in projects table
  let projectQuery = supabase.from(getTableName('project')).select(
    `
      id, user_id, title, description, bitcoin_address,
      created_at, updated_at, category, status, goal_amount, currency, raised_amount,
      cover_image_url
    `
  );

  // Priority 1: If radius is specified, use PostGIS RPC (handles both query and radius)
  if (filters?.radius_km && filters.lat !== undefined && filters.lng !== undefined) {
    try {
      const { data, error } = await supabase.rpc('search_projects_nearby', {
        p_lat: filters.lat,
        p_lng: filters.lng,
        p_radius_km: filters.radius_km,
        p_query: query || null,
        p_limit: limit,
        p_offset: offset,
      } as any);

      if (!error && data) {
        // Apply additional filters to RPC results
        let results = data as RawSearchProject[];
        if (filters.statuses && filters.statuses.length > 0) {
          results = results.filter(p =>
            filters.statuses!.includes(p.status as 'active' | 'paused' | 'completed' | 'cancelled')
          );
        } else if (filters.isActive !== undefined) {
          if (filters.isActive) {
            results = results.filter(p => p.status === PROJECT_STATUS.ACTIVE);
          } else {
            results = results.filter(p => p.status !== PROJECT_STATUS.ACTIVE);
          }
        } else {
          // Default: Show active and paused projects
          results = results.filter(p =>
            ([PROJECT_STATUS.ACTIVE, PROJECT_STATUS.PAUSED] as string[]).includes(p.status)
          );
        }

        if (filters.categories && filters.categories.length > 0) {
          results = results.filter(p => filters.categories!.includes(p.category || ''));
        }
        if (filters.hasGoal) {
          results = results.filter(p => p.goal_amount !== null);
        }
        if (filters.minFunding !== undefined) {
          results = results.filter(p => (p.raised_amount || 0) >= filters.minFunding!);
        }
        if (filters.maxFunding !== undefined) {
          results = results.filter(p => (p.raised_amount || 0) <= filters.maxFunding!);
        }
        if (filters.dateRange) {
          results = results.filter(
            p => p.created_at >= filters.dateRange!.start && p.created_at <= filters.dateRange!.end
          );
        }
        // Location filters removed - projects table doesn't have location columns

        // Fetch profiles for projects
        const userIds = [...new Set(results.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from(DATABASE_TABLES.PROFILES)
          .select('id, username, name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(
          (profiles as ProfileReference[] | null)?.map(p => [
            p.id,
            {
              ...p,
              name: p.name,
            },
          ]) || []
        );

        return results.map(project => {
          const coverImageUrl = project.cover_image_url;
          return {
            ...project,
            raised_amount: project.raised_amount || 0,
            cover_image_url: coverImageUrl,
            banner_url: coverImageUrl,
            featured_image_url: coverImageUrl,
            profiles: profileMap.get(project.user_id),
          };
        });
      }
    } catch (rpcError) {
      // Fall back to application-layer filtering if RPC not available
      logger.warn('PostGIS RPC not available, using application filtering', rpcError, 'Search');
    }
  }

  // Priority 2: If query is specified (and no radius), use full-text search RPC
  if (query) {
    try {
      const { data, error } = await supabase.rpc('search_projects_fts', {
        p_query: query,
        p_limit: limit,
        p_offset: offset,
      } as any);

      if (!error && data) {
        // Apply filters to RPC results
        let results = data as RawSearchProject[];
        if (filters) {
          if (filters.statuses && filters.statuses.length > 0) {
            results = results.filter(p =>
              filters.statuses!.includes(
                p.status as 'active' | 'paused' | 'completed' | 'cancelled'
              )
            );
          } else if (filters.isActive !== undefined) {
            if (filters.isActive) {
              results = results.filter(p => p.status === PROJECT_STATUS.ACTIVE);
            } else {
              results = results.filter(p => p.status !== PROJECT_STATUS.ACTIVE);
            }
          } else {
            // Default: Show active and paused projects (public search statuses)
            results = results.filter(p =>
              PUBLIC_SEARCH_STATUSES.includes(p.status as (typeof PUBLIC_SEARCH_STATUSES)[number])
            );
          }

          if (filters.categories && filters.categories.length > 0) {
            results = results.filter(p => filters.categories!.includes(p.category || ''));
          }
          if (filters.hasGoal) {
            results = results.filter(p => p.goal_amount !== null);
          }
          if (filters.minFunding !== undefined) {
            results = results.filter(p => (p.raised_amount || 0) >= filters.minFunding!);
          }
          if (filters.maxFunding !== undefined) {
            results = results.filter(p => (p.raised_amount || 0) <= filters.maxFunding!);
          }
          if (filters.dateRange) {
            results = results.filter(
              p =>
                p.created_at >= filters.dateRange!.start && p.created_at <= filters.dateRange!.end
            );
          }
          // Location filters removed - projects table doesn't have location columns
        }

        // Fetch profiles for projects
        const userIds = [...new Set(results.map(p => p.user_id))];
        const { data: profiles } = await supabase
          .from(DATABASE_TABLES.PROFILES)
          .select('id, username, name, avatar_url')
          .in('id', userIds);

        const profileMap = new Map(
          (profiles as ProfileReference[] | null)?.map(p => [
            p.id,
            {
              ...p,
              name: p.name,
            },
          ]) || []
        );

        // Transform and return
        return results.map(project => {
          const coverImageUrl = project.cover_image_url;
          return {
            ...project,
            raised_amount: project.raised_amount || 0,
            cover_image_url: coverImageUrl,
            banner_url: coverImageUrl,
            featured_image_url: coverImageUrl,
            profiles: profileMap.get(project.user_id),
          };
        });
      }
    } catch (rpcError) {
      // Fall back to ILIKE if RPC function doesn't exist yet
      logger.warn('Full-text search RPC not available, using ILIKE', rpcError, 'Search');
    }
  }

  // Fallback: Use standard Supabase query builder with ILIKE
  if (query) {
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
    projectQuery = projectQuery.or(
      `title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`
    );
  }

  // Apply filters
  if (filters) {
    // Status filtering
    if (filters.statuses && filters.statuses.length > 0) {
      projectQuery = projectQuery.in('status', filters.statuses);
    } else if (filters.isActive !== undefined) {
      // Deprecated: backward compatibility
      if (filters.isActive) {
        projectQuery = projectQuery.eq('status', PROJECT_STATUS.ACTIVE);
      } else {
        projectQuery = projectQuery.neq('status', PROJECT_STATUS.ACTIVE);
      }
    } else {
      // Default: Show active and paused projects (public search statuses)
      projectQuery = projectQuery.in('status', PUBLIC_SEARCH_STATUSES as string[]);
    }

    if (filters.categories && filters.categories.length > 0) {
      projectQuery = projectQuery.in('category', filters.categories);
    }

    if (filters.hasGoal) {
      projectQuery = projectQuery.not('goal_amount', 'is', null);
    }

    if (filters.minFunding !== undefined) {
      projectQuery = projectQuery.gte('raised_amount', filters.minFunding);
    }

    if (filters.maxFunding !== undefined) {
      projectQuery = projectQuery.lte('raised_amount', filters.maxFunding);
    }

    if (filters.dateRange) {
      projectQuery = projectQuery
        .gte('created_at', filters.dateRange.start)
        .lte('created_at', filters.dateRange.end);
    }

    // Location filters - REMOVED: projects table doesn't have location columns
    // Projects don't have location_city, location_country, or location_coordinates columns
  }

  // Use index-friendly ordering
  const { data: rawProjects, error } = await projectQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw error;
  }
  if (!rawProjects || rawProjects.length === 0) {
    return [];
  }

  // Apply radius filtering - REMOVED: projects don't have location_coordinates
  // Projects table doesn't have location columns, so radius filtering is not supported
  const filteredProjects = rawProjects;

  // Fetch profiles for all projects in parallel
  const userIds = [...new Set((filteredProjects as RawSearchProject[]).map(p => p.user_id))];
  const { data: profiles } = await supabase
    .from(DATABASE_TABLES.PROFILES)
    .select('id, username, name, avatar_url')
    .in('id', userIds);

  // Create a map of user_id to profile for quick lookup
  const profileMap = new Map(
    (profiles as ProfileReference[] | null)?.map(p => [
      p.id,
      {
        ...p,
        name: p.name,
      },
    ]) || []
  );

  // Transform projects with profile data
  const projects: SearchFundingPage[] = (filteredProjects as RawSearchProject[]).map(project => {
    // Get first project_media image as fallback if cover_image_url is not set
    const coverImageUrl = project.cover_image_url;
    // project_media table doesn't exist - removed media processing

    return {
      ...project,
      raised_amount: project.raised_amount || 0,
      cover_image_url: coverImageUrl,
      banner_url: coverImageUrl, // Map for compatibility
      featured_image_url: coverImageUrl, // Map for compatibility
      profiles: profileMap.get(project.user_id),
      project_media: undefined, // Remove to reduce payload
    };
  });

  return projects;
}

/**
 * Get search suggestions from database
 */
export async function getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&');

    // Use Promise.all for parallel suggestion queries
    const [profileSuggestions, projectSuggestions] = await Promise.all([
      supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('username, name')
        .or(`username.ilike.%${sanitizedQuery}%,name.ilike.%${sanitizedQuery}%`)
        .not('username', 'is', null)
        .limit(limit),

      supabase
        .from(getTableName('project'))
        .select('title, category')
        .or(`title.ilike.%${sanitizedQuery}%,category.ilike.%${sanitizedQuery}%`)
        .in('status', PUBLIC_SEARCH_STATUSES as string[])
        .limit(limit),
    ]);

    const suggestions: Set<string> = new Set();

    // Add profile suggestions
    if (!profileSuggestions.error && profileSuggestions.data) {
      (profileSuggestions.data as Array<{ username?: string; name?: string }>).forEach(profile => {
        if (profile.username) {
          suggestions.add(profile.username);
        }
        if (profile.name) {
          suggestions.add(profile.name);
        }
      });
    }

    // Add project suggestions
    if (!projectSuggestions.error && projectSuggestions.data) {
      (projectSuggestions.data as Array<{ title?: string; category?: string }>).forEach(project => {
        if (project.title) {
          suggestions.add(project.title);
        }
        if (project.category) {
          suggestions.add(project.category);
        }
      });
    }

    return Array.from(suggestions).slice(0, limit);
  } catch (error) {
    logger.error('Error getting search suggestions', error, 'Search');
    return [];
  }
}

/**
 * Get trending content
 */
export async function getTrending(): Promise<{
  projects: SearchFundingPage[];
  profiles: SearchProfile[];
}> {
  try {
    const [projectsData, profilesData] = await Promise.all([
      supabase
        .from(getTableName('project'))
        .select(
          `
          id, user_id, title, description, bitcoin_address,
          created_at, updated_at, category, status, goal_amount, raised_amount,
          cover_image_url
        `
        )
        .in('status', PUBLIC_SEARCH_STATUSES as string[])
        .order('created_at', { ascending: false })
        .limit(10),

      supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('id, username, name, bio, avatar_url, created_at')
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    // Process projects with profile data
    let projects: SearchFundingPage[] = [];
    if (!projectsData.error && projectsData.data) {
      const projectResults = projectsData.data as RawSearchProject[];
      const userIds = [...new Set(projectResults.map(p => p.user_id))];
      const { data: projectProfiles } = await supabase
        .from(DATABASE_TABLES.PROFILES)
        .select('id, username, name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(
        (projectProfiles as ProfileReference[] | null)?.map(p => [p.id, { ...p, name: p.name }]) ||
          []
      );

      projects = projectResults.map(project => {
        const coverImageUrl = project.cover_image_url;
        return {
          ...project,
          raised_amount: project.raised_amount || 0,
          cover_image_url: coverImageUrl,
          banner_url: coverImageUrl,
          featured_image_url: coverImageUrl,
          profiles: profileMap.get(project.user_id),
        };
      });
    }

    // Process profiles
    const profiles: SearchProfile[] = [];
    if (!profilesData.error && profilesData.data) {
      (profilesData.data as RawSearchProfile[]).forEach(profile => {
        profiles.push({
          ...profile,
          name: profile.name,
        });
      });
    }

    return { projects, profiles };
  } catch (error) {
    logger.error('Error getting trending content', error, 'Search');
    return { projects: [], profiles: [] };
  }
}

/**
 * Search loans with filters
 */
export async function searchLoans(
  query?: string,
  filters?: SearchFilters,
  limit: number = 20,
  offset: number = 0
): Promise<SearchLoan[]> {
  // Only select necessary columns for better performance
  let loanQuery = supabase
    .from(getTableName('loan'))
    .select(
      `
      id, user_id, title, description, loan_category_id,
      original_amount, remaining_balance, interest_rate, monthly_payment,
      currency, status, loan_type, is_public, is_negotiable,
      created_at, updated_at
    `
    )
    .eq('is_public', true)
    .eq('status', 'active');

  // Apply text search if query provided
  if (query) {
    const sanitizedQuery = query.replace(/[%_]/g, '\\$&');
    loanQuery = loanQuery.or(
      `title.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`
    );
  }

  // Apply filters
  if (filters) {
    // Note: Loans don't have categories in the same way as projects
    // but we could filter by loan_category_id if needed
    // For now, we'll focus on basic search functionality
  }

  // Use index-friendly ordering
  const { data: rawLoans, error } = await loanQuery
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    logger.warn('Error searching loans', error, 'Search');
    return [];
  }

  if (!rawLoans || rawLoans.length === 0) {
    return [];
  }

  // Fetch profiles for all loans in parallel
  const loanResults = rawLoans as RawSearchLoan[];
  const userIds = [...new Set(loanResults.map(l => l.user_id))];
  const { data: profiles } = await supabase
    .from(DATABASE_TABLES.PROFILES)
    .select('id, username, name, avatar_url')
    .in('id', userIds);

  // Create a map of user_id to profile for quick lookup
  const profileMap = new Map(
    (profiles as ProfileReference[] | null)?.map(p => [p.id, { ...p, name: p.name }]) || []
  );

  // Transform loans with profile data
  const loans: SearchLoan[] = loanResults.map(loan => ({
    ...loan,
    profiles: profileMap.get(loan.user_id),
  }));

  return loans;
}
