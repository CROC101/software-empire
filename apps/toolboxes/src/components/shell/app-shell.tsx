import { Button, cn, HubSwitcher, TearFooter } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import { AppWindow, House, LayoutGrid, LogIn, LogOut, Shapes, Star } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { env } from "@/lib/env";
import { signInUrl, signOut, useSession } from "@/lib/session";
import { FavoritesSync } from "@/lib/tools/favorites-sync";

const NAV = [
  { to: "/", label: "หน้าหลัก", icon: House },
  { to: "/tools", label: "เครื่องมือ", icon: LayoutGrid },
  { to: "/apps", label: "แอป", icon: AppWindow },
  { to: "/icons", label: "ไอคอน", icon: Shapes },
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
      <header className="vt-top sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-1 px-2 sm:gap-2 sm:px-6">
          <HubSwitcher
            hubUrl={env.hubUrl}
            apps={subsystems}
            current="toolboxes"
            cookieDomain={import.meta.env.VITE_COOKIE_DOMAIN}
            iconOnly
            className="size-9 justify-center rounded-md hover:bg-accent"
          />
          <Link
            to="/"
            className="mr-auto flex items-baseline gap-1.5 rounded-md px-1 font-black tracking-tight"
          >
            crocwork
            <span className="hidden font-mono text-xs font-medium text-primary uppercase sm:inline">
              toolboxes
            </span>
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
                    "inline-flex h-10 items-center gap-2 rounded-md px-2.5 text-sm hover:bg-muted sm:px-3",
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
      <SiteFooter />
      <FavoritesSync />
    </div>
  );
}

const year = new Date().getFullYear();

/** The studio's torn-poster footer, shared by every page of the toolbox. */
function SiteFooter() {
  return (
    <TearFooter
      brand="crocwork"
      ink
      name="toolboxes"
      logo={<AppWindow aria-hidden className="size-6" />}
      logoHref="/"
      columns={[
        {
          title: "ในกล่อง",
          links: [
            { label: "เครื่องมือ", href: "/tools" },
            { label: "แอป", href: "/apps" },
          ],
          // two links: on phones the torn paper covers a third line
          cta: { label: "ไอคอน", href: "/icons" },
        },
        {
          title: "crocwork",
          links: [
            { label: "หน้าหลัก crocwork", href: env.hubUrl },
            { label: "ซอร์สแอป", href: "https://github.com/CROC101" },
          ],
          cta: { label: "กลับ hub", href: env.hubUrl },
        },
      ]}
      sideLinks={[
        { label: "GitHub", href: "https://github.com/CROC101", icon: "github" },
        { label: "crocwork", href: env.hubUrl, icon: "globe" },
      ]}
      timeZone="Asia/Bangkok"
      timeLabel="กรุงเทพฯ"
      copyright={`© ${String(year + 543)} crocwork · ประกาศลิขสิทธิ์ของโค้ดต้นทางอยู่ในแต่ละแอป`}
      labels={{ top: "กลับขึ้นบน", pin: "หมุด", copied: "คัดลอกแล้ว", copy: "คัดลอก" }}
    />
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
