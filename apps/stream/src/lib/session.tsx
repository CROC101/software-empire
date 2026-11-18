import type { User } from "@supabase/supabase-js";
import { createContext, use, useEffect, useState, type ReactNode } from "react";
import { env } from "./env";

/** The Supabase SDK is ~half the app's JS and only needed for the account — load it after first paint. */
export const loadSupabase = () => import("./supabase").then((m) => m.supabase);

type Session = { user: User | null; ready: boolean };

const SessionContext = createContext<Session>({ user: null, ready: false });

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>({ user: null, ready: false });

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    let active = true;

    loadSupabase()
      .then((supabase) => {
        if (!active) return;
        // fires INITIAL_SESSION right away, then on sign-in/out and token refresh (also from other tabs)
        const { data } = supabase.auth.onAuthStateChange((_event, current) => {
          setSession({ user: current?.user ?? null, ready: true });
        });
        unsubscribe = () => {
          data.subscription.unsubscribe();
        };
      })
      .catch((error: unknown) => {
        console.error("โหลดระบบบัญชีไม่สำเร็จ", error);
        if (active) setSession({ user: null, ready: true });
      });

    return () => {
      active = false;
      unsubscribe?.();
    };
  }, []);

  return <SessionContext value={session}>{children}</SessionContext>;
}

export const useSession = () => use(SessionContext);

/** Sign-in happens at the hub, which sends the user back to `returnTo`. */
export function signInUrl(returnTo: string) {
  const url = new URL("/login", env.hubUrl);
  url.searchParams.set("next", returnTo);
  return url.href;
}

/** Clears the shared cookie — signs the user out of every Empire app. */
export async function signOut() {
  const supabase = await loadSupabase();
  await supabase.auth.signOut();
}
