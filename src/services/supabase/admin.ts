/**
 * Supabase Admin Client - Re-exports from SSOT
 *
 * DEPRECATED: Import directly from '@/lib/supabase/admin' instead.
 * This file exists for backwards compatibility only.
 *
 * SSOT: @/lib/supabase/admin
 */

import { getAdminClient, createAdminClient } from '@/lib/supabase/admin';

// Export singleton for backwards compatibility with default export
const supabaseAdmin = getAdminClient();

export default supabaseAdmin;
export { createAdminClient, getAdminClient };
