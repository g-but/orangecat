/**
 * PEOPLE SERVICE
 *
 * Social networking service for user connections and people search
 *
 * Created: 2025-10-24
 * Last Modified: 2025-10-24
 * Last Modified Summary: Created basic people service implementation
 */

import { supabase } from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';

export interface PeopleSearchFilters {
  query?: string;
  limit?: number;
  offset?: number;
}

export interface Connection {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface ConnectionRequest {
  requester_id: string;
  addressee_id: string;
  message?: string;
}

export class PeopleService {
  /**
   * Search for people by username or name
   */
  static async searchPeople(filters: PeopleSearchFilters = {}) {
    const { query = '', limit = 10, offset = 0 } = filters;

    try {
      let queryBuilder = supabase
        .from('profiles')
        .select('*')
        .range(offset, offset + limit - 1);

      if (query.trim()) {
        queryBuilder = queryBuilder.or(`username.ilike.%${query}%,name.ilike.%${query}%`);
      }

      const { data, error } = await queryBuilder;

      if (error) {
        logger.error('People search failed:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      logger.error('People search unexpected error:', err);
      return { data: [], error: 'Search failed' };
    }
  }

  /**
   * Send connection request
   */
  static async sendConnectionRequest(request: ConnectionRequest) {
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          requester_id: request.requester_id,
          addressee_id: request.addressee_id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        logger.error('Connection request failed:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      logger.error('Connection request unexpected error:', err);
      return { data: null, error: 'Connection request failed' };
    }
  }

  /**
   * Get user connections
   */
  static async getConnections(userId: string) {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select(
          `
          *,
          requester:profiles!requester_id(*),
          addressee:profiles!addressee_id(*)
        `
        )
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      if (error) {
        logger.error('Get connections failed:', error);
        return { data: [], error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      logger.error('Get connections unexpected error:', err);
      return { data: [], error: 'Get connections failed' };
    }
  }

  /**
   * Respond to connection request
   */
  static async respondToConnection(connectionId: string, response: 'accept' | 'reject') {
    try {
      const { data, error } = await supabase
        .from('connections')
        .update({ status: response === 'accept' ? 'accepted' : 'rejected' })
        .eq('id', connectionId)
        .select()
        .single();

      if (error) {
        logger.error('Connection response failed:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      logger.error('Connection response unexpected error:', err);
      return { data: null, error: 'Connection response failed' };
    }
  }

  /**
   * Get user analytics for people features
   */
  static async getUserAnalytics(userId: string) {
    try {
      // Get connection count
      const { count: connectionsCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
        .eq('status', 'accepted');

      // Get pending requests count
      const { count: pendingCount } = await supabase
        .from('connections')
        .select('*', { count: 'exact', head: true })
        .eq('addressee_id', userId)
        .eq('status', 'pending');

      return {
        data: {
          connectionsCount: connectionsCount || 0,
          pendingRequestsCount: pendingCount || 0,
          totalInteractions: (connectionsCount || 0) + (pendingCount || 0),
        },
        error: null,
      };
    } catch (err) {
      logger.error('User analytics failed:', err);
      return { data: null, error: 'Analytics failed' };
    }
  }
}
