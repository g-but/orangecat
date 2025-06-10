import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// During static builds (e.g., Vercel build step) the service-role key may be
// intentionally absent for security.  To prevent the build from crashing we
// fall back to a dummy client that will throw **at runtime** if it is actually
// used without the required credentials.  This keeps the build green while
// still ensuring we do not accidentally operate without proper secrets in
// production.

function createDummyClient() {
  return new Proxy({}, {
    get() {
      throw new Error('Supabase Admin client requested, but required environment variables are missing (NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY). Configure these in your deployment environment.')
    },
  }) as unknown as ReturnType<typeof createClient>
}

const supabaseAdmin = (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY)
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : createDummyClient()

export default supabaseAdmin; 