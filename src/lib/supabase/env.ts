export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

/** True once the Supabase URL and anon key are set. Until then the site runs in placeholder mode. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
