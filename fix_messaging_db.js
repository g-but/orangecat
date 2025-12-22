#!/usr/bin/env node

/**
 * Fix Messaging Database Functions
 *
 * This script applies the necessary database fixes to resolve the
 * "participant_read_times does not exist" error in the messaging system.
 */

const { createClient } = require('@supabase/supabase-js');

// Get credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function applyMigration() {
  console.log('🚀 Applying Messaging Database Migration...');
  console.log('📍 Supabase URL:', supabaseUrl);

  try {
    // Drop problematic functions first
    console.log('📝 Dropping problematic functions...');

    await supabase.rpc('exec_sql', {
      query: 'DROP FUNCTION IF EXISTS public.get_total_unread_count(uuid) CASCADE;',
    });

    await supabase.rpc('exec_sql', {
      query: 'DROP FUNCTION IF EXISTS public.get_user_conversations(uuid) CASCADE;',
    });

    await supabase.rpc('exec_sql', {
      query:
        'DROP FUNCTION IF EXISTS public.get_conversation_participant_read_times(uuid) CASCADE;',
    });

    console.log('✅ Old functions dropped');

    // Create the fixed functions
    console.log('📝 Creating fixed get_total_unread_count function...');

    const unreadCountFunction = `
      CREATE OR REPLACE FUNCTION public.get_total_unread_count(p_user_id uuid)
      RETURNS integer AS $$
      DECLARE
        total_count integer := 0;
        conv_record RECORD;
      BEGIN
        FOR conv_record IN
          SELECT cp.conversation_id, cp.last_read_at
          FROM public.conversation_participants cp
          WHERE cp.user_id = p_user_id
            AND cp.is_active = true
        LOOP
          SELECT total_count + COALESCE((
            SELECT COUNT(m.id)
            FROM public.messages m
            WHERE m.conversation_id = conv_record.conversation_id
              AND m.sender_id != p_user_id
              AND m.is_deleted = false
              AND (conv_record.last_read_at IS NULL OR m.created_at > conv_record.last_read_at)
          ), 0) INTO total_count;
        END LOOP;

        RETURN total_count;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER STABLE;
    `;

    await supabase.rpc('exec_sql', { query: unreadCountFunction });
    console.log('✅ get_total_unread_count function created');

    console.log('📝 Creating fixed get_user_conversations function...');

    const userConversationsFunction = `
      CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid)
      RETURNS TABLE(
        id uuid,
        title text,
        is_group boolean,
        created_at timestamptz,
        updated_at timestamptz,
        last_message_at timestamptz,
        last_message_preview text,
        last_message_sender_id uuid,
        created_by uuid,
        participants jsonb,
        unread_count integer
      )
      LANGUAGE plpgsql
      SECURITY DEFINER
      STABLE
      AS $$
      BEGIN
        RETURN QUERY
        SELECT
          c.id,
          c.title,
          c.is_group,
          c.created_at,
          c.updated_at,
          c.last_message_at,
          c.last_message_preview,
          c.last_message_sender_id,
          c.created_by,
          jsonb_agg(
            jsonb_build_object(
              'user_id', cp.user_id,
              'username', p.username,
              'name', p.name,
              'avatar_url', p.avatar_url,
              'role', cp.role,
              'joined_at', cp.joined_at,
              'last_read_at', cp.last_read_at,
              'is_active', cp.is_active
            )
          ) as participants,
          COALESCE((
            SELECT COUNT(m.id)
            FROM messages m
            WHERE m.conversation_id = c.id
              AND m.sender_id != p_user_id
              AND m.is_deleted = false
              AND (cp_user.last_read_at IS NULL OR m.created_at > cp_user.last_read_at)
          ), 0) as unread_count
        FROM conversations c
        JOIN conversation_participants cp ON c.id = cp.conversation_id
        LEFT JOIN profiles p ON cp.user_id = p.id
        LEFT JOIN conversation_participants cp_user ON c.id = cp_user.conversation_id AND cp_user.user_id = p_user_id
        WHERE cp.user_id = p_user_id
          AND cp.is_active = true
        GROUP BY c.id, c.title, c.is_group, c.created_at, c.updated_at, c.last_message_at, c.last_message_preview, c.last_message_sender_id, c.created_by, cp_user.last_read_at
        ORDER BY c.last_message_at DESC NULLS LAST
        LIMIT 30;
      END;
      $$;
    `;

    await supabase.rpc('exec_sql', { query: userConversationsFunction });
    console.log('✅ get_user_conversations function created');

    console.log('🎉 Migration applied successfully!');
    console.log('📱 Messaging system should now work properly');
    console.log('💡 You can now send messages to "mao" and other contacts');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
