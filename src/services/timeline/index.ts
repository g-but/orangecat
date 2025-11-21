/**
 * TIMELINE SERVICE - Unified Activity Feed System
 *
 * Provides comprehensive timeline functionality for OrangeCat:
 * - Project milestones and funding events
 * - User activities and social interactions
 * - Community events and collaborations
 * - Bitcoin transaction tracking with rich context
 *
 * Created: 2025-11-13
 * Last Modified: 2025-11-13
 * Last Modified Summary: Initial implementation of comprehensive timeline service
 */

import supabase from '@/lib/supabase/browser';
import { logger } from '@/utils/logger';
import {
  TimelineEvent,
  TimelineDisplayEvent,
  TimelineEventType,
  TimelineEventSubtype,
  TimelineActorType,
  TimelineSubjectType,
  TimelineVisibility,
  TimelineFeedRequest,
  TimelineFeedResponse,
  CreateTimelineEventRequest,
  TimelineEventResponse,
  TimelineEventDb,
  TimelineEventInput,
  TimelineFilters,
  TimelinePagination,
} from '@/types/timeline';
import {
  Heart,
  MessageCircle,
  Share2,
  Rocket,
  Zap,
  Trophy,
  Target,
  Bitcoin,
  User,
  Users,
  Star,
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  Plus,
  Minus,
} from 'lucide-react';

class TimelineService {
  private readonly DEFAULT_PAGE_SIZE = 20;
  private readonly MAX_PAGE_SIZE = 100;

  // ==================== EVENT CREATION ====================

  /**
   * Create a new timeline event with visibility contexts (no duplicates)
   * This is the NEW preferred method for creating posts with cross-posting support
   */
  async createEventWithVisibility(
    request: CreateTimelineEventRequest & {
      timelineContexts?: Array<{
        timeline_type: 'profile' | 'project' | 'community';
        timeline_owner_id: string | null;
      }>;
    }
  ): Promise<TimelineEventResponse> {
    try {
      // Get current user if actorId not provided
      let actorId = request.actorId;
      if (!actorId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return { success: false, error: 'Authentication required' };
        }
        actorId = user.id;
      }

      // Validate required fields
      const validation = this.validateEventRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Prepare timeline contexts as JSONB array
      const timelineContextsJson = (request.timelineContexts || []).map(ctx => ({
        timeline_type: ctx.timeline_type,
        timeline_owner_id: ctx.timeline_owner_id,
      }));

      // Use database function to create post with visibility contexts
      // The function returns JSONB, so we need to parse it
      const { data, error } = await supabase.rpc('create_post_with_visibility', {
        p_event_type: request.eventType || 'post_created',
        p_actor_id: actorId,
        p_subject_type: request.subjectType || 'profile',
        p_subject_id: request.subjectId || null,
        p_title: request.title,
        p_description: request.description || null,
        p_visibility: request.visibility || 'public',
        p_metadata: request.metadata || {},
        p_timeline_contexts: timelineContextsJson as any, // Supabase will handle JSONB conversion
      });

      if (error) {
        logger.error('Failed to create post with visibility', { error, data }, 'Timeline');

        // Provide more specific error messages
        if (error.message?.includes('function') && error.message?.includes('does not exist')) {
          return {
            success: false,
            error: 'Posting feature is not available. Please contact support if this persists.',
          };
        }

        if (error.message?.includes('permission') || error.message?.includes('policy')) {
          return {
            success: false,
            error: 'You do not have permission to post here. Please check your account status.',
          };
        }

        return {
          success: false,
          error: error.message || 'Failed to create post. Please try again.',
        };
      }

      // Handle case where data might be null or undefined
      if (!data) {
        logger.error('Function returned no data', { error, request }, 'Timeline');
        return { success: false, error: 'No response from server. Please try again.' };
      }

      // Parse the JSONB response
      let result: any;
      if (typeof data === 'string') {
        try {
          result = JSON.parse(data);
        } catch (parseError) {
          logger.error('Failed to parse function response', { parseError, data }, 'Timeline');
          return { success: false, error: 'Invalid response from server. Please try again.' };
        }
      } else if (typeof data === 'object') {
        result = data;
      } else {
        logger.error('Unexpected data type from function', { data, type: typeof data }, 'Timeline');
        return { success: false, error: 'Unexpected response format. Please try again.' };
      }

      // Check if the function returned success
      if (!result || result.success === false) {
        logger.error('Function returned unsuccessful result', { result, request }, 'Timeline');
        return {
          success: false,
          error: result?.error || 'Failed to create post. Please try again.',
        };
      }

      // Extract post_id - handle both direct property and nested structure
      const postId = result.post_id || result.data?.post_id || result.id;

      if (!postId) {
        logger.error('No post_id in function response', { result }, 'Timeline');
        return { success: false, error: 'Post created but could not retrieve ID. Please refresh.' };
      }

      // Fetch the created event
      const { data: event, error: fetchError } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('id', postId)
        .single();

      if (fetchError) {
        logger.error('Failed to fetch created post', fetchError, 'Timeline');
        return { success: false, error: 'Post created but could not retrieve details' };
      }

      const timelineEvent = this.mapDbEventToTimelineEvent(event);

      return {
        success: true,
        event: timelineEvent,
        metadata: {
          visibility_count: result.visibility_count || 0,
        },
      };
    } catch (error: any) {
      logger.error('Error creating post with visibility', { error, request }, 'Timeline');

      // Provide more helpful error messages
      if (error?.message?.includes('function') && error?.message?.includes('does not exist')) {
        logger.warn(
          'create_post_with_visibility function not found, falling back to legacy method',
          {},
          'Timeline'
        );
        // Fallback to legacy createEvent method
        return this.createEvent(request);
      }

      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        return {
          success: false,
          error: 'Network error. Please check your connection and try again.',
        };
      }

