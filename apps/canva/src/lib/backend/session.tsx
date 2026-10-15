import type { User } from "@supabase/supabase-js";
import { LogIn } from "lucide-react";
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from "react";
import { ShellSkeleton } from "@/components/base/primitives";
import { env } from "@/lib/env";
import { supabase } from "@/lib/supabase";

/// ตัวตนของผู้ใช้ — ใช้ session ของ Supabase ที่ Hub ตั้งไว้ (cookie เดียวกันทุกแอป)
/// รักษา API เดิมของ csmju-canvas (useMe · useSignOut · SessionProvider) ให้หน้าจอเดิมไม่ต้องแก้

export type CoreRole = "student" | "alumni" | "staff" | "lecturer" | "guest" | "admin";
export type SubsystemRole = "CREATOR" | "EDITOR" | "ADMIN";

export interface Me {
  id: string;
  email: string;
  coreRole: CoreRole;
  subsystemRole: SubsystemRole;
  session?: { expiresAt: string };
}

/** Hub sign-in page that sends the user back to `next` (an absolute URL on this app). */
export function loginHref(next?: string): string {
  const url = new URL("/login", env.hubUrl);
  url.searchParams.set("next", new URL(next ?? currentPath(), env.supabase.siteUrl).href);
  return url.href;
}

export function currentPath(): string {
  return window.location.pathname + window.location.search;
}

// every signed-in Empire user is a creator here; admin tools from csmju-canvas stay hidden
const toMe = (user: User): Me => ({
  id: user.id,
  email: user.email ?? "",
  coreRole: "student",
  subsystemRole: "CREATOR",
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

  if (state.status === "loading") return <ShellSkeleton />;
  if (state.status === "signed-out") return <SignInScreen />;
  return <MeContext value={state.me}>{children}</MeContext>;
}

function SignInScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas px-6 text-center">
      <h1 className="text-cv-h2 font-bold">Empire Canvas</h1>
      <p className="max-w-md text-muted">
        เข้าสู่ระบบด้วยบัญชี Software Empire เพื่อสร้างและบันทึกงานออกแบบของคุณ
      </p>
      <a
        href={loginHref()}
        className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-5 font-semibold text-on-inverse hover:bg-primary-hover"
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
