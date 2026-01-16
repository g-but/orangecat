/**
 * Timeline Demo Data Utilities
 * 
 * Generates demo timeline events for testing UI when database is not available.
 * 
 * Created: 2025-01-28
 * Last Modified: 2025-01-28
 * Last Modified Summary: Extracted demo data generation from monolithic timeline service
 */

/**
 * Generate demo timeline events for testing UI when database is not available
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDemoTimelineEvents(userId: string): any[] {
  const now = new Date();

  // Get user-created posts from localStorage
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const storedPosts = JSON.parse(localStorage.getItem('mock_timeline_posts') || '[]').filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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



