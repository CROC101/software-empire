import type { User } from "@supabase/supabase-js";
import { Loader2, LogIn } from "lucide-react";
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";

/// ตัวตนของผู้ใช้ — ใช้ session ของ Supabase ที่ Hub ตั้งไว้ (cookie เดียวกันทุกแอป)
/// รักษา API เดิมของ csmju-nexus (useMe · useSignOut · SessionProvider) ให้หน้าจอเดิมไม่ต้องแก้

export type CoreRole = "student" | "alumni" | "staff" | "lecturer" | "guest" | "admin";
export type SubsystemRole = "GUEST" | "EDITOR" | "ADMIN";

export interface Me {
  /** Supabase user id — every `coreUserId` in this app is a user id. */
  id: string;
  email: string;
  coreRole: CoreRole;
  subsystemRole: SubsystemRole;
  session?: { expiresAt: string };
}

/** Hub sign-in page that sends the user back to `next` (a path on this app). */
export function loginHref(next?: string): string {
  const url = new URL("/login", env.hubUrl);
  url.searchParams.set("next", new URL(next ?? currentPath(), env.supabase.siteUrl).href);
  return url.href;
}

export function currentPath(): string {
  return window.location.pathname + window.location.search;
}

// role comes from community.profiles (admins are set in the database, never by the client);
// until that loads everyone is an EDITOR — the database still enforces the real role
const toMe = (user: User): Me => ({
  id: user.id,
  email: user.email ?? "",
  coreRole: "student",
  subsystemRole: "EDITOR",
});

type State = { status: "loading" } | { status: "signed-out" } | { status: "ready"; me: Me };

const MeContext = createContext<Me | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? { status: "ready", me: toMe(session.user) } : { status: "signed-out" });
    });
    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  if (state.status === "loading") {
    return (
      <div role="status" className="grid min-h-dvh place-items-center text-muted-foreground">
        <Loader2 aria-hidden className="size-6 animate-spin" />
        <span className="sr-only">กำลังตรวจสอบตัวตน…</span>
      </div>
    );
  }
  if (state.status === "signed-out") return <SignInScreen />;
  return <MeContext value={state.me}>{children}</MeContext>;
}

function SignInScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-heading text-2xl font-bold">Empire Community</h1>
      <p className="max-w-md text-muted-foreground">
        เข้าสู่ระบบด้วยบัญชี Software Empire เพื่อดูฟีด แชท และห้องเสียงของชุมชน
      </p>
      <a
        href={loginHref()}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-primary-foreground hover:bg-primary/90"
      >
        <LogIn aria-hidden className="size-5" />
        เข้าสู่ระบบ
      </a>
    </main>
  );
}

export function useMe(): Me {
  const me = use(MeContext);
  if (!me) throw new Error("useMe ต้องอยู่ใต้ <SessionProvider>");
  return me;
}

/** Clears the shared cookie — signs the user out of every Empire app. */
export function useSignOut(): () => Promise<void> {
  return useCallback(async () => {
    await supabase.auth.signOut();
  }, []);
}
