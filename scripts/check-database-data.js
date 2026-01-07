#!/usr/bin/env node

/**
 * Script to check database contents and add sample data if needed
 */

const { createClient } = require('@supabase/supabase-js');

// Get environment variables (with fallbacks for development)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'REPLACE_WITH_ENV_VAR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('🔍 Checking database contents...\n');

  try {
    // Check profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, name, created_at')
      .limit(10);

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError.message);
    } else {
      console.log(`👥 Profiles found: ${profiles.length}`);
      profiles.forEach(profile => {
        console.log(`  - ${profile.username || 'No username'} (${profile.name || 'No name'}) - ${profile.created_at}`);
      });
    }

    // Check projects
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, status, created_at')
      .limit(10);

    if (projectsError) {
      console.error('❌ Error fetching projects:', projectsError.message);
    } else {
      console.log(`\n📋 Projects found: ${projects.length}`);
      projects.forEach(project => {
        console.log(`  - "${project.title}" (${project.status}) - ${project.created_at}`);
      });
    }

    // Check active projects specifically
    const { data: activeProjects, error: activeProjectsError } = await supabase
      .from('projects')
      .select('id, title, status, created_at')
      .eq('status', 'active')
      .limit(10);

    if (activeProjectsError) {
      console.error('❌ Error fetching active projects:', activeProjectsError.message);
    } else {
      console.log(`\n✅ Active projects: ${activeProjects.length}`);
    }

    console.log('\n✨ Database check complete!');

  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

// Run the check
checkDatabase();
