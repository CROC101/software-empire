import { createBrowserSupabase } from "@empire/core/supabase";
import { env } from "@/lib/env";

/** For Client Components (the visit beacon, the live online list). One per tab. */
export const createBrowserClient = () => createBrowserSupabase(env);
