import { NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import {
  apiSuccess,
  apiNotFound,
  handleApiError,
} from '@/lib/api/standardResponse';

/**
 * GET /api/profile/[identifier] - Get profile by username or email
 * 
 * Supports both username and email lookups for viewing other users' profiles
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ identifier: string }> }
) {
  try {
    const { identifier } = await params;
    
    if (!identifier?.trim()) {
      return apiNotFound('Profile identifier is required');
    }

    const supabase = await createServerClient();
    const trimmedIdentifier = identifier.trim();
    const isEmail = trimmedIdentifier.includes('@');
    
    let profile = null;
    let error = null;
    let userId: string | null = null;
    
    if (isEmail) {
      // Try to find profile by email field first (if it exists in profiles table)
      const { data: profileByEmail, error: emailError } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', trimmedIdentifier)
        .single();
      
      if (!emailError && profileByEmail) {
        profile = profileByEmail;
        userId = profileByEmail.id;
      } else {
        // If email field doesn't exist in profiles, try to find user by email in auth.users
        // Use service role client if available for admin access
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        
        if (serviceRoleKey && supabaseUrl) {
          try {
            const adminClient = createClient(supabaseUrl, serviceRoleKey, {
              auth: {
                autoRefreshToken: false,
                persistSession: false
              }
            });
            
            // Use getUserByEmail if available (more efficient than listing all users)
            // Note: This method might not be available in all Supabase versions
            try {
              const { data: userData, error: getUserError } = await adminClient.auth.admin.getUserByEmail(trimmedIdentifier);
              
              if (!getUserError && userData?.user?.id) {
                userId = userData.user.id;
              } else {
                // Fallback: list users and find by email (less efficient but works)
                const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
                
                if (!listError && usersData?.users) {
                  const user = usersData.users.find(u => u.email?.toLowerCase() === trimmedIdentifier.toLowerCase());
                  if (user?.id) {
                    userId = user.id;
                  } else {
                    return apiNotFound('Profile not found');
                  }
                } else {
                  return apiNotFound('Profile not found');
                }
              }
            } catch (getUserByEmailError) {
              // Fallback: list users and find by email
              const { data: usersData, error: listError } = await adminClient.auth.admin.listUsers();
              
              if (!listError && usersData?.users) {
                const user = usersData.users.find(u => u.email?.toLowerCase() === trimmedIdentifier.toLowerCase());
                if (user?.id) {
                  userId = user.id;
                } else {
                  return apiNotFound('Profile not found');
                }
              } else {
                return apiNotFound('Profile not found');
              }
            }
            
            // Now fetch the profile by user ID
            if (userId) {
              const { data: profileById, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();
              
              if (!profileError && profileById) {
                profile = profileById;
              } else {
                error = profileError;
              }
            } else {
              return apiNotFound('Profile not found');
            }
          } catch (adminError) {
            // Fallback: return error suggesting username lookup
            return apiNotFound('Profile not found. Please use username instead of email.');
          }
        } else {
          // No service role key available, can't lookup by email
          return apiNotFound('Profile not found. Please use username instead of email.');
        }
      }
    } else {
      // Look up by username
      const { data: profileByUsername, error: usernameError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', trimmedIdentifier)
        .single();
      
      profile = profileByUsername;
      error = usernameError;
      if (profile) {
        userId = profile.id;
      }
    }

    if (error || !profile) {
      return apiNotFound('Profile not found');
    }

    // Calculate project count
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId || profile.id)
      .neq('status', 'draft'); // Exclude drafts from public view

    // Add computed project_count to profile
    const profileWithCounts = {
      ...profile,
      project_count: projectCount || 0,
    };

    return apiSuccess(profileWithCounts);
  } catch (error) {
    return handleApiError(error);
  }
}

