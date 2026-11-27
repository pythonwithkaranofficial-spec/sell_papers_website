import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Anonymous Supabase client that does not read cookies. Used for public catalogue data
 * (prices, availability) so those pages can be cached and served instantly.
 */
export function createPublicClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
