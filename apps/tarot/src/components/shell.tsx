import { HubSwitcher, cn } from "@empire/ui";
import { subsystems } from "@empire/core/subsystems";
import { Coins, Layers, Sun, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { useTarotData } from "@/lib/data";
import { env } from "@/lib/env";
import { useSession } from "@/lib/session";
import { IntroSheet, Splash } from "./intro";
import { ProfileForm } from "./profile-form";

const NAV = [
  { to: "/", label: "ไพ่ประจำวัน", icon: Sun },
  { to: "/read", label: "อ่านไพ่", icon: Layers },
  { to: "/me", label: "ฉัน", icon: UserRound },
];

/** Night sky, a top bar (hub switcher, coins) and a bottom tab bar like a phone app. */
export function Shell() {
  const { status } = useTarotData();
  // the profile question waits until the first-visit tour is closed: one dialog at a time
  const [introDone, setIntroDone] = useState(false);
  const onIntroDone = useCallback(() => setIntroDone(true), []);
  return (
    <div className="flex min-h-dvh flex-col text-[var(--em-ink-50)]">
      <div aria-hidden className="tt-sky">
        <div className="tt-stars" />
        <div className="tt-moon" />
        <div className="tt-clouds" />
      </div>
      <header className="mx-auto flex w-full max-w-md items-center gap-2 px-4 pt-3">
        <HubSwitcher
          hubUrl={env.hubUrl}
          apps={subsystems}
          current="tarot"
          cookieDomain={import.meta.env.VITE_COOKIE_DOMAIN}
          iconOnly
          className="size-11 justify-center rounded-md text-[var(--em-ink-0)] hover:bg-[color-mix(in_oklab,var(--em-ink-0)_10%,transparent)]"
        />
        <p className="mr-auto font-heading font-bold text-[var(--em-ink-0)]">crocwork tarot</p>
        {status && (
          <p className="flex items-center gap-1 rounded-full bg-[color-mix(in_oklab,var(--em-ink-975)_60%,transparent)] px-3 py-1 font-heading text-sm font-bold tabular-nums text-[var(--em-gold-300)]">
            <Coins className="size-4" aria-hidden />
            <span className="sr-only">เหรียญ</span>
            {status.coins}
          </p>
        )}
      </header>
      <main id="content" className="flex-1">
        <Outlet />
      </main>
      <nav
        aria-label="เมนูหลัก"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-[color-mix(in_oklab,var(--em-ink-0)_12%,transparent)] bg-[color-mix(in_oklab,var(--em-ink-975)_92%,transparent)] pb-[env(safe-area-inset-bottom)]"
      >
        <ul className="mx-auto grid max-w-md grid-cols-3">
          {NAV.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink
                to={to}
                end
                className={({ isActive }) =>
                  cn(
                    "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs",
                    isActive ? "text-[var(--em-blue-300)]" : "text-[var(--em-ink-300)]",
                  )
                }
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <Splash />
      <IntroSheet onDone={onIntroDone} />
      {introDone && <Welcome />}
    </div>
  );
}

/** First sign-in: ask for a nickname, birthday and gender before the first reading. */
function Welcome() {
  const { user } = useSession();
  const { profile, loaded } = useTarotData();
  const ref = useRef<HTMLDialogElement>(null);
  const needed = Boolean(user) && loaded && profile === null;

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (needed && !dialog.open) dialog.showModal();
    if (!needed && dialog.open) dialog.close();
  }, [needed]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="welcome-title"
      className="m-auto w-[min(26rem,calc(100%-2rem))] rounded-xl border border-[color-mix(in_oklab,var(--em-ink-0)_14%,transparent)] bg-[var(--em-ink-950)] p-5 text-[var(--em-ink-50)] backdrop:bg-black/60"
    >
      <h2 id="welcome-title" className="text-xl font-black text-[var(--em-ink-0)]">
        ยินดีต้อนรับ
      </h2>
      <p className="mb-4 text-sm text-[var(--em-ink-300)]">
        บอกนกฮูกสักนิด เพื่อคำทำนายที่ตรงกับคุณ
      </p>
      {needed && <ProfileForm onSaved={() => ref.current?.close()} />}
    </dialog>
  );
}
