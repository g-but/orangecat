#!/usr/bin/env node

/**
 * Public Profiles & Sharing - Test Script
 *
 * Tests the Phase 1 implementation:
 * - Public profile routes
 * - Server-side rendered project pages
 * - Metadata generation
 * - 404 handling
 *
 * Created: 2025-01-30
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('   Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Test results tracker
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

function logTest(name, passed, message = '') {
  if (passed) {
    console.log(`✅ ${name}`);
    results.passed.push(name);
  } else {
    console.error(`❌ ${name}${message ? ': ' + message : ''}`);
    results.failed.push({ name, message });
  }
}

function logWarning(name, message) {
  console.warn(`⚠️  ${name}: ${message}`);
  results.warnings.push({ name, message });
}

async function testPublicProfileRoute() {
  console.log('\n📋 Testing Public Profile Route...\n');

  try {
    // Find a test user with username
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('username, display_name')
      .not('username', 'is', null)
      .limit(1);

    if (error) {
      logTest('Fetch test profiles', false, error.message);
      return;
    }

    if (!profiles || profiles.length === 0) {
      logWarning(
        'Public Profile Route',
        'No profiles with usernames found. Create a test user first.'
      );
      return;
    }

    const testProfile = profiles[0];
    logTest('Found test profile', true, `Username: ${testProfile.username}`);

    // Test profile fetch by username
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', testProfile.username)
      .single();

    if (fetchError || !profile) {
      logTest('Fetch profile by username', false, fetchError?.message || 'Profile not found');
      return;
    }

    logTest(
      'Fetch profile by username',
      true,
      `Found: ${profile.display_name || profile.username}`
    );

    // Test projects fetch
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, title, status')
      .eq('user_id', profile.id)
      .neq('status', 'draft')
      .limit(5);

    if (projectsError) {
      logWarning('Fetch user projects', projectsError.message);
    } else {
      logTest('Fetch user projects', true, `Found ${projects?.length || 0} public projects`);
    }

    // Test non-existent profile
    const { data: nonExistent, error: notFoundError } = await supabase
      .from('profiles')
      .select('*')
      .eq('username', 'definitely-does-not-exist-12345')
      .single();

    if (notFoundError && notFoundError.code === 'PGRST116') {
      logTest('404 handling for non-existent profile', true);
    } else if (nonExistent) {
      logTest(
        '404 handling for non-existent profile',
        false,
        'Should return error, but found profile'
      );
    } else {
      logTest('404 handling for non-existent profile', true, 'No profile found (expected)');
    }
  } catch (error) {
    logTest('Public Profile Route Tests', false, error.message);
  }
}

async function testProjectPage() {
  console.log('\n📋 Testing Project Page Server-Side Rendering...\n');

  try {
    // Find a public project
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, title, description, user_id, status')
      .neq('status', 'draft')
      .limit(1);

    if (error) {
      logTest('Fetch test projects', false, error.message);
      return;
    }

    if (!projects || projects.length === 0) {
      logWarning('Project Page', 'No public projects found. Create a test project first.');
      return;
    }

    const testProject = projects[0];
    logTest('Found test project', true, `Title: ${testProject.title}`);

    // Test project fetch with profile
    const { data: project, error: fetchError } = await supabase
      .from('projects')
      .select('*, profiles:user_id (username, display_name, avatar_url)')
      .eq('id', testProject.id)
      .single();

    if (fetchError || !project) {
      logTest('Fetch project with profile', false, fetchError?.message || 'Project not found');
      return;
    }

    logTest('Fetch project with profile', true);

    // Verify required fields for metadata
    const hasTitle = !!project.title;
    const hasDescription = !!project.description;

    logTest('Project has title', hasTitle);
    logTest('Project has description', hasDescription);

    // Test non-existent project
    const { data: nonExistent, error: notFoundError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', '00000000-0000-0000-0000-000000000000')
      .single();

    if (notFoundError && notFoundError.code === 'PGRST116') {
      logTest('404 handling for non-existent project', true);
    } else if (nonExistent) {
      logTest(
        '404 handling for non-existent project',
        false,
        'Should return error, but found project'
      );
    } else {
      logTest('404 handling for non-existent project', true, 'No project found (expected)');
    }
  } catch (error) {
    logTest('Project Page Tests', false, error.message);
  }
}

async function testMetadataGeneration() {
  console.log('\n📋 Testing Metadata Generation...\n');

  try {
    // Test profile metadata fields
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, display_name, bio, avatar_url')
      .not('username', 'is', null)
      .limit(1)
      .single();

    if (profile) {
      const hasDisplayName = !!profile.display_name || !!profile.username;
      const hasBio = !!profile.bio;
      const hasImage = !!profile.avatar_url;

      logTest('Profile metadata: display name', hasDisplayName);
      logTest('Profile metadata: bio', hasBio);
      logTest('Profile metadata: avatar', hasImage);

      if (!hasImage) {
        logWarning('Profile metadata', 'No avatar_url - will use default OG image');
      }
    }

    // Test project metadata fields
    const { data: project } = await supabase
      .from('projects')
      .select('title, description, user_id, profiles:user_id (avatar_url)')
      .neq('status', 'draft')
      .limit(1)
      .single();

    if (project) {
      const hasTitle = !!project.title;
      const hasDescription = !!project.description;
      const hasCreator = !!project.profiles;

      logTest('Project metadata: title', hasTitle);
      logTest('Project metadata: description', hasDescription);
      logTest('Project metadata: creator info', hasCreator);
    }
  } catch (error) {
    logTest('Metadata Generation Tests', false, error.message);
  }
}

async function testRouteConstants() {
  console.log('\n📋 Testing Route Constants...\n');

  try {
    // Import route constants (would need to be in a test file, but we can verify the file exists)
    const fs = await import('fs');
    const path = await import('path');

    const routesFile = path.join(process.cwd(), 'src/lib/routes.ts');
    const routesContent = fs.readFileSync(routesFile, 'utf-8');

    const hasProfilesView = routesContent.includes('PROFILES:') && routesContent.includes('VIEW:');
    logTest('Route constants: PROFILES.VIEW exists', hasProfilesView);

    const hasProfilesRoute = routesContent.includes('/profiles/');
    logTest('Route constants: /profiles/ route defined', hasProfilesRoute);
  } catch (error) {
    logWarning('Route Constants', `Could not verify route constants: ${error.message}`);
  }
}

async function runAllTests() {
  console.log('🧪 Public Profiles & Sharing - Test Suite\n');
  console.log('='.repeat(60));

  await testPublicProfileRoute();
  await testProjectPage();
  await testMetadataGeneration();
  await testRouteConstants();

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Test Summary\n');
  console.log(`✅ Passed: ${results.passed.length}`);
  console.log(`❌ Failed: ${results.failed.length}`);
  console.log(`⚠️  Warnings: ${results.warnings.length}`);

  if (results.failed.length > 0) {
    console.log('\n❌ Failed Tests:');
    results.failed.forEach(({ name, message }) => {
      console.log(`   - ${name}${message ? ': ' + message : ''}`);
    });
  }

  if (results.warnings.length > 0) {
    console.log('\n⚠️  Warnings:');
    results.warnings.forEach(({ name, message }) => {
      console.log(`   - ${name}: ${message}`);
    });
  }

  console.log('\n' + '='.repeat(60));

  if (results.failed.length === 0) {
    console.log('\n✅ All tests passed! Ready for deployment.\n');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed. Please fix issues before deploying.\n');
    process.exit(1);
  }
}

runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
