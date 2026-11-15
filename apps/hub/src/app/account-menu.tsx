import { UserMenu, userMenuItemClass } from "@empire/ui";
import { Activity, LayoutDashboard, LogOut, UserRound, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./dashboard/actions";
import { Beacon } from "./beacon";

/**
 * The account menu for signed-in hub pages (dashboard, profile, back office), plus the page beacon.
 * Name comes from hub.profiles, falling back to the sign-up name, then the email.
 */
export async function AccountMenu() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data) return null;
  const { claims } = data;
  const [{ data: profile }, { data: admin }] = await Promise.all([
    supabase.schema("hub").from("profiles").select("display_name").maybeSingle(),
    supabase.schema("cms").rpc("is_admin"),
  ]);
  const meta = claims.user_metadata as { name?: unknown } | undefined;
  const name = profile?.display_name ?? (typeof meta?.name === "string" ? meta.name : "");

  const links = [
    { href: "/dashboard", label: "แดชบอร์ด", icon: <LayoutDashboard /> },
    { href: "/profile", label: "โปรไฟล์ของฉัน", icon: <UserRound /> },
    ...(admin === true
      ? [
          { href: "/admin/users", label: "จัดการผู้ใช้", icon: <Users /> },
          { href: "/admin/stats", label: "สถิติการเข้าใช้", icon: <Activity /> },
        ]
      : []),
  ];

  return (
    <>
      <Beacon />
      <UserMenu
        name={name}
        email={claims.email ?? ""}
        badge={admin === true ? "แอดมิน" : undefined}
        links={links}
        signOut={
          <form action={signOut}>
            <button type="submit" className={userMenuItemClass}>
              <LogOut aria-hidden className="size-4 text-muted-foreground" />
              ออกจากระบบ
            </button>
          </form>
        }
      />
    </>
  );
}
