import { useId, type ReactNode } from "react";
import { cn } from "../lib/cn";

export type UserMenuLink = { href: string; label: string; icon?: ReactNode };

/**
 * The account menu every app shows once someone is signed in: who they are, links to their
 * profile and history, and sign out. Native popover, like HubSwitcher (Escape, light-dismiss and
 * focus return come from the browser). Each app passes its own sign-out control, because the hub
 * signs out with a server action and the SPAs with the Supabase client.
 */
export function UserMenu({
  name,
  email,
  links,
  signOut,
  badge,
  className,
}: {
  name: string;
  email: string;
  links: readonly UserMenuLink[];
  /** a button or a form; styled by the app, placed at the bottom of the panel */
  signOut: ReactNode;
  /** small tag next to the name, e.g. "แอดมิน" */
  badge?: string;
  /** trigger button class */
  className?: string;
}) {
  const id = useId();
  // first grapheme, so a Thai letter with its vowel mark or an emoji stays whole
  const [first] = Array.from(new Intl.Segmenter().segment(name.trim() || email));
  const initial = first ? first.segment.toUpperCase() : "?";

  return (
    <>
      <button
        type="button"
        popoverTarget={id}
        aria-label={`บัญชีของ ${name || email}`}
        className={cn(
          "inline-flex size-10 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground ring-offset-background hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className,
        )}
      >
        {initial}
      </button>
      <div
        id={id}
        popover="auto"
        aria-label="บัญชีของฉัน"
        className="fixed inset-auto right-4 top-16 m-0 w-[min(18rem,calc(100vw-2rem))] rounded-2xl border bg-popover p-2 text-popover-foreground shadow-xl"
      >
        <div className="flex items-center gap-3 rounded-xl px-2 py-2">
          <span
            aria-hidden
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-sm font-bold text-primary-foreground"
          >
            {initial}
          </span>
          <span className="min-w-0">
            <span className="flex items-center gap-2 font-heading font-bold">
              <span className="truncate">{name || email.split("@")[0]}</span>
              {badge && (
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {badge}
                </span>
              )}
            </span>
            <span className="block truncate text-xs text-muted-foreground">{email}</span>
          </span>
        </div>
        <ul className="mt-1 border-t pt-1">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className="flex min-h-10 items-center gap-3 rounded-lg px-2 text-sm font-medium hover:bg-accent"
              >
                {link.icon && (
                  <span aria-hidden className="text-muted-foreground [&>svg]:size-4">
                    {link.icon}
                  </span>
                )}
                {link.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="mt-1 border-t pt-1">{signOut}</div>
      </div>
    </>
  );
}

/** Class for the sign-out control inside the panel, so every app's button looks the same. */
export const userMenuItemClass =
  "flex min-h-10 w-full items-center gap-3 rounded-lg px-2 text-left text-sm font-medium hover:bg-accent";