      return {
        success: false,
        error: error?.message || 'Failed to create post. Please try again.',
      };
    }
  }

  /**
   * Create a new timeline event (LEGACY - prefer createEventWithVisibility for posts)
   */
  async createEvent(request: CreateTimelineEventRequest): Promise<TimelineEventResponse> {
    try {
      // Get current user if actorId not provided
      let actorId = request.actorId;
      if (!actorId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          return { success: false, error: 'Authentication required' };
        }
        actorId = user.id;
      }

      // Validate required fields based on event type
      const validation = this.validateEventRequest(request);
      if (!validation.valid) {
        return { success: false, error: validation.error };
      }

      // Prepare event data - match database function parameter names exactly
      const eventData = {
        p_event_type: request.eventType || 'post_created',
        p_subject_type: request.subjectType || 'profile',
        p_title: request.title,
        p_event_subtype: request.eventSubtype || null,
        p_actor_id: actorId,
        p_actor_type: 'user' as TimelineActorType,
        p_subject_id: request.subjectId || null,
        p_target_type: request.targetType || null,
        p_target_id: request.targetId || null,
        p_description: request.description || null,
        p_content: request.content || {},
        p_amount_sats: request.amountSats || null,
        p_amount_btc: request.amountBtc || null,
        p_quantity: request.quantity || null,
        p_visibility: request.visibility || 'public',
        p_is_featured: request.isFeatured || false,
        p_metadata: request.metadata || {},
        p_tags: request.tags || [],
        p_parent_event_id: request.parentEventId || null,
        p_thread_id: request.threadId || null,
      };

      // Create event using database function
      let eventId: string;

      try {
        const { data, error } = await supabase.rpc('create_timeline_event', eventData);

        if (error) {
          logger.error('Failed to create timeline event', error, 'Timeline');
          return { success: false, error: error.message };
        }

        eventId = data;
      } catch (dbError) {
        logger.error('Failed to execute timeline creation RPC', dbError, 'Timeline');
        return { success: false, error: 'Timeline service unavailable' };
      }

      // Fetch the created event (only if database function succeeded)
      const { data: event, error: fetchError } = await supabase
        .from('timeline_events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (fetchError) {
        logger.error('Failed to fetch created timeline event', fetchError, 'Timeline');
        return { success: false, error: 'Event created but could not retrieve details' };
      }

      const timelineEvent = this.mapDbEventToTimelineEvent(event);

      // Trigger any post-creation hooks
      await this.handlePostCreationHooks(timelineEvent);

      return { success: true, event: timelineEvent };
    } catch (error) {
      logger.error('Error creating timeline event', error, 'Timeline');
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Create project-related events automatically
   */
  async createProjectEvent(
    projectId: string,
    eventType: TimelineEventType,
    userId: string,
    additionalData?: Partial<CreateTimelineEventRequest>
  ): Promise<TimelineEventResponse> {
    // Get project details
    const { data: project } = await supabase
      .from('projects')
      .select('title, description, goal_amount, currency')
      .eq('id', projectId)
      .single();

    if (!project) {
      return { success: false, error: 'Project not found' };
    }

    const title = this.generateProjectEventTitle(eventType, project.title, additionalData);
    const description = this.generateProjectEventDescription(eventType, project, additionalData);

    return this.createEvent({
      eventType,
      actorId: userId,
      subjectType: 'project',
      subjectId: projectId,
      title,
      description,
      visibility: 'public',
      isFeatured: this.shouldFeatureProjectEvent(eventType),
      metadata: {
        project_title: project.title,
        project_goal: project.goal_amount,
        project_currency: project.currency,
        ...additionalData?.metadata,
      },
      ...additionalData,
    });
  }

  /**
   * Create transaction-related events
   */
  async createTransactionEvent(
    transactionId: string,
    projectId: string,
    donorId: string,
    amountSats: number,
    amountBtc: number,
    eventType: 'donation_received' | 'donation_sent' = 'donation_received'
  ): Promise<TimelineEventResponse> {
    // Get transaction and project details
    const { data: transaction } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single();

    const { data: project } = await supabase
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    const { data: donor } = await supabase
      .from('profiles')
      .select('username, display_name')
      .eq('id', donorId)
      .single();

    if (!transaction || !project) {
      return { success: false, error: 'Transaction or project not found' };
    }

    const title =
      eventType === 'donation_received'
        ? `Received ₿${amountBtc.toFixed(6)} donation`
        : `Sent ₿${amountBtc.toFixed(6)} donation`;

    const description =
      eventType === 'donation_received'
        ? `${donor?.display_name || donor?.username || 'Anonymous'} donated ₿${amountBtc.toFixed(6)} to ${project.title}`
        : `Donated ₿${amountBtc.toFixed(6)} to ${project.title}`;

    return this.createEvent({
      eventType,
      actorId: donorId,
      subjectType: 'transaction',
      subjectId: transactionId,
      targetType: 'project',
      targetId: projectId,
      title,
      description,
      amountSats,
      amountBtc,
      visibility: 'public',
      metadata: {
        transaction_id: transactionId,
        project_id: projectId,
        project_title: project.title,
        donor_name: donor?.display_name || donor?.username,
        is_anonymous: !donor?.display_name && !donor?.username,
      },
    });
  }

  // ==================== EVENT QUERYING ====================

  /**
   * Get user's personalized timeline feed
   */
  async getUserFeed(
    userId: string,
    filters?: Partial<TimelineFilters>,
    pagination?: Partial<TimelinePagination>
  ): Promise<TimelineFeedResponse> {
    try {
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const offset = (page - 1) * limit;

      // Build filter conditions
      let query = supabase.rpc('get_user_timeline_feed', {
        p_user_id: userId,
        p_limit: limit,
        p_offset: offset,
      });

      // Apply additional filters
      if (filters?.eventTypes?.length) {
        query = query.in('event_type', filters.eventTypes);
      }

      if (filters?.dateRange && filters.dateRange !== 'all') {
        const dateFilter = this.getDateRangeFilter(filters.dateRange);
        query = query
          .gte('event_timestamp', dateFilter.start)
          .lte('event_timestamp', dateFilter.end);
      }

      if (filters?.visibility?.length) {
        query = query.in('visibility', filters.visibility);
      }

      const { data: events, error } = await query;

      if (error) {
        logger.error('Failed to fetch timeline feed', error, 'Timeline');
        throw error;
      }

      // Transform to display events
      const displayEvents = await this.enrichEventsForDisplay(events || []);

      // Get total count
      const { count } = await supabase
        .from('timeline_events')
        .select('*', { count: 'exact', head: true })
        .eq('actor_id', userId)
        .eq('is_deleted', false);

      const totalEvents = count || 0;

      return {
        events: displayEvents,
        pagination: {
          page,
          limit,
          total: totalEvents,
          hasNext: offset + limit < totalEvents,
          hasPrev: page > 1,
        },
        filters: this.buildDefaultFilters(filters),
        metadata: {
          totalEvents,
          featuredEvents: displayEvents.filter(e => e.isFeatured).length,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error fetching user timeline feed', error, 'Timeline');
      throw error;
    }
  }

  /**
   * Get project timeline feed
   */
  async getProjectFeed(
    projectId: string,
    filters?: Partial<TimelineFilters>,
    pagination?: Partial<TimelinePagination>
  ): Promise<TimelineFeedResponse> {
    try {
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const offset = (page - 1) * limit;

      const sortBy = filters?.sortBy || 'recent';

      // Query events where subject_type = 'project' and subject_id = projectId
      const {
        data: events,
        error,
        count,
      } = await supabase
        .from('enriched_timeline_events')
        .select('*', { count: 'exact' })
        .eq('subject_type', 'project')
        .eq('subject_id', projectId)
        .or(`visibility.eq.public,actor_id.eq.${await this.getCurrentUserId()}`)
        .order('event_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to fetch project timeline feed', error, 'Timeline');
        throw error;
      }

      // Transform enriched VIEW data to display events
      const displayEvents = (events || []).map((event: any) => {
        const timelineEvent = this.mapDbEventToTimelineEvent(event);

        return {
          ...timelineEvent,
          eventType: undefined as any,
          eventSubtype: undefined as any,
          icon: this.getEventIcon(timelineEvent.eventType),
          iconColor: this.getEventColor(timelineEvent.eventType),
          displayType: this.getEventDisplayType(timelineEvent.eventType),
          displaySubtype: timelineEvent.eventSubtype,
          // Actor, subject, target data already pre-joined in VIEW
          actor: event.actor_data
            ? {
                id: event.actor_data.id,
                name: event.actor_data.display_name || event.actor_data.username || 'Unknown',
                username: event.actor_data.username,
                avatar: event.actor_data.avatar_url,
                type: 'user' as TimelineActorType,
              }
            : undefined,
          subject: event.subject_data
            ? {
                id: event.subject_data.id,
                name:
                  event.subject_data.type === 'profile'
                    ? event.subject_data.display_name || event.subject_data.username
                    : event.subject_data.title,
                type: event.subject_data.type,
                url:
                  event.subject_data.type === 'profile'
                    ? `/profiles/${event.subject_data.username || event.subject_data.id}`
                    : `/projects/${event.subject_data.id}`,
              }
            : undefined,
          target: event.target_data
            ? {
                id: event.target_data.id,
                name:
                  event.target_data.type === 'profile'
                    ? event.target_data.display_name || event.target_data.username
                    : event.target_data.title,
                type: event.target_data.type,
                url:
                  event.target_data.type === 'profile'
                    ? `/profiles/${event.target_data.username || event.target_data.id}`
                    : `/projects/${event.target_data.id}`,
              }
            : undefined,
          formattedAmount: this.formatAmount(timelineEvent),
          timeAgo: this.getTimeAgo(timelineEvent.eventTimestamp),
          isRecent: this.isEventRecent(timelineEvent.eventTimestamp),

          // Social interaction data
          likesCount: event.like_count || 0,
          sharesCount: event.share_count || 0,
          commentsCount: event.comment_count || 0,
          userLiked: false,
          userShared: false,
          userCommented: false,
        } as TimelineDisplayEvent;
      });

      return {
        events: displayEvents,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1,
        },
        filters: this.buildDefaultFilters(filters),
        metadata: {
          totalEvents: count || 0,
          featuredEvents: displayEvents.filter(e => e.isFeatured).length,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error fetching project timeline feed', error, 'Timeline');
      // Return empty feed instead of throwing
      return {
        events: [],
        pagination: {
          page: 1,
          limit: this.DEFAULT_PAGE_SIZE,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: this.buildDefaultFilters(filters),
        metadata: {
          totalEvents: 0,
          featuredEvents: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Get profile timeline feed
   */
  async getProfileFeed(
    profileId: string,
    filters?: Partial<TimelineFilters>,
    pagination?: Partial<TimelinePagination>
  ): Promise<TimelineFeedResponse> {
    try {
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const offset = (page - 1) * limit;

      const sortBy = filters?.sortBy || 'recent';

      // Query events where subject_type = 'profile' and subject_id = profileId
      const {
        data: events,
        error,
        count,
      } = await supabase
        .from('enriched_timeline_events')
        .select('*', { count: 'exact' })
        .eq('subject_type', 'profile')
        .eq('subject_id', profileId)
        .or(`visibility.eq.public,actor_id.eq.${await this.getCurrentUserId()}`)
        .order('event_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to fetch profile timeline feed', error, 'Timeline');
        throw error;
      }

      // Transform enriched VIEW data to display events
      const displayEvents = (events || []).map((event: any) => {
        const timelineEvent = this.mapDbEventToTimelineEvent(event);

        return {
          ...timelineEvent,
          eventType: undefined as any,
          eventSubtype: undefined as any,
          icon: this.getEventIcon(timelineEvent.eventType),
          iconColor: this.getEventColor(timelineEvent.eventType),
          displayType: this.getEventDisplayType(timelineEvent.eventType),
          displaySubtype: timelineEvent.eventSubtype,
          // Actor, subject, target data already pre-joined in VIEW
          actor: event.actor_data
            ? {
                id: event.actor_data.id,
                name: event.actor_data.display_name || event.actor_data.username || 'Unknown',
                username: event.actor_data.username,
                avatar: event.actor_data.avatar_url,
                type: 'user' as TimelineActorType,
              }
            : undefined,
          subject: event.subject_data
            ? {
                id: event.subject_data.id,
                name:
                  event.subject_data.type === 'profile'
                    ? event.subject_data.display_name || event.subject_data.username
                    : event.subject_data.title,
                type: event.subject_data.type,
                url:
                  event.subject_data.type === 'profile'
                    ? `/profiles/${event.subject_data.username || event.subject_data.id}`
                    : `/projects/${event.subject_data.id}`,
              }
            : undefined,
          target: event.target_data
            ? {
                id: event.target_data.id,
                name:
                  event.target_data.type === 'profile'
                    ? event.target_data.display_name || event.target_data.username
                    : event.target_data.title,
                type: event.target_data.type,
                url:
                  event.target_data.type === 'profile'
                    ? `/profiles/${event.target_data.username || event.target_data.id}`
                    : `/projects/${event.target_data.id}`,
              }
            : undefined,
          formattedAmount: this.formatAmount(timelineEvent),
          timeAgo: this.getTimeAgo(timelineEvent.eventTimestamp),
          isRecent: this.isEventRecent(timelineEvent.eventTimestamp),

          // Social interaction data
          likesCount: event.like_count || 0,
          sharesCount: event.share_count || 0,
          commentsCount: event.comment_count || 0,
          userLiked: false,
          userShared: false,
          userCommented: false,
        } as TimelineDisplayEvent;
      });

      return {
        events: displayEvents,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1,
        },
        filters: this.buildDefaultFilters(filters),
        metadata: {
          totalEvents: count || 0,
          featuredEvents: displayEvents.filter(e => e.isFeatured).length,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error fetching profile timeline feed', error, 'Timeline');
      // Return empty feed instead of throwing
      return {
        events: [],
        pagination: {
          page: 1,
          limit: this.DEFAULT_PAGE_SIZE,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: this.buildDefaultFilters(filters),
        metadata: {
          totalEvents: 0,
          featuredEvents: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    }
  }

  /**
   * Get project timeline
   * @deprecated Use getProjectFeed instead. This method is kept for backward compatibility only.
   */
  async getProjectTimeline(projectId: string, limit: number = 50): Promise<TimelineDisplayEvent[]> {
    try {
      const feed = await this.getProjectFeed(projectId, {}, { limit });
      return feed.events;
    } catch (error) {
      logger.error('Error fetching project timeline', error, 'Timeline');
      return [];
    }
  }

  /**
   * Get community timeline (events from followed users)
   */
  async getFollowedUsersFeed(
    userId: string,
    pagination?: Partial<TimelinePagination>
  ): Promise<TimelineFeedResponse> {
    try {
      // Get users this user follows
      const { data: following } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      if (!following || following.length === 0) {
        return {
          events: [],
          pagination: { page: 1, limit: 0, total: 0, hasNext: false, hasPrev: false },
          filters: this.buildDefaultFilters(),
          metadata: { totalEvents: 0, featuredEvents: 0, lastUpdated: new Date().toISOString() },
        };
      }

      const followingIds = following.map(f => f.following_id);
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const offset = (page - 1) * limit;

      const {
        data: events,
        error,
        count,
      } = await supabase
        .from('timeline_events')
        .select('*', { count: 'exact' })
        .in('actor_id', followingIds)
        .eq('visibility', 'public')
        .eq('is_deleted', false)
        .order('event_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to fetch community feed', error, 'Timeline');
        throw error;
      }

      const displayEvents = await this.enrichEventsForDisplay(events || []);

      return {
        events: displayEvents,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1,
        },
        filters: this.buildDefaultFilters(),
        metadata: {
          totalEvents: count || 0,
          featuredEvents: displayEvents.filter(e => e.isFeatured).length,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error fetching community feed', error, 'Timeline');
      throw error;
    }
  }

  /**
   * Get public community timeline (posts from all users and projects)
   * FIXED: Uses community_timeline_no_duplicates VIEW to eliminate duplicate cross-posts
   */
  async getCommunityFeed(
    filters?: Partial<TimelineFilters>,
    pagination?: Partial<TimelinePagination>
  ): Promise<TimelineFeedResponse> {
    try {
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const offset = (page - 1) * limit;

      const sortBy = filters?.sortBy || 'recent';

      // Query community timeline view (NO DUPLICATES!)
      const {
        data: enrichedEvents,
        error,
        count,
      } = await supabase
        .from('community_timeline_no_duplicates')
        .select('*', { count: 'exact' })
        .order('event_timestamp', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        logger.error('Failed to fetch community feed from enriched VIEW', error, 'Timeline');
        throw error;
      }

      // Transform enriched VIEW data to display events (no N+1 queries needed!)
      const displayEvents = (enrichedEvents || []).map((event: any) => {
        const timelineEvent = this.mapDbEventToTimelineEvent(event);

        return {
          ...timelineEvent,
          eventType: undefined as any,
          eventSubtype: undefined as any,
          icon: this.getEventIcon(timelineEvent.eventType),
          iconColor: this.getEventColor(timelineEvent.eventType),
          displayType: this.getEventDisplayType(timelineEvent.eventType),
          displaySubtype: timelineEvent.eventSubtype,
          // Actor, subject, target data already pre-joined in VIEW
          actor: event.actor_data
            ? {
                id: event.actor_data.id,
                name: event.actor_data.display_name || event.actor_data.username || 'Unknown',
                username: event.actor_data.username,
                avatar: event.actor_data.avatar_url,
                type: 'user' as TimelineActorType,
              }
            : undefined,
          subject: event.subject_data
            ? {
                id: event.subject_data.id,
                name:
                  event.subject_data.type === 'profile'
                    ? event.subject_data.display_name || event.subject_data.username
                    : event.subject_data.title,
                type: event.subject_data.type,
                url:
                  event.subject_data.type === 'profile'
                    ? `/profiles/${event.subject_data.username || event.subject_data.id}`
                    : `/projects/${event.subject_data.id}`,
              }
            : undefined,
          target: event.target_data
            ? {
                id: event.target_data.id,
                name:
                  event.target_data.type === 'profile'
                    ? event.target_data.display_name || event.target_data.username
                    : event.target_data.title,
                type: event.target_data.type,
                url:
                  event.target_data.type === 'profile'
                    ? `/profiles/${event.target_data.username || event.target_data.id}`
                    : `/projects/${event.target_data.id}`,
              }
            : undefined,
          formattedAmount: this.formatAmount(timelineEvent),
          timeAgo: this.getTimeAgo(timelineEvent.eventTimestamp),
          isRecent: this.isEventRecent(timelineEvent.eventTimestamp),

          // Social interaction data (placeholder counts from VIEW)
          likesCount: event.like_count || 0,
          sharesCount: event.share_count || 0,
          commentsCount: event.comment_count || 0,
          userLiked: false,
          userShared: false,
          userCommented: false,
        } as TimelineDisplayEvent;
      });

      return {
        events: displayEvents,
        pagination: {
          page,
          limit,
          total: count || 0,
          hasNext: offset + limit < (count || 0),
          hasPrev: page > 1,
        },
        filters: this.buildDefaultFilters(filters),
        metadata: {
          totalEvents: count || 0,
          featuredEvents: displayEvents.filter(e => e.isFeatured).length,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error fetching community timeline feed', error, 'Timeline');
      // Return empty feed instead of throwing
      return {
        events: [],
        pagination: {
          page: 1,
          limit: this.DEFAULT_PAGE_SIZE,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: this.buildDefaultFilters(filters),
        metadata: {
          totalEvents: 0,
          featuredEvents: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    }
  }

  // ==================== SOCIAL INTERACTIONS ====================

  /**
   * Like or unlike an event
   */
  async toggleLike(
    eventId: string,
    userId?: string
  ): Promise<{ success: boolean; liked: boolean; likeCount: number; error?: string }> {
    try {
      const targetUserId = userId || (await this.getCurrentUserId());
      if (!targetUserId) {
        return { success: false, liked: false, likeCount: 0, error: 'Authentication required' };
      }

      // Check if user already liked this event
      const { data: existingLike } = await supabase
        .from('timeline_likes')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', targetUserId)
        .single();

      if (existingLike) {
        // Unlike the event
        try {
          const { data, error } = await supabase.rpc('unlike_timeline_event', {
            p_event_id: eventId,
            p_user_id: targetUserId,
          });

          if (error) {
            logger.error('Failed to unlike timeline event', error, 'Timeline');
            return { success: false, liked: false, likeCount: 0, error: error.message };
          }

          return {
            success: true,
            liked: false,
            likeCount: data.like_count || 0,
          };
        } catch (dbError) {
          logger.warn(
            'Database function not available for unlike, using fallback',
            dbError,
            'Timeline'
          );
          const { error: delErr } = await supabase
            .from('timeline_likes')
            .delete()
            .eq('event_id', eventId)
            .eq('user_id', targetUserId);
          if (delErr) {
            logger.error('Fallback unlike failed', delErr, 'Timeline');
            return { success: false, liked: false, likeCount: 0, error: delErr.message };
          }
          const { count } = await supabase
            .from('timeline_likes')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);
          return { success: true, liked: false, likeCount: count || 0 };
        }
      } else {
        // Like the event
        try {
          const { data, error } = await supabase.rpc('like_timeline_event', {
            p_event_id: eventId,
            p_user_id: targetUserId,
          });

          if (error) {
            logger.error('Failed to like timeline event', error, 'Timeline');
            return { success: false, liked: false, likeCount: 0, error: error.message };
          }

          return {
            success: true,
            liked: true,
            likeCount: data.like_count || 0,
          };
        } catch (dbError) {
          logger.warn(
            'Database function not available for like, using fallback',
            dbError,
            'Timeline'
          );
          // Fallback: insert into timeline_likes and return new count
          const { error: insertErr } = await supabase
            .from('timeline_likes')
            .insert({ event_id: eventId, user_id: targetUserId });
          if (insertErr) {
            logger.error('Fallback like failed', insertErr, 'Timeline');
            return { success: false, liked: false, likeCount: 0, error: insertErr.message };
          }
          const { count } = await supabase
            .from('timeline_likes')
            .select('*', { count: 'exact', head: true })
            .eq('event_id', eventId);
          return { success: true, liked: true, likeCount: count || 0 };
        }
      }
    } catch (error) {
      logger.error('Error toggling like on timeline event', error, 'Timeline');
      return { success: false, liked: false, likeCount: 0, error: 'Internal server error' };
    }
  }

  /**
   * Share an event
   */
  async shareEvent(
    originalEventId: string,
    shareText?: string,
    visibility: TimelineVisibility = 'public'
  ): Promise<{ success: boolean; shareCount: number; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, shareCount: 0, error: 'Authentication required' };
      }

      try {
        const { data, error } = await supabase.rpc('share_timeline_event', {
          p_original_event_id: originalEventId,
          p_user_id: userId,
          p_share_text: shareText,
          p_visibility: visibility,
        });

        if (error) {
          logger.error('Failed to share timeline event', error, 'Timeline');
          return { success: false, shareCount: 0, error: error.message };
        }

        return {
          success: true,
          shareCount: data.share_count || 0,
        };
      } catch (dbError) {
        logger.warn(
          'Database function not available for share, using fallback',
          dbError,
          'Timeline'
        );
        // Fallback: create a simple share event referencing the original
        const fallback = await this.createEvent({
          eventType: 'post_shared',
          subjectType: 'profile',
          title: 'Shared a post',
          description: shareText || 'Shared from timeline',
          metadata: { original_event_id: originalEventId },
          visibility,
        });
        if (!fallback.success) {
          return { success: false, shareCount: 0, error: fallback.error || 'Share failed' };
        }
        // Attempt to count share events referencing this original
        const { count } = await supabase
          .from('timeline_events')
          .select('id', { count: 'exact', head: true })
          .contains('metadata', { original_event_id: originalEventId });
        return { success: true, shareCount: count || 0 };
      }
    } catch (error) {
      logger.error('Error sharing timeline event', error, 'Timeline');
      return { success: false, shareCount: 0, error: 'Internal server error' };
    }
  }

  /**
   * Add a comment to an event
   */
  async addComment(
    eventId: string,
    content: string,
    parentCommentId?: string
  ): Promise<{ success: boolean; commentId?: string; commentCount: number; error?: string }> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) {
        return { success: false, commentCount: 0, error: 'Authentication required' };
      }

      try {
        const { data, error } = await supabase.rpc('add_timeline_comment', {
          p_event_id: eventId,
          p_user_id: userId,
          p_content: content,
          p_parent_comment_id: parentCommentId,
        });

        if (error) {
          logger.error('Failed to add timeline comment', error, 'Timeline');
          return { success: false, commentCount: 0, error: error.message };
        }

        return {
          success: true,
          commentId: data.comment_id,
          commentCount: data.comment_count || 0,
        };
      } catch (dbError) {
        logger.warn(
          'Database function not available for comments, using fallback',
          dbError,
          'Timeline'
        );
        // Fallback: insert directly into timeline_comments
        const { data: inserted, error: iErr } = await supabase
          .from('timeline_comments')
          .insert({
            event_id: eventId,
            user_id: userId,
            content,
            parent_comment_id: parentCommentId,
          })
          .select('id')
          .single();
        if (iErr || !inserted) {
          logger.error('Fallback add comment failed', iErr, 'Timeline');
          return { success: false, commentCount: 0, error: iErr?.message || 'Add comment failed' };
        }
        const { count } = await supabase
          .from('timeline_comments')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);
        return { success: true, commentId: inserted.id, commentCount: count || 0 };
      }
    } catch (error) {
      logger.error('Error adding timeline comment', error, 'Timeline');
      return { success: false, commentCount: 0, error: 'Internal server error' };
    }
  }

  /**
   * Get like/comment counts for an event (fallback for feeds lacking counts)
   */
  async getEventCounts(eventId: string): Promise<{ likeCount: number; commentCount: number }> {
    try {
      const [{ count: likeCount }, { count: commentCount }] = await Promise.all([
        supabase
          .from('timeline_likes')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId),
        supabase
          .from('timeline_comments')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId),
      ]);
      return { likeCount: likeCount || 0, commentCount: commentCount || 0 };
    } catch (error) {
      logger.error('Failed to get event counts', error, 'Timeline');
      return { likeCount: 0, commentCount: 0 };
    }
  }

  /**
   * Update event visibility (owner only) and cascade effect handled by queries
   */
  async updateEventVisibility(
    eventId: string,
    visibility: 'public' | 'private',
    userId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const actorId = userId || (await this.getCurrentUserId());
      if (!actorId) {
        return { success: false, error: 'Authentication required' };
      }
      // Update visibility; RLS should ensure only owner can update
      const { error } = await supabase
        .from('timeline_events')
        .update({ visibility })
        .eq('id', eventId)
        .eq('actor_id', actorId);
      if (error) {
        logger.error('Failed to update event visibility', error, 'Timeline');
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (error) {
      logger.error('Error updating event visibility', error, 'Timeline');
      return { success: false, error: 'Internal server error' };
    }
  }

  /**
   * Get comments for an event
   */
  async getEventComments(eventId: string, limit: number = 50, offset: number = 0): Promise<any[]> {
    try {
      try {
        const { data, error } = await supabase.rpc('get_event_comments', {
          p_event_id: eventId,
          p_limit: limit,
          p_offset: offset,
        });

        if (error) {
          logger.error('Failed to get event comments', error, 'Timeline');
          return [];
        }

        return data || [];
      } catch (dbError) {
        logger.warn(
          'Database function not available for comments, using fallback',
          dbError,
          'Timeline'
        );
        // Fallback: query comments table directly and enrich with profile info
        const { data: comments, error: cErr } = await supabase
          .from('timeline_comments')
          .select('id, event_id, user_id, content, created_at, parent_comment_id')
          .eq('event_id', eventId)
          .order('created_at', { ascending: true })
          .range(offset, offset + limit - 1);
        if (cErr || !comments) {
          logger.error('Fallback comments query failed', cErr, 'Timeline');
          return [];
        }
        const userIds = Array.from(new Set(comments.map(c => c.user_id).filter(Boolean)));
        let profilesMap: Record<string, { display_name: string; username: string | null; avatar_url: string | null }> = {};
        if (userIds.length > 0) {
          const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .in('id', userIds as string[]);
          if (!pErr && profiles) {
            profilesMap = Object.fromEntries(
              profiles.map((p: any) => [
                p.id,
                { display_name: p.display_name, username: p.username, avatar_url: p.avatar_url },
              ])
            );
          }
        }
        return comments.map(c => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          user_id: c.user_id,
          user_name: profilesMap[c.user_id]?.display_name || 'User',
          user_username: profilesMap[c.user_id]?.username || null,
          user_avatar: profilesMap[c.user_id]?.avatar_url || null,
          reply_count: 0,
        }));
      }
    } catch (error) {
      logger.error('Error getting event comments', error, 'Timeline');
      return [];
    }
  }

  /**
   * Get replies to a comment
   */
  async getCommentReplies(commentId: string, limit: number = 20): Promise<any[]> {
    try {
      try {
        const { data, error } = await supabase.rpc('get_comment_replies', {
          p_comment_id: commentId,
          p_limit: limit,
        });

        if (error) {
          logger.error('Failed to get comment replies', error, 'Timeline');
          return [];
        }

        return data || [];
      } catch (dbError) {
        logger.warn(
          'Database function not available for comment replies, using fallback',
          dbError,
          'Timeline'
        );
        const { data: replies, error: rErr } = await supabase
          .from('timeline_comments')
          .select('id, event_id, user_id, content, created_at, parent_comment_id')
          .eq('parent_comment_id', commentId)
          .order('created_at', { ascending: true })
          .limit(limit);
        if (rErr || !replies) {
          logger.error('Fallback replies query failed', rErr, 'Timeline');
          return [];
        }
        const userIds = Array.from(new Set(replies.map(c => c.user_id).filter(Boolean)));
        let profilesMap: Record<string, { display_name: string; username: string | null; avatar_url: string | null }> = {};
        if (userIds.length > 0) {
          const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('id, display_name, username, avatar_url')
            .in('id', userIds as string[]);
          if (!pErr && profiles) {
            profilesMap = Object.fromEntries(
              profiles.map((p: any) => [
                p.id,
                { display_name: p.display_name, username: p.username, avatar_url: p.avatar_url },
              ])
            );
          }
        }
        return replies.map(c => ({
          id: c.id,
          content: c.content,
          created_at: c.created_at,
          user_id: c.user_id,
          user_name: profilesMap[c.user_id]?.display_name || 'User',
          user_username: profilesMap[c.user_id]?.username || null,
          user_avatar: profilesMap[c.user_id]?.avatar_url || null,
          reply_count: 0,
        }));
      }
    } catch (error) {
      logger.error('Error getting comment replies', error, 'Timeline');
      return [];
    }
  }

  // ==================== ENHANCED TIMELINE FEED ====================

  /**
   * Get enriched timeline feed with social interactions
   */
  async getEnrichedUserFeed(
    userId: string,
    filters?: Partial<TimelineFilters>,
    pagination?: Partial<TimelinePagination>
  ): Promise<TimelineFeedResponse> {
    try {
      const page = pagination?.page || 1;
      const limit = Math.min(pagination?.limit || this.DEFAULT_PAGE_SIZE, this.MAX_PAGE_SIZE);
      const offset = (page - 1) * limit;

      let events: any[] = [];
      let totalEvents = 0;

      try {
        const {
          data: enrichedEvents,
          error,
          count,
        } = await supabase.rpc('get_enriched_timeline_feed', {
          p_user_id: userId,
          p_limit: limit,
          p_offset: offset,
        });

        if (error) {
          logger.warn(
            'Enriched timeline feed not available, falling back to basic feed',
            error,
            'Timeline'
          );

          // Fallback to basic timeline feed if enriched version isn't available
          const { data: basicEvents, error: basicError } = await supabase.rpc(
            'get_user_timeline_feed',
            {
              p_user_id: userId,
              p_limit: limit,
              p_offset: offset,
            }
          );

          if (basicError) {
            logger.warn(
              'Basic timeline feed also not available, using empty feed',
              basicError,
              'Timeline'
            );
            events = [];
            totalEvents = 0;
          } else {
            // Convert basic events to enriched format
            events = (basicEvents || []).map((event: any) => ({
              ...event,
              like_count: 0,
              share_count: 0,
              comment_count: 0,
              user_liked: false,
              user_shared: false,
              user_commented: false,
            }));
            totalEvents = events.length;
          }
        } else {
          events = enrichedEvents || [];
          totalEvents = count || 0;
        }
      } catch (dbError) {
        logger.warn(
          'Database functions not available, returning demo timeline',
          dbError,
          'Timeline'
        );
        // Return demo data so the UI works even without database
        events = this.getDemoTimelineEvents(userId);
        totalEvents = events.length;
      }

      // Transform to display events with social data
      const displayEvents = await Promise.all(
        (events || []).map(async (event: any) => {
          const timelineEvent = this.mapDbEventToTimelineEvent(event);

          // Enrich with actor info
          const actor = await this.getActorInfo(timelineEvent.actorId);
          const subject = timelineEvent.subjectId
            ? await this.getSubjectInfo(timelineEvent.subjectType, timelineEvent.subjectId)
            : undefined;
          const target = timelineEvent.targetId
            ? await this.getSubjectInfo(timelineEvent.targetType!, timelineEvent.targetId)
            : undefined;

          return {
            ...timelineEvent,
            eventType: undefined as any, // Remove from display
            eventSubtype: undefined as any,
            icon: this.getEventIcon(timelineEvent.eventType),
            iconColor: this.getEventColor(timelineEvent.eventType),
            displayType: this.getEventDisplayType(timelineEvent.eventType),
            displaySubtype: timelineEvent.eventSubtype,
            actor,
            subject,
            target,
            formattedAmount: this.formatAmount(timelineEvent),
            timeAgo: this.getTimeAgo(timelineEvent.eventTimestamp),
            isRecent: this.isEventRecent(timelineEvent.eventTimestamp),

            // Social interaction data
            likesCount: event.like_count || 0,
            sharesCount: event.share_count || 0,
            commentsCount: event.comment_count || 0,
            userLiked: event.user_liked || false,
            userShared: event.user_shared || false,
            userCommented: event.user_commented || false,
          } as TimelineDisplayEvent;
        })
      );

      return {
        events: displayEvents,
        pagination: {
          page,
          limit,
          total: totalEvents,
          hasNext: offset + limit < totalEvents,
          hasPrev: page > 1,
        },
        filters: this.buildDefaultFilters(filters),
        metadata: {
          totalEvents,
          featuredEvents: displayEvents.filter(e => e.isFeatured).length,
          lastUpdated: new Date().toISOString(),
        },
      };
    } catch (error) {
      logger.error('Error fetching enriched user timeline feed', error, 'Timeline');
      // Return empty feed instead of throwing
      return {
        events: [],
        pagination: {
          page: 1,
          limit: this.DEFAULT_PAGE_SIZE,
          total: 0,
          hasNext: false,
          hasPrev: false,
        },
        filters: this.buildDefaultFilters(filters),
        metadata: {
          totalEvents: 0,
          featuredEvents: 0,
          lastUpdated: new Date().toISOString(),
        },
      };
    }
  }

  // ==================== EVENT MANAGEMENT ====================

  /**
   * Soft delete an event
   */
  async deleteEvent(eventId: string, reason?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('soft_delete_timeline_event', {
        event_id: eventId,
        reason,
      });

      if (error) {
        logger.error('Failed to delete timeline event', error, 'Timeline');
        return false;
      }

      return data || false;
    } catch (error) {
      logger.error('Error deleting timeline event', error, 'Timeline');
      return false;
    }
  }

  /**
   * Update event visibility
   */
  async updateEventVisibility(eventId: string, visibility: TimelineVisibility): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('timeline_events')
        .update({ visibility })
        .eq('id', eventId);

      if (error) {
        logger.error('Failed to update event visibility', error, 'Timeline');
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error updating event visibility', error, 'Timeline');
      return false;
    }
  }

  /**
   * Update event content (title, description, metadata)
   */
  async updateEvent(
    eventId: string,
    updates: {
      title?: string;
      description?: string;
      visibility?: TimelineVisibility;
      metadata?: Record<string, any>;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {};

      if (updates.title !== undefined) {
        updateData.title = updates.title;
      }

      if (updates.description !== undefined) {
        updateData.description = updates.description;
      }

      if (updates.visibility !== undefined) {
        updateData.visibility = updates.visibility;
      }

      if (updates.metadata !== undefined) {
        updateData.metadata = updates.metadata;
      }

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase.from('timeline_events').update(updateData).eq('id', eventId);

      if (error) {
        logger.error('Failed to update timeline event', error, 'Timeline');
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Error updating timeline event', error, 'Timeline');
      return { success: false, error: errorMessage };
    }
  }

  // ==================== DEMO DATA METHODS ====================

  /**
   * Generate demo timeline events for testing UI when database is not available
   */
  private getDemoTimelineEvents(userId: string): any[] {
    const now = new Date();

    // Get user-created posts from localStorage
    const storedPosts = JSON.parse(localStorage.getItem('mock_timeline_posts') || '[]').filter(
      (post: any) => post.actor_id === userId
    ); // Only show user's own posts

    // Demo posts (only show if no user posts exist)
    const demoPosts =
      storedPosts.length === 0
        ? [
            {
              id: 'demo-1',
              event_type: 'status_update',
              actor_id: userId,
              actor_type: 'user',
              subject_type: 'profile',
              subject_id: userId,
              title: 'Welcome to My Journey!',
              description:
                'Just set up my personal timeline on OrangeCat. Excited to share my Bitcoin crowdfunding journey!',
              content: null,
              amount_sats: null,
              amount_btc: null,
              quantity: null,
              visibility: 'public',
              is_featured: false,
              event_timestamp: new Date(now.getTime() - 1000 * 60 * 30).toISOString(), // 30 min ago
              created_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
              updated_at: new Date(now.getTime() - 1000 * 60 * 30).toISOString(),
              metadata: {},
              tags: ['introduction'],
              like_count: 0,
              share_count: 0,
              comment_count: 0,
              user_liked: false,
              user_shared: false,
              user_commented: false,
            },
            {
              id: 'demo-2',
              event_type: 'achievement_shared',
              actor_id: userId,
              actor_type: 'user',
              subject_type: 'profile',
              subject_id: userId,
              title: 'First Bitcoin Transaction!',
              description:
                'Just made my first Bitcoin transaction on OrangeCat. The future of crowdfunding is here! ₿',
              content: null,
              amount_sats: 10000,
              amount_btc: 0.0001,
              quantity: null,
              visibility: 'public',
              is_featured: true,
              event_timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
              created_at: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
              updated_at: new Date(now.getTime() - 1000 * 60 * 60 * 2).toISOString(),
              metadata: { achievement: 'first_transaction' },
              tags: ['bitcoin', 'achievement'],
              like_count: 3,
              share_count: 1,
              comment_count: 2,
              user_liked: false,
              user_shared: false,
              user_commented: false,
            },
            {
              id: 'demo-3',
              event_type: 'reflection_posted',
              actor_id: userId,
              actor_type: 'user',
              subject_type: 'profile',
              subject_id: userId,
              title: 'Thoughts on Bitcoin Crowdfunding',
              description:
                'Bitcoin crowdfunding eliminates middlemen and gives creators direct access to supporters. No fees, no delays, just pure value exchange. This is the future! 🚀',
              content: null,
              amount_sats: null,
              amount_btc: null,
              quantity: null,
              visibility: 'public',
              is_featured: false,
              event_timestamp: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
              created_at: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
              updated_at: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(),
              metadata: {},
              tags: ['bitcoin', 'crowdfunding', 'reflection'],
              like_count: 7,
              share_count: 2,
              comment_count: 4,
              user_liked: false,
              user_shared: false,
              user_commented: false,
            },
          ]
        : [];

    // Combine user posts with demo posts
    return [...storedPosts, ...demoPosts];
  }

  // ==================== UTILITY METHODS ====================

  private async getCurrentUserId(): Promise<string | null> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      logger.error('Error getting current user ID', error, 'Timeline');
      return null;
    }
  }

  private validateEventRequest(request: CreateTimelineEventRequest): {
    valid: boolean;
    error?: string;
  } {
    if (!request.title?.trim()) {
      return { valid: false, error: 'Title is required' };
    }

    // Add more validation based on event type
    switch (request.eventType) {
      case 'donation_received':
      case 'donation_sent':
        if (!request.amountSats || request.amountSats <= 0) {
          return { valid: false, error: 'Valid donation amount required' };
        }
        break;
      case 'project_created':
      case 'project_published':
        if (!request.subjectId) {
          return { valid: false, error: 'Project ID required for project events' };
        }
        break;
    }

    return { valid: true };
  }

  private generateProjectEventTitle(
    eventType: TimelineEventType,
    projectTitle: string,
    additionalData?: any
  ): string {
    switch (eventType) {
      case 'project_created':
        return `Created project "${projectTitle}"`;
      case 'project_published':
        return `Published project "${projectTitle}"`;
      case 'project_completed':
        return `Completed project "${projectTitle}"`;
      case 'project_goal_reached':
        return `Reached funding goal for "${projectTitle}"`;
      case 'project_funded':
        return `Received funding for "${projectTitle}"`;
      default:
        return `${eventType.replace('_', ' ')} for "${projectTitle}"`;
    }
  }

  private generateProjectEventDescription(
    eventType: TimelineEventType,
    project: any,
    additionalData?: any
  ): string {
    switch (eventType) {
      case 'project_created':
        return `Started working on "${project.title}" with a goal of ${project.goal_amount} ${project.currency}`;
      case 'project_published':
        return `"${project.title}" is now live and accepting donations`;
      case 'project_completed':
        return `Successfully completed "${project.title}"`;
      case 'project_goal_reached':
        return `"${project.title}" has reached its funding goal!`;
      default:
        return `Project "${project.title}" milestone achieved`;
    }
  }

  private shouldFeatureProjectEvent(eventType: TimelineEventType): boolean {
    return [
      'project_created',
      'project_published',
      'project_completed',
      'project_goal_reached',
    ].includes(eventType);
  }

  private async enrichEventsForDisplay(events: any[]): Promise<TimelineDisplayEvent[]> {
    const enrichedEvents: TimelineDisplayEvent[] = [];

    for (const event of events) {
      const timelineEvent = this.mapDbEventToTimelineEvent(event);

      // Enrich with actor info
      const actor = await this.getActorInfo(timelineEvent.actorId);
      const subject = timelineEvent.subjectId
        ? await this.getSubjectInfo(timelineEvent.subjectType, timelineEvent.subjectId)
        : undefined;
      const target = timelineEvent.targetId
        ? await this.getSubjectInfo(timelineEvent.targetType!, timelineEvent.targetId)
        : undefined;

      const displayEvent: TimelineDisplayEvent = {
        ...timelineEvent,
        icon: this.getEventIcon(timelineEvent.eventType),
        iconColor: this.getEventColor(timelineEvent.eventType),
        displayType: this.getEventDisplayType(timelineEvent.eventType),
        displaySubtype: timelineEvent.eventSubtype,
        actor,
        subject,
        target,
        formattedAmount: this.formatAmount(timelineEvent),
        timeAgo: this.getTimeAgo(timelineEvent.eventTimestamp),
        isRecent: this.isEventRecent(timelineEvent.eventTimestamp),
      };

      enrichedEvents.push(displayEvent);
    }

    return enrichedEvents;
  }

  private async getActorInfo(actorId: string): Promise<{
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    type: TimelineActorType;
  }> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, username, avatar_url')
      .eq('id', actorId)
      .single();

    return {
      id: actorId,
      name: profile?.display_name || profile?.username || 'Unknown User',
      username: profile?.username,
      avatar: profile?.avatar_url,
      type: 'user',
    };
  }

  private async getSubjectInfo(
    type: TimelineSubjectType,
    id: string
  ): Promise<{ id: string; name: string; type: TimelineSubjectType; url?: string }> {
    switch (type) {
      case 'project':
        const { data: project } = await supabase
          .from('projects')
          .select('title')
          .eq('id', id)
          .single();
        return {
          id,
          name: project?.title || 'Unknown Project',
          type: 'project',
          url: `/projects/${id}`,
        };
      case 'profile':
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name, username')
          .eq('id', id)
          .single();
        return {
          id,
          name: profile?.display_name || profile?.username || 'Unknown User',
          type: 'profile',
          url: `/profiles/${profile?.username || id}`,
        };
      default:
        return { id, name: `Unknown ${type}`, type };
    }
  }

  private mapDbEventToTimelineEvent(dbEvent: TimelineEventDb): TimelineEvent {
    return {
      id: dbEvent.id,
      eventType: dbEvent.event_type as TimelineEventType,
      eventSubtype: dbEvent.event_subtype as TimelineEventSubtype,
      actorId: (dbEvent as any).actor_id || (dbEvent as any).actorId,
      actorType: ((dbEvent as any).actor_type as TimelineActorType) || (dbEvent as any).actorType,
      subjectType:
        ((dbEvent as any).subject_type as TimelineSubjectType) || (dbEvent as any).subjectType,
      subjectId: (dbEvent as any).subject_id || (dbEvent as any).subjectId || undefined,
      targetType:
        ((dbEvent as any).target_type as TimelineSubjectType) || (dbEvent as any).targetType,
      targetId: (dbEvent as any).target_id || (dbEvent as any).targetId || undefined,
      title: dbEvent.title,
      description: dbEvent.description || undefined,
      content: dbEvent.content,
      amountSats: dbEvent.amount_sats || undefined,
      amountBtc: dbEvent.amount_btc || undefined,
      quantity: dbEvent.quantity || undefined,
      locationData: dbEvent.location_data,
      deviceInfo: dbEvent.device_info,
      visibility: dbEvent.visibility as TimelineVisibility,
      isFeatured: dbEvent.is_featured,
      eventTimestamp: dbEvent.event_timestamp,
      createdAt: dbEvent.created_at,
      updatedAt: dbEvent.updated_at,
      metadata: dbEvent.metadata,
      tags: dbEvent.tags,
      parentEventId: dbEvent.parent_event_id || undefined,
      threadId: dbEvent.thread_id || undefined,
      isDeleted: dbEvent.is_deleted,
      deletedAt: dbEvent.deleted_at || undefined,
      deletionReason: dbEvent.deletion_reason || undefined,
    };
  }

  private getEventIcon(eventType: TimelineEventType): any {
    const iconMap: Record<TimelineEventType, any> = {
      // Post events
      post_created: BookOpen,
      post_shared: Share2,
      post_liked: Heart,
      post_commented: MessageCircle,
      status_update: BookOpen,
      achievement_shared: Trophy,
      reflection_posted: Star,

      // Project events
      project_created: Plus,
      project_published: Rocket,
      project_updated: TrendingUp,
      project_paused: Minus,
      project_resumed: Plus,
      project_completed: Target,
      project_cancelled: Minus,
      project_funded: Bitcoin,
      project_milestone: Target,
      project_goal_reached: Trophy,

      // Transaction events
      donation_received: Bitcoin,
      donation_sent: Share2,
      bitcoin_transaction: Bitcoin,
      lightning_payment: Zap,

      // Social events
      user_followed: User,
      user_unfollowed: User,
      project_liked: Heart,
      project_shared: Share2,
      comment_added: MessageCircle,
      comment_liked: Heart,
      profile_updated: User,
      verification_achieved: Award,

      // Community events
      organization_joined: Users,
      organization_left: Users,
      organization_created: Users,
      event_created: Calendar,
      event_attended: Calendar,
      collaboration_started: Users,

      // System events
      achievement_unlocked: Trophy,
      badge_earned: Award,
      level_up: TrendingUp,
      streak_maintained: Star,
    };

    return iconMap[eventType] || BookOpen;
  }

  private getEventColor(eventType: TimelineEventType): string {
    const colorMap: Record<string, string> = {
      project_created: 'blue',
      donation_received: 'green',
      user_followed: 'purple',
      project_completed: 'orange',
    };
    return colorMap[eventType] || 'gray';
  }

  private getEventDisplayType(eventType: TimelineEventType): string {
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  private formatAmount(event: TimelineEvent): string | undefined {
    if (event.amountBtc) {
      return `₿${event.amountBtc.toFixed(6)}`;
    }
    if (event.amountSats) {
      return `${event.amountSats.toLocaleString()} sats`;
    }
    return undefined;
  }

  private getTimeAgo(timestamp: string): string {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffMs = now.getTime() - eventTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    }
    if (diffMins < 60) {
      return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
      return `${diffHours}h ago`;
    }
    if (diffDays < 7) {
      return `${diffDays}d ago`;
    }
    return eventTime.toLocaleDateString();
  }

  private isEventRecent(timestamp: string): boolean {
    const now = new Date();
    const eventTime = new Date(timestamp);
    const diffHours = (now.getTime() - eventTime.getTime()) / (1000 * 60 * 60);
    return diffHours < 24;
  }

  private getDateRangeFilter(dateRange: string): { start: string; end: string } {
    const now = new Date();
    const end = now.toISOString();

    switch (dateRange) {
      case 'today':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return { start: today.toISOString(), end };
      case 'week':
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return { start: weekAgo.toISOString(), end };
      case 'month':
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return { start: monthAgo.toISOString(), end };
      case 'year':
        const yearAgo = new Date(now);
        yearAgo.setFullYear(now.getFullYear() - 1);
        return { start: yearAgo.toISOString(), end };
      default:
        const yearAgoDefault = new Date(now);
        yearAgoDefault.setFullYear(now.getFullYear() - 1);
        return { start: yearAgoDefault.toISOString(), end };
    }
  }

  private buildDefaultFilters(partialFilters?: Partial<TimelineFilters>): TimelineFilters {
    return {
      eventTypes: [],
      dateRange: 'all',
      visibility: ['public', 'followers'],
      actors: [],
      subjects: [],
      tags: [],
      ...partialFilters,
    };
  }

  private async handlePostCreationHooks(event: TimelineEvent): Promise<void> {
    // Handle specific post-creation logic
    switch (event.eventType) {
      case 'project_goal_reached':
        // Could trigger notifications, featured placement, etc.
        break;
      case 'donation_received':
        // Could update project funding stats, trigger thank you emails, etc.
        break;
      case 'user_followed':
        // Could update follower counts, send welcome messages, etc.
        break;
    }
  }
}

// Export singleton instance
export const timelineService = new TimelineService();
export default timelineService;
