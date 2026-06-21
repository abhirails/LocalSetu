import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// True when both env vars are real (not placeholder)
export const isSupabaseConfigured =
  !!(supabaseUrl &&
     supabaseAnonKey &&
     supabaseUrl !== 'your_supabase_project_url_here' &&
     supabaseAnonKey !== 'your_supabase_anon_key_here')

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null

export default supabase
