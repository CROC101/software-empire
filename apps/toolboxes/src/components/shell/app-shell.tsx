import { Button, cn } from "@empire/ui";
import { HubSwitcher } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import { House, LayoutGrid, LogIn, LogOut, Star } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { env } from "@/lib/env";
import { signInUrl, signOut, useSession } from "@/lib/session";
import { FavoritesSync } from "@/lib/tools/favorites-sync";

const NAV = [
  { to: "/", label: "หน้าหลัก", icon: House },
  { to: "/tools", label: "เครื่องมือ", icon: LayoutGrid },
  { to: "/favorites", label: "รายการโปรด", icon: Star },
];

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  if (to === "/tools") return pathname.startsWith("/tools") || pathname.startsWith("/category/");
  return pathname.startsWith(to);
}

export function AppShell() {
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2"
      >
        ข้ามไปเนื้อหา
      </a>
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-2 sm:gap-2 sm:px-6">
          <HubSwitcher
            hubUrl={env.hubUrl}
            apps={subsystems}
            current="toolboxes"
            cookieDomain={import.meta.env.VITE_COOKIE_DOMAIN}
            iconOnly
            className="size-9 justify-center rounded-md hover:bg-accent"
          />
          <Link to="/" className="mr-auto rounded-md px-1 font-bold tracking-tight">
            Toolboxes
          </Link>
          <nav aria-label="เมนูหลัก" className="flex items-center">
            {NAV.map((item) => {
              const active = isActive(pathname, item.to);
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm hover:bg-muted",
                    active ? "font-semibold text-foreground" : "text-muted-foreground",
                  )}
                >
                  <item.icon aria-hidden className="size-4" />
                  <span className="sr-only sm:not-sr-only">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <Account />
        </div>
      </header>
      <div id="content" className="flex-1">
        <Outlet />
      </div>
      <FavoritesSync />
    </div>
  );
}

function Account() {
  const { user, ready } = useSession();
  const { pathname, search } = useLocation();

  // keep the slot sized while the cookie is read so the header doesn't jump
  if (!ready) return <span aria-hidden className="h-9 w-9" />;

  if (!user) {
    return (
      <Button asChild size="sm">
        <a href={signInUrl(new URL(pathname + search, env.siteUrl).href)}>
          <LogIn aria-hidden />
          <span className="sr-only sm:not-sr-only">เข้าสู่ระบบ</span>
        </a>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="hidden max-w-48 truncate text-sm text-muted-foreground lg:inline">
        {user.email}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          void signOut();
        }}
      >
        <LogOut aria-hidden />
        <span className="sr-only sm:not-sr-only">ออกจากระบบ</span>
      </Button>
    </div>
  );
}
