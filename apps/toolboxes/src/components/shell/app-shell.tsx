import { Button, cn, HubSwitcher } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import { AppWindow, House, LayoutGrid, LogIn, LogOut, Shapes, Star } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router";
import { env } from "@/lib/env";
import { signInUrl, signOut, useSession } from "@/lib/session";
import { FavoritesSync } from "@/lib/tools/favorites-sync";
import { Dock } from "@/components/ui/dock";
import { KineticMenu } from "@/components/ui/kinetic-menu";
import SignaturePenFooter from "./signature-pen-footer";

const NAV = [
  { to: "/", label: "หน้าหลัก", icon: House },
  { to: "/tools", label: "เครื่องมือ", icon: LayoutGrid },
  { to: "/apps", label: "แอป", icon: AppWindow },
  { to: "/icons", label: "ไอคอน", icon: Shapes },
  { to: "/favorites", label: "รายการโปรด", icon: Star },
];

// the full-screen menu: every page, plus the ones too small for the bar
const MENU = [
  { to: "/", label: "หน้าหลัก", hint: "home" },
  { to: "/tools", label: "เครื่องมือ", hint: "tools" },
  { to: "/apps", label: "แอป", hint: "apps" },
  { to: "/icons", label: "ไอคอน", hint: "icons" },
  { to: "/favorites", label: "รายการโปรด", hint: "favorites" },
  { to: "/licenses", label: "สัญญาอนุญาต", hint: "licenses" },
];

function isActive(pathname: string, to: string) {
  if (to === "/") return pathname === "/";
  if (to === "/tools") return pathname.startsWith("/tools") || pathname.startsWith("/category/");
  return pathname.startsWith(to);
}

export function AppShell() {
  const { pathname } = useLocation();

  return (
    // pb: the phone dock floats over the bottom of the page
    <div className="flex min-h-dvh flex-col pb-24 sm:pb-0">
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
          {/* phones get the dock at the bottom instead */}
          <nav aria-label="เมนูหลัก" className="hidden items-center sm:flex">
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
                  <span className="sr-only lg:not-sr-only">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <KineticMenu
            links={MENU}
            footer={
              <>
                ทุกเครื่องมือทำงานในเบราว์เซอร์ของคุณ ·{" "}
                <a
                  href={env.hubUrl}
                  className="font-medium text-primary underline underline-offset-4"
                >
                  crocwork hub
                </a>
              </>
            }
          />
          <Account />
        </div>
      </header>
      <div id="content" className="flex-1">
        <Outlet />
      </div>
      <div className="vt-top pointer-events-none fixed inset-x-0 bottom-3 z-40 flex justify-center sm:hidden">
        <Dock
          className="pointer-events-auto"
          items={NAV.map((item) => ({ ...item, active: isActive(pathname, item.to) }))}
        />
      </div>
      <SiteFooter />
      <FavoritesSync />
    </div>
  );
}

const year = new Date().getFullYear();

/** The closing sign-off shared by every page: the pen writes "crocwork", then the links settle in. */
function SiteFooter() {
  const { user } = useSession();
  const { pathname, search } = useLocation();
  return (
    <SignaturePenFooter
      word="crocwork"
      title="ขอบคุณที่แวะมาใช้กล่องเครื่องมือ"
      description={
        user
          ? "งานในแอปของคุณซิงก์เข้าบัญชีแล้ว เปิดเครื่องไหนก็ทำต่อได้"
          : "ทุกอย่างทำงานในเบราว์เซอร์ของคุณ ล็อกอินที่ hub ครั้งเดียว แล้วงานในแอปจะตามไปทุกเครื่อง"
      }
      actions={[
        user
          ? { label: "กลับ hub", href: env.hubUrl }
          : { label: "เข้าสู่ระบบ", href: signInUrl(new URL(pathname + search, env.siteUrl).href) },
        { label: "ดูแอปทั้งหมด", href: "/apps" },
      ]}
      brand="crocwork toolboxes"
      links={[
        { label: "เครื่องมือ", href: "/tools" },
        { label: "แอป", href: "/apps" },
        { label: "ไอคอน", href: "/icons" },
        { label: "สัญญาอนุญาต", href: "/licenses" },
        { label: "crocwork hub", href: env.hubUrl },
      ]}
      legal={`© ${String(year + 543)} crocwork`}
      height="min(88svh, 760px)"
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
