// Quick test of the fixed migration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ohkueislstxomdjavyhs.supabase.co';
const supabaseKey = 'REPLACE_WITH_ENV_VAR';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMigration() {
  console.log('🧪 Testing migration fixes...');
  
  try {
    // Test if tables exist
    const tables = ['user_products', 'user_services', 'loans', 'conversations', 'timeline_events', 'donations'];
    
    for (const table of tables) {
      try {
        const { error } = await supabase.from(table).select('count').limit(1);
        if (!error) {
          console.log(`✅ ${table} exists`);
        } else {
          console.log(`❌ ${table} missing: ${error.message}`);
        }
      } catch (e) {
        console.log(`❌ ${table} error: ${e.message}`);
      }
    }
    
    // Test timeline_event_stats view
    try {
      const { error } = await supabase.from('timeline_event_stats').select('event_id').limit(1);
      if (!error) {
        console.log('✅ timeline_event_stats view works');
      } else {
        console.log(`❌ timeline_event_stats error: ${error.message}`);
      }
    } catch (e) {
      console.log(`❌ timeline_event_stats error: ${e.message}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testMigration();
