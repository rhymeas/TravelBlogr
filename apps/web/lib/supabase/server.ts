/**
 * Re-export of server-side Supabase utilities
 * This file exists for backward compatibility with imports using @/lib/supabase/server
 */
export { createServerSupabase, createServiceSupabase } from '../supabase-server'
export type { ServerSupabaseClient, ServiceSupabaseClient } from '../supabase-server'

// Also re-export createClient from @supabase/supabase-js for backward compatibility
export { createClient } from '@supabase/supabase-js'

