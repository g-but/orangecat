#!/usr/bin/env node

/**
 * Fix Username Email Issue
 *
 * This script fixes profiles that have full email addresses as usernames
 * by extracting the part before @ and ensuring uniqueness.
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixUsernameEmails() {
  console.log('Starting username fix...\n');

  // Step 1: Get all profiles with email addresses as usernames
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, username, email')
    .like('username', '%@%');

  if (fetchError) {
    console.error('Error fetching profiles:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${profiles.length} profiles with email addresses as usernames\n`);

  // Step 2: Fix each profile
  for (const profile of profiles) {
    const baseUsername = profile.username.split('@')[0];
    let newUsername = baseUsername;
    let counter = 0;

    // Check for uniqueness
    let isUnique = false;
    while (!isUnique) {
      const { data: existing } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', newUsername)
        .neq('id', profile.id)
        .single();

      if (!existing) {
        isUnique = true;
      } else {
        counter++;
        newUsername = `${baseUsername}${counter}`;
      }
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        username: newUsername,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (updateError) {
      console.error(`Error updating profile ${profile.id}:`, updateError);
    } else {
      console.log(`✓ Updated profile ${profile.id}: ${profile.username} → ${newUsername}`);
    }
  }

  console.log('\n✓ Username fix completed!');
}

fixUsernameEmails().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
