-- Development seed data for testing search functionality
-- Run this in Supabase SQL Editor to populate the database with sample data

-- First, let's create some sample user profiles
-- Note: In a real scenario, these would be created through Supabase Auth
-- For testing, we'll create them directly in the profiles table

-- Insert sample profiles
INSERT INTO profiles (id, username, display_name, bio, avatar_url, created_at, updated_at)
VALUES 
  (
    gen_random_uuid(),
    'alice_creator',
    'Alice Johnson',
    'Creative entrepreneur passionate about sustainable technology and community building.',
    'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    NOW() - INTERVAL '30 days',
    NOW() - INTERVAL '30 days'
  ),
  (
    gen_random_uuid(),
    'bob_developer',
    'Bob Smith',
    'Full-stack developer building the future of decentralized applications.',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    NOW() - INTERVAL '25 days',
    NOW() - INTERVAL '25 days'
  ),
  (
    gen_random_uuid(),
    'charlie_artist',
    'Charlie Brown',
    'Digital artist creating NFTs and exploring the intersection of art and technology.',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    NOW() - INTERVAL '20 days',
    NOW() - INTERVAL '20 days'
  ),
  (
    gen_random_uuid(),
    'diana_educator',
    'Diana Wilson',
    'Educator and advocate for accessible technology education in underserved communities.',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    NOW() - INTERVAL '15 days',
    NOW() - INTERVAL '15 days'
  ),
  (
    gen_random_uuid(),
    'evan_musician',
    'Evan Davis',
    'Independent musician and producer creating experimental electronic music.',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    NOW() - INTERVAL '10 days',
    NOW() - INTERVAL '10 days'
  );

-- Insert sample funding pages
-- We'll use the profile IDs we just created
WITH profile_ids AS (
  SELECT id, username FROM profiles WHERE username IN ('alice_creator', 'bob_developer', 'charlie_artist', 'diana_educator', 'evan_musician')
)
INSERT INTO funding_pages (
  id, user_id, title, description, category, tags, goal_amount, total_funding, 
  contributor_count, is_active, is_public, featured_image_url, slug, created_at, updated_at
)
SELECT 
  gen_random_uuid(),
  p.id,
  campaign.title,
  campaign.description,
  campaign.category,
  campaign.tags,
  campaign.goal_amount,
  campaign.total_funding,
  campaign.contributor_count,
  campaign.is_active,
  campaign.is_public,
  campaign.featured_image_url,
  lower(replace(campaign.title, ' ', '-')),
  campaign.created_at,
  campaign.created_at
FROM profile_ids p
CROSS JOIN (
  VALUES 
    (
      'Solar-Powered Community Garden',
      'Building a sustainable community garden powered entirely by solar energy. This project will provide fresh produce to local families while demonstrating renewable energy solutions.',
      'community',
      ARRAY['sustainability', 'solar', 'community', 'garden'],
      50000,
      12500,
      25,
      true,
      true,
      'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=400&fit=crop',
      NOW() - INTERVAL '28 days'
    ),
    (
      'Open Source Learning Platform',
      'Developing a free, open-source platform for online education that works offline and on low-bandwidth connections.',
      'education',
      ARRAY['education', 'open-source', 'technology', 'accessibility'],
      75000,
      45000,
      89,
      true,
      true,
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=400&fit=crop',
      NOW() - INTERVAL '22 days'
    ),
    (
      'Digital Art Exhibition Space',
      'Creating a virtual reality gallery space for emerging digital artists to showcase their work and connect with collectors.',
      'creative',
      ARRAY['art', 'vr', 'digital', 'gallery'],
      30000,
      18750,
      42,
      true,
      true,
      'https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=800&h=400&fit=crop',
      NOW() - INTERVAL '18 days'
    ),
    (
      'Blockchain Music Distribution',
      'Building a decentralized platform for musicians to distribute their music directly to fans without intermediaries.',
      'technology',
      ARRAY['blockchain', 'music', 'decentralized', 'distribution'],
      100000,
      67500,
      156,
      true,
      true,
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=400&fit=crop',
      NOW() - INTERVAL '12 days'
    ),
    (
      'Clean Water Initiative',
      'Installing water purification systems in rural communities to provide access to clean, safe drinking water.',
      'charity',
      ARRAY['water', 'charity', 'health', 'community'],
      80000,
      32000,
      78,
      true,
      true,
      'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=400&fit=crop',
      NOW() - INTERVAL '8 days'
    )
) AS campaign(title, description, category, tags, goal_amount, total_funding, contributor_count, is_active, is_public, featured_image_url, created_at)
WHERE p.username = CASE 
  WHEN campaign.title = 'Solar-Powered Community Garden' THEN 'alice_creator'
  WHEN campaign.title = 'Open Source Learning Platform' THEN 'bob_developer'
  WHEN campaign.title = 'Digital Art Exhibition Space' THEN 'charlie_artist'
  WHEN campaign.title = 'Blockchain Music Distribution' THEN 'evan_musician'
  WHEN campaign.title = 'Clean Water Initiative' THEN 'diana_educator'
END;

-- Verify the data was inserted
SELECT 'Profiles created:' as info, count(*) as count FROM profiles WHERE username LIKE '%_creator' OR username LIKE '%_developer' OR username LIKE '%_artist' OR username LIKE '%_educator' OR username LIKE '%_musician';
SELECT 'Funding pages created:' as info, count(*) as count FROM funding_pages WHERE is_public = true;

-- Show sample data
SELECT 'Sample profiles:' as info;
SELECT username, display_name, bio FROM profiles WHERE username IN ('alice_creator', 'bob_developer', 'charlie_artist', 'diana_educator', 'evan_musician');

SELECT 'Sample campaigns:' as info;
SELECT title, category, total_funding, contributor_count FROM funding_pages WHERE is_public = true ORDER BY created_at DESC; 