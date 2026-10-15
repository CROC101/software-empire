import { createBrowserSupabase } from "@empire/core/supabase";
import { env } from "./env";

/** Reads and refreshes the session cookie the hub set — one sign-in covers every Empire app. */
export const supabase = createBrowserSupabase(env.supabase);

/** All tables of this app live in the `community` schema (one schema per app — ADR-02). */
export const db = () => supabase.schema("community");
