require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkProfile() {
  const userId = 'd26e6c11-f832-49b0-b0b6-b05a7879f9a4';
  
  try {
    console.log('Checking if profile exists for user:', userId);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking profile:', error);
      return;
    }
    
    if (data) {
      console.log('Profile exists:', data);
    } else {
      console.log('Profile does not exist, creating...');
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({ 
          id: userId, 
          username: 'testuser', 
          name: 'Test User',
          email: 'test@example.com'
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating profile:', insertError);
      } else {
        console.log('Profile created:', newProfile);
      }
    }
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

checkProfile();
