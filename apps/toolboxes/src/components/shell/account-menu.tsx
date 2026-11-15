import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { startBeacon } from "@empire/core/presence";
import { UserMenu, userMenuItemClass } from "@empire/ui";
import { Clock, LayoutDashboard, LogOut, Star, UserRound } from "lucide-react";
import { env } from "@/lib/env";
import { loadSupabase, signOut } from "@/lib/session";

/**
 * Signed-in account menu (same panel as the hub's), plus the page beacon that feeds the hub's
 * back office (hub.visits / hub.online). The name is the one set at the hub's /profile.
 */
export function AccountMenu({ user, pathname }: { user: User; pathname: string }) {
  const meta = user.user_metadata as { name?: unknown };
  const [name, setName] = useState(typeof meta.name === "string" ? meta.name : "");
  const beacon = useRef<ReturnType<typeof startBeacon> | null>(null);

  useEffect(() => {
    let active = true;
    void loadSupabase().then(async (supabase) => {
      if (!active) return;
      beacon.current = startBeacon(supabase, "toolboxes");
      beacon.current.page(location.pathname);
      const { data } = await supabase
        .schema("hub")
        .from("profiles")
        .select("display_name")
        .maybeSingle();
      if (active && data) setName(data.display_name);
    });
    return () => {
      active = false;
      beacon.current?.stop();
      beacon.current = null;
    };
  }, [user.id]);
  useEffect(() => beacon.current?.page(pathname), [pathname]);

  const hub = (path: string) => new URL(path, env.hubUrl).href;
  return (
    <UserMenu
      name={name}
      email={user.email ?? ""}
      className="size-8 rounded-full"
      links={[
        { href: hub("/profile"), label: "My profile", icon: <UserRound /> },
        { href: hub("/dashboard"), label: "Dashboard", icon: <LayoutDashboard /> },
        { href: "/favorites", label: "Favorites", icon: <Star /> },
        { href: "/history", label: "History", icon: <Clock /> },
      ]}
      signOut={
        <button type="button" onClick={() => void signOut()} className={userMenuItemClass}>
          <LogOut aria-hidden className="size-4 text-muted-foreground" />
          Sign out
        </button>
      }
    />
  );
}
